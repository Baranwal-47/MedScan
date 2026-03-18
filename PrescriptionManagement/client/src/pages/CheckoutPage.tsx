import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useCart } from '../context/CartContext';
import { orderAPI } from '../services/orderApi';
import { ShippingAddress } from '../types/Order';
import { CreditCard, Smartphone, Truck, MapPin } from 'lucide-react';

const CheckoutPage: React.FC = () => {
  const { cart, clearCart } = useCart();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [doctorName, setDoctorName] = useState('');

  if (!cart || cart.items.length === 0) {
    navigate('/cart');
    return null;
  }

  const hasRxMedicines = cart.items.some(item => item.medicine.prescriptionRequired);

  // Fix: Create separate handlers for different input types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value
    });
  };

  // New handler specifically for textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const orderData = {
        shippingAddress,
        paymentMethod,
        ...(hasRxMedicines && { doctorName })
      };

      const response = await orderAPI.createOrder(orderData);
      
      // Navigate to payment page with order ID
      navigate(`/payment/${response.data._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Delivery Address
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={shippingAddress.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={shippingAddress.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* Fix: Use the textarea-specific handler */}
                <textarea
                  name="address"
                  placeholder="Complete Address"
                  value={shippingAddress.address}
                  onChange={handleTextareaChange}  
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={shippingAddress.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    name="state"
                    placeholder="State"
                    value={shippingAddress.state}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    name="zipCode"
                    placeholder="ZIP Code"
                    value={shippingAddress.zipCode}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </form>
            </div>

            {/* Prescription Details */}
            {hasRxMedicines && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Prescription Details</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    Your order contains prescription medicines. Please provide your doctor's details.
                  </p>
                </div>
                
                <input
                  type="text"
                  placeholder="Doctor's Name with their License Number (eg. Dr. John Doe, License #123456)"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
              
              <div className="space-y-3">
                <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <CreditCard className="w-5 h-5 mr-3 text-gray-600" />
                  <div>
                    <p className="font-medium">Credit/Debit Card</p>
                    <p className="text-sm text-gray-600">Visa, MasterCard, RuPay</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <Smartphone className="w-5 h-5 mr-3 text-gray-600" />
                  <div>
                    <p className="font-medium">UPI</p>
                    <p className="text-sm text-gray-600">Google Pay, PhonePe, Paytm</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <Truck className="w-5 h-5 mr-3 text-gray-600" />
                  <div>
                    <p className="font-medium">Cash on Delivery</p>
                    <p className="text-sm text-gray-600">Pay when you receive</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-4">
                {cart.items.map((item) => (
                  <div key={item.medicine._id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.medicine.name}</p>
                      <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                      {item.medicine.prescriptionRequired && (
                        <span className="text-xs bg-red-100 text-red-700 px-1 py-0.5 rounded">Rx</span>
                      )}
                    </div>
                    <p className="font-medium">{item.price}</p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{cart.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{cart.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {hasRxMedicines && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-xs text-orange-800">
                    Prescription medicines will be reviewed by our pharmacist before dispatch.
                  </p>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
