import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MapPin, Users, CalendarPlus } from 'lucide-react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import Composer from '../components/Composer';
import PostCard from '../components/PostCard';
import EventCard from '../components/EventCard';
import { Avatar, Empty, ErrorNote, Notice, Spinner, Tabs, fmtDate, placeLabel, swatch } from '../components/ui';

const isMod = (r) => r === 'moderator' || r === 'admin';

export default function CommunityPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [c, setC] = useState(null);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { const { data } = await api.get(`/communities/${id}`); setC(data); setError(''); }
    catch (e) { setError(errMsg(e)); }
  }, [id]);
  useEffect(() => { setC(null); load(); }, [load]);

  const m = c?.myMembership;
  const active = m?.status === 'active';
  const role = m?.role;
  const mod = active && isMod(role);

  useEffect(() => {
    if (mod) api.get(`/communities/${id}/requests`).then((r) => setRequests(r.data)).catch(() => {});
  }, [mod, id]);

  if (error) return <div className="mx-auto max-w-2xl"><ErrorNote error={error} /><Link to="/explore" className="btn-soft mt-3">Back to Explore</Link></div>;
  if (!c) return <Spinner />;

  const join = async () => {
    setBusy(true);
    try { await api.post(`/communities/${id}/join`); await load(); } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };
  const leave = async () => {
    if (!window.confirm(`Leave ${c.name}?`)) return;
    try { await api.delete(`/communities/${id}/leave`); nav('/explore'); } catch (e) { setError(errMsg(e)); }
  };

  const tabs = active
    ? [{ id: 'feed', label: 'Feed' }, { id: 'events', label: 'Events' }, { id: 'about', label: 'About' }, { id: 'members', label: 'Members' }, ...(mod ? [{ id: 'manage', label: 'Manage', badge: requests.length }] : [])]
    : [{ id: 'about', label: 'About' }];
  const tab = tabs.some((t) => t.id === params.get('tab')) ? params.get('tab') : tabs[0].id;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header className="card overflow-hidden">
        <div className="h-24 sm:h-28" style={{ background: swatch(c.name) }} />
        <div className="px-4 pb-4">
          <div className="-mt-8 flex items-end justify-between gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white font-display text-3xl font-bold text-white" style={{ background: swatch(c.name) }} aria-hidden="true">{c.name.charAt(0)}</div>
            <div className="flex gap-2">
              {!m && c.status === 'approved' && <button className="btn-primary" onClick={join} disabled={busy}>{c.joinPolicy === 'open' ? 'Join community' : 'Request to join'}</button>}
              {m?.status === 'rejected' && c.status === 'approved' && <button className="btn-primary" onClick={join} disabled={busy}>Request again</button>}
              {m?.status === 'pending' && <span className="chip bg-marigold-100 py-1.5 text-marigold-600">Request pending</span>}
              {active && !m.platform && <button className="btn-ghost" onClick={leave}>Leave</button>}
            </div>
          </div>
          <h1 className="mt-2 text-2xl font-bold">{c.name}</h1>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/60">
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{[c.city, c.state].filter(Boolean).join(', ')}</span>
            <span className="flex items-center gap-1"><Users className="h-4 w-4" />{c.memberCount} {c.memberCount === 1 ? 'member' : 'members'}</span>
            <span>Created {fmtDate(c.createdAt)}</span>
          </p>
        </div>
      </header>

      {c.status !== 'approved' && <Notice>{c.status === 'pending' ? 'This community is waiting for platform approval. Posting and events unlock once it is approved.' : 'This community was not approved.'}</Notice>}
      {m?.status === 'pending' && <Notice>A moderator will review your request soon. You'll be notified when you're in.</Notice>}

      <Tabs tabs={tabs} active={tab} onChange={(t) => setParams({ tab: t }, { replace: true })} />

      {tab === 'feed' && <FeedTab community={c} role={role} />}
      {tab === 'events' && <EventsTab community={c} role={role} />}
      {tab === 'about' && <AboutTab community={c} canReport={active && !m.platform} />}
      {tab === 'members' && <MembersTab id={id} />}
      {tab === 'manage' && <ManageTab community={c} role={role} requests={requests} setRequests={setRequests} onSaved={(d) => setC((x) => ({ ...x, ...d }))} reload={load} />}
    </div>
  );
}

function FeedTab({ community, role }) {
  const [posts, setPosts] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState('');
  const load = useCallback(async (p) => {
    try {
      const { data } = await api.get(`/communities/${community._id}/posts`, { params: { page: p } });
      setPosts((cur) => (p === 1 ? data.items : [...cur, ...data.items])); setPages(data.pages); setPage(p);
    } catch (e) { setError(errMsg(e)); setPosts((c) => c || []); }
  }, [community._id]);
  useEffect(() => { load(1); }, [load]);

  return (
    <div className="space-y-4">
      {community.status === 'approved' && <Composer communityId={community._id} role={role} onCreated={(p) => setPosts((l) => [p, ...(l || [])])} />}
      <ErrorNote error={error} />
      {posts === null ? <Spinner /> : posts.length === 0 ? <Empty title="No posts yet">Share the first update, photo or question with your community.</Empty> : (
        <>
          {posts.map((p) => <PostCard key={p._id} post={p} onUpdate={(u) => setPosts((l) => l.map((x) => (x._id === u._id ? u : x)))} onRemove={(pid) => setPosts((l) => l.filter((x) => x._id !== pid))} />)}
          {page < pages && <button className="btn-soft w-full" onClick={() => load(page + 1)}>Show more posts</button>}
        </>
      )}
    </div>
  );
}

