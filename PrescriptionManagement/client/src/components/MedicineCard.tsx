import React, { useState } from 'react';
import { Link } from 'wouter';
import { Medicine } from '../types/Medicine';
import { ShieldCheck, ShieldAlert, ShoppingCart, Check } from 'lucide-react'; // 🆕 Icons for prescription
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface MedicineCardProps {
  medicine: Medicine;
}

const MedicineCard: React.FC<MedicineCardProps> = ({ medicine }) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    // Card is wrapped in a Link — don't navigate on button click
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add medicines to your cart.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setAdding(true);
      await addToCart(medicine._id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (error: any) {
      toast({
        title: 'Could not add to cart',
        description: error?.response?.data?.message || error?.message || 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link                                             
      href={`/medicine/${medicine._id}`}
      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-4"
    >
      <div className="flex items-start gap-4">
        {medicine.image_url ? (
          <img
            src={medicine.image_url}
            alt={medicine.name}
            className="w-20 h-20 object-contain rounded-lg bg-gray-50"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-xs">No Image</span>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-lg text-gray-900 truncate flex-1">
              {medicine.name}
            </h3>
            {/* 🆕 Prescription Badge */}
            {medicine.prescriptionRequired && (
              <div className="ml-2 flex items-center text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                <ShieldAlert className="w-3 h-3 mr-1" />
                Rx
              </div>
            )}
          </div>
          
          {medicine.manufacturer && (
            <p className="text-sm text-gray-600 mb-1">
              by {medicine.manufacturer}
            </p>
          )}
          
          {medicine.composition && (
            <p className="text-sm text-gray-700 mb-2 line-clamp-2">
              <span className="font-medium">Composition:</span> {medicine.composition}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            {medicine.price && (
              <span className="text-lg font-bold text-primary-600">
                {medicine.price}
              </span>
            )}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {medicine.letter}
              </span>
              {medicine.price && (
                <button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    added
                      ? 'bg-green-100 text-green-700'
                      : 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60'
                  }`}
                >
                  {added ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                  {added ? 'Added' : adding ? 'Adding…' : 'Add'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MedicineCard;
