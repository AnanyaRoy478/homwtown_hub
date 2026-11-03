import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { Empty, ErrorNote, Spinner, Tabs, fmtDate, timeAgo } from '../components/ui';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'communities', label: 'Communities' },
  { id: 'users', label: 'Users' },
  { id: 'moderators', label: 'Moderators' },
  { id: 'reports', label: 'Reports' },
  { id: 'categories', label: 'Categories' },
];

export default function Admin() {
  const [tab, setTab] = useState('overview');
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold">Admin dashboard</h1>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'overview' && <Overview go={setTab} />}
      {tab === 'communities' && <CommunitiesAdmin />}
      {tab === 'users' && <UsersAdmin />}
      {tab === 'moderators' && <ModeratorsAdmin />}
      {tab === 'reports' && <ReportsAdmin />}
      {tab === 'categories' && <CategoriesAdmin />}
    </div>
  );
}

function useFetch(url, params) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const key = JSON.stringify(params || {});
  const reload = useCallback(() => {
    setData(null);
    api.get(url, { params }).then((r) => setData(r.data)).catch((e) => { setError(errMsg(e)); setData([]); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, key]);
  useEffect(() => { reload(); }, [reload]);
  return { data, setData, error, setError, reload };
}

function Stat({ label, value, hint, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag onClick={onClick} className="card p-4 text-left">
      <p className="font-display text-3xl font-bold">{value}</p>
      <p className="text-sm font-medium text-ink/70">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-ink/50">{hint}</p>}
    </Tag>
  );
}

function Overview({ go }) {
  const { data, error } = useFetch('/admin/stats');
  if (error) return <ErrorNote error={error} />;
  if (!data || Array.isArray(data)) return <Spinner />;
  const { kpis: k, totals: t } = data;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Registered users" value={k.registeredUsers} hint={`${k.newUsers7d} new this week`} />
        <Stat label="Active communities" value={k.activeCommunities} hint={`${k.communityGrowthRate}% growth vs last 30 days`} />
        <Stat label="Daily active users" value={k.dau} hint={`${k.wau} in the last 7 days`} />
        <Stat label="Posts today" value={k.postsToday} hint={`${t.posts} total`} />
        <Stat label="Engagement per post" value={k.engagementPerPost} hint="Likes, comments and shares" />
        <Stat label="Event participation" value={`${k.eventParticipationRate}%`} hint="RSVPs vs community reach" />
        <Stat label="Awaiting approval" value={t.pendingCommunities} hint="Communities" onClick={() => go('communities')} />
        <Stat label="Open reports" value={t.openReports} hint="Needs review" onClick={() => go('reports')} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-4">
          <h2 className="mb-2 text-lg font-semibold">Largest communities</h2>
          {data.topCommunities.length === 0 ? <p className="text-sm text-ink/60">Nothing yet.</p> : (
            <ol className="space-y-2">{data.topCommunities.map((c) => <li key={c._id} className="flex justify-between text-sm"><Link className="font-medium hover:underline" to={`/communities/${c._id}`}>{c.name}</Link><span className="text-ink/60">{c.memberCount} members</span></li>)}</ol>
          )}
        </section>
        <section className="card p-4">
          <h2 className="mb-2 text-lg font-semibold">Recent activity</h2>
          <ul className="space-y-2">{data.recent.map((r, i) => <li key={i} className="flex justify-between gap-3 text-sm"><span>{r.text}</span><span className="shrink-0 text-ink/50">{timeAgo(r.at)}</span></li>)}</ul>
        </section>
      </div>
    </div>
  );
}