function EventsTab({ community, role }) {
  const [events, setEvents] = useState(null);
  const [past, setPast] = useState(false);
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ title: '', description: '', location: '', startsAt: '', endsAt: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    setEvents(null);
    api.get(`/communities/${community._id}/events`, { params: { past } }).then((r) => setEvents(r.data)).catch((e) => { setError(errMsg(e)); setEvents([]); });
  }, [community._id, past]);

  const create = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const body = { ...f, startsAt: new Date(f.startsAt).toISOString(), endsAt: f.endsAt ? new Date(f.endsAt).toISOString() : undefined };
      const { data } = await api.post(`/communities/${community._id}/events`, body);
      setEvents((l) => [...(l || []), data].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)));
      setF({ title: '', description: '', location: '', startsAt: '', endsAt: '' }); setShow(false);
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <button className={past ? 'btn-ghost' : 'btn-soft'} onClick={() => setPast(false)}>Upcoming</button>
          <button className={past ? 'btn-soft' : 'btn-ghost'} onClick={() => setPast(true)}>Past</button>
        </div>
        {community.status === 'approved' && <button className="btn-primary" onClick={() => setShow(!show)}><CalendarPlus className="h-4 w-4" /> Plan an event</button>}
      </div>
      {show && (
        <form onSubmit={create} className="card space-y-3 p-4">
          <input className="input" required placeholder="Event title" value={f.title} onChange={set('title')} maxLength={120} aria-label="Event title" />
          <textarea className="input" rows={3} placeholder="What should people know?" value={f.description} onChange={set('description')} maxLength={2000} aria-label="Description" />
          <input className="input" placeholder="Location" value={f.location} onChange={set('location')} maxLength={200} aria-label="Location" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label" htmlFor="s">Starts</label><input id="s" type="datetime-local" required className="input" value={f.startsAt} onChange={set('startsAt')} /></div>
            <div><label className="label" htmlFor="e">Ends <span className="text-ink/40">(optional)</span></label><input id="e" type="datetime-local" className="input" value={f.endsAt} onChange={set('endsAt')} /></div>
          </div>
          <ErrorNote error={error} />
          <button className="btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create event'}</button>
        </form>
      )}
      {!show && <ErrorNote error={error} />}
      {events === null ? <Spinner /> : events.length === 0 ? <Empty title={past ? 'No past events' : 'No upcoming events'}>{past ? '' : 'Plan a meet-up, festival or clean-up drive and invite everyone.'}</Empty> : events.map((ev) => (
        <EventCard key={ev._id} event={{ ...ev, myRole: ev.myRole || role }}
          onUpdate={(u) => setEvents((l) => l.map((x) => (x._id === u._id ? { ...x, ...u } : x)))}
          onRemove={(id) => setEvents((l) => l.filter((x) => x._id !== id))} />
      ))}
    </div>
  );
}

