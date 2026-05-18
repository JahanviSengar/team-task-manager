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
              <p style={{ fontSize: 13, color: 'var(--text2)', ma