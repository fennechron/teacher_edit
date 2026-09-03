'use client';

import React, { useState } from 'react';
import {
  User,
  Phone,
  GraduationCap,
  BookOpen,
  Award,
  Save,
  Trash2,
  ArrowLeft,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { Teacher, Department } from '@/lib/types';
import PhotoDropzone from './PhotoDropzone';
import DynamicStringArray from './DynamicStringArray';
import PublicationsRepeater from './PublicationsRepeater';

interface FacultyEditorProps {
  teacher: Partial<Teacher>;
  departments: Department[];
  isNew: boolean;
  isSaving: boolean;
  isLoadingDetails?: boolean;
  onUpdateField: (field: keyof Teacher, value: any) => void;
  onSave: () => void;
  onDelete: () => void;
  onMobileBack: () => void;
}

export default function FacultyEditor({
  teacher,
  departments,
  isNew,
  isSaving,
  isLoadingDetails,
  onUpdateField,
  onSave,
  onDelete,
  onMobileBack,
}: FacultyEditorProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'contact' | 'education' | 'research' | 'awards'>('personal');

  const deptRef =
    typeof teacher.department === 'string'
      ? teacher.department
      : (teacher.department as any)?._ref || '';

  return (
    <section className="editor-panel">
      {/* Header bar */}
      <div className="editor-header">
        <div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onMobileBack}
            style={{ marginBottom: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <ArrowLeft size={14} />
            Back to Directory
          </button>

          <h2 className="editor-heading">{teacher.name || (isNew ? 'Create Faculty Profile' : 'Unnamed Faculty')}</h2>
          <p className="editor-subtext">
            {teacher.designation || 'Faculty Member'}
            {teacher.departmentData?.name ? ` • ${teacher.departmentData.name}` : ''}
          </p>
        </div>

        <div className="editor-top-actions">
          {!isNew && (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={onDelete}
              disabled={isSaving || isLoadingDetails}
            >
              <Trash2 size={15} />
              <span>Delete</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={onSave}
            disabled={isSaving || isLoadingDetails}
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </div>

      {isLoadingDetails ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <Loader2 size={32} className="animate-spin" style={{ marginBottom: '1rem', color: 'var(--primary)' }} />
          <p>Loading faculty details...</p>
        </div>
      ) : (
        <>
          {/* Tabs Hint */}
          <div style={{ padding: '0.75rem 1rem 0', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <span><i>Swipe the tabs below to view more sections like Publications, Awards, etc.</i></span>
          </div>

          {/* Tabs */}
          <div className="editor-tabs">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              <User size={15} />
              <span>1. Personal & Photo</span>
            </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          <Phone size={15} />
          <span>2. Contact & Bio</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'education' ? 'active' : ''}`}
          onClick={() => setActiveTab('education')}
        >
          <GraduationCap size={15} />
          <span>3. Education & Teaching</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'research' ? 'active' : ''}`}
          onClick={() => setActiveTab('research')}
        >
          <BookOpen size={15} />
          <span>4. Publications & Research</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'awards' ? 'active' : ''}`}
          onClick={() => setActiveTab('awards')}
        >
          <Award size={15} />
          <span>5. Awards & Roles</span>
        </button>
      </div>

      {/* Form Tabs Content */}
      <div className="editor-form">
        {/* Tab 1: Personal & Photo */}
        {activeTab === 'personal' && (
          <div className="form-grid-layout">
            <div className="form-col-inputs">
              <div className="form-group">
                <label className="form-label required">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Dr. Jane Smith"
                  value={teacher.name || ''}
                  onChange={(e) => onUpdateField('name', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  className="form-control"
                  value={deptRef}
                  onChange={(e) => onUpdateField('department', e.target.value)}
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.short ? `${d.short} - ${d.name}` : d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Designation / Role</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Associate Professor"
                    value={teacher.designation || ''}
                    onChange={(e) => onUpdateField('designation', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Specialization Area</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Machine Learning"
                    value={teacher.specialization || ''}
                    onChange={(e) => onUpdateField('specialization', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Cabin / Staff Room</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Room 304, Academic Block A"
                    value={teacher.staffRoom || ''}
                    onChange={(e) => onUpdateField('staffRoom', e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', marginTop: '1.25rem' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(teacher.isHOD)}
                      onChange={(e) => onUpdateField('isHOD', e.target.checked)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      Is Head of Department (HOD)?
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Photo dropzone column */}
            <div>
              <PhotoDropzone
                photoUrl={teacher.photoUrl}
                assetRef={teacher.photo?.asset?._ref}
                onPhotoChange={(assetRef, photoUrl) => {
                  if (assetRef) {
                    onUpdateField('photo', {
                      _type: 'image',
                      asset: { _type: 'reference', _ref: assetRef },
                    });
                    onUpdateField('photoUrl', photoUrl);
                  } else {
                    onUpdateField('photo', null);
                    onUpdateField('photoUrl', null);
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Contact & Bio */}
        {activeTab === 'contact' && (
          <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Official Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g., teacher@university.edu"
                  value={teacher.email || ''}
                  onChange={(e) => onUpdateField('email', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone / Extension</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="e.g., +91 9876543210"
                  value={teacher.phone || ''}
                  onChange={(e) => onUpdateField('phone', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Word From Teacher (Message to Students)</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="A short inspirational quote or message for students..."
                value={teacher.wordFromTeacher || ''}
                onChange={(e) => onUpdateField('wordFromTeacher', e.target.value)}
              />
            </div>

            <DynamicStringArray
              label="About / Biographical Paragraphs"
              items={teacher.about || []}
              onChange={(newAbout) => onUpdateField('about', newAbout)}
              placeholder="Type biographical paragraph and press Enter..."
              hint="Add one or more paragraphs detailing academic background, journey, and teaching philosophy."
            />
          </div>
        )}

        {/* Tab 3: Education & Teaching */}
        {activeTab === 'education' && (
          <div style={{ maxWidth: '800px' }}>
            <DynamicStringArray
              label="Qualifications & Degrees"
              items={teacher.qualification || []}
              onChange={(val) => onUpdateField('qualification', val)}
              placeholder="e.g., Ph.D. in Computer Science (MIT), M.Tech in Software Systems..."
              hint="List higher educational degrees, university names, and graduation years."
            />

            <DynamicStringArray
              label="Experience & Career History"
              items={teacher.experience || []}
              onChange={(val) => onUpdateField('experience', val)}
              placeholder="e.g., 8 Years Teaching at College of Engineering..."
            />

            <DynamicStringArray
              label="Courses & Subjects Handled"
              items={teacher.courses_handled || []}
              onChange={(val) => onUpdateField('courses_handled', val)}
              placeholder="e.g., Advanced Operating Systems, Data Structures, Machine Learning..."
            />

            <DynamicStringArray
              label="Fields of Expertise & Skills"
              items={teacher.fields_of_expertise || []}
              onChange={(val) => onUpdateField('fields_of_expertise', val)}
              placeholder="e.g., Cloud Architecture, Distributed Systems, VLSI..."
            />
          </div>
        )}

        {/* Tab 4: Publications & Research */}
        {activeTab === 'research' && (
          <div style={{ maxWidth: '800px' }}>
            <PublicationsRepeater
              publications={teacher.publications || []}
              onChange={(val) => onUpdateField('publications', val)}
            />

            <DynamicStringArray
              label="Research Interests & Ongoing Projects"
              items={teacher.research || []}
              onChange={(val) => onUpdateField('research', val)}
              placeholder="e.g., Low-power IoT sensor architectures, Federated Learning..."
            />

            <DynamicStringArray
              label="Patents Filed / Granted"
              items={teacher.patents || []}
              onChange={(val) => onUpdateField('patents', val)}
              placeholder="e.g., US Patent: Energy Efficient Hardware Accelerator..."
            />

            <DynamicStringArray
              label="Books & Book Chapters Published"
              items={teacher.books_published || []}
              onChange={(val) => onUpdateField('books_published', val)}
              placeholder="e.g., Modern Computer Networks (Pearson 2022)..."
            />
          </div>
        )}

        {/* Tab 5: Awards & Roles */}
        {activeTab === 'awards' && (
          <div style={{ maxWidth: '800px' }}>
            <DynamicStringArray
              label="Awards, Honours & Recognitions"
              items={teacher.awards_and_honours || []}
              onChange={(val) => onUpdateField('awards_and_honours', val)}
              placeholder="e.g., Best Teacher Award 2023, IEEE Distinguished Contributor..."
            />

            <DynamicStringArray
              label="Administrative Positions & Committees Handled"
              items={teacher.positions_handled || []}
              onChange={(val) => onUpdateField('positions_handled', val)}
              placeholder="e.g., Head of Department (2020-Present), Chief Academic Coordinator..."
            />

            <DynamicStringArray
              label="Industry Interaction & Consultancies"
              items={teacher.industry_interaction || []}
              onChange={(val) => onUpdateField('industry_interaction', val)}
              placeholder="e.g., Technical Advisor to Semiconductor Inc., Corporate Trainer..."
            />

            <DynamicStringArray
              label="Other Professional Details & Memberships"
              items={teacher.other_details || []}
              onChange={(val) => onUpdateField('other_details', val)}
              placeholder="e.g., Senior Member IEEE, ACM Student Chapter Advisor..."
            />
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="editor-bottom-bar">
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {isNew ? 'Ready to publish new profile' : 'Profile ready to update in Sanity'}
        </span>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onSave}
            disabled={isSaving || isLoadingDetails}
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </div>
        </>
      )}
    </section>
  );
}
