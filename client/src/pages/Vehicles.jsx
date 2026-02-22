import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import SideBar from '../components/SideBar';
import ChromeCard from '../components/ChromeCard';
import { api } from '../app/api';

export default function Vehicles() {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [eras, setEras] = useState([]);
  const [eraLoading, setEraLoading] = useState(true);
  const [selectedEraId, setSelectedEraId] = useState('');

  const [vehicles, setVehicles] = useState([]);
  const [vehLoading, setVehLoading] = useState(false);

  const [errMsg, setErrMsg] = useState(null);

  // Filters
  const [q, setQ] = useState('');
  const [year, setYear] = useState('');

  // Auth/session check
  useEffect(() => {
    let alive = true;

    async function loadMe() {
      setLoadingMe(true);
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
        setErrMsg(err.message || 'Failed to load session.');
      } finally {
        if (alive) setLoadingMe(false);
      }
    }

    loadMe();
    return () => {
      alive = false;
    };
  }, [navigate]);

  // Load eras on mount
  useEffect(() => {
    let alive = true;

    async function loadEras() {
      setEraLoading(true);
      setErrMsg(null);

      try {
        const rows = await api('/api/eras');
        if (!alive) return;

        const list = Array.isArray(rows) ? rows : [];
        setEras(list);

        if (!selectedEraId && list.length) {
          setSelectedEraId(String(list[0].id));
        }
      } catch (err) {
        if (!alive) return;
        setErrMsg(err.message || 'Failed to load eras.');
      } finally {
        if (alive) setEraLoading(false);
      }
    }

    loadEras();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load vehicles when era changes
  useEffect(() => {
    let alive = true;

    async function loadVehicles() {
      if (!selectedEraId) {
        setVehicles([]);
        return;
      }

      setVehLoading(true);
      setErrMsg(null);

      try {
        const rows = await api(`/api/vehicles/by-era/${selectedEraId}`);
        if (!alive) return;
        setVehicles(Array.isArray(rows) ? rows : []);
      } catch (err) {
        if (!alive) return;
        setErrMsg(err.message || 'Failed to load vehicles.');
      } finally {
        if (alive) setVehLoading(false);
      }
    }

    loadVehicles();
    return () => {
      alive = false;
    };
  }, [selectedEraId]);

  const filteredVehicles = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const yearNeedle = year.trim();

    return vehicles.filter((v) => {
      const text = `${v.year ?? ''} ${v.make ?? ''} ${v.model ?? ''} ${v.trim ?? ''}`.toLowerCase();
      const okText = !needle || text.includes(needle);
      const okYear = !yearNeedle || String(v.year ?? '') === yearNeedle;
      return okText && okYear;
    });
  }, [vehicles, q, year]);

  function onPickEra(e) {
    setSelectedEraId(e.target.value);
  }

  const selectedEra = useMemo(
    () => eras.find((e) => String(e.id) === String(selectedEraId)) || null,
    [eras, selectedEraId]
  );

  return (
    <div className="app-shell">
      <TopBar title="Vehicles" user={me} />

      <div className="app-row">
        <SideBar />

        <div className="content-area">
          <ChromeCard className="panel-card" style={{ padding: 18 }}>
            <div className="detail-head" style={{ marginBottom: 12 }}>
              <h2 className="detail-title" style={{ margin: 0 }}>
                Browse Vehicles
              </h2>

              <Link className="chrome-btn" style={{ textDecoration: 'none' }} to="/dashboard">
                Back to Dashboard
              </Link>
            </div>

            {loadingMe ? <p className="muted">Loading session…</p> : null}

            {errMsg ? (
              <div className="callout callout-danger">
                <div className="callout-title">Request failed</div>
                <div className="callout-body">{errMsg}</div>
                <div className="callout-hint">
                  Make sure <code>/api/eras</code> and <code>/api/vehicles/by-era/:id</code> are
                  mounted.
                </div>
              </div>
            ) : null}

            {/* Controls */}
            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                marginTop: 10,
                alignItems: 'start',
              }}
            >
              <div style={{ display: 'grid', gap: 6 }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Era
                </div>

                <select
                  className="chrome-select"
                  value={selectedEraId}
                  onChange={onPickEra}
                  disabled={eraLoading}
                >
                  {eraLoading ? <option>Loading eras…</option> : null}
                  {!eraLoading && !eras.length ? <option>No eras found</option> : null}

                  {eras.map((e) => (
                    <option key={e.id} value={String(e.id)}>
                      {e.name}
                    </option>
                  ))}
                </select>

                {selectedEra ? (
                  <div className="muted" style={{ fontSize: 12, lineHeight: 1.35 }}>
                  </div>
                ) : null}
              </div>

              <div style={{ display: 'grid', gap: 6 }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Search (make / model / trim)
                </div>
                <input
                  className="chrome-input"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="e.g. Chevelle, Mustang, C10…"
                  autoComplete="off"
                />
              </div>

              <div style={{ display: 'grid', gap: 6 }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Year (exact)
                </div>
                <input
                  className="chrome-input"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 1969"
                  inputMode="numeric"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* List */}
            <div style={{ marginTop: 16 }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
                {vehLoading ? 'Loading vehicles…' : `Vehicles (${filteredVehicles.length})`}
              </div>

              {vehLoading ? <p className="muted">Fetching that classic steel…</p> : null}

              {!vehLoading && filteredVehicles.length ? (
                <div
                  style={{
                    display: 'grid',
                    gap: 12,
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  }}
                >
                  {filteredVehicles.map((v) => {
                    const name = [v.year, v.make, v.model, v.trim].filter(Boolean).join(' ');
                    return (
                      <Link
                        key={v.id}
                        to={`/vehicles/${v.id}`}
                        className="chrome-card"
                        style={{
                          textDecoration: 'none',
                          color: 'inherit',
                          padding: 12,
                          borderRadius: 14,
                          display: 'grid',
                          gap: 10,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                          <div style={{ fontWeight: 800 }}>{name || `Vehicle #${v.id}`}</div>
                          <div className="muted" style={{ fontSize: 12 }}>
                            {v.horsepower ? `${v.horsepower} hp` : ''}
                          </div>
                        </div>

                        {v.image_url ? (
                          <img
                            src={v.image_url}
                            alt={name}
                            style={{
                              width: '100%',
                              height: 140,
                              objectFit: 'cover',
                              borderRadius: 12,
                              border: '1px solid var(--w14)',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: 140,
                              borderRadius: 12,
                              border: '1px solid var(--w14)',
                              background: 'var(--w03)',
                              display: 'grid',
                              placeItems: 'center',
                              color: 'var(--muted)',
                              fontSize: 12,
                            }}
                          >
                            No image
                          </div>
                        )}

                        <div className="muted" style={{ fontSize: 12, lineHeight: 1.35 }}>
                          Tap to open thread → comments + replies
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : null}

              {!vehLoading && !filteredVehicles.length ? (
                <div className="muted" style={{ fontSize: 13 }}>
                  No vehicles found for this era (or filters too strict). Try clearing search/year.
                </div>
              ) : null}
            </div>
          </ChromeCard>
        </div>
      </div>
    </div>
  );
}
