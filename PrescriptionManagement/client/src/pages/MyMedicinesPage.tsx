import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { orderAPI } from '../services/orderApi';
import { Pill, Calendar, Package, ShieldAlert, ShieldCheck, TrendingUp, Clock, Eye } from 'lucide-react';

interface DeliveredMedicine {
  medicine: {
    _id: string;
    name: string;
    price: string;
    image_url: string;
    composition: string;
    manufacturer: string;
    prescriptionRequired: boolean;
    uses: string;
    side_effects: string;
  };
  quantity: number;
  price: string;
  prescriptionRequired: boolean;
  orderNumber: string;
  orderDate: string;
  deliveredDate: string;
  doctorName?: string;
}

interface MedicineStats {
  totalOrders: number;
  uniqueMedicines: number;
  totalQuantity: number;
  prescriptionMedicines: number;
}

const MyMedicinesPage: React.FC = () => {
  const [medicines, setMedicines] = useState<DeliveredMedicine[]>([]);
  const [stats, setStats] = useState<MedicineStats>({
    totalOrders: 0,
    uniqueMedicines: 0,
    totalQuantity: 0,
    prescriptionMedicines: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMedicine, setSelectedMedicine] = useState<DeliveredMedicine | null>(null);
  const [medicineHistory, setMedicineHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchMyMedicines();
  }, [currentPage]);

 const fetchMyMedicines = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('No token found');
    setError('Please log in again');
    return;
  }

  try {
    setLoading(true);
    const response = await fetch('http://localhost:5000/api/medicines/my-delivered?page=1', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success:', data);
      setMedicines(data.data);
      // Note: This route returns simpler data structure
    } else {
      const errorText = await response.text();
      console.error('Response not ok:', response.status, errorText);
      setError(`API Error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('Fetch error:', error);
    setError('Network error occurred');
  } finally {
    setLoading(false);
  }
};


  const fetchMedicineHistory = async (medicineId: string) => {
    try {
      setHistoryLoading(true);
      const response = await orderAPI.getMedicineHistory(medicineId);
      setMedicineHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch medicine history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleViewHistory = (medicine: DeliveredMedicine) => {
    setSelectedMedicine(medicine);
    fetchMedicineHistory(medicine.medicine._id);
  };

  const groupMedicinesByName = (medicines: DeliveredMedicine[]) => {
    const grouped: { [key: string]: DeliveredMedicine[] } = {};
    medicines.forEach(item => {
      const key = item.medicine._id;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    return grouped;
  };

  const groupedMedicines = groupMedicinesByName(medicines);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Medicines</h1>
          <p className="text-gray-600">Track your delivered medicines and medication history</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Pill className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Unique Medicines</p>
                <p className="text-2xl font-bold text-gray-900">{stats.uniqueMedicines}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Quantity</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalQuantity}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ShieldAlert className="w-8 h-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Prescription Meds</p>
                <p className="text-2xl font-bold text-gray-900">{stats.prescriptionMedicines}</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {medicines.length === 0 ? (
          <div className="text-center py-12">
            <Pill className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No medicines delivered yet</h2>
            <p className="text-gray-500 mb-6">Your delivered medicines will appear here</p>
            <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Browse Medicines
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(groupedMedicines).map(([medicineId, items]) => {
                const medicine = items[0]; // Use first item for medicine details
                const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
                const lastDelivered = new Date(Math.max(...items.map(item => new Date(item.deliveredDate).getTime())));

                return (
                  <div key={medicineId} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start space-x-4">
                        {medicine.medicine.image_url ? (
                          <img
                            src={medicine.medicine.image_url}
                            alt={medicine.medicine.name}
                            className="w-20 h-20 object-contain rounded-lg bg-gray-50"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Pill className="w-8 h-8 text-gray-400" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">
                            {medicine.medicine.name}
                          </h3>
                          {medicine.medicine.manufacturer && (
                            <p className="text-sm text-gray-600 mb-2">
                              by {medicine.medicine.manufacturer}
                            </p>
                          )}

                          <div className="flex items-center space-x-2 mb-2">
                            {medicine.medicine.prescriptionRequired ? (
                              <span className="inline-flex items-center text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                <ShieldAlert className="w-3 h-3 mr-1" />
                                Prescription
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                <ShieldCheck className="w-3 h-3 mr-1" />
                                OTC
                              </span>
                            )}
                          </div>

                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center">
                              <Package className="w-4 h-4 mr-1" />
                              <span>Total delivered: {totalQuantity}</span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              <span>Last: {lastDelivered.toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>Orders: {items.length}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleViewHistory(medicine)}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View History
                          </button>
                          <Link
                            href={`/medicine/${medicine.medicine._id}`}
                            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm text-center"
                          >
                            Reorder
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

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
          </>
        )}

        {/* Medicine History Modal */}
        {selectedMedicine && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedMedicine.medicine.name}
                    </h2>
                    <p className="text-gray-600">{selectedMedicine.medicine.manufacturer}</p>
                  </div>
                  <button
                    onClick={() => setSelectedMedicine(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order History</h3>
                
                {historyLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {medicineHistory.map((history, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">Order #{history.orderNumber}</p>
                            <p className="text-sm text-gray-600">Quantity: {history.quantity}</p>
                            <p className="text-sm text-gray-600">Price: {history.price}</p>
                            {/* {history.doctorName && (
                              <p className="text-sm text-blue-600">Prescribed by Dr. {history.doctorName}</p>
                            )} */}
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <p>Ordered: {new Date(history.orderDate).toLocaleDateString()}</p>
                            <p>Delivered: {new Date(history.deliveredDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyMedicinesPage;
