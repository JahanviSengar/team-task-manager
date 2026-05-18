import React from 'react';
import { format, isPast } from 'date-fns';
import { Calendar, Tag, MoreVertical, Edit3, Trash2, User } from 'lucide-react';

const PRIORITY_COLORS = { low: 'var(--green)', medium: 'var(--blue)', high: 'var(--yellow)', critical: 'var(--red)' };

export default function TaskCard({ task, onEdit, onDelete, canEdit }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
  return (
    <div className="card" style={{ padding: '0.9rem', cursor: 'default', position: 'relative', borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.4, flex: 1 }}>{task.title}</h4>
        {canEdit && (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button className="btn btn-ghost btn-icon" style={{ padding: '0.2rem', opacity: 0.6 }} onClick={() => setMenuOpen(p => !p)}>
              <MoreVertical size={14} />
            </button>
            {menuOpen && (
              <div style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.25rem', zIndex: 100, minWidth: 130, boxShadow: 'var(--shadow)' }} onMouseLeave={() => setMenuOpen(false)}>
                <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => { onEdit(task); setMenuOpen(false); }}><Edit3 size={13} /> Edit</button>
                <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--red)' }} onClick={() => { onDelete(task._id); setMenuOpen(false); }}><Trash2 size={13} /> Delete</button>
              </div>
            )}
          </div>
        )}
      </div>
      {task.description && <p style={{ fontSize: '0.78rem', color: 'var(--text-2)', marginBottom: '0.6rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{task.description}</p>}
      {task.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.6rem' }}>
          {task.tags.slice(0, 3).map(tag => <span key={tag} style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', background: 'var(--bg-4)', borderRadius: 100, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Tag size={9} /> {tag}</span>)}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {task.assignedTo ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <img src={task.assignedTo.avatar} alt={task.assignedTo.name} style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid var(--border)' }} title={task.assignedTo.name} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{task.assignedTo.name.split(' ')[0]}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-3)' }}><User size={13} /><span style={{ fontSize: '0.72rem' }}>Unassigned</span></div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {task.dueDate && <span style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.2rem', color: isOverdue ? 'var(--red)' : 'var(--text-3)' }}><Calendar size={10} />{format(new Date(task.dueDate), 'MMM d')}</span>}
          <span className={`badge badge-${task.priority}`} style={{ fontSize: '0.62rem', padding: '0.1rem 0.4rem' }}>{task.priority}</span>
        </div>
      </div>
    </div>
  );
}