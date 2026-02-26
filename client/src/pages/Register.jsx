// client/src/pages/Register.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import FieldError from '../components/fieldError';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

export default function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [acceptTerms, setAcceptTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [fieldErr, setFieldErr] = useState({});
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErr({});
    setIsSubmitting(true);

    try {
      await axios.post(
        `${API_BASE}/api/auth/register`,
        { username, email, password, acceptTerms },
        { withCredentials: true }
      );

      navigate('/dashboard', { replace: true });
    } catch (err) {
      const data = err?.response?.data;

      // backend returns: { field: 'email', error: '...' }
      if (data?.field && data?.error) {
        setFieldErr((prev) => ({ ...prev, [data.field]: data.error }));
      } else {
        setErrorMsg(data?.error || err.message || 'Register failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="chrome-card login-card">
        <h2 className="login-brandTitle">Ol&apos; Time Muscle</h2>

        <div className="login-brandWrap">
          <img
            className="login-brand"
            src={`${process.env.PUBLIC_URL}/brandMark.png`}
            alt="Brand Mark"
            onError={(e) => {
              e.currentTarget.src = '/brandMark.png';
            }}
          />
        </div>

        <h1 className="login-title">Register</h1>

        <form autoComplete="off" className="login-form" onSubmit={onSubmit}>
          <label className="login-label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className="login-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <FieldError className="login-error" message={fieldErr.username} />

          <label className="login-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <FieldError className="login-error" message={fieldErr.email} />

          <label className="login-label" htmlFor="password">
            Password
          </label>

          <div className="password-field">
            <input
              id="password"
              className="login-input password-input"
              value={password}
              type={showPassword ? 'text' : 'password'}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />

            <button
              type="button"
              className="password-toggle"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((v) => !v)}
            >
              <svg
                className="password-eye"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M12 5c-5.5 0-9.6 4.1-11 7 1.4 2.9 5.5 7 11 7s9.6-4.1 11-7c-1.4-2.9-5.5-7-11-7Zm0 12c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
                />
              </svg>
            </button>
          </div>

          <FieldError className="login-error" message={fieldErr.password} />

          <label
            className="login-label"
            style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}
          >
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />
            I accept the terms
          </label>
          <FieldError className="login-error" message={fieldErr.acceptTerms} />

          {errorMsg ? <p className="field-error login-error">{errorMsg}</p> : null}

          <button disabled={isSubmitting} type="submit" className="chrome-btn login-btn">
            {isSubmitting ? 'Creating…' : 'Create Account'}
          </button>

          <div style={{ marginTop: 12, textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