function CommunitiesAdmin() {
  const [status, setStatus] = useState('pending');
  const { data, setData, error, setError } = useFetch('/admin/communities', { status });
  const set = async (id, s) => {
    try { await api.put(`/admin/communities/${id}/status`, { status: s }); setData((l) => l.filter((c) => c._id !== id)); } catch (e) { setError(errMsg(e)); }
  };
  return (
    <div className="space-y-3">
      <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
        <option value="pending">Awaiting approval</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
      </select>
      <ErrorNote error={error} />
      {!data ? <Spinner /> : data.length === 0 ? <Empty title="Nothing here">No {status} communities.</Empty> : (
        <ul className="card divide-y divide-ink/10">
          {data.map((c) => (
            <li key={c._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <Link to={`/communities/${c._id}`} className="font-semibold hover:underline">{c.name}</Link>
                <p className="text-xs text-ink/55">{c.type} · {c.city}{c.state ? `, ${c.state}` : ''} · by {c.createdBy?.name} · {fmtDate(c.createdAt)}</p>
                <p className="mt-1 line-clamp-2 text-sm text-ink/75">{c.description}</p>
              </div>
              {status !== 'approved' && <button className="btn-primary" onClick={() => set(c._id, 'approved')}>Approve</button>}
              {status !== 'rejected' && <button className="btn-danger" onClick={() => set(c._id, 'rejected')}>{status === 'approved' ? 'Suspend' : 'Reject'}</button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function UsersAdmin() {
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => { const t = setTimeout(() => { setDq(q); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  const { data, setData, error, setError } = useFetch('/admin/users', { q: dq || undefined, page });

  const update = async (u, body) => {
    try { const { data: nu } = await api.put(`/admin/users/${u._id}`, body); setData((d) => ({ ...d, items: d.items.map((x) => (x._id === nu._id ? nu : x)) })); setError(''); }
    catch (e) { setError(errMsg(e)); }
  };
  return (
    <div className="space-y-3">
      <input className="input" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search users" />
      <ErrorNote error={error} />
      {data === null ? <Spinner /> : Array.isArray(data) ? null : (
        <>
          <ul className="card divide-y divide-ink/10">
            {data.items.map((u) => (
              <li key={u._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{u.name} {u.role === 'admin' && <span className="chip bg-river-50 text-river-700">Platform admin</span>} {u.isBanned && <span className="chip bg-brick-50 text-brick-600">Suspended</span>}</p>
                  <p className="truncate text-xs text-ink/55">{u.email} · joined {fmtDate(u.createdAt)}</p>
                </div>
                <button className="btn-ghost text-xs" onClick={() => update(u, { role: u.role === 'admin' ? 'user' : 'admin' })}>{u.role === 'admin' ? 'Remove admin' : 'Make admin'}</button>
                <button className={u.isBanned ? 'btn-soft' : 'btn-danger'} onClick={() => update(u, { isBanned: !u.isBanned })}>{u.isBanned ? 'Reinstate' : 'Suspend'}</button>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between text-sm text-ink/60">
            <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span>Page {data.page} of {Math.max(data.pages, 1)} · {data.total} users</span>
            <button className="btn-ghost" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}

function ModeratorsAdmin() {
  const { data, error } = useFetch('/admin/moderators');
  return (
    <div className="space-y-3">
      <p className="text-sm text-ink/60">Community admins and moderators across the platform. Use the Users tab to suspend an account.</p>
      <ErrorNote error={error} />
      {!data ? <Spinner /> : data.length === 0 ? <Empty title="No moderators yet" /> : (
        <ul className="card divide-y divide-ink/10">
          {data.map((m) => (
            <li key={m._id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span><span className="font-semibold">{m.user.name}</span> <span className="text-ink/55">{m.user.email}</span></span>
              <span className="text-right"><Link className="hover:underline" to={`/communities/${m.community._id}`}>{m.community.name}</Link> <span className="chip ml-1">{m.role}</span></span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReportsAdmin() {
  const [status, setStatus] = useState('open');
  const { data, setData, error, setError } = useFetch('/admin/reports', { status });
  const resolve = async (r, s, action) => {
    try { await api.put(`/admin/reports/${r._id}`, { status: s, action }); setData((l) => l.filter((x) => x._id !== r._id)); } catch (e) { setError(errMsg(e)); }
  };
  return (
    <div className="space-y-3">
      <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter reports">
        <option value="open">Open</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option>
      </select>
      <ErrorNote error={error} />
      {!data ? <Spinner /> : data.length === 0 ? <Empty title="No reports">Nothing to review right now.</Empty> : data.map((r) => (
        <div key={r._id} className="card space-y-2 p-4">
          <p className="text-sm"><span className="chip bg-marigold-100 text-marigold-600">{r.targetType}</span> <span className="font-semibold">{r.reason}</span> <span className="text-ink/50">· reported by {r.reporter?.name} · {timeAgo(r.createdAt)}</span></p>
          {r.details && <p className="text-sm text-ink/70">"{r.details}"</p>}
          <div className="rounded-lg bg-paper px-3 py-2 text-sm">
            {r.preview ? <>{r.preview.by && <span className="font-semibold">{r.preview.by}: </span>}{r.preview.text}{r.preview.removed && <span className="chip ml-2">already actioned</span>}</> : <span className="text-ink/50">This item no longer exists.</span>}
          </div>
          {status === 'open' && (
            <div className="flex flex-wrap gap-2">
              {['post', 'comment'].includes(r.targetType) && <button className="btn-danger" onClick={() => resolve(r, 'resolved', 'remove_content')}>Remove content</button>}
              {['post', 'comment', 'user'].includes(r.targetType) && <button className="btn-danger" onClick={() => resolve(r, 'resolved', 'ban_user')}>Suspend user</button>}
              <button className="btn-soft" onClick={() => resolve(r, 'resolved', 'none')}>Mark resolved</button>
              <button className="btn-ghost" onClick={() => resolve(r, 'dismissed')}>Dismiss</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CategoriesAdmin() {
  const { data, setData, error, setError } = useFetch('/admin/categories');
  const [name, setName] = useState('');
  const [kind, setKind] = useState('category');
  const add = async (e) => {
    e.preventDefault();
    try { const { data: c } = await api.post('/admin/categories', { name, kind }); setData((l) => [...l, c]); setName(''); setError(''); } catch (err) { setError(errMsg(err)); }
  };
  const del = async (id) => { try { await api.delete(`/admin/categories/${id}`); setData((l) => l.filter((c) => c._id !== id)); } catch (e) { setError(errMsg(e)); } };
  return (
    <div className="space-y-3">
      <form onSubmit={add} className="flex gap-2">
        <input className="input" placeholder="New category name" value={name} onChange={(e) => setName(e.target.value)} required aria-label="Category name" />
        <select className="input !w-auto" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Kind"><option value="category">Category</option><option value="tag">Tag</option></select>
        <button className="btn-primary">Add</button>
      </form>
      <ErrorNote error={error} />
      {!data ? <Spinner /> : (
        <div className="card flex flex-wrap gap-2 p-4">
          {data.map((c) => (
            <span key={c._id} className="chip gap-1.5 !text-sm">
              {c.kind === 'tag' && '#'}{c.name}
              <button onClick={() => del(c._id)} className="text-ink/40 hover:text-brick-600" aria-label={`Delete ${c.name}`}>×</button>
            </span>
          ))}
          {data.length === 0 && <p className="text-sm text-ink/60">No categories yet.</p>}
        </div>
      )}
    </div>
  );
}
