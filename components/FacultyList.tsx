'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, RotateCw, User, Award } from 'lucide-react';
import { Teacher, Department } from '@/lib/types';

interface FacultyListProps {
  teachers: Teacher[];
  departments: Department[];
  selectedTeacherId: string | null;
  isLoading: boolean;
  onSelectTeacher: (id: string | null) => void;
  onRefresh: () => void;
}

export default function FacultyList({
  teachers,
  departments,
  selectedTeacherId,
  isLoading,
  onSelectTeacher,
  onRefresh,
}: FacultyListProps) {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  const filteredTeachers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return teachers.filter((t) => {
      const nameMatch = !q || (t.name && t.name.toLowerCase().includes(q));
      const desigMatch = !q || (t.designation && t.designation.toLowerCase().includes(q));
      const emailMatch = !q || (t.email && t.email.toLowerCase().includes(q));
      const specMatch = !q || (t.specialization && t.specialization.toLowerCase().includes(q));
      const textMatch = nameMatch || desigMatch || emailMatch || specMatch;

      const deptRef = typeof t.department === 'string' ? t.department : (t.department as any)?._ref;
      const deptMatch = !selectedDept || deptRef === selectedDept;

      return textMatch && deptMatch;
    });
  }, [teachers, search, selectedDept]);

  return (
    <aside className="sidebar-teachers">
      <div className="sidebar-header">
        {/* Search bar */}
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            className="form-control"
            placeholder="Search faculty by name, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem', paddingRight: search ? '2rem' : '0.85rem' }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter & Refresh Row */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select
            className="form-control"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.short ? `${d.short} - ${d.name}` : d.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn-icon"
            onClick={onRefresh}
            title="Refresh list from Sanity"
            style={{ width: '34px', height: '34px', flexShrink: 0 }}
          >
            <RotateCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="sidebar-stats" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Faculty Directory ({filteredTeachers.length})</span>
        <a
          href="/teacher/order"
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--primary)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
          }}
          title="Reorder faculties by department"
        >
          Reorder ↗
        </a>
      </div>

      {/* Teachers List Cards */}
      <div className="teachers-list">
        {isLoading && teachers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Loading faculty profiles...
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>No faculty found</p>
            <span style={{ fontSize: '0.8rem' }}>Try modifying your search or department filter.</span>
          </div>
        ) : (
          filteredTeachers.map((teacher) => {
            const isSelected = selectedTeacherId === teacher._id;
            const deptName =
              teacher.departmentData?.short ||
              teacher.departmentData?.title ||
              teacher.departmentData?.name;

            return (
              <div
                key={teacher._id}
                onClick={() => onSelectTeacher(teacher._id || null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-surface)',
                  border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 0 0 1px var(--primary)' : 'var(--shadow-sm)',
                }}
              >
                {/* Avatar thumbnail */}
                {teacher.photoUrl ? (
                  <img
                    src={teacher.photoUrl}
                    alt={teacher.name}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--radius-md)',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontWeight: 700,
                      fontSize: '0.9rem',
                    }}
                  >
                    {teacher.name ? teacher.name.charAt(0).toUpperCase() : <User size={20} />}
                  </div>
                )}

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {teacher.name || 'Unnamed Faculty'}
                    </span>
                    {(teacher.idx || teacher.orderIndex) && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                          color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                          border: `1px solid ${isSelected ? 'transparent' : 'var(--border-subtle)'}`,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          flexShrink: 0,
                        }}
                        title={`Display Position: #${teacher.idx ?? teacher.orderIndex}`}
                      >
                        #{teacher.idx ?? teacher.orderIndex}
                      </span>
                    )}
                    {teacher.isHOD && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          backgroundColor: '#DCFCE7',
                          color: '#15803D',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          flexShrink: 0,
                        }}
                      >
                        HOD
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '1px',
                    }}
                  >
                    {teacher.designation || 'Faculty Member'}
                  </div>

                  {deptName && (
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        marginTop: '3px',
                        maxWidth: '180px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {deptName}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
