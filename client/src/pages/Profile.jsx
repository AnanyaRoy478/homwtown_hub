import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar, ErrorNote, ImagePicker, Spinner, fmtDate } from '../components/ui';

export default function Profile() {
  const { user, setUser } = useAuth();
  const h = user.hometown || {};
  const [f, setF] = useState({ name: user.name, bio: user.bio || '', phone: user.phone || '', currentCity: user.currentCity || '', village: h.village || '', city: h.city || '', state: h.state || '' });
  const [avatar, setAvatar] = useState(user.avatar ? [user.avatar] : []);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [mine, setMine] = useState(null);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [pwMsg, setPwMsg] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => { api.get('/communities/mine').then((r) => setMine(r.data)).catch(() => setMine([])); }, []);

  const save = async (e) => {
    e.preventDefault(); setError(''); setMsg('');
    try {
      const { data } = await api.put('/auth/me', { name: f.name, bio: f.bio, phone: f.phone, currentCity: f.currentCity, avatar: avatar[0], hometown: { village: f.village, city: f.city, state: f.state } });
      setUser(data.user); setMsg('Profile saved');
    } catch (err) { setError(errMsg(err)); }
  };
  const changePw = async (e) => {
    e.preventDefault(); setPwMsg('');
    try { await api.put('/auth/password', pw); setPw({ currentPassword: '', newPassword: '' }); setPwMsg('Password updated'); }
    catch (err) { setPwMsg(errMsg(err)); }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Avatar user={{ ...user, avatar: avatar[0] }} size={64} />
        <div><h1 className="text-2xl font-bold">{user.name}</h1><p className="text-sm text-ink/60">{user.email} · Member since {fmtDate(user.createdAt)}</p></div>
      </div>

      <form onSubmit={save} className="card space-y-4 p-5">
        <h2 className="text-lg font-semibold">Your details</h2>
        <div><span className="label">Profile photo</span><ImagePicker value={avatar} onChange={(v) => setAvatar(v.slice(-1))} max={1} label="Choose photo" /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label" htmlFor="n">Full name</label><input id="n" className="input" value={f.name} onChange={set('name')} required /></div>
          <div><label className="label" htmlFor="p">Phone</label><input id="p" className="input" value={f.phone} onChange={set('phone')} /></div>
        </div>
        <div><label className="label" htmlFor="b">About you</label><textarea id="b" className="input" rows={2} value={f.bio} onChange={set('bio')} maxLength={300} placeholder="A line about you and your connection to home" /></div>
        <fieldset className="grid gap-3 sm:grid-cols-3">
          <legend className="label">Hometown</legend>
          <input aria-label="Village or locality" className="input" placeholder="Village / locality" value={f.village} onChange={set('village')} />
          <input aria-label="City" className="input" placeholder="City / town" value={f.city} onChange={set('city')} />
          <input aria-label="State" className="input" placeholder="State" value={f.state} onChange={set('state')} />
        </fieldset>
        <div><label className="label" htmlFor="cc">Currently living in</label><input id="cc" className="input" value={f.currentCity} onChange={set('currentCity')} /></div>
        <ErrorNote error={error} />
        {msg && <p className="text-sm text-river-700" role="status">{msg}</p>}
        <button className="btn-primary">Save changes</button>
      </form>

      <section className="card p-5">
        <h2 className="mb-3 text-lg font-semibold">Your communities</h2>
        {mine === null ? <Spinner /> : mine.length === 0 ? <p className="text-sm text-ink/60">You haven't joined any communities yet. <Link className="font-semibold text-river-700" to="/explore">Find yours</Link></p> : (
          <ul className="divide-y divide-ink/10">
            {mine.map((c) => (
              <li key={c._id} className="flex items-center justify-between py-2.5">
                <Link to={`/communities/${c._id}`} className="font-medium hover:underline">{c.name}</Link>
                <span className="chip">{c.myMembership.status === 'active' ? c.myMembership.role : c.myMembership.status}{c.status !== 'approved' ? ` · ${c.status}` : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={changePw} className="card space-y-3 p-5">
        <h2 className="text-lg font-semibold">Change password</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input type="password" aria-label="Current password" autoComplete="current-password" className="input" placeholder="Current password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required />
          <input type="password" aria-label="New password" autoComplete="new-password" minLength={8} className="input" placeholder="New password (8+ characters)" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required />
        </div>
        {pwMsg && <p className="text-sm text-ink/70" role="status">{pwMsg}</p>}
        <button className="btn-soft">Update password</button>
      </form>
    </div>
  );
}
