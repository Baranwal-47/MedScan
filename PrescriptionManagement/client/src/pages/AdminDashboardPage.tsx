import React, { useState, useEffect } from 'react';
import { orderAPI } from '../services/orderApi';
import { Order } from '../types/Order';
import { Package, Clock, Truck, CheckCircle, AlertCircle, Users, DollarSign, TrendingUp } from 'lucide-react';

const AdminDashboardPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState({
    totalOrders: 0,
    ordersByStatus: {} as Record<string, number>,
    paidRevenue: 0,
    paidOrders: 0,
    topMedicines: [] as { name: string; qty: number }[],
    userCount: 0,
    prescriptionsPending: 0
  });

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [currentPage, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getAllOrders(currentPage, statusFilter);
      setOrders(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await orderAPI.getAdminStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Order pipeline segments — palette validated for CVD + contrast on white
  const STATUS_SEGMENTS: { key: string; label: string; color: string }[] = [
    { key: 'pending_approval', label: 'Pending Approval', color: '#d97706' },
    { key: 'confirmed', label: 'Confirmed', color: '#2563eb' },
    { key: 'shipped', label: 'Shipped', color: '#0d9488' },
    { key: 'out_for_delivery', label: 'Out for Delivery', color: '#ea580c' },
    { key: 'delivered', label: 'Delivered', color: '#16a34a' },
    { key: 'cancelled', label: 'Cancelled', color: '#dc2626' },
  ];

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await orderAPI.updateOrderStatus(orderId, newStatus);
      fetchOrders(); // Refresh the list
    } catch (error) {
      setError('Failed to update order status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'shipped':
        return <Truck className="w-4 h-4 text-blue-500" />;
      case 'out_for_delivery':
        return <Package className="w-4 h-4 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getNextStatus = (currentStatus: string): string[] => {
    switch (currentStatus) {
      case 'pending_approval':
        return ['confirmed', 'cancelled'];
      case 'confirmed':
        return ['shipped', 'cancelled'];
      case 'shipped':
        return ['out_for_delivery'];
      case 'out_for_delivery':
        return ['delivered'];
      default:
        return [];
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Rx Awaiting Review</p>
                <p className="text-2xl font-bold text-gray-900">{stats.prescriptionsPending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Paid Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.paidRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{stats.paidOrders} paid order{stats.paidOrders !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Registered Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.userCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline + top medicines */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Pipeline</h2>
            {stats.totalOrders > 0 ? (
              <>
                <div className="flex h-4 rounded-full overflow-hidden gap-0.5 mb-4">
                  {STATUS_SEGMENTS.filter(s => (stats.ordersByStatus[s.key] || 0) > 0).map(s => (
                    <div
                      key={s.key}
                      title={`${s.label}: ${stats.ordersByStatus[s.key]}`}
                      style={{
                        backgroundColor: s.color,
                        width: `${(stats.ordersByStatus[s.key] / stats.totalOrders) * 100}%`
                      }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {STATUS_SEGMENTS.map(s => (
                    <div key={s.key} className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-gray-600 flex-1">{s.label}</span>
                      <span className="font-medium text-gray-900">{stats.ordersByStatus[s.key] || 0}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">No orders yet.</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Medicines</h2>
            {stats.topMedicines.length > 0 ? (
              <div className="space-y-3">
                {stats.topMedicines.map((m) => {
                  const max = stats.topMedicines[0].qty;
                  return (
                    <div key={m.name} className="flex items-center gap-3 text-sm">
                      <span className="text-gray-700 truncate w-44 shrink-0">{m.name}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3">
                        <div
                          className="h-3 rounded-full"
                          style={{ backgroundColor: '#2563eb', width: `${(m.qty / max) * 100}%` }}
                        />
                      </div>
                      <span className="font-medium text-gray-900 w-8 text-right">{m.qty}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No sales yet.</p>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <h2 className="text-lg font-semibold text-gray-900">Filter Orders:</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter('')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === '' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Orders
              </button>
              {['pending_approval', 'confirmed', 'shipped', 'out_for_delivery', 'delivered'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {formatStatus(status)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{order.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </div>
                        {order.prescriptionRequired && (
                          <div className="text-xs text-blue-600">
                            Rx Required - {order.doctorName}
                            {order.doctorLicense && ` (${order.doctorLicense})`}
                          </div>
                        )}
                        {order.prescription && (
                          <a
                            href={order.prescription.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
                          >
                            View Prescription ↗
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.user.email}
                        </div>
                        {order.user.phone && (
                          <div className="text-sm text-gray-500">
                            {order.user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.items.slice(0, 2).map((item, index) => (
                          <div key={index}>
                            {item.medicine.name} (x{item.quantity})
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div>+{order.items.length - 2} more</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{order.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {order.paymentMethod}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{formatStatus(order.status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        {getNextStatus(order.status).map((nextStatus) => (
                          <button
                            key={nextStatus}
                            onClick={() => updateOrderStatus(order._id, nextStatus)}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              nextStatus === 'cancelled'
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            {/* Pharmacist wording for the Rx review queue */}
                            {order.status === 'pending_approval'
                              ? (nextStatus === 'confirmed' ? 'Approve' : 'Reject')
                              : formatStatus(nextStatus)}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
