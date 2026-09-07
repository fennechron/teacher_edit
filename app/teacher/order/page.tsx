'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Teacher, Department, getFacultyRoleRank } from '@/lib/types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Loader2,
  ArrowLeft,
  Save,
  GripVertical,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  SlidersVertical
} from 'lucide-react';

export default function OrderTeacherPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [orderedTeachers, setOrderedTeachers] = useState<Teacher[]>([]);
  const [initialOrderSnapshot, setInitialOrderSnapshot] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [status, setStatus] = useState<{ connected: boolean; isLive?: boolean; projectId?: string; dataset?: string }>({
    connected: false,
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  const loadTeachers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/teachers');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTeachers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    loadDepartments();
    loadTeachers();
  }, [loadStatus, loadDepartments, loadTeachers]);

  // Initial order: priority to idx if assigned, else academic hierarchy: HOD -> Professor -> Associate -> Assistant -> Others
  useEffect(() => {
    if (selectedDept) {
      const deptTeachers = teachers
        .filter((t) => {
          const deptRef = typeof t.department === 'string' ? t.department : (t.department as any)?._ref;
          return deptRef === selectedDept;
        })
        .sort((a, b) => {
          const idxA = a.idx ?? a.orderIndex ?? 999999;
          const idxB = b.idx ?? b.orderIndex ?? 999999;
          if (idxA !== idxB) return idxA - idxB;

          // Role hierarchy: HOD (1), Professor (2), Associate (3), Assistant (4), Others (5, 6)
          const rankA = getFacultyRoleRank(a);
          const rankB = getFacultyRoleRank(b);
          if (rankA !== rankB) return rankA - rankB;

          return (a.name || '').localeCompare(b.name || '');
        });

      setOrderedTeachers(deptTeachers);
      setInitialOrderSnapshot(deptTeachers.map((t) => t._id || ''));
      setHasUnsavedChanges(false);
    } else {
      setOrderedTeachers([]);
      setInitialOrderSnapshot([]);
      setHasUnsavedChanges(false);
    }
  }, [selectedDept, teachers]);

  // Handle direct position change with automatic shifting
  const handlePositionChange = (currentIndex: number, newPosition1Based: number): boolean => {
    if (isNaN(newPosition1Based) || orderedTeachers.length <= 1) return false;
    
    if (newPosition1Based < 1 || newPosition1Based > orderedTeachers.length) {
      showToast(`Invalid position! Please enter a value between 1 and ${orderedTeachers.length}.`, 'error');
      return false;
    }

    const targetIndex = newPosition1Based - 1;
    if (targetIndex === currentIndex) return false;

    const copy = [...orderedTeachers];
    const [movedItem] = copy.splice(currentIndex, 1);
    copy.splice(targetIndex, 0, movedItem);

    setOrderedTeachers(copy);
    setHasUnsavedChanges(true);
    return true;
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    handlePositionChange(index, index);
  };

  const handleMoveDown = (index: number) => {
    if (index >= orderedTeachers.length - 1) return;
    handlePositionChange(index, index + 2);
  };

  // Re-rank strictly by hierarchy: HOD -> Professor -> Associate Professor -> Assistant Professor -> Others
  const handleAutoRankByHierarchy = () => {
    if (!selectedDept || orderedTeachers.length === 0) return;

    const sortedByHierarchy = [...orderedTeachers].sort((a, b) => {
      const rankA = getFacultyRoleRank(a);
      const rankB = getFacultyRoleRank(b);
      if (rankA !== rankB) return rankA - rankB;
      return (a.name || '').localeCompare(b.name || '');
    });

    setOrderedTeachers(sortedByHierarchy);
    setHasUnsavedChanges(true);
    showToast('Ranked by hierarchy: HOD → Professor → Associate → Assistant → Others', 'info');
  };

  const handleResetOrder = () => {
    if (!selectedDept) return;
    const originalMap = new Map(initialOrderSnapshot.map((id, index) => [id, index]));
    const resetList = [...orderedTeachers].sort((a, b) => {
      const posA = originalMap.get(a._id || '') ?? 999;
      const posB = originalMap.get(b._id || '') ?? 999;
      return posA - posB;
    });
    setOrderedTeachers(resetList);
    setHasUnsavedChanges(false);
    showToast('Reset order to last saved state', 'info');
  };

  // Drag and drop handlers
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    const copyListItems = [...orderedTeachers];
    const [reorderedItem] = copyListItems.splice(sourceIndex, 1);
    copyListItems.splice(destinationIndex, 0, reorderedItem);
    
    setOrderedTeachers(copyListItems);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!selectedDept || orderedTeachers.length === 0) return;
    
    setIsSaving(true);
    try {
      const updates = orderedTeachers.map((t, index) => ({
        id: t._id!,
        idx: index + 1,
        orderIndex: index + 1,
      }));

      const res = await fetch('/api/teachers/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save order');
      }

      showToast(`Saved index order for ${updates.length} faculties!`, 'success');
      setHasUnsavedChanges(false);
      setInitialOrderSnapshot(orderedTeachers.map((t) => t._id || ''));

      // Update local teachers cache with new idx
      setTeachers((prev) => {
        const next = [...prev];
        updates.forEach((u) => {
          const tIdx = next.findIndex((x) => x._id === u.id);
          if (tIdx >= 0) {
            next[tIdx] = { ...next[tIdx], idx: u.idx, orderIndex: u.orderIndex };
          }
        });
        return next;
      });
    } catch (err: any) {
      showToast(`Save error: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Compute teacher counts per department for dropdown display
  const departmentCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    teachers.forEach((t) => {
      const dId = typeof t.department === 'string' ? t.department : (t.department as any)?._ref;
      if (dId) {
        counts[dId] = (counts[dId] || 0) + 1;
      }
    });
    return counts;
  }, [teachers]);

  return (
    <div className="app-container">
      <Header status={status} showAddButton={false} />

      <main
        className="app-workspace"
        style={{
          overflowY: 'auto',
          backgroundColor: 'var(--bg-app)',
          display: 'block',
          paddingBottom: '4rem',
        }}
      >
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem', width: '100%' }}>
          {/* Header Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '1.75rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => router.push('/')}
                style={{
                  marginBottom: '0.75rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: 600,
                }}
              >
                <ArrowLeft size={15} />
                Back to Directory
              </button>
              <h2 className="editor-heading" style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
                Department Faculty Ordering
              </h2>
              <p className="editor-subtext" style={{ marginTop: '0.35rem', fontSize: '0.9rem' }}>
                Set display position (<code style={{ color: 'var(--primary)', fontWeight: 700 }}>idx</code>) for each faculty member.
                Type a position or drag cards to auto-shift the entire department list.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {selectedDept && orderedTeachers.length > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleAutoRankByHierarchy}
                  disabled={isSaving}
                  title="Sort faculties by HOD → Professor → Associate Professor → Assistant Professor → Others"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}
                >
                  <SlidersVertical size={14} />
                  <span>Auto-Rank by Hierarchy</span>
                </button>
              )}

              {hasUnsavedChanges && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleResetOrder}
                  disabled={isSaving}
                  title="Reset to last saved order"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <RotateCcw size={14} />
                  <span>Reset</span>
                </button>
              )}

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={isSaving || orderedTeachers.length === 0 || !hasUnsavedChanges}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.65rem 1.25rem',
                  fontWeight: 600,
                  boxShadow: hasUnsavedChanges ? '0 0 14px rgba(37, 99, 235, 0.4)' : undefined,
                }}
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>{isSaving ? 'Saving Order...' : hasUnsavedChanges ? 'Save Changes' : 'Order Saved'}</span>
              </button>
            </div>
          </div>

          {/* Department Selection Bar */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem 1.5rem',
              marginBottom: '2rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: 1, minWidth: '260px' }}>
                <label
                  htmlFor="dept-selector"
                  className="form-label"
                  style={{ fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}
                >
                  Choose Department to Reorder:
                </label>
                <select
                  id="dept-selector"
                  className="form-control"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  style={{ fontSize: '0.95rem', padding: '0.6rem 0.85rem' }}
                >
                  <option value="">-- Choose a Department --</option>
                  {departments.map((d) => {
                    const count = departmentCounts[d._id] || 0;
                    return (
                      <option key={d._id} value={d._id}>
                        {d.short ? `${d.short} - ${d.name}` : d.name} ({count} {count === 1 ? 'member' : 'members'})
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedDept && orderedTeachers.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: 'auto' }}>
                  {hasUnsavedChanges ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: '#FEF3C7',
                        color: '#B45309',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                      }}
                    >
                      <AlertCircle size={14} />
                      Unsaved Order Changes
                    </span>
                  ) : (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: '#DCFCE7',
                        color: '#15803D',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                      }}
                    >
                      <CheckCircle2 size={14} />
                      All Positions Up to Date
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* List Content */}
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0' }}>
              <Loader2 size={36} className="animate-spin" style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>Loading faculties...</p>
            </div>
          ) : !selectedDept ? (
            <div
              style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '2px dashed var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              <Sparkles size={36} style={{ color: 'var(--primary)', opacity: 0.8, marginBottom: '0.75rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Select a Department
              </h3>
              <p style={{ maxWidth: '450px', margin: '0 auto', fontSize: '0.875rem' }}>
                Please choose a department above to view and reorder its faculty members by drag-and-drop or typing the position index directly.
              </p>
            </div>
          ) : orderedTeachers.length === 0 ? (
            <div
              style={{
                padding: '3rem 1.5rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                No faculty members in this department yet.
              </p>
              <span style={{ fontSize: '0.85rem' }}>
                You can create a new faculty member from the directory.
              </span>
            </div>
          ) : (
            isMounted && (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="teachers-list">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0 0.5rem',
                          fontSize: '0.825rem',
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span>Display Order (Top to Bottom) • Academic Hierarchy: HOD → Professor → Associate → Assistant</span>
                        <span>{orderedTeachers.length} Faculties</span>
                      </div>

                      {orderedTeachers.map((teacher, index) => {
                        const currentPos = index + 1;

                        return (
                          <Draggable key={teacher._id} draggableId={teacher._id || String(index)} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.85rem',
                                  padding: '0.85rem 1rem',
                                  backgroundColor: snapshot.isDragging
                                    ? 'var(--bg-surface-elevated)'
                                    : 'var(--bg-surface)',
                                  border: `1.5px solid ${
                                    snapshot.isDragging
                                      ? 'var(--primary)'
                                      : 'var(--border-subtle)'
                                  }`,
                                  borderRadius: 'var(--radius-lg)',
                                  boxShadow: snapshot.isDragging ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                                  opacity: snapshot.isDragging ? 0.9 : 1,
                                  transform: snapshot.isDragging ? 'scale(1.02)' : 'none',
                                  transition: 'box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease',
                                  ...provided.draggableProps.style,
                                }}
                              >
                                {/* Drag Grip Handle */}
                                <div
                                  {...provided.dragHandleProps}
                                  title="Drag to reorder"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--text-muted)',
                                    cursor: 'grab',
                                    padding: '4px',
                                  }}
                                >
                                  <GripVertical size={20} />
                                </div>

                    {/* Position Display Pill */}
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--primary)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        flexShrink: 0,
                        boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
                      }}
                      title={`Current position on college website: #${currentPos}`}
                    >
                      #{currentPos}
                    </div>

                    {/* Faculty Avatar */}
                    {teacher.photoUrl ? (
                      <img
                        src={teacher.photoUrl}
                        alt={teacher.name}
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: 'var(--radius-md)',
                          objectFit: 'cover',
                          flexShrink: 0,
                          border: '1px solid var(--border-subtle)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--bg-surface-elevated)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--primary)',
                          fontWeight: 700,
                          fontSize: '1rem',
                          flexShrink: 0,
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {teacher.name ? teacher.name.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}

                    {/* Name & Role Info */}
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            fontSize: '0.95rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {teacher.name || 'Unnamed Faculty'}
                        </span>
                        {teacher.isHOD && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              backgroundColor: '#DCFCE7',
                              color: '#15803D',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            HOD
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: '2px',
                        }}
                      >
                        {teacher.designation || 'Faculty Member'}
                      </div>
                    </div>

                    {/* Step Nudge Buttons (Up / Down) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveUp(index);
                        }}
                        disabled={index === 0}
                        className="btn-icon"
                        style={{
                          width: '26px',
                          height: '22px',
                          padding: 0,
                          opacity: index === 0 ? 0.3 : 1,
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                        }}
                        title="Move Up"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveDown(index);
                        }}
                        disabled={index === orderedTeachers.length - 1}
                        className="btn-icon"
                        style={{
                          width: '26px',
                          height: '22px',
                          padding: 0,
                          opacity: index === orderedTeachers.length - 1 ? 0.3 : 1,
                          cursor: index === orderedTeachers.length - 1 ? 'not-allowed' : 'pointer',
                        }}
                        title="Move Down"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>

                    {/* Direct Position Textfield (Auto-shifts entire list on change/Enter) */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        padding: '0.35rem 0.65rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        flexShrink: 0,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <label
                        htmlFor={`pos-input-${teacher._id}`}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Pos:
                      </label>
                      <input
                        id={`pos-input-${teacher._id}`}
                        type="number"
                        min={1}
                        max={orderedTeachers.length}
                        defaultValue={currentPos}
                        key={`pos-input-${teacher._id}-${currentPos}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseInt((e.target as HTMLInputElement).value, 10);
                            if (!isNaN(val)) {
                              // We let onBlur handle the resetting or moving since blur() triggers it
                              (e.target as HTMLInputElement).blur();
                            }
                          }
                        }}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value, 10);
                          let moved = false;
                          if (!isNaN(val) && val !== currentPos) {
                            moved = handlePositionChange(index, val);
                          }
                          if (!moved) {
                            e.target.value = String(currentPos);
                          }
                        }}
                        style={{
                          width: '52px',
                          height: '30px',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          textAlign: 'center',
                          borderRadius: '4px',
                          border: '1.5px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                        }}
                        title="Type a position number and press Enter or click outside. All faculties will auto-shift accordingly."
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        / {orderedTeachers.length}
                      </span>
                    </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )
          )}
        </div>
      </main>

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
