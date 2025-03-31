// src/components/common/Pagination.js
import React from 'react';
import PropTypes from 'prop-types';
import { FaAngleLeft, FaAngleRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';
import '../styles/Pagination.css';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLastButtons = true,
  size = 'medium',
  align = 'center',
  className = '',
  itemsPerPageOptions = [10, 25, 50, 100],
  itemsPerPage = 10,
  onItemsPerPageChange = null,
  totalItems = null,
  showItemsPerPage = false
}) => {
  // Don't render pagination if there's only one page
  if (totalPages <= 1) return null;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const totalNumbers = siblingCount * 2 + 3; // siblings + current + first + last
    const totalBlocks = totalNumbers + 2; // +2 for the "..." blocks

    if (totalPages <= totalBlocks) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 1 + 2 * siblingCount;
      return [...Array.from({ length: leftItemCount }, (_, i) => i + 1), 'RIGHT_DOTS', totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 1 + 2 * siblingCount;
      return [1, 'LEFT_DOTS', ...Array.from(
        { length: rightItemCount }, 
        (_, i) => totalPages - rightItemCount + i + 1
      )];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      return [
        1,
        'LEFT_DOTS',
        ...Array.from(
          { length: rightSiblingIndex - leftSiblingIndex + 1 },
          (_, i) => leftSiblingIndex + i
        ),
        'RIGHT_DOTS',
        totalPages
      ];
    }
  };

  const pageNumbers = getPageNumbers();

  // Handle page change
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    if (onItemsPerPageChange) {
      onItemsPerPageChange(Number(e.target.value));
    }
  };

  // Calculate displayed items range
  const getItemsRange = () => {
    if (totalItems === null) return null;
    
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);
    
    return `${start}-${end} of ${totalItems}`;
  };

  return (
    <div className={`pagination-container ${align} ${className}`}>
      {showItemsPerPage && (
        <div className="items-per-page">
          <span className="items-per-page-label">Items per page:</span>
          <select 
            value={itemsPerPage} 
            onChange={handleItemsPerPageChange}
            className="items-per-page-select"
          >
            {itemsPerPageOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {totalItems !== null && (
        <div className="items-range">
          {getItemsRange()}
        </div>
      )}
      
      <ul className={`pagination ${size}`}>
        {showFirstLastButtons && (
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button
              className="page-link first"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              aria-label="Go to first page"
            >
              <FaAngleDoubleLeft />
            </button>
          </li>
        )}
        
        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
          <button
            className="page-link prev"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
          >
            <FaAngleLeft />
          </button>
        </li>
        
        {pageNumbers.map((pageNumber, index) => {
          if (pageNumber === 'LEFT_DOTS' || pageNumber === 'RIGHT_DOTS') {
            return (
              <li key={`dots-${index}`} className="page-item dots">
                <span className="page-link">...</span>
              </li>
            );
          }
          
          return (
            <li 
              key={pageNumber} 
              className={`page-item ${pageNumber === currentPage ? 'active' : ''}`}
            >
              <button
                className="page-link"
                onClick={() => handlePageChange(pageNumber)}
                aria-current={pageNumber === currentPage ? 'page' : undefined}
              >
                {pageNumber}
              </button>
            </li>
          );
        })}
        
        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
          <button
            className="page-link next"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Go to next page"
          >
            <FaAngleRight />
          </button>
        </li>
        
        {showFirstLastButtons && (
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button
              className="page-link last"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Go to last page"
            >
              <FaAngleDoubleRight />
            </button>
          </li>
        )}
      </ul>
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  siblingCount: PropTypes.number,
  showFirstLastButtons: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  align: PropTypes.oneOf(['start', 'center', 'end']),
  className: PropTypes.string,
  itemsPerPageOptions: PropTypes.arrayOf(PropTypes.number),
  itemsPerPage: PropTypes.number,
  onItemsPerPageChange: PropTypes.func,
  totalItems: PropTypes.number,
  showItemsPerPage: PropTypes.bool
};

export default Pagination;
