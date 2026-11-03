import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';
import { ErrorNote } from '../components/ui';
import AuthShell from './AuthShell';

export default function Register() {
  const { user, register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', village: '', city: '', state: '', currentCity: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (f.password.length < 8) return setError('Password must be at least 8 characters');
    setBusy(true); setError('');
    try {
      await register({ name: f.name, email: f.email, password: f.password, currentCity: f.currentCity, hometown: { village: f.village, city: f.city, state: f.state } });
      nav(f.city ? `/explore?q=${encodeURIComponent(f.city)}` : '/explore', { replace: true });
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Join your hometown" subtitle="Tell us where you're from and we'll help you find your people.">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label" htmlFor="name">Full name</label><input id="name" required className="input" value={f.name} onChange={set('name')} autoComplete="name" /></div>
        <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" required className="input" value={f.email} onChange={set('email')} autoComplete="email" /></div>
        <div><label className="label" htmlFor="password">Password</label><input id="password" type="password" required minLength={8} className="input" value={f.password} onChange={set('password')} autoComplete="new-password" /><p className="mt-1 text-xs text-ink/50">At least 8 characters</p></div>
        <fieldset className="space-y-3 rounded-xl border border-ink/10 bg-white p-4">
          <legend className="px-1 text-sm font-semibold">Your hometown</legend>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="city">City or town</label><input id="city" className="input" value={f.city} onChange={set('city')} placeholder="e.g. Cuttack" /></div>
            <div><label className="label" htmlFor="state">State</label><input id="state" className="input" value={f.state} onChange={set('state')} placeholder="e.g. Odisha" /></div>
          </div>
          <div><label className="label" htmlFor="village">Village or locality <span className="text-ink/40">(optional)</span></label><input id="village" className="input" value={f.village} onChange={set('village')} /></div>
          <div><label className="label" htmlFor="cc">Where do you live now? <span className="text-ink/40">(optional)</span></label><input id="cc" className="input" value={f.currentCity} onChange={set('currentCity')} /></div>
        </fieldset>
        <ErrorNote error={error} />
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
        <p className="text-center text-sm text-ink/60">Already a member? <Link to="/login" className="font-semibold text-river-700 hover:underline">Log in</Link></p>
      </form>
    </AuthShell>
  );
}
