import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';
import { ErrorNote } from '../components/ui';
import AuthShell from './AuthShell';

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { await login(form.email, form.password); nav(loc.state?.from || '/', { replace: true }); }
    catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to see what's new in your community.">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" required autoComplete="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div><label className="label" htmlFor="password">Password</label><input id="password" type="password" required autoComplete="current-password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        <ErrorNote error={error} />
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <p className="text-center text-sm text-ink/60">New here? <Link to="/register" className="font-semibold text-river-700 hover:underline">Create an account</Link></p>
      </form>
    </AuthShell>
  );
}
