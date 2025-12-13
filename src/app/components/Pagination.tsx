import React from 'react';

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const PaginationControls: React.FC<PaginationProps> = ({ 
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) {
    return null;
  }

  const MAX_VISIBLE_PAGES = 5; // max number of page numbers to show in the bar
  const pages: (number | '...')[] = [];
  
  let startPage = Math.max(1, currentPage - Math.floor(MAX_VISIBLE_PAGES / 2));
  let endPage = Math.min(totalPages, startPage + MAX_VISIBLE_PAGES - 1);
  if (endPage - startPage + 1 < MAX_VISIBLE_PAGES) {
      startPage = Math.max(1, endPage - MAX_VISIBLE_PAGES + 1);
  }

  if (startPage > 1) {
    pages.push(1);
    if (startPage > 2) pages.push('...');
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pages.push('...');
    pages.push(totalPages);
  }


  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex items-center space-x-2 p-3 bg-white rounded-lg shadow-md border border-gray-200">
      {/* Previous Button */}
      <button
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        className={`
          px-3 py-1 text-sm font-medium rounded-md transition-colors 
          ${currentPage === 1 
            ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
            : 'text-blue-600 bg-white hover:bg-gray-100 border border-gray-300'
          }
        `}
      >
        Previous
      </button>

      {/* Page Numbers */}
      <nav className="flex space-x-1" aria-label="Pagination">
        {pages.map((page, index) => {
          if (page === '...') {
            return (
              <span key={index} className="px-3 py-1 text-gray-500">
                ...
              </span>
            );
          }

          const pageNumber = page as number;
          const isCurrent = pageNumber === currentPage;

          return (
            <button
              key={index}
              onClick={() => handlePageClick(pageNumber)}
              aria-current={isCurrent ? 'page' : undefined}
              className={`
                px-3 py-1 text-sm font-medium rounded-md transition-colors
                ${isCurrent 
                  ? 'bg-blue-600 text-white shadow-inner' 
                  : 'text-gray-700 bg-white hover:bg-gray-100 border border-transparent hover:border-gray-300'
                }
              `}
            >
              {pageNumber}
            </button>
          );
        })}
      </nav>

      {/* Next Button */}
      <button
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`
          px-3 py-1 text-sm font-medium rounded-md transition-colors 
          ${currentPage === totalPages 
            ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
            : 'text-blue-600 bg-white hover:bg-gray-100 border border-gray-300'
          }
        `}
      >
        Next
      </button>
    </div>
  );
};

export default PaginationControls;