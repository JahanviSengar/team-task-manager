import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getProject, getProjectTasks, createTask, updateTask, deleteTask, addMember, removeMember, searchUsers } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, ArrowLeft, Users } from 'lucide-react';

const STATUSES = ['todo', 'in-progress', 'in-review', 'done'];
const STATUS_LABELS = { 'todo': 'To Do', 'in-progress': 'In Progress', 'in-review': 'In Review', 'done': 'Done' };
const PRIORITY_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444', critical: '#a855f7' };

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', status: 'todo', priority: 'medium', dueDate: '', assignedTo: '' });
  const [saving, setSaving] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [tab, setTab] = useState('kanban');

  useEffect(() => {
    Promise.all([getProject(id), getProjectTasks(id)])
      .then(([p, t]) => { setProject(p.data.data); setTasks(t.data.data); })
      .catch(() => navigate('/projects'))
      .finally(() => setLoading(false));
  }, [id]);

  const tasksByStatus = status => tasks.filter(t => t.status === status);

  const handleCreateTask = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await createTask(id, taskForm);
      setTasks([...tasks, data.data]);
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', status: 'todo', priority: 'medium', dueDate: '', assignedTo: '' });
      toast.success('Task created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      const { data } = await updateTask(id, task._id, { status: newStatus });
      setTasks(tasks.map(t => t._id === task._id ? data.data : t));
    } catch { toast.error('Failed to update'); }
  };

  const handleDeleteTask = async (tid) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(id, tid);
      setTasks(tasks.filter(t => t._id !== tid));
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  const handleMemberSearch = async () => {
    if (!memberSearch.trim()) return;
    try {
      const { data } = await searchUsers(memberSearch);
      setSearchResults(data.data);
    } catch { toast.error('Search failed'); }
  };

  const handleAddMember = async (userId) => {
    try {
      const { data } = await addMember(id, { userId, role: 'member' });
      setProject(data.data);
      toast.success('Member added!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      const { data } = await removeMember(id, userId);
      setProject(data.data);
      toast.success('Removed');
    } catch { toast.error('Failed'); }
  };

  const myRole = project?.members?.find(m => m.user?._id === user?._id)?.role;
  const isAdmin = myRole === 'admin' || project?.owner?._id === user?._id;

  if (loading) return <div className="spinner" />;
  if (!project) return null;

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <button onClick={() => navigate('/projects')} className="btn btn-outline flex items-center gap-2 mb-2" style={{ padding: '6px 12px', fontSize: 13 }}>
            <ArrowLeft size={14} /> Projects
          </button>
          <h1>{project.name}</h1>
          <p>{project.description}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline flex items-center gap-2" onClick={() => setShowMemberModal(true)}>
            <Users size={16} /> Members ({project.members?.length})
          </button>
          <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowTaskModal(true)}>
            <Plus size={16} /> Add Task
          </button>
        </div>
      </div>

      <div className="kanban">
        {STATUSES.map(status => (
          <div key={status} className="kanban-col">
            <div className="kanban-col-header">
              <span>{STATUS_LABELS[status]}</span>
              <span style={{ background: 'var(--bg)', padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{tasksByStatus(status).length}</span>
            </div>
            {tasksByStatus(status).map(task => (
              <div key={task._id} className="task-card" style={{ borderLeftColor: PRIORITY_COLORS[task.priority] }}>
                <div className="flex justify-between items-center mb-2">
                  <h4>{task.title}</h4>
                  <button onClick={() => handleDeleteTask(task._id)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
                {task.description && <p className="text-xs text-muted mb-2">{task.description.slice(0, 80)}{task.description.length > 80 ? '...' : ''}</p>}
                <div className="flex justify-between items-center mt-2">
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  <select value={task.status} onChange={e => handleStatusChange(task, e.target.value)}
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 6, padding: '2px 6px', fontSize: 11, cursor: 'pointer' }}>
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
                {task.assignedTo && (
                  <div className="flex items-center gap-1 mt-2">
                    <img src={task.assignedTo.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${task.assignedTo.name}`} alt="" style={{ width: 18, height: 18, borderRadius: '50%' }} />
                    <span className="text-xs text-muted">{task.assignedTo.name}</span>
                  </div>
                )}
                {task.dueDate && <p className={`text-xs mt-1 ${new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-danger' : 'text-muted'}`}>Due: {new Date(task.dueDate).toLocaleDateString()}</p>}
              </div>
            ))}
          </div>
        ))}
      </div>

      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Title</label>
                <input placeholder="Task title" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} placeholder="Details..." value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select value={taskForm.status} onChange={e => setTaskForm({...taskForm, status: e.target.value})}>
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Assign To</label>
                  <select value={taskForm.assignedTo} onChange={e => setTaskForm({...taskForm, assignedTo: e.target.value})}>
                    <option value="">Unassigned</option>
                    {project.members?.map(m => <option key={m.user?._id} value={m.user?._id}>{m.user?.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Team Members</h2>
            {isAdmin && (
              <div className="flex gap-2 mb-4">
                <input placeholder="Search by name or email" value={memberSearch} onChange={e => setMemberSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleMemberSearch()} />
                <button className="btn btn-primary" onClick={handleMemberSearch} style={{ whiteSpace: 'nowrap' }}>Search</button>
              </div>
            )}
            {searchResults.length > 0 && (
              <div className="card mb-4" style={{ padding: 12 }}>
                {searchResults.map(u => (
                  <div key={u._id} className="flex justify-between items-center" style={{ padding: '6px 0' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>{u.email}</div>
                    </div>
                    <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleAddMember(u._id)}>Add</button>
                  </div>
                ))}
              </div>
            )}
            <div>
              {project.members?.map(m => (
                <div key={m.user?._id} className="flex justify-between items-center" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <img src={m.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${m.user?.name}`} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{m.user?.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>{m.role}</div>
                    </div>
                  </div>
                  {isAdmin && m.user?._id !== user?._id && (
                    <button onClick={() => handleRemoveMember(m.user?._id)} className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }}>Remove</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
