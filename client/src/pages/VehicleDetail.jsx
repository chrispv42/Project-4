// client/src/pages/VehicleDetail.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import TopBar from '../components/TopBar';
import SideBar from '../components/SideBar';
import ChromeCard from '../components/ChromeCard';
import { api } from '../app/api';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

function formatWhen(ts) {
  try {
    return ts ? new Date(ts).toLocaleString() : '';
  } catch {
    return '';
  }
}

function countThread(list) {
  let n = 0;
  for (const c of list || []) {
    n += 1;
    if (c?.replies?.length) n += countThread(c.replies);
  }
  return n;
}

const ThreadItem = React.memo(function ThreadItem({
  node,
  depth,
  replyOpenFor,
  replyDrafts,
  replyPostingFor,
  onToggleReply,
  onChangeReplyDraft,
  onPostReply,
}) {
  const isOpen = replyOpenFor === node.id;
  const replies = Array.isArray(node.replies) ? node.replies : [];
  const marginLeft = depth ? Math.min(28, depth * 14) : 0;

  const draft = String(replyDrafts[node.id] ?? '');
  const isPostingReply = replyPostingFor === node.id;

  return (
    <div
      className={`thread-item chrome-card ${depth > 0 ? 'thread-item--reply' : ''}`}
      style={{ marginLeft }}
    >
      <div className="thread-head">
        <div className="thread-user">{node.username || 'user'}</div>
        <div className="muted thread-time">{formatWhen(node.created_at)}</div>
      </div>

      <div className="thread-body">{node.body}</div>

      <div className="thread-foot">
        <button
          type="button"
          className="thread-replyBtn"
          onClick={() => onToggleReply(node.id)}
          aria-expanded={isOpen ? 'true' : 'false'}
        >
          {isOpen ? 'Cancel' : 'Reply'}
        </button>

        {replies.length ? (
          <div className="muted thread-replyCount">
            {replies.length} repl{replies.length === 1 ? 'y' : 'ies'}
          </div>
        ) : (
          <div className="muted thread-replyCount" />
        )}
      </div>

      {isOpen ? (
        <div className="thread-replyComposer">
          <textarea
            className="thread-textarea thread-textarea--reply"
            value={draft}
            onChange={(e) => onChangeReplyDraft(node.id, e.target.value)}
            placeholder="Write a reply…"
            rows={2}
          />

          <div className="thread-actions">
            <button
              type="button"
              className="chrome-btn thread-submit"
              onClick={() => onPostReply(node.id)}
              disabled={isPostingReply || draft.trim().length < 2}
              title={draft.trim().length < 2 ? 'Reply must be at least 2 characters' : 'Post reply'}
            >
              {isPostingReply ? 'Posting…' : 'Post Reply'}
            </button>
          </div>
        </div>
      ) : null}

      {replies.length ? (
        <div className="thread-replies">
          {replies.map((r) => (
            <ThreadItem
              key={r.id}
              node={r}
              depth={depth + 1}
              replyOpenFor={replyOpenFor}
              replyDrafts={replyDrafts}
              replyPostingFor={replyPostingFor}
              onToggleReply={onToggleReply}
              onChangeReplyDraft={onChangeReplyDraft}
              onPostReply={onPostReply}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
});

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

  // Reply UI state
  const [replyOpenFor, setReplyOpenFor] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyPostingFor, setReplyPostingFor] = useState(null);

  const title = useMemo(() => {
    if (!vehicle) return `Vehicle #${id}`;
    const parts = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean);
    return parts.length ? parts.join(' ') : `Vehicle #${id}`;
  }, [vehicle, id]);

  const totalCount = useMemo(() => countThread(comments), [comments]);

  function resolveImg(url) {
    if (!url) return '';
    if (url.startsWith('/')) return `${API_BASE}${url}`;
    return url;
  }

  const refreshComments = useCallback(async () => {
    const c = await api(`/api/comments/thread/by-vehicle/${id}`);
    setComments(Array.isArray(c) ? c : []);
  }, [id]);

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

        const v = await api(`/api/vehicles/${id}`);
        if (!alive) return;
        setVehicle(v);

        const c = await api(`/api/comments/thread/by-vehicle/${id}`);
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

  const onAddComment = useCallback(
    async (e) => {
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
    },
    [posting, newComment, id, refreshComments]
  );

  const onToggleReply = useCallback((commentId) => {
    setReplyOpenFor((cur) => (cur === commentId ? null : commentId));
  }, []);

  const onChangeReplyDraft = useCallback((commentId, value) => {
    setReplyDrafts((prev) => {
      if (prev[commentId] === value) return prev;
      return { ...prev, [commentId]: value };
    });
  }, []);

  const onPostReply = useCallback(
    async (parentCommentId) => {
      if (replyPostingFor) return;

      const draft = String(replyDrafts[parentCommentId] ?? '').trim();
      if (draft.length < 2) return;

      setReplyPostingFor(parentCommentId);
      setErrMsg(null);

      try {
        await api('/api/comments', {
          method: 'POST',
          body: JSON.stringify({
            vehicleId: Number(id),
            parentCommentId: Number(parentCommentId),
            body: draft,
          }),
        });

        setReplyDrafts((prev) => {
          const next = { ...prev };
          delete next[parentCommentId];
          return next;
        });
        setReplyOpenFor(null);

        await refreshComments();
      } catch (err) {
        setErrMsg(err.message || 'Failed to post reply.');
      } finally {
        setReplyPostingFor(null);
      }
    },
    [replyPostingFor, replyDrafts, id, refreshComments]
  );

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
              </div>
            ) : null}

            {!loading && vehicle ? (
              <>
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

                <div className="thread">
                  <div className="muted thread-kicker">Comments ({totalCount})</div>

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
                      <ThreadItem
                        key={c.id}
                        node={c}
                        depth={0}
                        replyOpenFor={replyOpenFor}
                        replyDrafts={replyDrafts}
                        replyPostingFor={replyPostingFor}
                        onToggleReply={onToggleReply}
                        onChangeReplyDraft={onChangeReplyDraft}
                        onPostReply={onPostReply}
                      />
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
