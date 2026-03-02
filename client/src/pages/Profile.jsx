// client/src/pages/Profile.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

    async function loadProfile() {
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
        setErrMsg(err?.message || 'Failed to load profile.');
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      alive = false;
    };
  }, [navigate]);

  async function onLogout() {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      // If the API is unavailable, still force a logout UX.
    } finally {
      navigate('/login', { replace: true });
    }
  }

  const createdLabel = useMemo(() => {
    const ts = me?.created_at;
    if (!ts) return null;

    try {
      return new Date(ts).toLocaleString();
    } catch {
      return String(ts);
    }
  }, [me]);

  return (
    <div className="app-shell">
      <TopBar title="Profile" user={me} onLogout={onLogout} />

      <div className="app-row">
        <SideBar showTip />

        <div className="content-area">
          <div
            style={{
              display: 'grid',
              gap: 14,
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              alignItems: 'start',
            }}
          >
            <ChromeCard className="panel-card" style={{ padding: 18 }}>
              <h2 style={{ marginTop: 0 }}>Your Profile</h2>

              {loading ? <p className="muted">Loading…</p> : null}
              {errMsg ? <p className="field-error">{errMsg}</p> : null}

              {!loading && me ? (
                <div style={{ display: 'grid', gap: 14 }}>
                  <div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      Username
                    </div>
                    <div>{me.username}</div>
                  </div>

                  {me.email ? (
                    <div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        Email
                      </div>
                      <div>{me.email}</div>
                    </div>
                  ) : null}

                  {createdLabel ? (
                    <div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        Created
                      </div>
                      <div>{createdLabel}</div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </ChromeCard>

            <ChromeCard className="panel-card" style={{ padding: 18 }}>
              <h2 style={{ marginTop: 0, marginBottom: 6 }}>Garage</h2>

              <p className="muted" style={{ marginTop: 6, lineHeight: 1.4 }}>
                Add your first ride and it will show up under its era on the Vehicles page.
              </p>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                <Link className="chrome-btn" to="/vehicles/new" style={{ textDecoration: 'none' }}>
                  + Add Vehicle
                </Link>

                <Link className="chrome-btn" to="/vehicles" style={{ textDecoration: 'none' }}>
                  Browse Vehicles
                </Link>
              </div>
            </ChromeCard>
          </div>
        </div>
      </div>
    </div>
  );
}
