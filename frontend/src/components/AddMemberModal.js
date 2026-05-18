import React, { useState, useEffect, useRef } from 'react';
import { projectAPI, authAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { X, Users, Search, UserPlus } from 'lucide-react';

export default function AddMemberModal({ projectId, existingMembers, onClose, onAdded }) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(null);
  const timer = useRef(null);
  const existingIds = new Set(existingMembers.map(m => m.user._id));

  useEffect(() => {
    clearTimeout(timer.current);
    if (!search.trim()) { setUsers([]); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await authAPI.getUsers(search);
        setUsers(res.data.users.filter(u => !existingIds.has(u._id)));
      } catch {}
      setLoading(false);
    }, 350);
  }, [search]);

  const handleAdd = async (userId) => {
    setAdding(userId);
    try {
      const res = await projectAPI.addMember(projectId, { userId, role: 'member' });
      toast.success('Member added!');
      onAdded(res.data.project);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally { setAdding(null); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={18} color="var(--accent)" />
            <h2 className="modal-title">Add Member</h2>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." autoFocus style={{ paddingLeft: '2.25rem' }} />
          </div>
        </div>
        {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}><div className="spinner" /></div>}
        {!loading && search && users.length === 0 && (
          <div className="empty-state" style={{ padding: '1.5rem' }}><Users size={28} /><p style={{ fontSize: '0.85rem' }}>No users