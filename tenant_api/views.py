import json
import re 
import io
from django.conf import settings
from django.shortcuts import render  # Required for home_page
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.http import JsonResponse, FileResponse

from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from reportlab.pdfgen import canvas
from django_daraja.mpesa.core import MpesaClient

# --- 1. ALL IMPORTS (MODELS & SERIALIZERS) ---
from .models import (
    Payment, Complaint, MaintenanceRequest, Notification, TenantProfile,
    MpesaTransaction 
)
from .serializers import (
    RegisterSerializer, 
    UserSerializer, 
    PaymentSerializer, 
    ComplaintSerializer, 
    MaintenanceRequestSerializer, 
    NotificationSerializer, 
    TenantProfileSerializer
)

User = get_user_model()

# --- 2. FRONTEND VIEW ---

def home_page(request):
    """
    Serves the initial login page from your frontend folder.
    """
    return render(request, 'login.html')

# --- 3. AUTHENTICATION VIEWS ---

class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny] 
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            login(request, user) 
            return Response({'success': True}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(csrf_exempt, name='dispatch')
class LoginView(APIView):
    authentication_classes = [] 
    permission_classes = [permissions.AllowAny] 

    def post(self, request):
        logout(request)
        email_input = request.data.get('username') 
        password = request.data.get('password')

        try:
            temp_user = User.objects.get(email=email_input)
            actual_username = temp_user.username
        except User.DoesNotExist:
            actual_username = email_input

        user = authenticate(request, username=actual_username, password=password)

        if user is not None:
            if user.is_active:
                login(request, user)
                return Response({
                    'success': True, 
                    'username': user.username,
                    'is_staff': user.is_staff
                })
        
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    def post(self, request): 
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)

