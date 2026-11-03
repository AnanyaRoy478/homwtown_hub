import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import api, { errMsg } from '../api';
import { Spinner, Empty, ErrorNote, timeAgo } from '../components/ui';

export default function Notifications() {
  const nav = useNavigate();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const ping = () => window.dispatchEvent(new Event('hh:notifications'));

  useEffect(() => { api.get('/notifications').then((r) => setItems(r.data.items)).catch((e) => { setError(errMsg(e)); setItems([]); }); }, []);

  const open = async (n) => {
    if (!n.read) { await api.put(`/notifications/${n._id}/read`).catch(() => {}); setItems((l) => l.map((x) => (x._id === n._id ? { ...x, read: true } : x))); ping(); }
    if (n.link) nav(n.link);
  };
  const readAll = async () => { await api.put('/notifications/read-all').catch(() => {}); setItems((l) => l.map((x) => ({ ...x, read: true }))); ping(); };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {items?.some((n) => !n.read) && <button onClick={readAll} className="btn-soft">Mark all as read</button>}
      </div>
      <ErrorNote error={error} />
      {items === null ? <Spinner /> : items.length === 0 ? <Empty title="You're all caught up">New announcements, events and replies will appear here.</Empty> : (
        <ul className="card divide-y divide-ink/10 overflow-hidden">
          {items.map((n) => (
            <li key={n._id}>
              <button onClick={() => open(n)} className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-paper ${n.read ? '' : 'bg-river-50/60'}`}>
                <Bell className={`mt-0.5 h-4 w-4 shrink-0 ${n.read ? 'text-ink/30' : 'text-river-600'}`} />
                <span className="flex-1 text-sm"><span className={n.read ? '' : 'font-semibold'}>{n.message}</span><span className="block text-xs text-ink/50">{timeAgo(n.createdAt)}</span></span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
