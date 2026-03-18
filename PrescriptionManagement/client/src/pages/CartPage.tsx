import React from 'react';
import { Link, useLocation } from 'wouter';
import { useCart } from '../context/CartContext';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

const CartPage: React.FC = () => {
  const { cart, loading, updateQuantity, removeFromCart } = useCart();
  const [, navigate] = useLocation();

  const handleQuantityChange = async (medicineId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      await removeFromCart(medicineId);
    } else {
      await updateQuantity(medicineId, newQuantity);
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-24 h-24 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add some medicines to get started</p>
          <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Browse Medicines
          </Link>
        </div>
      </div>
    );
  }

  const hasRxMedicines = cart.items.some(item => item.medicine.prescriptionRequired);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              {cart.items.map((item) => (
                <div key={item.medicine._id} className="p-6 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-center space-x-4">
                    <img
                      src={item.medicine.image_url}
                      alt={item.medicine.name}
                      className="w-20 h-20 object-contain rounded-lg bg-gray-50"
                    />
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">{item.medicine.name}</h3>
                      <p className="text-sm text-gray-600">{item.medicine.manufacturer}</p>
                      <p className="text-sm text-gray-700">{item.medicine.composition}</p>
                      
                      {item.medicine.prescriptionRequired && (
                        <span className="inline-block mt-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          Prescription Required
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleQuantityChange(item.medicine._id, item.quantity - 1)}
                        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      
                      <span className="font-medium text-lg">{item.quantity}</span>
                      
                      <button
                        onClick={() => handleQuantityChange(item.medicine._id, item.quantity + 1)}
                        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{item.price}</p>
                      <button
                        onClick={() => removeFromCart(item.medicine._id)}
                        className="text-red-500 hover:text-red-700 transition-colors mt-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span>Items ({cart.items.reduce((sum, item) => sum + item.quantity, 0)})</span>
                  <span>₹{cart.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{cart.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {hasRxMedicines && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Your cart contains prescription medicines. You'll need to provide doctor details during checkout.
                  </p>
                </div>
              )}

              <button
                onClick={handleCheckout}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link href="/" className="block text-center text-blue-600 hover:text-blue-700 mt-4">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
