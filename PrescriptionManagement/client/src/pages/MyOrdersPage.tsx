import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { orderAPI } from '../services/orderApi';
import { Order } from '../types/Order';
import { Package, Clock, Truck, CheckCircle, AlertCircle, X } from 'lucide-react';

const MyOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, [currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getMyOrders(currentPage);
      setOrders(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-blue-500" />;
      case 'out_for_delivery':
        return <Package className="w-5 h-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'cancelled':
        return <X className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
            <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Browse Medicines
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.orderNumber}
                      </h3>
                      <p className="text-gray-600">
                        Placed on {new Date(order.orderDate).toLocaleDateString()}
                      </p>
                      {order.prescriptionRequired && order.doctorName && (
                        <p className="text-sm text-blue-600">
                          Prescribed by Dr. {order.doctorName}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-2">{formatStatus(order.status)}</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 mt-2">
                        ₹{order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <img
                          src={item.medicine.image_url}
                          alt={item.medicine.name}
                          className="w-16 h-16 object-contain rounded-lg bg-gray-50"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.medicine.name}</h4>
                          <p className="text-sm text-gray-600">{item.medicine.manufacturer}</p>
                          <p className="text-sm text-gray-700">Qty: {item.quantity}</p>
                          {item.prescriptionRequired && (
                            <span className="inline-block text-xs bg-red-100 text-red-700 px-2 py-1 rounded mt-1">
                              Prescription Required
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">
                          Estimated Delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Payment: <span className="capitalize">{order.paymentMethod}</span>
                        </p>
                      </div>
                      {/* <div className="flex space-x-3">
                        <Link
                          href="/my-orders"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </Link>
                        {order.status === 'delivered' && (
                          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            Reorder
                          </button>
                        )}
                      </div> */}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2 mt-8">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrdersPage;
