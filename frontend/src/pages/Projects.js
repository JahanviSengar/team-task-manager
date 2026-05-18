import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getProjects, createProject } from '../utils/api';
import { Plus, FolderKanban } from 'lucide-react';

const COLORS = ['#6c63ff','#22c55e','#f59e0b','#ef4444','#06b6d4','#a855f7'];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', priority: 'medium', color: COLORS[0] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProjects()
      .then(r => setProjects(r.data.data || r.data || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await createProject(form);
      const newProject = data.data || data;
      setProjects(prev => [newProject, ...prev]);
      setShowModal(false);
      setForm({ name: '', description: '', priority: 'medium', color: COLORS[0] });
      toast.success('Project created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>Projects</h1>
          <p>Manage your team projects</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty">
          <FolderKanban size={48} />
          <p style={{ marginTop: 16 }}>No projects yet. Create your first one!</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(p => (
            <Link key={p._id} to={`/projects/${p._id}`} className="project-card">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: p.color || '#6c63ff', marginBottom: 12 }} />
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{p.name}</h3>
              <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>{p.description || 'No description'}</p>
              <div className="flex gap-2">
                <span className={`badge badge-${p.priority}`}>{p.priority}</span>
                <span className="text-xs text-muted">{p.members?.length || 0} members</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New Project</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Project Name</label>
                <input placeholder="My Awesome Project" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} placeholder="What's this project about?" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <div className="flex gap-2 mt-2">
                    {COLORS.map(c => (
                      <div key={c} onClick={() => setForm({...form, color: c})} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '3px solid white' : '3px solid transparent' }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}