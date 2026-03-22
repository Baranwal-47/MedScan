import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { orderAPI } from '../services/orderApi';
import { Order } from '../types/Order';
import { CheckCircle, CreditCard, Smartphone, AlertCircle } from 'lucide-react';

const PaymentPage: React.FC = () => {
  const { orderId } = useParams();
  const [location, navigate] = useLocation();
  const locationState = (window as any).history.state?.state || {};
  const {
    clientSecret: initialClientSecret,
    paymentIntentId: initialPaymentIntentId,
    publishableKey: initialPublishableKey
  } = locationState;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState(initialClientSecret || '');
  const [paymentIntentId, setPaymentIntentId] = useState(initialPaymentIntentId || '');
  const [publishableKey, setPublishableKey] = useState(initialPublishableKey || '');

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

  const retryStripePayment = async () => {
    try {
      setPaymentLoading(true);
      setPaymentStatus('processing');
      setError('');

      // If we don't have a clientSecret, create a new payment intent
      let currentClientSecret = clientSecret;
      let currentPaymentIntentId = paymentIntentId;
      let currentPublishableKey = publishableKey;

      if (!currentClientSecret) {
        const orderData = await orderAPI.getOrder(orderId!);
        const stripeResponse = await orderAPI.createStripePaymentIntent(orderData.data.totalAmount);

        currentClientSecret = stripeResponse.data.clientSecret;
        currentPaymentIntentId = stripeResponse.data.paymentIntentId;
        currentPublishableKey = stripeResponse.data.publishableKey;

        setClientSecret(currentClientSecret);
        setPaymentIntentId(currentPaymentIntentId);
        setPublishableKey(currentPublishableKey);
      }

      // Load Stripe.js
      await new Promise<void>((resolve, reject) => {
        if ((window as any).Stripe) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Stripe'));
        document.body.appendChild(script);
      });

      const stripe = (window as any).Stripe(currentPublishableKey);
      const result = await stripe.confirmCardPayment(currentClientSecret, {
        payment_method: {
          card: {
            token: 'tok_visa'
          }
        }
      });

      if (result.error) {
        setPaymentStatus('failed');
        setError(result.error.message || 'Payment failed');
        setPaymentLoading(false);
        return;
      }

      if (result.paymentIntent?.status === 'succeeded') {
        await orderAPI.verifyStripePayment({
          paymentIntentId: currentPaymentIntentId,
          mongoOrderId: orderId!
        });
        setPaymentStatus('success');
        setPaymentLoading(false);
        setTimeout(() => navigate('/my-orders'), 2000);
      }
    } catch (err: any) {
      setPaymentStatus('failed');
      setError('Payment failed. Please try again.');
      setPaymentLoading(false);
    }
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

  if (!order) {
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
        ) : (
          <div>
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                {getPaymentIcon()}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {paymentStatus === 'processing' ? 'Processing Payment...' : (paymentStatus === 'failed' ? 'Payment Failed' : 'Complete Payment')}
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

            {paymentStatus === 'failed' && error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              {paymentStatus === 'failed' ? (
                <>
                  <button
                    onClick={retryStripePayment}
                    disabled={paymentLoading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Retry Payment
                  </button>
                  <button
                    onClick={() => navigate('/cart')}
                    className="w-full bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Back to Cart
                  </button>
                </>
              ) : paymentStatus === 'processing' ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Processing payment...</p>
                </div>
              ) : (
                <>
                  <button
                    onClick={retryStripePayment}
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
