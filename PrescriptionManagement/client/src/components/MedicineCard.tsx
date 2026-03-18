import React from 'react';
import { Link } from 'wouter';
import { Medicine } from '../types/Medicine';
import { ShieldCheck, ShieldAlert } from 'lucide-react'; // 🆕 Icons for prescription

interface MedicineCardProps {
  medicine: Medicine;
}

const MedicineCard: React.FC<MedicineCardProps> = ({ medicine }) => {
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
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MedicineCard;
