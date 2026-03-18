import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { notificationAPI } from '../services/notificationApi';
import { Notification } from '../types/Notification';
import { 
  Bell, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Check, // ✅ Replace MarkAsRead with Check
  Filter
} from 'lucide-react';

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications(currentPage, 20, filter); // ✅ Fixed parameter order
      setNotifications(response.data);
      setUnreadCount(response.unreadCount);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      setNotifications(notifications.filter(n => n._id !== notificationId));
      // If deleted notification was unread, decrease unread count
      const deletedNotification = notifications.find(n => n._id === notificationId);
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
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
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Bell className="w-8 h-8 mr-3" />
                Notifications
              </h1>
              <p className="text-gray-600 mt-1">
                Stay updated with your order status changes
                {unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {unreadCount} unread
                  </span>
                )}
              </p>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Check className="w-4 h-4 mr-2" /> {/* ✅ Fixed icon */}
                Mark All Read
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <div className="flex space-x-2">
              {['all', 'unread', 'read'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => {
                    setFilter(filterType);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === filterType
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  {filterType === 'unread' && unreadCount > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                      {unreadCount}
                    </span>
                  )}
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

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No notifications</h2>
            <p className="text-gray-500 mb-6">
              {filter === 'unread' 
                ? "You're all caught up! No unread notifications."
                : "We'll notify you when there are updates on your orders."
              }
            </p>
            <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Browse Medicines
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow border-l-4 ${
                  notification.isRead 
                    ? 'border-gray-300' 
                    : 'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        {getStatusIcon(notification.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className={`text-lg font-semibold ${
                            notification.isRead ? 'text-gray-900' : 'text-blue-900'
                          }`}>
                            {notification.title}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{notification.message}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Order #{notification.metadata.orderNumber}</span>
                          <span>•</span>
                          <span>{notification.metadata.itemCount} item{notification.metadata.itemCount > 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span>₹{notification.metadata.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification._id)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" /> {/* ✅ Fixed icon */}
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteNotification(notification._id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Link
                      href="/my-orders"
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View Order Details
                      <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
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

export default NotificationsPage;
