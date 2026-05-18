import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { taskAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { LayoutDashboard, CheckCircle2, Clock, AlertTriangle, FolderKanban, TrendingUp, ArrowRight, CalendarClock } from 'lucide-react';

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done' };
const STATUS_COLORS = { todo: 'var(--text-3)', in_progress: 'var(--blue)', in_review: 'var(--yellow)', done: 'var(--green)' };

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    taskAPI.getDashboard()
      .then(res => setStats(res.data.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '4rem' }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  const statCards = [
    { label: 'Total Projects', value: stats?.totalProjects || 0, icon: FolderKanban, color: 'var(--accent)', bg: 'rgba(124,58,237,0.1)' },
    { label: 'My Tasks', value: stats?.myTasks || 0, icon: CheckCircle2, color: 'var(--blue)', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Overdue', value: stats?.overdueTasks || 0, icon: AlertTriangle, color: 'var(--red)', bg: 'rgba(239,68,68,0.1)' },
    { label: 'Due This Week', value: stats?.dueSoon || 0, icon: CalendarClock, color: 'var(--yellow)', bg: 'rgba(245,158,11,0.1)' },
  ];

  const completionRate = stats?.totalTasks ? Math.round((stats.tasksByStatus.done / stats.totalTasks) * 100) : 0;

  return (
    <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{greeting}</div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{user?.name}</h1>
        <p style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>Here's what's happening with your projects today.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-2)', marginTop: '0.2rem' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem' }}>Task Overview</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--green)' }}>
              <TrendingUp size={14} /> {completionRate}% done
            </div>
          </div>
          <div style={{ background: 'var(--bg-3)', borderRadius: 100, height: 8, marginBottom: '1.25rem', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${completionRate}%`, background: 'var(--green)', borderRadius: 100, transition: 'width 0.8s ease' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {Object.entries(stats?.tasksByStatus || {}).map(([status, count]) => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[status] }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>{STATUS_LABELS[status]}</span>
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{count}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{stats?.totalTasks || 0}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem' }}>Recent Tasks</h2>
            <Link to="/projects" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--accent)' }}>View all <ArrowRight size={12} /></Link>
          </div>
          {(!stats?.recentTasks || stats.recentTasks.length === 0) && (
            <div className="empty-state" style={{ padding: '1.5rem' }}>
              <Clock size={28} />
              <p style={{ fontSize: '0.85rem' }}>No tasks yet</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {stats?.recentTasks?.map(task => (
              <Link key={task._id} to={`/projects/${task.project?._id}`} style={{ display: 'block' }}>
                <div style={{ padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.83rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '0.15rem' }}>{task.project?.name}</div>
                    </div>
                    <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {stats?.projects?.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem' }}>Your Projects</h2>
            <Link to="/projects" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--accent)' }}>All projects <ArrowRight size={12} /></Link>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {stats.projects.map(project => (
              <Link key={project._id} to={`/projects/${project._id}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.9rem', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.83rem', fontWeight: 500, cursor: 'pointer' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: project.color || 'var(--accent)', flexShrink: 0 }} />
                  {project.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}