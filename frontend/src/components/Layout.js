import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const handleLogout = () => { logout(); navigate('/login'); };
  const close = () => setOpen(false);
  return (
    <div>
      <button className="hamburger" onClick={() => setOpen(true)}><Menu size={20} /></button>
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={close} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          ⚡ TaskFlow
          <button className="sidebar-close" onClick={close}><X size={20} /></button>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''} onClick={close}>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => isActive ? 'active' : ''} onClick={close}>
            <FolderKanban size={18} /> Projects
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="flex items-center gap-2 mb-4">
            <img src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', wordBreak: 'break-all' }}>{user?.email}</div>
            </div>
          </div>
          <button className="btn btn-outline w-full" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
      <main className="main-content"><Outlet /></main>
    </div>
  );
}
