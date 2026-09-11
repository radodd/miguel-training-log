'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { startApp } from '../lib/training-log';

export default function Page() {
  // undefined while the stored session loads, null when signed out
  const [userId, setUserId] = useState(undefined);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session ? session.user.id : null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (userId === undefined) return null;
  return userId ? <TrainingLog userId={userId} /> : <SignIn />;
}

// The log UI is plain DOM code ported from the original HTML; React only provides the mount point.
function TrainingLog({ userId }) {
  const rootRef = useRef(null);
  useEffect(() => startApp(rootRef.current, userId), [userId]);
  return <div ref={rootRef} />;
}

function SignIn() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: form.get('email'),
      password: form.get('password'),
    });
    if (error) {
      setError(error.message);
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <h1>Training Log</h1>
      <p>Sign in to log workouts.</p>
      <form onSubmit={onSubmit}>
        <input name="email" type="email" placeholder="email" autoComplete="email" required />
        <input name="password" type="password" placeholder="password" autoComplete="current-password" required />
        <div className="auth-error">{error}</div>
        <button type="submit" className="primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
