// client/src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import SideBar from '../components/SideBar';
import ChromeCard from '../components/ChromeCard';
import { api } from '../app/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState(null);

  useEffect(() => {
    let alive = true;

    async function loadMe() {
      setLoading(true);
      setErrMsg(null);

      try {
        const user = await api('/api/auth/me');
        if (!alive) return;

        if (!user) {
          navigate('/login', { replace: true });
          return;
        }

        setMe(user);
      } catch (err) {
        if (!alive) return;
        setErrMsg(err?.message || 'Failed to load session.');
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadMe();
    return () => {
      alive = false;
    };
  }, [navigate]);

  async function onLogout() {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      // even if logout fails, still kick them out
    } finally {
      navigate('/login', { replace: true });
    }
  }

  const createdLabel = useMemo(() => {
    if (!me?.created_at) return null;
    try {
      return new Date(me.created_at).toLocaleString();
    } catch {
      return String(me.created_at);
    }
  }, [me]);

  return (
    <div className="app-shell">
      <TopBar title="Dashboard" user={me} onLogout={onLogout} />

      <div className="app-row">
        <SideBar />

        <div className="content-area">
          <ChromeCard className="panel-card" style={{ padding: 18 }}>
            <h2 style={{ marginTop: 0, marginBottom: 6 }}>Welcome back</h2>

            {loading ? (
              <p style={{ color: 'var(--muted)', marginTop: 6 }}>Loading session…</p>
            ) : null}

            {errMsg ? <p className="field-error">{errMsg}</p> : null}

            {!loading && me ? (
              <p style={{ color: 'var(--muted)', marginTop: 6, marginBottom: 0 }}>
                Signed in as <span style={{ color: 'var(--text)' }}>{me.username}</span>
                {me.email ? (
                  <>
                    {' '}
                    <span style={{ color: 'var(--muted)' }}>•</span> {me.email}
                  </>
                ) : null}
                {createdLabel ? (
                  <>
                    {' '}
                    <span style={{ color: 'var(--muted)' }}>•</span> created {createdLabel}
                  </>
                ) : null}
              </p>
            ) : null}
          </ChromeCard>
        </div>
      </div>
    </div>
  );
}
