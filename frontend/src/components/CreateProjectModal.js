import React, { useState } from 'react';
import { projectAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { X, FolderKanban } from 'lucide-react';

const COLORS = ['#6366f1', '#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777'];

export default function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', priority: 'medium', color: COLORS[0], dueDate: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.dueDate) delete payload.dueDate;
      const res = await projectAPI.create(payload);
      toast.success('Project created!');
      onCreated(res.data.project);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FolderKanban size={18} color="var(--accent)" />
            <h2 className="modal-title">New Project</h2>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Website Redesign" required minLength={2} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What is this project about?" rows={3} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} min={new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Project Color</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {COLORS.map(color => (
                <button key={color} type="button" onClick={() => setForm(p => ({ ...p, color }))}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: color, border: form.color === color ? '3px solid white' : '3px solid transparent', cursor: 'pointer', boxShadow: form.color === color ? `0 0 0 2px ${color}` : 'none', transition: 'all 0.15s' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}