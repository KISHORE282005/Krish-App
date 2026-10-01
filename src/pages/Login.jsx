import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';

export default function Login() {
  const { loginWith, initAuth, auth } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(auth.error);
  const offline = auth.status === 'offline';

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await loginWith(username, password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <motion.form
        className="login-card"
        onSubmit={submit}
        initial={{ opacity: 0, rotateX: 25, y: 40 }}
        animate={{ opacity: 1, rotateX: 0, y: 0 }}
        transition={{ type: 'spring', stiffness: 110, damping: 16 }}
      >
        <div className="login-logo" aria-hidden>
          <div className="login-orb" />
          <span>A</span>
        </div>
        <h1>ASCEND</h1>
        <p className="login-sub">Your daily mission, saved safely.</p>

        {offline ? (
          <div className="login-offline">
            <span className="material-symbols-outlined">cloud_off</span>
            <p>{auth.error}</p>
            <button type="button" className="btn-primary" onClick={initAuth}>Try again</button>
          </div>
        ) : (
          <>
            <label className="login-field">
              <span className="material-symbols-outlined">person</span>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Username"
                autoComplete="username"
                autoCapitalize="none"
                autoFocus
                required
              />
            </label>
            <label className="login-field">
              <span className="material-symbols-outlined">lock</span>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                inputMode="numeric"
                required
              />
              <button type="button" className="btn-icon" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                <span className="material-symbols-outlined">{showPw ? 'visibility_off' : 'visibility'}</span>
              </button>
            </label>

            {error && <motion.p className="login-error" initial={{ x: -8 }} animate={{ x: [8, -6, 4, 0] }}>{error}</motion.p>}

            <button className="btn-primary login-btn" disabled={busy}>
              {busy ? 'Opening your data…' : 'Log in'}
            </button>
          </>
        )}
      </motion.form>
    </div>
  );
}
