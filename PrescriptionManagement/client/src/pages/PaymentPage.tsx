import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { orderAPI } from '../services/orderApi';
import { Order } from '../types/Order';
import { CheckCircle, CreditCard, Smartphone, AlertCircle } from 'lucide-react';

let stripePromise: any = null;
const getStripePromise = (publishableKey: string) => {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

const StripePaymentForm: React.FC<{
  orderId: string;
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
  onError: (message: string) => void;
}> = ({ orderId, clientSecret, amount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState('');

  const handlePay = async () => {
    if (!stripe || !elements) return;

    setProcessing(true);
    setCardError('');

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setProcessing(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement }
    });

    if (error) {
      const message = error.message || 'Payment failed';
      setCardError(message);
      onError(message);
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      onSuccess();
      return;
    }

    const fallbackMessage = 'Payment failed';
    setCardError(fallbackMessage);
    onError(fallbackMessage);
    setProcessing(false);
  };

  return (
    <div className="space-y-4" data-order-id={orderId}>
      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#374151',
                '::placeholder': { color: '#9CA3AF' },
                fontFamily: 'system-ui, sans-serif'
              },
              invalid: { color: '#EF4444' }
            },
            hidePostalCode: true
          }}
        />
      </div>

      {cardError && (
        <p className="text-sm text-red-600">{cardError}</p>
      )}

      <button
        onClick={handlePay}
        disabled={!stripe || processing}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? (
          <span className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </span>
        ) : (
          `Pay ₹${amount.toFixed(2)}`
        )}
      </button>
    </div>
  );
};

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
  const [showCardForm, setShowCardForm] = useState(!!initialClientSecret);

  void location;

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

      setClientSecret(currentClientSecret);
      setPaymentIntentId(currentPaymentIntentId);
      setPublishableKey(currentPublishableKey);
      setShowCardForm(true);
      setPaymentStatus('pending');
      setPaymentLoading(false);
    } catch (err: any) {
      setPaymentStatus('failed');
      setError('Payment failed. Please try again.');
      setPaymentLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      await orderAPI.verifyStripePayment({
        paymentIntentId,
        mongoOrderId: orderId!
      });
      setPaymentStatus('success');
      setTimeout(() => navigate('/my-orders'), 2000);
    } catch (err: any) {
      setError('Payment verification failed. Contact support.');
      setPaymentStatus('failed');
    }
  };

  const handlePaymentError = (message: string) => {
    setError(message);
    setPaymentStatus('failed');
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
                  {showCardForm && clientSecret ? (
                    <Elements
                      stripe={getStripePromise(publishableKey)}
                      options={{ clientSecret }}
                    >
                      <StripePaymentForm
                        orderId={orderId!}
                        clientSecret={clientSecret}
                        amount={order.totalAmount}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                      />
                    </Elements>
                  ) : (
                    <button
                      onClick={retryStripePayment}
                      disabled={paymentLoading}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Pay Now
                    </button>
                  )}
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
