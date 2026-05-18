import React, { useState } from 'react';
import { taskAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { X, CheckSquare } from 'lucide-react';

export default function TaskModal({ projectId, members, task, onClose, onSaved }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assignedTo: task?.assignedTo?._id || '',
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    tags: task?.tags?.join(', ') || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        assignedTo: form.assignedTo || undefined,
        dueDate: form.dueDate || undefined,
      };
      if (!payload.assignedTo) delete payload.assignedTo;
      if (!payload.dueDate) delete payload.dueDate;
      let res;
      if (isEdit) { res = await taskAPI.update(projectId, task._id, payload); }
      else { res = await taskAPI.create(projectId, payload); }
      toast.success(isEdit ? 'Task updated!' : 'Task created!');
      onSaved(res.data.task);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckSquare size={18} color="var(--accent)" />
            <h2 className="modal-title">{isEdit ? 'Edit Task' : 'New Task'}</h2>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="What needs to be done?" required minLength={2} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Add more details..." rows={3} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
            <div className="form-group">
              <label className="form-label">Assign To</label>
              <select value={form.assignedTo} onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))}>
                <option value="">Unassigned</option>
                {members?.map(m => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}