# --- 4. PROFILE & DASHBOARD VIEWS ---

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated] 
    def get(self, request):
        user = request.user
        data = UserSerializer(user).data
        try:
            profile = user.tenantprofile
            data['unit_number'] = profile.unit_number
            data['phone_number'] = profile.phone_number
        except: 
            data['unit_number'] = data['phone_number'] = None
        return Response(data)

    def patch(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            profile, created = TenantProfile.objects.get_or_create(user=user)
            profile.phone_number = request.data.get('phone_number', profile.phone_number)
            profile.unit_number = request.data.get('unit_number', profile.unit_number)
            profile.save()
            return Response({'success': True, 'message': 'Profile updated successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DashboardCountsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        data = {
            'username': user.username,
            'open_complaints': Complaint.objects.filter(user=user, status__in=['Open', 'Pending']).count(),
            'unread_notifications': Notification.objects.filter(user=user, is_read=False).count(),
        }
        return Response(data)

# --- 5. MPESA STK PUSH & CALLBACKS ---

@csrf_exempt
def initiate_stk_push(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        amount = int(float(data.get('amount')))
        phone_number = str(data.get('phone_number')).strip()
        
        # Phone cleaning logic
        clean_phone = re.sub(r'\D', '', phone_number)
        if clean_phone.startswith('0'): 
            formatted_phone = '254' + clean_phone[1:]
        elif clean_phone.startswith('7'):
            formatted_phone = '254' + clean_phone
        else:
            formatted_phone = clean_phone

        # Get Tenant Profile for the logged-in user
        tenant_profile = None
        if request.user.is_authenticated:
            tenant_profile, _ = TenantProfile.objects.get_or_create(user=request.user)

        cl = MpesaClient()
        response = cl.stk_push(
            phone_number=formatted_phone, 
            amount=amount, 
            account_reference='RENT-PAY', 
            transaction_desc='Rent Payment',
            callback_url=settings.MPESA_CALLBACK_URL
        )

        res_code = getattr(response, 'ResponseCode', None)
        checkout_id = getattr(response, 'CheckoutRequestID', None)
        merchant_id = getattr(response, 'MerchantRequestID', None)

        if str(res_code) == '0':
            MpesaTransaction.objects.create(
                tenant=tenant_profile,
                amount=amount,
                checkout_request_id=checkout_id,
                merchant_request_id=merchant_id,
                phone_number=formatted_phone,
                account_reference=f"REF-{checkout_id[:8].upper()}",
                status='PENDING'
            )
            return JsonResponse({
                'ResponseCode': '0', 
                'CustomerMessage': 'STK Push initiated successfully', 
                'CheckoutRequestID': checkout_id
            })
        else:
            return JsonResponse({'ResponseCode': str(res_code), 'error': 'Safaricom Rejected'}, status=400)
            
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def stk_callback(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            stk_data = data['Body']['stkCallback']
            result_code = stk_data['ResultCode']
            checkout_id = stk_data['CheckoutRequestID']

            transaction = MpesaTransaction.objects.filter(checkout_request_id=checkout_id).first()
            
            if transaction:
                transaction.callback_data = data # Store raw JSON for debug
                if result_code == 0:
                    transaction.status = 'COMPLETED'
                    metadata = stk_data['CallbackMetadata']['Item']
                    receipt = next(item['Value'] for item in metadata if item['Name'] == 'MpesaReceiptNumber')
                    transaction.mpesa_receipt_number = receipt
                    
                    # Create actual Payment entry for history
                    Payment.objects.create(
                        user=transaction.tenant.user,
                        amount=transaction.amount,
                        transaction_id=receipt,
                        payment_method='M-Pesa STK',
                        status='Paid',
                        month_paid_for=transaction.created_at.date() # Default to current month
                    )
                else:
                    transaction.status = 'FAILED'
                transaction.save()
            return JsonResponse({"ResultCode": 0, "ResultDesc": "Success"})
        except Exception as e:
            return JsonResponse({"ResultCode": 0, "ResultDesc": "Error Handled"})
    return JsonResponse({"ResultCode": 1, "ResultDesc": "Invalid Method"}, status=405)

# --- 6. HISTORY & RECEIPTS ---

class PaymentHistoryListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        # Fetch completed MpesaTransactions linked to this user
        transactions = MpesaTransaction.objects.filter(
            tenant__user=request.user, 
            status='COMPLETED'
        ).order_by('-created_at')
        
        data = []
        for tx in transactions:
            data.append({
                'id': tx.id,
                'date': tx.created_at.strftime('%Y-%m-%d %H:%M'),
                'amount': tx.amount,
                'receipt': tx.mpesa_receipt_number,
                'phone': tx.phone_number
            })
        return Response(data)

@csrf_exempt
def download_receipt(request, transaction_id):
    try:
        transaction = MpesaTransaction.objects.get(id=transaction_id, tenant__user=request.user)
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer)

        p.setFont("Helvetica-Bold", 16)
        p.drawString(100, 800, "RENTAL PORTAL - OFFICIAL RECEIPT")
        p.line(100, 785, 500, 785)
        
        p.setFont("Helvetica", 12)
        p.drawString(100, 750, f"Receipt No: {transaction.mpesa_receipt_number}")
        p.drawString(100, 730, f"Date: {transaction.created_at.strftime('%d %b %Y')}")
        p.drawString(100, 710, f"Tenant: {request.user.username}")
        p.drawString(100, 690, f"Amount: KES {transaction.amount}")
        p.drawString(100, 650, "Status: VERIFIED & PAID")
        
        p.showPage()
        p.save()
        buffer.seek(0)
        return FileResponse(buffer, as_attachment=True, filename=f'Receipt_{transaction.mpesa_receipt_number}.pdf')
    except Exception:
        return JsonResponse({'error': 'Receipt not found'}, status=404)

# Keep other ListCreateViews (Complaint, Maintenance, Notification) as per your previous logic
class ComplaintListCreateView(generics.ListCreateAPIView):
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self): return Complaint.objects.filter(user=self.request.user).order_by('-created_at')
    def perform_create(self, serializer): serializer.save(user=self.request.user)