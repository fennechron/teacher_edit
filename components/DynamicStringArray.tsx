'use client';

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface DynamicStringArrayProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  hint?: string;
}

export default function DynamicStringArray({
  label,
  items = [],
  onChange,
  placeholder = 'Type item and press Enter...',
  hint,
}: DynamicStringArrayProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onChange([...items, trimmed]);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
      <label className="form-label">{label}</label>
      {hint && <span className="field-hint" style={{ marginBottom: '0.4rem' }}>{hint}</span>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.5rem' }}>
        {items.length === 0 ? (
          <div
            style={{
              padding: '0.75rem',
              textAlign: 'center',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              border: '1px dashed var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-elevated)',
            }}
          >
            No items added yet. Use the field below to add.
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.55rem 0.85rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                gap: '0.75rem',
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--text-muted)', minWidth: '20px' }}>
                {idx + 1}.
              </span>
              <span style={{ flex: 1, wordBreak: 'break-word', color: 'var(--text-primary)' }}>
                {item}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px',
                }}
                title="Remove item"
              >
                <X size={15} />
              </button>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          className="form-control"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleAdd}
          style={{ whiteSpace: 'nowrap', padding: '0.5rem 0.9rem' }}
        >
          <Plus size={15} />
          Add
        </button>
      </div>
    </div>
  );
}
