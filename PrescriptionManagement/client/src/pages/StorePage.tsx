import React, { useState } from 'react';
import { useMedicines } from '../hooks/useMedicines';
import MedicineCard from '../components/MedicineCard';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import Loading from '../components/Loading';

const StorePage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('');
  const [prescriptionFilter, setPrescriptionFilter] = useState('');

  const { medicines, loading, error, pagination } = useMedicines(
    currentPage,
    searchQuery,
    selectedLetter,
    prescriptionFilter
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleLetterFilter = (letter: string) => {
    setSelectedLetter(letter);
    setCurrentPage(1);
  };

  const handlePrescriptionFilter = (value: string) => {
    setPrescriptionFilter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Medicine Store</h1>
          <p className="text-gray-600">Browse and search through our comprehensive medicine database</p>
        </header>

        <SearchBar
          onSearch={handleSearch}
          onLetterFilter={handleLetterFilter}
          onPrescriptionFilter={handlePrescriptionFilter}
          currentSearch={searchQuery}
          currentLetter={selectedLetter}
          currentPrescription={prescriptionFilter}
        />

        {loading && <Loading />}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                Showing {medicines.length} of {pagination.totalCount} medicines
                {searchQuery && ` for "${searchQuery}"`}
                {selectedLetter && ` starting with "${selectedLetter}"`}
                {prescriptionFilter === 'true' && ` requiring prescription`}
                {prescriptionFilter === 'false' && ` available over the counter`}
              </p>
            </div>

            {medicines.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No medicines found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {medicines.map((medicine) => (
                  <MedicineCard
                    key={medicine._id}
                    medicine={medicine}
                  />
                ))}
              </div>
            )}

            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              hasNext={pagination.hasNext}
              hasPrev={pagination.hasPrev}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default StorePage;
