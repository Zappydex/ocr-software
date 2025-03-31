import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaCloudUploadAlt, FaFileAlt, FaTimesCircle } from 'react-icons/fa';
import '../styles/DropZone.css';

const MAX_FILES = 100;
const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB in bytes

const DropZone = ({ 
  onFilesAdded, 
  maxFiles = MAX_FILES, 
  maxSize = MAX_FILE_SIZE,
  acceptedFileTypes = {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'application/zip': ['.zip']
  },
  multiple = true,
  disabled = false,
  existingFiles = []
}) => {
  const [files, setFiles] = useState(existingFiles || []);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (existingFiles && existingFiles.length > 0) {
      setFiles(existingFiles);
    }
  }, [existingFiles]);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (disabled) return;

    // Handle rejected files
    if (rejectedFiles && rejectedFiles.length > 0) {
      const errorMessages = rejectedFiles.map(file => {
        const { errors } = file;
        if (errors[0]?.code === 'file-too-large') {
          return `"${file.file.name}" is too large. Max size is ${formatFileSize(maxSize)}.`;
        }
        if (errors[0]?.code === 'file-invalid-type') {
          return `Unsupported file type: ${file.file.type}. Please upload PDF, JPEG, PNG, or ZIP files only.`;
        }
        return `"${file.file.name}" could not be uploaded: ${errors[0]?.message}`;
      });
      setErrors(errorMessages);
      return;
    }

    // Check if adding these files would exceed the max files limit
    if (files.length + acceptedFiles.length > maxFiles) {
      setErrors([`You can only upload a maximum of ${maxFiles} files.`]);
      return;
    }

    // Process accepted files
    const newFiles = acceptedFiles.map(file => 
      Object.assign(file, {
        preview: URL.createObjectURL(file),
        id: `${file.name}-${Date.now()}`
      })
    );

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    
    if (onFilesAdded) {
      onFilesAdded(updatedFiles);
    }
    
    setErrors([]);
  }, [files, maxFiles, maxSize, onFilesAdded, disabled]);

  const removeFile = (fileToRemove) => {
    const updatedFiles = files.filter(file => file.id !== fileToRemove.id);
    setFiles(updatedFiles);
    
    if (onFilesAdded) {
      onFilesAdded(updatedFiles);
    }
  };

  const clearErrors = () => {
    setErrors([]);
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize,
    multiple,
    disabled
  });

  // Format file size to human-readable format
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
    };
  }, [files]);

  return (
    <div className="dropzone-container">
      <div 
        {...getRootProps()} 
        className={`dropzone ${isDragActive ? 'active' : ''} ${isDragReject ? 'reject' : ''} ${disabled ? 'disabled' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="dropzone-content">
          <FaCloudUploadAlt className="upload-icon" />
          <p className="dropzone-text">
            {isDragActive 
              ? 'Drop files here...' 
              : `Drag & drop files here, or click to select files`
            }
          </p>
          <p className="dropzone-hint">
            Accepted file types: PDF, JPEG, PNG, ZIP
          </p>
          <p className="dropzone-hint">
            Maximum file size: {formatFileSize(maxSize)}
          </p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="dropzone-errors">
          <div className="error-header">
            <h6>Upload Errors</h6>
            <button className="clear-errors-btn" onClick={clearErrors} type="button" aria-label="Clear errors">
              <FaTimesCircle />
            </button>
          </div>
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {files.length > 0 && (
        <div className="file-list">
          <h6>Selected Files ({files.length}/{maxFiles})</h6>
          <ul>
            {files.map(file => (
              <li key={file.id} className="file-item">
                <div className="file-info">
                  <FaFileAlt className="file-icon" />
                  <div className="file-details">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{formatFileSize(file.size)}</span>
                  </div>
                </div>
                <button 
                  className="remove-file-btn" 
                  onClick={() => removeFile(file)}
                  disabled={disabled}
                  type="button"
                  aria-label={`Remove ${file.name}`}
                >
                  <FaTimesCircle />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DropZone;
