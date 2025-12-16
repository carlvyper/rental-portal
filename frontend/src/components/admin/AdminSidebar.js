import React from "react";
import { Link } from "react-router-dom";

const AdminSidebar = () => {
  return (
    <div className="w-64 h-screen bg-blue-700 text-white p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Rental Portal</h1>

      <nav className="flex flex-col space-y-4">
        <Link to="/admin/dashboard" className="hover:text-gray-300">Dashboard</Link>
        <Link to="/admin/manage-tenants" className="hover:text-gray-300">Manage Tenants</Link>
        <Link to="/admin/manage-units" className="hover:text-gray-300">Manage Units</Link>
        <Link to="/admin/payments" className="hover:text-gray-300">View Payments</Link>
        <Link to="/admin/approve" className="hover:text-gray-300">Approve Requests</Link>
        <Link to="/admin/complaints" className="hover:text-gray-300">Respond to Complaints</Link>
        <Link to="/admin/reminders" className="hover:text-gray-300">Send Reminders</Link>
      </nav>
    </div>
  );
};

export default AdminSidebar;
