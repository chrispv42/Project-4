// client/src/components/TopBar.jsx
export default function TopBar({ title = "Ol' Time Muscle", user, onLogout }) {
  const logoSrc = `${process.env.PUBLIC_URL}/brandMark.png`;

  return (
    <header className="chrome-card topbar">
      <div className="topbar-left">
        <img
          className="topbar-brand"
          src={logoSrc}
          alt="Brand"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />

        <div className="topbar-meta">
          <div className="topbar-title">{title}</div>

          {user ? (
            <div className="topbar-sub">
              {user.username}
              {user.email ? ` • ${user.email}` : ''}
            </div>
          ) : (
            <div className="topbar-sub">Loading session…</div>
          )}
        </div>
      </div>

      {/* Logout only appears when a handler is explicitly provided AND a user exists */}
      {user && typeof onLogout === 'function' ? (
        <button className="chrome-btn topbar-logout" type="button" onClick={onLogout}>
          Logout
        </button>
      ) : null}
    </header>
  );
}