function AboutTab({ community, canReport }) {
  const [msg, setMsg] = useState('');
  const report = async () => {
    const reason = window.prompt('Why are you reporting this community?');
    if (!reason) return;
    try { const { data } = await api.post('/reports', { targetType: 'community', targetId: community._id, reason }); setMsg(data.message); } catch (e) { setMsg(errMsg(e)); }
  };
  return (
    <div className="space-y-4">
      <section className="card p-5"><h2 className="mb-2 text-lg font-semibold">About</h2><p className="whitespace-pre-wrap leading-relaxed">{community.description}</p>
        <p className="mt-3 text-sm text-ink/60">Started by {community.createdBy?.name || 'a community member'} · {community.joinPolicy === 'open' ? 'Anyone can join' : 'Join requests are reviewed by moderators'}</p></section>
      <section className="card p-5"><h2 className="mb-2 text-lg font-semibold">Community rules</h2>
        {community.rules ? <p className="whitespace-pre-wrap leading-relaxed">{community.rules}</p> : <p className="text-sm text-ink/60">The moderators haven't added rules yet. Be kind and keep things local.</p>}</section>
      {canReport && <div className="flex items-center gap-3"><button onClick={report} className="btn-ghost text-xs">Report this community</button>{msg && <span className="text-xs text-ink/60" role="status">{msg}</span>}</div>}
    </div>
  );
}

function MembersTab({ id }) {
  const [list, setList] = useState(null);
  useEffect(() => { api.get(`/communities/${id}/members`).then((r) => setList(r.data)).catch(() => setList([])); }, [id]);
  if (!list) return <Spinner />;
  return (
    <ul className="card divide-y divide-ink/10">
      {list.map((m) => (
        <li key={m._id} className="flex items-center gap-3 px-4 py-3">
          <Avatar user={m.user} />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{m.user.name}</p><p className="truncate text-xs text-ink/55">{placeLabel(m.user) ? `From ${placeLabel(m.user)}` : m.user.currentCity ? `Lives in ${m.user.currentCity}` : ''}</p></div>
          {m.role !== 'member' && <span className="chip bg-river-50 text-river-700">{m.role === 'admin' ? 'Admin' : 'Moderator'}</span>}
        </li>
      ))}
    </ul>
  );
}

function ManageTab({ community, role, requests, setRequests, onSaved, reload }) {
  const { user } = useAuth();
  const [members, setMembers] = useState(null);
  const [f, setF] = useState({ description: community.description, rules: community.rules || '', joinPolicy: community.joinPolicy });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const id = community._id;

  const loadMembers = useCallback(() => api.get(`/communities/${id}/members`).then((r) => setMembers(r.data)).catch(() => setMembers([])), [id]);
  useEffect(() => { loadMembers(); }, [loadMembers]);

  const decide = async (mid, action) => {
    setError('');
    try { await api.put(`/communities/${id}/requests/${mid}`, { action }); setRequests((l) => l.filter((r) => r._id !== mid)); if (action === 'approve') { loadMembers(); reload(); } }
    catch (e) { setError(errMsg(e)); }
  };
  const save = async (e) => {
    e.preventDefault(); setMsg(''); setError('');
    try { const { data } = await api.put(`/communities/${id}`, f); onSaved(data); setMsg('Saved'); } catch (err) { setError(errMsg(err)); }
  };
  const setRole = async (mid, r) => { try { await api.put(`/communities/${id}/members/${mid}/role`, { role: r }); loadMembers(); } catch (e) { setError(errMsg(e)); } };
  const remove = async (mid, name) => {
    if (!window.confirm(`Remove ${name} from the community?`)) return;
    try { await api.delete(`/communities/${id}/members/${mid}`); loadMembers(); reload(); } catch (e) { setError(errMsg(e)); }
  };
  const rank = { member: 1, moderator: 2, admin: 3 };

  return (
    <div className="space-y-6">
      <ErrorNote error={error} />
      <section>
        <h2 className="mb-2 text-lg font-semibold">Join requests</h2>
        {requests.length === 0 ? <p className="card px-4 py-5 text-sm text-ink/60">No pending requests.</p> : (
          <ul className="card divide-y divide-ink/10">
            {requests.map((r) => (
              <li key={r._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Avatar user={r.user} />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{r.user.name}</p><p className="truncate text-xs text-ink/55">{placeLabel(r.user) ? `From ${placeLabel(r.user)}` : r.user.bio || ''}</p></div>
                <button className="btn-primary" onClick={() => decide(r._id, 'approve')}>Approve</button>
                <button className="btn-danger" onClick={() => decide(r._id, 'reject')}>Decline</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={save} className="card space-y-3 p-5">
        <h2 className="text-lg font-semibold">Description and rules</h2>
        <div><label className="label" htmlFor="d">Description</label><textarea id="d" className="input" rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={1000} /></div>
        <div><label className="label" htmlFor="r">Rules and guidelines</label><textarea id="r" className="input" rows={5} value={f.rules} onChange={(e) => setF({ ...f, rules: e.target.value })} maxLength={3000} /></div>
        {role === 'admin' && <div><label className="label" htmlFor="jp">Who can join?</label><select id="jp" className="input" value={f.joinPolicy} onChange={(e) => setF({ ...f, joinPolicy: e.target.value })}><option value="approval">Moderators approve each request</option><option value="open">Anyone can join instantly</option></select></div>}
        {msg && <p className="text-sm text-river-700" role="status">{msg}</p>}
        <button className="btn-primary">Save changes</button>
      </form>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Members and moderators</h2>
        {!members ? <Spinner /> : (
          <ul className="card divide-y divide-ink/10">
            {members.map((m) => {
              const self = m.user._id === user._id;
              const canRemove = !self && rank[m.role] < rank[role];
              return (
                <li key={m._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Avatar user={m.user} size={32} />
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold">{m.user.name}{self && <span className="font-normal text-ink/50"> (you)</span>}</p>
                  {role === 'admin' ? (
                    <select className="input !w-auto !py-1" value={m.role} onChange={(e) => setRole(m._id, e.target.value)} aria-label={`Role for ${m.user.name}`}>
                      <option value="member">Member</option><option value="moderator">Moderator</option><option value="admin">Admin</option>
                    </select>
                  ) : <span className="chip">{m.role}</span>}
                  {canRemove && <button className="btn-ghost !text-brick-600" onClick={() => remove(m._id, m.user.name)}>Remove</button>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
