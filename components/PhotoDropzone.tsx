'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

interface PhotoDropzoneProps {
  photoUrl?: string | null;
  assetRef?: string | null;
  onPhotoChange: (assetRef: string | null, photoUrl: string | null) => void;
}

export default function PhotoDropzone({
  photoUrl,
  assetRef,
  onPhotoChange,
}: PhotoDropzoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, WebP).');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await res.json();
      onPhotoChange(data.assetRef, data.url);
    } catch (err: any) {
      alert(`Photo upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  return (
    <div className="form-group">
      <label className="form-label">Profile Photo</label>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !photoUrl && !isUploading && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragOver ? 'var(--primary)' : 'var(--border-medium)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          textAlign: 'center',
          backgroundColor: isDragOver ? 'var(--primary-light)' : 'var(--bg-surface)',
          cursor: photoUrl ? 'default' : 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          position: 'relative',
        }}
      >
        {isUploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Loader2 className="animate-spin" size={28} color="var(--primary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
              Uploading to Sanity...
            </span>
          </div>
        ) : photoUrl ? (
          <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img
              src={photoUrl}
              alt="Faculty photo"
              style={{
                width: '130px',
                height: '130px',
                objectFit: 'cover',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                marginBottom: '0.75rem',
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <a
                href={photoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                onClick={(e) => e.stopPropagation()}
              >
                View
              </a>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Change Photo
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onPhotoChange(null, null);
                }}
              >
                Remove
              </button>
            </div>
            <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--warning)', textAlign: 'center', maxWidth: '90%' }}>
              Note: Some images may look noisy in this preview, but they will be displayed correctly on the actual website. This is not an issue with the photo you used.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'var(--bg-surface-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                marginBottom: '0.25rem',
              }}
            >
              <Upload size={22} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Click or drag photo here
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              PNG, JPG, or WebP (max 5MB)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
