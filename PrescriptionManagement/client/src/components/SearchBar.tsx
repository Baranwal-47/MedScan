import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onLetterFilter: (letter: string) => void;
  onPrescriptionFilter: (required: string) => void; // 🆕 NEW PROP
  currentSearch: string;
  currentLetter: string;
  currentPrescription: string; // 🆕 NEW PROP
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onLetterFilter,
  onPrescriptionFilter, // 🆕
  currentSearch,
  currentLetter,
  currentPrescription // 🆕
}) => {
  const [searchInput, setSearchInput] = useState(currentSearch);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by medicine name, composition, or manufacturer..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Search
          </button>
          {currentSearch && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                onSearch('');
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* 🆕 Prescription Filter */}
      <div className="border-t pt-4 mb-4">
        <p className="text-sm text-gray-600 mb-2">Filter by prescription:</p>
        <div className="flex gap-2">
          <button
            onClick={() => onPrescriptionFilter('')}
            className={`px-3 py-1 text-sm rounded ${
              currentPrescription === '' 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } transition-colors`}
          >
            All
          </button>
          <button
            onClick={() => onPrescriptionFilter('false')}
            className={`px-3 py-1 text-sm rounded ${
              currentPrescription === 'false' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } transition-colors`}
          >
            OTC (Over the Counter)
          </button>
          <button
            onClick={() => onPrescriptionFilter('true')}
            className={`px-3 py-1 text-sm rounded ${
              currentPrescription === 'true' 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } transition-colors`}
          >
            Prescription Required
          </button>
        </div>
      </div>

      <div className="border-t pt-4">
        <p className="text-sm text-gray-600 mb-2">Filter by first letter:</p>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => onLetterFilter('')}
            className={`px-3 py-1 text-sm rounded ${
              currentLetter === '' 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } transition-colors`}
          >
            All
          </button>
          {letters.map((letter) => (
            <button
              key={letter}
              onClick={() => onLetterFilter(letter)}
              className={`px-3 py-1 text-sm rounded ${
                currentLetter === letter
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } transition-colors`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
