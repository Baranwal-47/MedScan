import { useState, useEffect } from 'react';
import { Medicine } from '../types/Medicine';
import { medicineAPI } from '../services/api';

export const useMedicines = (
  page: number = 1,
  search: string = '',
  letter: string = '',
  prescriptionRequired: string = '' // 🆕 Add prescription filter parameter
) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        setLoading(true);
        const response = await medicineAPI.getMedicines(
          page, 
          12, 
          search, 
          letter, 
          prescriptionRequired // 🆕 Pass prescription filter to API
        );
        setMedicines(response.data);
        setPagination(response.pagination);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch medicines');
        setMedicines([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicines();
  }, [page, search, letter, prescriptionRequired]); // 🆕 Add prescription filter to dependency array

  return { medicines, loading, error, pagination };
};
