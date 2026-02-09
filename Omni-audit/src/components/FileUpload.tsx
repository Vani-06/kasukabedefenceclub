'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface FileUploadProps {
  onUploadComplete?: (documentId: string) => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadStatus('idle');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      // Optionally add userId if you have authentication
      // formData.append('userId', 'user-123');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadStatus('success');
        if (onUploadComplete && data.documentId) {
          onUploadComplete(data.documentId);
        }
      } else {
        setUploadStatus('error');
        setErrorMessage(data.error || 'Upload failed');
      }
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage('Network error occurred');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="file-upload-container">
      <div
        className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${uploadStatus}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-input"
          className="file-input"
          onChange={handleFileSelect}
          accept=".pdf,.png,.jpg,.jpeg,.txt,.docx"
          disabled={isUploading}
        />

        <label htmlFor="file-input" className="upload-label">
          {isUploading ? (
            <Loader2 className="upload-icon spinning" size={48} />
          ) : uploadStatus === 'success' ? (
            <CheckCircle2 className="upload-icon success" size={48} />
          ) : uploadStatus === 'error' ? (
            <XCircle className="upload-icon error" size={48} />
          ) : (
            <Upload className="upload-icon" size={48} />
          )}

          <h3 className="upload-title">
            {isUploading
              ? 'Uploading...'
              : uploadStatus === 'success'
                ? 'Upload Successful!'
                : 'Upload Financial Document'
            }
          </h3>

          <p className="upload-description">
            {uploadStatus === 'error'
              ? errorMessage
              : 'Drag and drop or click to select PDF, images, text, or audio files'
            }
          </p>

          {!isUploading && uploadStatus === 'idle' && (
            <div className="supported-formats">
              <FileText size={16} />
              <span>PDF, PNG, JPG, TXT, DOCX, MP3, WAV</span>
            </div>
          )}
        </label>
      </div>

      <style jsx>{`
        .file-upload-container {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }

        .upload-dropzone {
          border: 2px dashed #cbd5e0;
          border-radius: 12px;
          padding: 3rem 2rem;
          text-align: center;
          transition: all 0.3s ease;
          background: #f7fafc;
          cursor: pointer;
        }

        .upload-dropzone:hover {
          border-color: #4299e1;
          background: #ebf8ff;
        }

        .upload-dropzone.dragging {
          border-color: #3182ce;
          background: #bee3f8;
          transform: scale(1.02);
        }

        .upload-dropzone.success {
          border-color: #48bb78;
          background: #f0fff4;
        }

        .upload-dropzone.error {
          border-color: #f56565;
          background: #fff5f5;
        }

        .file-input {
          display: none;
        }

        .upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          cursor: pointer;
        }

        .upload-icon {
          color: #4a5568;
          margin-bottom: 0.5rem;
        }

        .upload-icon.spinning {
          animation: spin 1s linear infinite;
          color: #4299e1;
        }

        .upload-icon.success {
          color: #48bb78;
        }

        .upload-icon.error {
          color: #f56565;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .upload-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #2d3748;
          margin: 0;
        }

        .upload-description {
          font-size: 0.95rem;
          color: #718096;
          margin: 0;
        }

        .supported-formats {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: white;
          border-radius: 8px;
          font-size: 0.875rem;
          color: #4a5568;
        }
      `}</style>
    </div>
  );
}
