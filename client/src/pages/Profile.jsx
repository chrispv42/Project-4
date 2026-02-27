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
      <TopBar title="Profile" user={me} />

      <div className="app-row">
        {/*Tip only on Profile*/}
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
            {/* Profile card */}
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

                  <div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      Email
                    </div>
                    <div>{me.email}</div>
                  </div>

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

            {/* Add Vehicle CTA card */}
            <ChromeCard className="panel-card" style={{ padding: 18 }}>
              <h2 style={{ marginTop: 0, marginBottom: 6 }}>Garage</h2>

              <p className="muted" style={{ marginTop: 6, lineHeight: 1.4 }}>
                Add your first ride and it’ll instantly show up under its era on the Vehicles page.
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
