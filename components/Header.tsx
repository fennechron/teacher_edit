'use client';

import React, { useState, useEffect } from 'react';
import { GraduationCap, Sun, Moon, Plus } from 'lucide-react';

interface HeaderProps {
  status: { connected: boolean; isLive?: boolean; projectId?: string; dataset?: string };
  onNewTeacher?: () => void;
  showAddButton?: boolean;
}

export default function Header({
  status,
  onNewTeacher,
  showAddButton = true,
}: HeaderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = (localStorage.getItem('faculty_portal_theme') as 'light' | 'dark') || 'light';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('faculty_portal_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-icon">
          <GraduationCap size={22} />
        </div>
        <div>
          <h1 className="brand-title">Faculty Portal</h1>
          <span className="brand-subtitle">Sanity Teacher Directory</span>
        </div>
      </div>

      <div className="header-actions">
        {/* Status Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 600,
            background: status.connected ? 'var(--success-bg)' : 'var(--warning-bg)',
            color: status.connected ? 'var(--success)' : 'var(--warning)',
            marginRight: '0.5rem',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: status.connected ? 'var(--success)' : 'var(--warning)',
              display: 'inline-block',
            }}
          />
          <span className="status-text">
            {status.connected
              ? `Sanity: ${status.projectId || 'Connected'}`
              : 'Demo / Setup'}
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          className="btn-icon"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Reorder Teachers */}
        {showAddButton && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => window.location.href = '/teacher/order'}
            style={{ fontWeight: 600, marginRight: '0.25rem' }}
          >
            <span className="btn-text-hide-mobile">Reorder</span>
          </button>
        )}

        {/* Add Faculty */}
        {showAddButton && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onNewTeacher}
            style={{ fontWeight: 600 }}
          >
            <Plus size={16} />
            <span className="btn-text-hide-mobile">Add Faculty</span>
          </button>
        )}
      </div>
    </header>
  );
}
