// client/src/pages/AddVehicle.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import SideBar from '../components/SideBar';
import ChromeCard from '../components/ChromeCard';
import { api } from '../app/api';

export default function AddVehicle() {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [eras, setEras] = useState([]);
  const [eraLoading, setEraLoading] = useState(true);

  const [posting, setPosting] = useState(false);
  const [errMsg, setErrMsg] = useState(null);
  const [okMsg, setOkMsg] = useState(null);

  const [form, setForm] = useState({
    eraId: '',
    year: '',
    make: '',
    model: '',
    trim: '',
    engine: '',
    horsepower: '',
    transmission: '',
    color: '',
    notes: '',
    imageUrl: '',
    imageCaption: '',
  });

  // auth/session
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

  // eras
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

        if (!form.eraId && list.length) {
          setForm((prev) => ({ ...prev, eraId: String(list[0].id) }));
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

  const selectedEra = useMemo(
    () => eras.find((e) => String(e.id) === String(form.eraId)) || null,
    [eras, form.eraId]
  );

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function numOrEmpty(v) {
    const s = String(v ?? '').trim();
    return s;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (posting) return;

    setErrMsg(null);
    setOkMsg(null);

    const eraId = Number(form.eraId);
    const year = Number(form.year);

    const make = String(form.make || '').trim();
    const model = String(form.model || '').trim();

    if (!Number.isFinite(eraId)) return setErrMsg('Pick an era.');
    if (!Number.isFinite(year)) return setErrMsg('Enter a valid year.');
    if (!make) return setErrMsg('Make is required.');
    if (!model) return setErrMsg('Model is required.');

    setPosting(true);

    try {
      const payload = {
        eraId,
        year,
        make,
        model,
        trim: String(form.trim || '').trim() || null,
        engine: String(form.engine || '').trim() || null,
        horsepower: numOrEmpty(form.horsepower) ? Number(form.horsepower) : null,
        transmission: String(form.transmission || '').trim() || null,
        color: String(form.color || '').trim() || null,
        notes: String(form.notes || '').trim() || null,
      };

      const created = await api('/api/vehicles', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const newId = created?.id;
      if (!newId) throw new Error('Vehicle created, but no id returned.');

      // optional: add photo
      const url = String(form.imageUrl || '').trim();
      if (url) {
        await api(`/api/vehicles/${newId}/photos`, {
          method: 'POST',
          body: JSON.stringify({
            url,
            caption: String(form.imageCaption || '').trim() || null,
          }),
        });
      }

      setOkMsg('Vehicle added ✅ Redirecting…');

      // go to detail page
      navigate(`/vehicles/${newId}`, { replace: true });
    } catch (err) {
      setErrMsg(err.message || 'Failed to add vehicle.');
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="app-shell">
      <TopBar title="Add Vehicle" user={me} />

      <div className="app-row">
        <SideBar />

        <div className="content-area">
          <ChromeCard className="panel-card" style={{ padding: 18 }}>
            <div className="detail-head" style={{ marginBottom: 12 }}>
              <h2 className="detail-title" style={{ margin: 0 }}>
                Add a Vehicle
              </h2>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link className="chrome-btn" style={{ textDecoration: 'none' }} to="/vehicles">
                  Back to Vehicles
                </Link>
                <Link className="chrome-btn" style={{ textDecoration: 'none' }} to="/dashboard">
                  Dashboard
                </Link>
              </div>
            </div>

            {loadingMe ? <p className="muted">Loading session…</p> : null}

            {errMsg ? (
              <div className="callout callout-danger">
                <div className="callout-title">Request failed</div>
                <div className="callout-body">{errMsg}</div>
              </div>
            ) : null}

            {okMsg ? (
              <div className="callout">
                <div className="callout-title">Success</div>
                <div className="callout-body">{okMsg}</div>
              </div>
            ) : null}

            <form onSubmit={onSubmit} style={{ display: 'grid', gap: 14, marginTop: 10 }}>
              {/* Era */}
              <div style={{ display: 'grid', gap: 6 }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Era
                </div>

                <select
                  className="chrome-select"
                  value={form.eraId}
                  onChange={(e) => setField('eraId', e.target.value)}
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
                    Now Searching:{' '}
                    <span style={{ color: 'var(--text)' }}>{selectedEra.name || '—'}</span>
                  </div>
                ) : null}
              </div>

              {/* Core row */}
              <div
                style={{
                  display: 'grid',
                  gap: 12,
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                }}
              >
                <div style={{ display: 'grid', gap: 6 }}>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Year *
                  </div>
                  <input
                    className="login-input"
                    value={form.year}
                    onChange={(e) => setField('year', e.target.value)}
                    placeholder="e.g. 1969"
                    inputMode="numeric"
                    autoComplete="off"
                  />
                </div>

                <div style={{ display: 'grid', gap: 6 }}>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Make *
                  </div>
                  <input
                    className="login-input"
                    value={form.make}
                    onChange={(e) => setField('make', e.target.value)}
                    placeholder="e.g. Chevrolet"
                    autoComplete="off"
                  />
                </div>

                <div style={{ display: 'grid', gap: 6 }}>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Model *
                  </div>
                  <input
                    className="login-input"
                    value={form.model}
                    onChange={(e) => setField('model', e.target.value)}
                    placeholder="e.g. Chevelle"
                    autoComplete="off"
                  />
                </div>

                <div style={{ display: 'grid', gap: 6 }}>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Trim
                  </div>
                  <input
                    className="login-input"
                    value={form.trim}
                    onChange={(e) => setField('trim', e.target.value)}
                    placeholder="e.g. SS"
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Specs */}
              <div
                style={{
                  display: 'grid',
                  gap: 12,
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                }}
              >
                <div style={{ display: 'grid', gap: 6 }}>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Engine
                  </div>
                  <input
                    className="login-input"
                    value={form.engine}
                    onChange={(e) => setField('engine', e.target.value)}
                    placeholder="e.g. 396 Big Block"
                    autoComplete="off"
                  />
                </div>

                <div style={{ display: 'grid', gap: 6 }}>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Horsepower
                  </div>
                  <input
                    className="login-input"
                    value={form.horsepower}
                    onChange={(e) => setField('horsepower', e.target.value)}
                    placeholder="e.g. 425"
                    inputMode="numeric"
                    autoComplete="off"
                  />
                </div>

                <div style={{ display: 'grid', gap: 6 }}>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Transmission
                  </div>
                  <input
                    className="login-input"
                    value={form.transmission}
                    onChange={(e) => setField('transmission', e.target.value)}
                    placeholder="e.g. 4-speed manual"
                    autoComplete="off"
                  />
                </div>

                <div style={{ display: 'grid', gap: 6 }}>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Color
                  </div>
                  <input
                    className="login-input"
                    value={form.color}
                    onChange={(e) => setField('color', e.target.value)}
                    placeholder="e.g. Hugger Orange"
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Notes */}
              <div style={{ display: 'grid', gap: 6 }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Notes
                </div>
                <textarea
                  className="login-input"
                  style={{ minHeight: 110, resize: 'vertical' }}
                  value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  placeholder="Anything special about this ride…"
                />
              </div>

              {/* Photo */}
              <div
                style={{
                  display: 'grid',
                  gap: 12,
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                }}
              >
                <div style={{ display: 'grid', gap: 6 }}>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Photo URL (optional)
                  </div>
                  <input
                    className="login-input"
                    value={form.imageUrl}
                    onChange={(e) => setField('imageUrl', e.target.value)}
                    placeholder="https://…"
                    autoComplete="off"
                  />
                </div>

                <div style={{ display: 'grid', gap: 6 }}>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Caption (optional)
                  </div>
                  <input
                    className="login-input"
                    value={form.imageCaption}
                    onChange={(e) => setField('imageCaption', e.target.value)}
                    placeholder="e.g. fresh paint + chrome"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                <button className="chrome-btn" type="submit" disabled={posting}>
                  {posting ? 'Saving…' : 'Add Vehicle'}
                </button>

                <Link className="chrome-btn" to="/vehicles" style={{ textDecoration: 'none' }}>
                  Cancel
                </Link>
              </div>

              <div className="muted" style={{ fontSize: 12, lineHeight: 1.35 }}>
                Tip: Add one vehicle per era first — once you see them populate, we’ll add uploading
                later if you want.
              </div>
            </form>
          </ChromeCard>
        </div>
      </div>
    </div>
  );
}
