'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function SettingsModal({ isOpen, onClose, onSaved }: SettingsModalProps) {
  const [projectId, setProjectId] = useState('');
  const [dataset, setDataset] = useState('production');
  const [apiVersion, setApiVersion] = useState('2024-01-01');
  const [token, setToken] = useState('');
  const [persistToEnv, setPersistToEnv] = useState(true);

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/config')
        .then((res) => res.json())
        .then((cfg) => {
          if (cfg.projectId) setProjectId(cfg.projectId);
          if (cfg.dataset) setDataset(cfg.dataset);
          if (cfg.apiVersion) setApiVersion(cfg.apiVersion);
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.connected) {
        setStatusMsg({ type: 'success', text: data.message || 'Connected successfully to Sanity!' });
      } else {
        setStatusMsg({ type: 'error', text: data.message || data.error || 'Connection failed' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, dataset, apiVersion, token, persistToEnv }),
      });
      const data = await res.json();

      if (data.success) {
        setStatusMsg({ type: 'success', text: 'Settings saved and connected!' });
        onSaved();
        setTimeout(() => onClose(), 1000);
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Save failed' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Sanity Configuration & Credentials</h3>
          <button type="button" className="btn-icon" onClick={onClose} style={{ border: 'none' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {statusMsg && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: statusMsg.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                  color: statusMsg.type === 'success' ? 'var(--success)' : 'var(--danger)',
                }}
              >
                {statusMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label required">Sanity Project ID</label>
              <input
                type="text"
                className="form-control"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Dataset Name</label>
              <input
                type="text"
                className="form-control"
                value={dataset}
                onChange={(e) => setDataset(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sanity API Token (Write/Editor access)</label>
              <input
                type="password"
                className="form-control"
                placeholder="Leave blank to keep existing server token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">API Version</label>
              <input
                type="text"
                className="form-control"
                value={apiVersion}
                onChange={(e) => setApiVersion(e.target.value)}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={persistToEnv}
                onChange={(e) => setPersistToEnv(e.target.checked)}
              />
              <span>Save to local .env file</span>
            </label>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleTest}
              disabled={testing || loading}
            >
              {testing ? <Loader2 size={15} className="animate-spin" /> : 'Test Connection'}
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || testing}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : 'Save & Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
