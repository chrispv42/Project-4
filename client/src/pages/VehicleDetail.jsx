// client/src/pages/VehicleDetail.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import TopBar from '../components/TopBar';
import SideBar from '../components/SideBar';
import ChromeCard from '../components/ChromeCard';
import { api } from '../app/api';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

export default function VehicleDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [me, setMe] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [comments, setComments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState(null);

  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
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

        // vehicle info
        const v = await api(`/api/vehicles/${id}`);
        if (!alive) return;
        setVehicle(v);

        // comments thread
        const c = await api(`/api/comments/by-vehicle/${id}`);
        if (!alive) return;
        setComments(Array.isArray(c) ? c : []);
      } catch (err) {
        if (!alive) return;
        setErrMsg(err.message || 'Failed to load vehicle.');
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [id, navigate]);

  const title = useMemo(() => {
    if (!vehicle) return `Vehicle #${id}`;
    const parts = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean);
    return parts.length ? parts.join(' ') : `Vehicle #${id}`;
  }, [vehicle, id]);

  function resolveImg(url) {
    if (!url) return '';
    if (url.startsWith('/')) return `${API_BASE}${url}`;
    return url;
  }

  async function refreshComments() {
    const c = await api(`/api/comments/by-vehicle/${id}`);
    setComments(Array.isArray(c) ? c : []);
  }

  async function onAddComment(e) {
    e.preventDefault();
    if (posting) return;

    const body = newComment.trim();
    if (body.length < 2) return;

    setPosting(true);
    setErrMsg(null);

    try {
      await api('/api/comments', {
        method: 'POST',
        body: JSON.stringify({ vehicleId: Number(id), body }),
      });

      setNewComment('');
      await refreshComments();
    } catch (err) {
      setErrMsg(err.message || 'Failed to post comment.');
    } finally {
      setPosting(false);
    }
  }

  const img = resolveImg(vehicle?.image_url);

  return (
    <div className="app-shell">
      <TopBar title="Vehicle Detail" user={me} />

      <div className="app-row">
        <SideBar />

        <div className="content-area">
          <ChromeCard className="panel-card" style={{ padding: 18 }}>
            <div className="detail-head">
              <h2 className="detail-title">{title}</h2>
              <Link className="chrome-btn" style={{ textDecoration: 'none' }} to="/dashboard">
                Back
              </Link>
            </div>

            {loading ? <p className="muted">Loading…</p> : null}

            {errMsg ? (
              <div className="callout callout-danger">
                <div className="callout-title">Request failed</div>
                <div className="callout-body">{errMsg}</div>
                <div className="callout-hint">
                  If you haven’t built <code>/api/vehicles/:id</code> and <code>/api/comments</code>{' '}
                  yet, this is expected.
                </div>
              </div>
            ) : null}

            {!loading && vehicle ? (
              <>
                {/* Vehicle summary */}
                <div className="vehicle-summary">
                  <div className="muted vehicle-kicker">Vehicle</div>

                  <div className="vehicle-meta">
                    <div>
                      <span className="muted">Year:</span> {vehicle.year ?? '—'}
                    </div>
                    <div>
                      <span className="muted">Make:</span> {vehicle.make ?? '—'}
                    </div>
                    <div>
                      <span className="muted">Model:</span> {vehicle.model ?? '—'}
                    </div>
                    <div>
                      <span className="muted">Trim:</span> {vehicle.trim ?? '—'}
                    </div>
                    <div>
                      <span className="muted">Horsepower:</span> {vehicle.horsepower ?? '—'}
                    </div>
                  </div>

                  {img ? <img className="vehicle-image" src={img} alt={title} /> : null}
                </div>

                {/* Comments thread */}
                <div className="thread">
                  <div className="muted thread-kicker">Comments ({comments.length})</div>

                  <form onSubmit={onAddComment} className="thread-form">
                    <textarea
                      className="thread-textarea"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Leave a comment…"
                      rows={3}
                    />

                    <div className="thread-actions">
                      <button
                        className="chrome-btn thread-submit"
                        type="submit"
                        disabled={posting || newComment.trim().length < 2}
                        title={
                          newComment.trim().length < 2
                            ? 'Comment must be at least 2 characters'
                            : 'Post comment'
                        }
                      >
                        {posting ? 'Posting…' : 'Post Comment'}
                      </button>
                    </div>
                  </form>

                  <div className="thread-list">
                    {comments.map((c) => (
                      <div key={c.id} className="thread-item chrome-card">
                        <div className="thread-head">
                          <div className="thread-user">{c.username || 'user'}</div>
                          <div className="muted thread-time">
                            {c.created_at ? new Date(c.created_at).toLocaleString() : ''}
                          </div>
                        </div>
                        <div className="thread-body">{c.body}</div>
                      </div>
                    ))}

                    {!comments.length ? (
                      <div className="muted thread-empty">
                        No comments yet. Be the first to drop one 🏁
                      </div>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}
          </ChromeCard>
        </div>
      </div>
    </div>
  );
}
