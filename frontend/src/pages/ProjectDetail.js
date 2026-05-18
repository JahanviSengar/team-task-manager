/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectAPI, taskAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ArrowLeft, Plus, Users, Trash2, UserPlus, Crown, Shield, User, AlertTriangle, Search } from 'lucide-react';
import TaskModal from '../components/TaskModal';
import TaskCard from '../components/TaskCard';
import AddMemberModal from '../components/AddMemberModal';

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'var(--text-3)' },
  { key: 'in_progress', label: 'In Progress', color: 'var(--blue)' },
  { key: 'in_review', label: 'In Review', color: 'var(--yellow)' },
  { key: 'done', label: 'Done', color: 'var(--green)' },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [activeTab, setActiveTab] = useState('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [settingsForm, setSettingsForm] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchProject = async () => {
    try {
      const res = await projectAPI.getOne(id);
      setProject(res.data.project);
      setSettingsForm({ name: res.data.project.name, description: res.data.project.description, status: res.data.project.status, priority: res.data.project.priority });
    } catch {
      toast.error('Project not found');
      navigate('/projects');
    }
  };

  const fetchTasks = async () => {
    try {
      const params = {};
      if (filterPriority) params.priority = filterPriority;
      if (searchQuery) params.search = searchQuery;
      const res = await taskAPI.getAll(id, params);
      setTasks(res.data.tasks);
    } catch {
      toast.error('Failed to load tasks');
    }
  };

  useEffect(() => {
    Promise.all([fetchProject(), fetchTasks()]).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { if (!loading) fetchTasks(); }, [filterPriority, searchQuery]);

  const myRole = project?.members?.find(m => m.user._id === user._id)?.role;
  const isOwner = project?.owner?._id === user._id;
  const isAdmin = myRole === 'admin';
  const canManage = isAdmin || isOwner;
  const getColumnTasks = (status) => tasks.filter(t => t.status === status);

  const handleTaskSaved = (savedTask) => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t._id === savedTask._id);
      if (idx >= 0) { const updated = [...prev]; updated[idx] = savedTask; return updated; }
      return [savedTask, ...prev];
    });
    setShowTaskModal(false);
    setEditTask(null);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskAPI.delete(id, taskId);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete task'); }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      const res = await projectAPI.removeMember(id, userId);
      setProject(res.data.project);
      toast.success('Member removed');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to remove'); }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const res = await projectAPI.updateMemberRole(id, userId, { role: newRole });
      setProject(res.data.project);
      toast.success('Role updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update role'); }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await projectAPI.update(id, settingsForm);
      setProject(res.data.project);
      toast.success('Project updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
    finally { setSavingSettings(false); }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project and ALL its tasks?')) return;
    try {
      await projectAPI.delete(id);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '4rem' }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>;
  if (!project) return null;

  const overdueCount = tasks.filter(t => t.isOverdue).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-2)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
          <Link to="/projects" style={{ color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Projects
          </Link>
          <span style={{ color: 'var(--text-3)' }}>/</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>{project.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: project.color || 'var(--accent)' }} />
            <h1 style={{ fontSize: '1.4rem' }}>{project.name}</h1>
            <span className={`badge badge-${project.priority}`}>{project.priority}</span>
            {overdueCount > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--red)', background: 'rgba(239,68,68,0.1)', padding: '0.2rem 0.6rem', borderRadius: 100 }}><AlertTriangle size={11} /> {overdueCount} overdue</span>}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {canManage && <button className="btn btn-secondary btn-sm" onClick={() => setShowAddMember(true)}><UserPlus size={14} /> Add Member</button>}
            <button className="btn btn-primary btn-sm" onClick={() => setShowTaskModal(true)}><Plus size={14} /> Add Task</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0', marginTop: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '-1.25rem' }}>
          {['board', 'members', ...(canManage ? ['settings'] : [])].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', color: activeTab === tab ? 'var(--text)' : 'var(--text-3)', fontWeight: activeTab === tab ? 600 : 400, fontSize: '0.875rem', cursor: 'pointer', borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent', fontFamily: 'inherit', textTransform: 'capitalize', transition: 'all 0.15s' }}>{tab}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem 2rem' }}>
        {activeTab === 'board' && (
          <>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1 1 200px' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search tasks..." style={{ paddingLeft: '2rem', height: 36, fontSize: '0.83rem' }} />
              </div>
              <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ flex: '0 0 auto', width: 'auto', height: 36, fontSize: '0.83rem' }}>
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(240px, 1fr))', gap: '1rem', minWidth: 'max-content', paddingBottom: '1rem' }}>
              {COLUMNS.map(col => {
                const colTasks = getColumnTasks(col.key);
                return (
                  <div key={col.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                        <span style={{ fontSize: '0.83rem', fontWeight: 700 }}>{col.label}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', background: 'var(--bg-3)', padding: '0.1rem 0.5rem', borderRadius: 100 }}>{colTasks.length}</span>
                      </div>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowTaskModal(true)}><Plus size={13} /></button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: 80 }}>
                      {colTasks.map(task => (
                        <TaskCard key={task._id} task={task}
                          onEdit={(t) => { setEditTask(t); setShowTaskModal(true); }}
                          onDelete={handleDeleteTask}
                          canEdit={canManage || task.createdBy?._id === user._id || task.assignedTo?._id === user._id} />
                      ))}
                      {colTasks.length === 0 && <div style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.78rem' }}>No tasks</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'members' && (
          <div style={{ maxWidth: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem' }}>{project.members.length} Members</h2>
              {canManage && <button className="btn btn-primary btn-sm" onClick={() => setShowAddMember(true)}><UserPlus size={14} /> Add Member</button>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {project.members.map(m => {
                const isProjectOwner = project.owner._id === m.user._id;
                const isSelf = m.user._id === user._id;
                return (
                  <div key={m.user._id} className="card" style={{ padding: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                      <img src={m.user.avatar} alt={m.user.name} style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--border)' }} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>
                          {m.user.name}
                          {isProjectOwner && <Crown size={12} color="var(--yellow)" />}
                          {isSelf && <span style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>(you)</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{m.user.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {isOwner && !isProjectOwner && !isSelf ? (
                        <select value={m.role} onChange={e => handleUpdateRole(m.user._id, e.target.value)} style={{ width: 'auto', fontSize: '0.78rem', padding: '0.25rem 0.5rem', height: 'auto' }}>
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: m.role === 'admin' ? 'var(--accent)' : 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          {m.role === 'admin' ? <Shield size={12} /> : <User size={12} />}{m.role}
                        </span>
                      )}
                      {canManage && !isProjectOwner && !isSelf && (
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleRemoveMember(m.user._id)}><Trash2 size={13} /></button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'settings' && canManage && (
          <div style={{ maxWidth: 500 }}>
            <h2 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>Project Settings</h2>
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input value={settingsForm?.name || ''} onChange={e => setSettingsForm(p => ({ ...p, name: e.target.value }))} required minLength={2} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea value={settingsForm?.description || ''} onChange={e => setSettingsForm(p => ({ ...p, description: e.target.value }))} rows={3} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select value={settingsForm?.status || 'active'} onChange={e => setSettingsForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select value={settingsForm?.priority || 'medium'} onChange={e => setSettingsForm(p => ({ ...p, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={savingSettings} style={{ alignSelf: 'flex-start' }}>
                {savingSettings ? <span className="spinner" /> : 'Save Changes'}
              </button>
            </form>
            {isOwner && (
              <>
                <hr className="divider" style={{ margin: '2rem 0' }} />
                <div style={{ padding: '1.25rem', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 'var(--radius)' }}>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--red)', marginBottom: '0.5rem' }}>Danger Zone</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: '1rem' }}>Deleting a project is permanent and will remove all tasks.</p>
                  <button className="btn btn-danger" onClick={handleDeleteProject}><Trash2 size={14} /> Delete Project</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {showTaskModal && <TaskModal projectId={id} members={project.members} task={editTask} onClose={() => { setShowTaskModal(false); setEditTask(null); }} onSaved={handleTaskSaved} />}
      {showAddMember && <AddMemberModal projectId={id} existingMembers={project.members} onClose={() => setShowAddMember(false)} onAdded={(updatedProject) => { setProject(updatedProject); setShowAddMember(false); }} />}
    </div>
  );
}