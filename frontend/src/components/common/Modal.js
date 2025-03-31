// src/components/common/Modal.js
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';
import '../styles/Modal.css';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  closeOnOutsideClick = true,
  showCloseButton = true,
  footer = null,
  className = '',
  closeOnEsc = true,
  centered = true,
  backdrop = true,
  animation = true
}) => {
  const modalRef = useRef(null);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (closeOnEsc && event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = ''; // Restore scrolling when modal is closed
    };
  }, [isOpen, onClose, closeOnEsc]);

  // Handle outside click
  const handleOutsideClick = (event) => {
    if (closeOnOutsideClick && modalRef.current && !modalRef.current.contains(event.target)) {
      onClose();
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  // Create portal to render modal at the end of the document body
  return createPortal(
    <div 
      className={`modal-overlay ${backdrop ? 'with-backdrop' : ''} ${animation ? 'fade-in' : ''}`}
      onClick={handleOutsideClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className={`modal-container ${size} ${centered ? 'centered' : ''} ${className} ${animation ? 'slide-in' : ''}`}
        ref={modalRef}
      >
        <div className="modal-header">
          <h3 id="modal-title" className="modal-title">{title}</h3>
          {showCloseButton && (
            <button 
              className="modal-close-button" 
              onClick={onClose}
              aria-label="Close modal"
            >
              <FaTimes />
            </button>
          )}
        </div>
        
        <div className="modal-content">
          {children}
        </div>
        
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'full']),
  closeOnOutsideClick: PropTypes.bool,
  showCloseButton: PropTypes.bool,
  footer: PropTypes.node,
  className: PropTypes.string,
  closeOnEsc: PropTypes.bool,
  centered: PropTypes.bool,
  backdrop: PropTypes.bool,
  animation: PropTypes.bool
};

export default Modal;
