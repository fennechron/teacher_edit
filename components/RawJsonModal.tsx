'use client';

import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { Teacher } from '@/lib/types';

interface RawJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Partial<Teacher>;
}

export default function RawJsonModal({ isOpen, onClose, data }: RawJsonModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Teacher Document JSON Inspector</h3>
          <button type="button" className="btn-icon" onClick={onClose} style={{ border: 'none' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1rem', background: 'var(--bg-app)' }}>
          <pre
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              overflowX: 'auto',
              maxHeight: '55vh',
              color: 'var(--text-primary)',
            }}
          >
            <code>{jsonString}</code>
          </pre>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={handleCopy}>
            {copied ? <Check size={15} color="var(--success)" /> : <Copy size={15} />}
            {copied ? 'Copied!' : 'Copy JSON'}
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
