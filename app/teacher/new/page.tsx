'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import FacultyEditor from '@/components/FacultyEditor';
import { Teacher, Department } from '@/lib/types';

export default function NewTeacherPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [currentTeacher, setCurrentTeacher] = useState<Partial<Teacher>>({
    name: '',
    isHOD: false,
    designation: '',
    specialization: '',
    qualification: [],
    experience: [],
    about: [],
    courses_handled: [],
    fields_of_expertise: [],
    research: [],
    publications: [],
    awards_and_honours: [],
    positions_handled: [],
    industry_interaction: [],
    patents: [],
    books_published: [],
    other_details: [],
  });

  const [isSaving, setIsSaving] = useState(false);
  
  const [status, setStatus] = useState<{ connected: boolean; isLive?: boolean; projectId?: string; dataset?: string }>({
    connected: false,
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      if (Array.isArray(data)) {
        setDepartments(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    loadDepartments();
  }, [loadStatus, loadDepartments]);

  const handleUpdateField = (field: keyof Teacher, value: any) => {
    setCurrentTeacher((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!currentTeacher.name?.trim()) {
      showToast('Please enter the faculty member\'s full name before saving.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentTeacher),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save');
      }

      showToast('New faculty profile created successfully!', 'success');
      
      // Redirect back to home after brief delay
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err: any) {
      showToast(`Save error: ${err.message}`, 'error');
      setIsSaving(false);
    }
  };

  return (
    <div className="app-container">
      <Header
        status={status}
        showAddButton={false}
      />
      <main className="app-workspace view-editor" style={{ display: 'block' }}>
        <FacultyEditor
          teacher={currentTeacher}
          departments={departments}
          isNew={true}
          isSaving={isSaving}
          isLoadingDetails={false}
          onUpdateField={handleUpdateField}
          onSave={handleSave}
          onDelete={() => {}}
          onMobileBack={() => router.push('/')}
        />
      </main>

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.9rem',
            fontWeight: 500,
            color: '#FFFFFF',
            backgroundColor:
              toast.type === 'success'
                ? '#059669'
                : toast.type === 'error'
                ? '#DC2626'
                : '#2563EB',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
