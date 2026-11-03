import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Clock } from 'lucide-react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { fmtDateTime } from './ui';

export default function EventCard({ event, onUpdate, onRemove, showCommunity }) {
  const { user } = useAuth();
  const [err, setErr] = useState('');
  const d = new Date(event.startsAt);
  const mod = event.myRole === 'moderator' || event.myRole === 'admin';
  const canManage = event.creator?._id === user._id || mod;
  const cancelled = event.status === 'cancelled';

  const rsvp = async () => {
    setErr('');
    try { const { data } = await api.put(`/events/${event._id}/rsvp`); onUpdate({ ...event, going: data.going, attendeeCount: data.attendeeCount }); }
    catch (e) { setErr(errMsg(e)); }
  };
  const cancel = async () => {
    try { await api.put(`/events/${event._id}`, { status: cancelled ? 'active' : 'cancelled' }); onUpdate({ ...event, status: cancelled ? 'active' : 'cancelled' }); }
    catch (e) { setErr(errMsg(e)); }
  };
  const del = async () => {
    if (!window.confirm('Delete this event?')) return;
    try { await api.delete(`/events/${event._id}`); onRemove(event._id); } catch (e) { setErr(errMsg(e)); }
  };

  return (
    <div className={`card flex gap-4 p-4 ${cancelled ? 'opacity-70' : ''}`}>
      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-river-600 text-white" aria-hidden="true">
        <span className="text-xs font-medium">{d.toLocaleString(undefined, { month: 'short' })}</span>
        <span className="font-display text-2xl font-bold leading-none">{d.getDate()}</span>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold leading-snug">
          {event.title} {cancelled && <span className="chip ml-1 bg-brick-50 text-brick-600">Cancelled</span>}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink/65"><Clock className="h-3.5 w-3.5" /> {fmtDateTime(event.startsAt)}</p>
        {event.location && <p className="flex items-center gap-1.5 text-sm text-ink/65"><MapPin className="h-3.5 w-3.5" /> {event.location}</p>}
        {showCommunity && event.community && <p className="text-sm"><Link to={`/communities/${event.community._id}?tab=events`} className="font-medium text-river-700 hover:underline">{event.community.name}</Link></p>}
        {event.description && <p className="mt-2 whitespace-pre-wrap text-sm text-ink/80">{event.description}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button onClick={rsvp} disabled={cancelled} className={event.going ? 'btn-soft' : 'btn-primary'}>{event.going ? "You're going" : 'Join event'}</button>
          <span className="flex items-center gap-1 text-sm text-ink/60"><Users className="h-4 w-4" /> {event.attendeeCount} going</span>
          {canManage && (
            <span className="ml-auto flex gap-1">
              <button onClick={cancel} className="btn-ghost !px-2 text-xs">{cancelled ? 'Reopen' : 'Cancel event'}</button>
              <button onClick={del} className="btn-ghost !px-2 text-xs !text-brick-600">Delete</button>
            </span>
          )}
        </div>
        {err && <p className="mt-2 text-xs text-brick-600">{err}</p>}
      </div>
    </div>
  );
}
