import json
import re 
import io
from django.conf import settings
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

# --- 2. AUTHENTICATION VIEWS ---

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
        
        # 'username' here contains the email typed by the user
        email_input = request.data.get('username') 
        password = request.data.get('password')

        try:
            # 1. Find the user by email to get their actual username
            temp_user = User.objects.get(email=email_input)
            actual_username = temp_user.username
        except User.DoesNotExist:
            # If email doesn't exist, we use the input as username just in case
            actual_username = email_input

        # 2. Authenticate using the real username
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

# --- 3. PROFILE & PASSWORD VIEWS ---

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

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        if not user.check_password(current_password):
            return Response({'error': 'Incorrect current password'}, status=401)
        user.set_password(new_password)
        user.save()
        login(request, user)
        return Response({'success': True})

# --- 4. TENANT DASHBOARD VIEWS ---

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

class PaymentListCreateView(generics.ListCreateAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self): 
        # Using -date_paid as requested for history order
        return Payment.objects.filter(user=self.request.user).order_by('-date_paid')
    def perform_create(self, serializer): 
        serializer.save(user=self.request.user)

class ComplaintListCreateView(generics.ListCreateAPIView):
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self): 
        return Complaint.objects.filter(user=self.request.user).order_by('-created_at')
    def perform_create(self, serializer): 
        serializer.save(user=self.request.user)

class RequestListCreateView(generics.ListCreateAPIView):
    serializer_class = MaintenanceRequestSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self): 
        return MaintenanceRequest.objects.filter(user=self.request.user).order_by('-created_at')
    def perform_create(self, serializer): 
        serializer.save(user=self.request.user)

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self): 
        return Notification.objects.filter(user=self.request.user).order_by('is_read', '-timestamp')

# --- 5. MPESA STK PUSH & CALLBACKS ---

@csrf_exempt
def initiate_stk_push(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    print("\n--- NEW PAYMENT REQUEST ---")
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
        msg = getattr(response, 'CustomerMessage', 'STK Push initiated.')

        if str(res_code) == '0':
            print(f"✅ SUCCESS: Prompt sent to {formatted_phone}")
            MpesaTransaction.objects.create(
                tenant=request.user if request.user.is_authenticated else None,
                amount=amount,
                checkout_request_id=checkout_id,
                phone_number=formatted_phone,
                status='PENDING'
            )
            return JsonResponse({
                'ResponseCode': '0', 
                'CustomerMessage': msg, 
                'CheckoutRequestID': checkout_id
            })
        else:
            print(f"❌ SAFARICOM REJECTED: Code {res_code}")
            return JsonResponse({'ResponseCode': str(res_code), 'error': 'Safaricom Rejected'}, status=400)
            
    except Exception as e:
        print(f"🔥 CRITICAL ERROR: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def stk_callback(request):
    print("\n!!! CALLBACK RECEIVED FROM SAFARICOM !!!")
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            stk_data = data['Body']['stkCallback']
            result_code = stk_data['ResultCode']
            checkout_id = stk_data['CheckoutRequestID']

            transaction = MpesaTransaction.objects.filter(checkout_request_id=checkout_id).first()
            
            if transaction:
                if result_code == 0:
                    transaction.status = 'COMPLETED'
                    metadata = stk_data['CallbackMetadata']['Item']
                    receipt = next(item['Value'] for item in metadata if item['Name'] == 'MpesaReceiptNumber')
                    transaction.mpesa_receipt_number = receipt
                    
                    # Create actual Payment entry for history
                    Payment.objects.create(
                        user=transaction.tenant,
                        amount=transaction.amount,
                        mpesa_reference=receipt,
                        payment_method='M-Pesa STK'
                    )
                    print(f"✅ PAYMENT SUCCESS: {receipt}")
                else:
                    transaction.status = 'FAILED'
                    print(f"❌ PAYMENT FAILED: Result Code {result_code}")
                transaction.save()
            return JsonResponse({"ResultCode": 0, "ResultDesc": "Success"})
        except Exception as e:
            print(f"❌ Callback Error: {str(e)}")
            return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"})
    return JsonResponse({"ResultCode": 1, "ResultDesc": "Invalid Method"}, status=405)

@csrf_exempt
def check_payment_status(request):
    """Used by the frontend to poll for payment completion"""
    checkout_id = request.GET.get('checkout_id')
    try:
        transaction = MpesaTransaction.objects.get(checkout_request_id=checkout_id)
        return JsonResponse({
            'status': transaction.status,
            'receipt': transaction.mpesa_receipt_number or ''
        })
    except MpesaTransaction.DoesNotExist:
        return JsonResponse({'status': 'NOT_FOUND'}, status=404)

# --- 6. RECEIPT & HISTORY ---

class PaymentHistoryListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        transactions = MpesaTransaction.objects.filter(
            tenant=request.user, 
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
        transaction = MpesaTransaction.objects.get(id=transaction_id, tenant=request.user)
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer)

        p.setFont("Helvetica-Bold", 16)
        p.drawString(100, 800, "RENTAL PORTAL - OFFICIAL RECEIPT")
        p.line(100, 790, 500, 790)
        
        p.setFont("Helvetica", 12)
        p.drawString(100, 760, f"Receipt Number: {transaction.mpesa_receipt_number}")
        p.drawString(100, 740, f"Date: {transaction.created_at.strftime('%d %b %Y')}")
        p.drawString(100, 720, f"Tenant: {request.user.get_full_name() or request.user.username}")
        p.drawString(100, 700, f"Amount Paid: KES {transaction.amount}")
        p.drawString(100, 680, f"Phone Number: {transaction.phone_number}")
        p.drawString(100, 640, "Status: PAID / COMPLETED")
        p.drawString(100, 600, "Thank you for your payment!")
        
        p.showPage()
        p.save()
        buffer.seek(0)
        return FileResponse(buffer, as_attachment=True, filename=f'Receipt_{transaction.mpesa_receipt_number}.pdf')
    except Exception:
        return JsonResponse({'error': 'Receipt not found'}, status=404)