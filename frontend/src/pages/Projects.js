/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, FolderKanban, Users, CheckSquare, AlertTriangle, Trash2, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CreateProjectModal from '../components/CreateProjectModal';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await projectAPI.getAll();
      setProjects(res.data.projects);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (e, projectId) => {
    e.preventDefault();
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await projectAPI.delete(projectId);
      setProjects(p => p.filter(pr => pr._id !== projectId));
      toast.success('Project deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Projects</h1>
          <p style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: 36, height: 36 }} />
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <FolderKanban size={48} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-2)' }}>No projects yet</h3>
          <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>Create your first project to get started</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> Create Project</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {projects.map(project => {
            const isOwner = project.owner._id === user._id;
            const completionPct = project.stats && project.stats.total > 0 ? Math.round((project.stats.done / project.stats.total) * 100) : 0;
            return (
              <Link key={project._id} to={`/projects/${project._id}`} style={{ display: 'block' }}>
                <div className="card" style={{ cursor: 'pointer', height: '100%', position: 'relative' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = project.color || 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: project.color || 'var(--accent)', borderRadius: 'var(--radius) var(--radius) 0 0' }} />
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                          <h3 style={{ fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</h3>
                          {isOwner && <Crown size={12} color="var(--yellow)" />}
                        </div>
                        {project.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{project.description}</p>}
                      </div>
                      {isOwner && (
                        <div onClick={e => e.preventDefault()}>
                          <button className="btn btn-danger btn-sm" onClick={e => handleDelete(e, project._id)}><Trash2 size={13} /></button>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.78rem', color: 'var(--text-2)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><CheckSquare size={12} /> {project.stats ? project.stats.total : 0} tasks</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Users size={12} /> {project.members.length} members</span>
                      {project.stats && project.stats.overdue > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--red)' }}><AlertTriangle size={12} /> {project.stats.overdue} overdue</span>}
                    </div>
                    {project.stats && project.stats.total > 0 && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: '0.25rem' }}>
                          <span>Progress</span><span>{completionPct}%</span>
                        </div>
                        <div style={{ background: 'var(--bg-3)', borderRadius: 100, height: 5, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${completionPct}%`, background: project.color || 'var(--accent)', borderRadius: 100 }} />
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex' }}>
                        {project.members.slice(0, 4).map((m, i) => (
                          <img key={m.user._id} src={m.user.avatar} alt={m.user.name} style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--bg-2)', marginLeft: i > 0 ? -8 : 0 }} title={m.user.name} />
                        ))}
                      </div>
                      <span className={`badge badge-${project.priority}`}>{project.priority}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={(project) => { setProjects(p => [project, ...p]); setShowCreate(false); }} />}
    </div>
  );
}