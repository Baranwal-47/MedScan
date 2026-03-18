import React, { useState, useEffect } from 'react';
import { Medicine } from '../types/Medicine';
import { medicineAPI } from '../services/api';
import Loading from './Loading';

interface MedicineDetailProps {
  medicineId: string;
  onClose: () => void;
}

const MedicineDetail: React.FC<MedicineDetailProps> = ({ medicineId, onClose }) => {
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        setLoading(true);
        const response = await medicineAPI.getMedicineById(medicineId);
        setMedicine(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch medicine details');
      } finally {
        setLoading(false);
      }
    };

    fetchMedicine();
  }, [medicineId]);

  if (loading) return <Loading />;
  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!medicine) return <div className="text-center">Medicine not found</div>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">{medicine.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Image and basic info */}
            <div className="lg:col-span-1">
              {medicine.image_url && (
                <img
                  src={medicine.image_url}
                  alt={medicine.name}
                  className="w-full h-48 object-contain bg-gray-50 rounded-lg mb-4"
                />
              )}
              
              <div className="space-y-2">
                {medicine.manufacturer && (
                  <div>
                    <span className="font-semibold">Manufacturer:</span>
                    <p className="text-gray-700">{medicine.manufacturer}</p>
                  </div>
                )}
                
                {medicine.price && (
                  <div>
                    <span className="font-semibold">Price:</span>
                    <p className="text-2xl font-bold text-primary-600">{medicine.price}</p>
                  </div>
                )}

                {medicine.composition && (
                  <div>
                    <span className="font-semibold">Composition:</span>
                    <p className="text-gray-700">{medicine.composition}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed information */}
            <div className="lg:col-span-2 space-y-6">
              {medicine.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{medicine.description}</p>
                </div>
              )}

              {medicine.uses && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Uses</h3>
                  <p className="text-gray-700">{medicine.uses}</p>
                </div>
              )}

              {medicine.side_effects && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Side Effects</h3>
                  <p className="text-gray-700">{medicine.side_effects}</p>
                </div>
              )}

              {medicine.quick_tips && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Quick Tips</h3>
                  <div className="text-gray-700 whitespace-pre-line">{medicine.quick_tips}</div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <a
              href={medicine.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors"
            >
              View on 1mg
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicineDetail;
