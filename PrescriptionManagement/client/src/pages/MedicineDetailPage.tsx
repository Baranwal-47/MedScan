import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { medicineAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { Medicine } from '../types/Medicine';
import Loading from '../components/Loading';
import { ShoppingCart, Plus, Minus, ShieldAlert, ShieldCheck } from 'lucide-react';

const MedicineDetailPage: React.FC = () => {
  const { id } = useParams();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const { addToCart, cart } = useCart();

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        if (!id) return;
        const res = await medicineAPI.getMedicineById(id);
        setMedicine(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load medicine');
      } finally {
        setLoading(false);
      }
    };
    fetchMedicine();
  }, [id]);

  const handleAddToCart = async () => {
    if (!medicine) return;
    
    try {
      setAddingToCart(true);
      await addToCart(medicine._id, quantity);
      // You could show a toast notification here
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  const isInCart = cart?.items.some(item => item.medicine._id === medicine?._id);
  const cartQuantity = cart?.items.find(item => item.medicine._id === medicine?._id)?.quantity || 0;

  if (loading) return <Loading />;
  if (error) return <div className="text-center text-red-500 p-8">{error}</div>;
  if (!medicine) return <div className="text-center text-gray-500 p-8">Medicine not found</div>;

  const shownPrice = medicine.price?.trim() ? medicine.price : 'Price not listed / Out of stock';
  const isPriceAvailable = medicine.price?.trim() && medicine.price !== 'Price not listed / Out of stock';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="text-primary-600 hover:underline mb-4 inline-block">
          ← Back to Medicines
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
            {/* Left Column - Image and Basic Info */}
            <div>
              {medicine.image_url && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <img
                    src={medicine.image_url}
                    alt={medicine.name}
                    className="w-full h-64 object-contain rounded-lg"
                  />
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{medicine.name}</h1>
                  {medicine.manufacturer && (
                    <p className="text-lg text-gray-600">by {medicine.manufacturer}</p>
                  )}
                </div>

                {medicine.composition && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Composition</h3>
                    <p className="text-gray-700">{medicine.composition}</p>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  {medicine.prescriptionRequired ? (
                    <div className="flex items-center bg-red-50 text-red-700 px-3 py-2 rounded-lg">
                      <ShieldAlert className="w-5 h-5 mr-2" />
                      <span className="font-medium">Prescription Required</span>
                    </div>
                  ) : (
                    <div className="flex items-center bg-green-50 text-green-700 px-3 py-2 rounded-lg">
                      <ShieldCheck className="w-5 h-5 mr-2" />
                      <span className="font-medium">Over the Counter</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Price and Actions */}
            <div>
              <div className="sticky top-4">
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="text-3xl font-bold text-primary-600 mb-4">
                    {shownPrice}
                  </div>

                  {isPriceAvailable && (
                    <>
                      <div className="flex items-center space-x-4 mb-6">
                        <span className="text-gray-700 font-medium">Quantity:</span>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-bold text-lg px-4">{quantity}</span>
                          <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {isInCart && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            Already in cart: {cartQuantity} item{cartQuantity > 1 ? 's' : ''}
                          </p>
                        </div>
                      )}

                      <div className="space-y-3">
                        <button
                          onClick={handleAddToCart}
                          disabled={addingToCart}
                          className="w-full bg-primary-600 text-white bg-blue-500 py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ShoppingCart className="w-5 h-5" />
                          <span>{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
                        </button>

                        <Link
                          href="/cart"
                          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                        >
                          Buy Now
                        </Link>
                      </div>

                      {medicine.prescriptionRequired && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <ShieldAlert className="w-4 h-4 inline mr-2" />
                            This medicine requires a prescription. You'll need to provide doctor details during checkout.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <a
                  href={medicine.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  View on 1mg →
                </a>
              </div>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="border-t border-gray-200 p-6">
            <div className="space-y-8">
              {medicine.description && (
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
                  <p className="text-gray-700 leading-relaxed">{medicine.description}</p>
                </section>
              )}

              {medicine.uses && (
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Uses</h2>
                  <p className="text-gray-700 leading-relaxed">{medicine.uses}</p>
                </section>
              )}

              {medicine.side_effects && (
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Side Effects</h2>
                  <p className="text-gray-700 leading-relaxed">{medicine.side_effects}</p>
                </section>
              )}

              {medicine.quick_tips && (
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Tips</h2>
                  <div className="text-gray-700 whitespace-pre-line leading-relaxed">{medicine.quick_tips}</div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicineDetailPage;
