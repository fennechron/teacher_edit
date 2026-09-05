'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import FacultyList from '@/components/FacultyList';
import FacultyEditor from '@/components/FacultyEditor';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { Teacher, Department } from '@/lib/types';

export default function Home() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [currentTeacher, setCurrentTeacher] = useState<Partial<Teacher>>({
    name: '',
    qualification: [],
    experience: [],
    about: [],
    publications: [],
  });

  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mobileViewEditor, setMobileViewEditor] = useState(false);

  // Modals
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Status
  const [status, setStatus] = useState<{ connected: boolean; isLive?: boolean; projectId?: string; dataset?: string }>({
    connected: false,
  });

  // Toasts
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load Status
  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Load Departments
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

  // Load Teachers
  const loadTeachers = useCallback(async () => {
    setIsLoadingTeachers(true);
    try {
      const res = await fetch('/api/teachers');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTeachers(data);
      }
      return data;
    } catch (err: any) {
      showToast(`Failed to load teachers: ${err.message}`, 'error');
      return null;
    } finally {
      setIsLoadingTeachers(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    loadDepartments();
    loadTeachers().then((data) => {
      if (data && data.length > 0) {
        setSelectedTeacherId(data[0]._id || null);
        setCurrentTeacher(data[0]);
      }
    });
  }, [loadStatus, loadDepartments, loadTeachers]);

  // Select Teacher
  const handleSelectTeacher = async (id: string | null) => {
    if (!id) return;

    setSelectedTeacherId(id);
    setMobileViewEditor(true);
    setIsLoadingDetails(true);

    try {
      const res = await fetch(`/api/teachers/${id}`);
      if (!res.ok) throw new Error('Could not fetch teacher details');
      const data = await res.json();
      setCurrentTeacher(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Update Field
  const handleUpdateField = (field: keyof Teacher, value: any) => {
    setCurrentTeacher((prev) => ({ ...prev, [field]: value }));
  };

  // Save Teacher
  const handleSave = async () => {
    if (!currentTeacher.name?.trim()) {
      showToast('Please enter the faculty member\'s full name before saving.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const isUpdate = Boolean(selectedTeacherId);
      const url = isUpdate ? `/api/teachers/${selectedTeacherId}` : '/api/teachers';
      const method = isUpdate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentTeacher),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save');
      }

      const savedDoc = await res.json();
      showToast(
        isUpdate ? 'Profile updated and saved to Sanity!' : 'New faculty profile created successfully!',
        'success'
      );

      // Refresh list
      await loadTeachers();
      if (savedDoc._id) {
        await handleSelectTeacher(savedDoc._id);
      }
    } catch (err: any) {
      showToast(`Save error: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!selectedTeacherId) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/teachers/${selectedTeacherId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Delete failed');
      }

      setIsDeleteOpen(false);
      showToast('Faculty profile deleted successfully', 'success');
      setSelectedTeacherId(null);
      setMobileViewEditor(false);
      await loadTeachers();
    } catch (err: any) {
      showToast(`Delete failed: ${err.message}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        status={status}
        onNewTeacher={() => router.push('/teacher/new')}
      />

      {/* Main Split-Pane Workspace */}
      <main className={`app-workspace ${mobileViewEditor ? 'view-editor' : ''}`}>
        <FacultyList
          teachers={teachers}
          departments={departments}
          selectedTeacherId={selectedTeacherId}
          isLoading={isLoadingTeachers}
          onSelectTeacher={handleSelectTeacher}
          onRefresh={loadTeachers}
        />

        <FacultyEditor
          teacher={currentTeacher}
          departments={departments}
          isNew={!selectedTeacherId}
          isSaving={isSaving}
          isLoadingDetails={isLoadingDetails}
          onUpdateField={handleUpdateField}
          onSave={handleSave}
          onDelete={() => setIsDeleteOpen(true)}
          onMobileBack={() => setMobileViewEditor(false)}
        />
      </main>

      {/* Modals */}

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        teacherName={currentTeacher.name || ''}
        isDeleting={isDeleting}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* Toast Notification */}
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
