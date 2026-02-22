import React from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../app/api';

export default function TopBar({ title = "Ol' Time Muscle", user }) {
  const navigate = useNavigate();

  async function onLogout() {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      // even if it fails, we still force logout UX
    } finally {
      navigate('/login', { replace: true });
    }
  }

  return (
    <header className="chrome-card topbar">
      <div className="topbar-left">
        <img className="topbar-brand" src="/brandMark.png" alt="Brand" />
        <div className="topbar-meta">
          <div className="topbar-title">{title}</div>
          {user ? (
            <div className="topbar-sub">
              {user.username} • {user.email}
            </div>
          ) : (
            <div className="topbar-sub">Loading session…</div>
          )}
        </div>
      </div>

      <button className="chrome-btn topbar-logout" type="button" onClick={onLogout}>
        Logout
      </button>
    </header>
  );
}
