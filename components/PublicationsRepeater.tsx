'use client';

import React from 'react';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { Publication } from '@/lib/types';

interface PublicationsRepeaterProps {
  publications: Publication[];
  onChange: (pubs: Publication[]) => void;
}

export default function PublicationsRepeater({
  publications = [],
  onChange,
}: PublicationsRepeaterProps) {
  const handleAdd = () => {
    onChange([
      ...publications,
      {
        _key: Math.random().toString(36).substring(2, 9),
        title: '',
        link: '',
      },
    ]);
  };

  const handleUpdate = (index: number, field: 'title' | 'link', val: string) => {
    const updated = [...publications];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    onChange(publications.filter((_, i) => i !== index));
  };

  return (
    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div>
          <label className="form-label">Publications & Research Papers</label>
          <span className="field-hint" style={{ display: 'block' }}>
            Add published papers, journal articles, or conference proceedings.
          </span>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleAdd}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <Plus size={14} />
          Add Publication
        </button>
      </div>

      {publications.length === 0 ? (
        <div
          style={{
            padding: '1.25rem',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            border: '1px dashed var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-elevated)',
          }}
        >
          No publications listed yet. Click "+ Add Publication" above to add research articles.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {publications.map((pub, idx) => (
            <div
              key={pub._key || idx}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                  Publication #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.8rem',
                  }}
                  title="Remove publication"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Paper / Journal Title & Citation
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="e.g., A Survey on Edge Computing, IEEE Transactions on Computers..."
                  value={pub.title || ''}
                  onChange={(e) => handleUpdate(idx, 'title', e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  DOI or Website Link (URL)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://doi.org/... or https://..."
                    value={pub.link || ''}
                    onChange={(e) => handleUpdate(idx, 'link', e.target.value)}
                  />
                  {pub.link && (
                    <a
                      href={pub.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      title="Test Link in new tab"
                      style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <ExternalLink size={14} />
                      Test
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
