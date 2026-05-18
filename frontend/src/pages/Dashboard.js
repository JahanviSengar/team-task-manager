import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FolderKanban, CheckSquare, AlertCircle, Clock } from 'lucide-react';

const priorityColors = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high', critical: 'badge-critical' };

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ stats: {}, recentTasks: [], projects: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(r => setData(r.data.data))
      .catch(() => setData({ stats: {}, recentTasks: [], projects: [] }))
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <h1>{greeting}, {user?.name?.split(' ')[0]}! 👋</h1>
        <p>Here's what's happening with your projects</p>
      </div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="label flex items-center gap-2"><FolderKanban size={14} /> Total Projects</div>
          <div className="value">{data?.stats?.totalProjects || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label flex items-center gap-2"><CheckSquare size={14} /> My Tasks</div>
          <div className="value">{data?.stats?.myTasks || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label flex items-center gap-2" style={{ color: 'var(--danger)' }}><AlertCircle size={14} /> Overdue</div>
          <div className="value text-danger">{data?.stats?.overdueTasks || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label flex items-center gap-2"><Clock size={14} /> Due This Week</div>
          <div className="value">{data?.stats?.dueThisWeek || 0}</div>
        </div>
      </div>
      <div className="dashboard-grid">
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 15 }}>Recent Tasks</h3>
          {(!data?.recentTasks || data.recentTasks.length === 0) && <p className="text-muted text-sm">No tasks yet — create a project and add some!</p>}
          {data?.recentTasks?.map(t => (
            <div key={t._id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{t.project?.name}</div>
              </div>
              <span className={`badge ${priorityColors[t.priority]}`}>{t.priority}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 15 }}>My Projects</h3>
          {(!data?.projects || data.projects.length === 0) && <p className="text-muted text-sm">No projects yet — <Link to="/projects" style={{ color: 'var(--primary)' }}>create one!</Link></p>}
          {data?.projects?.map(p => (
            <Link key={p._id} to={`/projects/${p._id}`} style={{ display: 'block', padding: '10px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{p.members?.length} members</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}