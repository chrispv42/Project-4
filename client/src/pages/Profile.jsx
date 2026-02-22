import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import SideBar from '../components/SideBar';
import ChromeCard from '../components/ChromeCard';
import { api } from '../app/api';

export default function Profile() {
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
        setErrMsg(err.message || 'Failed to load profile.');
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadMe();
    return () => {
      alive = false;
    };
  }, [navigate]);

  return (
    <div className="app-shell">
      <TopBar title="Profile" user={me} />

      <div className="app-row">
        <SideBar />

        <div className="content-area">
          <ChromeCard className="panel-card" style={{ padding: 18 }}>
            <h2 style={{ marginTop: 0 }}>Your Profile</h2>

            {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}

            {errMsg && <p className="field-error">{errMsg}</p>}

            {!loading && me && (
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Username</div>
                  <div>{me.username}</div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Email</div>
                  <div>{me.email}</div>
                </div>

                {me.created_at && (
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Created</div>
                    <div>{new Date(me.created_at).toLocaleString()}</div>
                  </div>
                )}
              </div>
            )}
          </ChromeCard>
        </div>
      </div>
    </div>
  );
}
