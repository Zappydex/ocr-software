// src/components/common/ProgressBar.js
import React from 'react';
import PropTypes from 'prop-types';
import '../styles/ProgressBar.css';

const ProgressBar = ({ 
  progress, 
  showPercentage = true, 
  height = 12, 
  animated = true, 
  variant = 'primary',
  label = '',
  showLabel = false
}) => {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className="progress-indicator-container">
      {(showLabel && label) && (
        <div className="progress-label">{label}</div>
      )}
      
      <div 
        className="progress-container" 
        style={{ height: `${height}px` }}
      >
        <div 
          className={`progress-bar ${animated ? 'animated' : ''} ${variant}`} 
          style={{ width: `${normalizedProgress}%` }}
          role="progressbar"
          aria-valuenow={normalizedProgress}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>
      
      {showPercentage && (
        <div className="progress-text">
          {normalizedProgress}%{label && !showLabel ? ` - ${label}` : ''}
        </div>
      )}
    </div>
  );
};

ProgressBar.propTypes = {
  progress: PropTypes.number.isRequired,
  showPercentage: PropTypes.bool,
  height: PropTypes.number,
  animated: PropTypes.bool,
  variant: PropTypes.oneOf(['primary', 'success', 'warning', 'danger', 'info']),
  label: PropTypes.string,
  showLabel: PropTypes.bool
};

export default ProgressBar;
