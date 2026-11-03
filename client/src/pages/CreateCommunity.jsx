import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { ErrorNote, Notice } from '../components/ui';

export default function CreateCommunity() {
  const { user } = useAuth();
  const nav = useNavigate();
  const h = user?.hometown || {};
  const [f, setF] = useState({ name: '', type: 'city', city: h.city || '', state: h.state || '', description: '', rules: '', joinPolicy: 'approval' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { const { data } = await api.post('/communities', f); nav(`/communities/${data._id}`); }
    catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Start a community</h1>
      <Notice>A platform admin reviews every new community before it goes live. You'll get a notification once it's approved.</Notice>
      <div><label className="label" htmlFor="name">Community name</label><input id="name" required className="input" value={f.name} onChange={set('name')} placeholder="e.g. Cuttack Connect" maxLength={100} /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className="label" htmlFor="type">Type</label><select id="type" className="input" value={f.type} onChange={set('type')}><option value="city">City</option><option value="town">Town</option><option value="village">Village</option></select></div>
        <div><label className="label" htmlFor="city">City / village</label><input id="city" required className="input" value={f.city} onChange={set('city')} /></div>
        <div><label className="label" htmlFor="state">State</label><input id="state" className="input" value={f.state} onChange={set('state')} /></div>
      </div>
      <div><label className="label" htmlFor="desc">Description</label><textarea id="desc" required className="input min-h-[96px]" value={f.description} onChange={set('description')} placeholder="Who is this community for and what will people share here?" maxLength={1000} /></div>
      <div><label className="label" htmlFor="rules">Community rules <span className="text-ink/40">(optional)</span></label><textarea id="rules" className="input min-h-[96px]" value={f.rules} onChange={set('rules')} placeholder={'1. Be respectful.\n2. No spam.'} maxLength={3000} /></div>
      <div><label className="label" htmlFor="jp">Who can join?</label><select id="jp" className="input" value={f.joinPolicy} onChange={set('joinPolicy')}><option value="approval">Moderators approve each request</option><option value="open">Anyone can join instantly</option></select></div>
      <ErrorNote error={error} />
      <button className="btn-primary w-full" disabled={busy}>{busy ? 'Submitting…' : 'Submit for approval'}</button>
    </form>
  );
}
