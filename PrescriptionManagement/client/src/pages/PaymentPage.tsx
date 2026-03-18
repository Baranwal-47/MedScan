import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { orderAPI } from '../services/orderApi';
import { Order } from '../types/Order';
import { CheckCircle, CreditCard, Smartphone, AlertCircle } from 'lucide-react';

const PaymentPage: React.FC = () => {
  const { orderId } = useParams();
  const [, navigate] = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');
  const [error, setError] = useState('');

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await orderAPI.getOrder(orderId!);
      setOrder(response.data);
    } catch (error) {
      setError('Order not found');
    } finally {
      setLoading(false);
    }
  };

  const simulatePayment = async () => {
    setPaymentLoading(true);
    setPaymentStatus('processing');

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Simulate 90% success rate
    const success = Math.random() > 0.1;
    
    if (success) {
      setPaymentStatus('success');
      setTimeout(() => {
        navigate('/my-orders');
      }, 2000);
    } else {
      setPaymentStatus('failed');
    }
    
    setPaymentLoading(false);
  };

  const getPaymentIcon = () => {
    switch (order?.paymentMethod) {
      case 'card':
        return <CreditCard className="w-8 h-8" />;
      case 'upi':
        return <Smartphone className="w-8 h-8" />;
      case 'cod':
        return <CheckCircle className="w-8 h-8" />;
      default:
        return <CreditCard className="w-8 h-8" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Order Not Found</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // If COD, show success immediately
  if (order.paymentMethod === 'cod') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
          <p className="text-gray-600 mb-4">Order #{order.orderNumber}</p>
          <p className="text-sm text-gray-500 mb-6">
            You'll pay ₹{order.totalAmount.toFixed(2)} when your order is delivered.
          </p>
          
          {order.prescriptionRequired && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                Your order contains prescription medicines and is pending approval from our pharmacist.
              </p>
            </div>
          )}
          
          <button
            onClick={() => navigate('/my-orders')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View My Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {paymentStatus === 'success' ? (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">Order #{order.orderNumber}</p>
            <p className="text-sm text-gray-500">Redirecting to your orders...</p>
          </div>
        ) : paymentStatus === 'failed' ? (
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">There was an issue processing your payment.</p>
            <div className="space-y-3">
              <button
                onClick={simulatePayment}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry Payment
              </button>
              <button
                onClick={() => navigate('/cart')}
                className="w-full bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Back to Cart
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                {getPaymentIcon()}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {paymentStatus === 'processing' ? 'Processing Payment...' : 'Complete Payment'}
              </h2>
              <p className="text-gray-600">Order #{order.orderNumber}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Amount to Pay</span>
                <span className="text-2xl font-bold text-gray-900">₹{order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Payment Method</span>
                <span className="text-gray-700 capitalize">
                  {order.paymentMethod === 'upi' ? 'UPI' : order.paymentMethod.toUpperCase()}
                </span>
              </div>
            </div>

            {order.prescriptionRequired && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  Your order contains prescription medicines and will be reviewed after payment.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {paymentStatus === 'processing' ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Please wait...</p>
                </div>
              ) : (
                <>
                  <button
                    onClick={simulatePayment}
                    disabled={paymentLoading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Pay Now
                  </button>
                  <button
                    onClick={() => navigate('/checkout')}
                    className="w-full bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Back to Checkout
                  </button>
                </>
              )}
            </div>

            <div className="mt-6 text-center">
              <div className="flex justify-center space-x-4 mb-2">
                <img src="/api/placeholder/40/25" alt="Visa" className="h-6" />
                <img src="/api/placeholder/40/25" alt="Mastercard" className="h-6" />
                <img src="/api/placeholder/40/25" alt="UPI" className="h-6" />
              </div>
              <p className="text-xs text-gray-500">
                Your payment information is secure and encrypted
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
