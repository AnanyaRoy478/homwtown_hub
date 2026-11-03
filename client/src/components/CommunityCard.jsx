import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users } from 'lucide-react';
import api, { errMsg } from '../api';
import { swatch } from './ui';

export default function CommunityCard({ community, onChange }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const m = community.myMembership;

  const join = async () => {
    setBusy(true); setErr('');
    try {
      const { data } = await api.post(`/communities/${community._id}/join`);
      onChange({ ...community, myMembership: data, memberCount: data.status === 'active' ? community.memberCount + 1 : community.memberCount });
    } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div className="card flex gap-4 p-4">
      <Link to={`/communities/${community._id}`} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl font-display text-2xl font-bold text-white" style={{ background: swatch(community.name) }} aria-hidden="true" tabIndex={-1}>
        {community.name.charAt(0)}
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={`/communities/${community._id}`} className="block truncate font-display text-lg font-semibold hover:underline">{community.name}</Link>
        <p className="flex items-center gap-3 text-sm text-ink/60">
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{[community.city, community.state].filter(Boolean).join(', ')}</span>
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{community.memberCount}</span>
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-ink/75">{community.description}</p>
        <div className="mt-3 flex items-center gap-2">
          {m?.status === 'active' ? <Link to={`/communities/${community._id}`} className="btn-soft">Open</Link>
            : m?.status === 'pending' ? <span className="chip bg-marigold-100 text-marigold-600">Request pending</span>
            : <button onClick={join} disabled={busy} className="btn-primary">{community.joinPolicy === 'open' ? 'Join' : 'Request to join'}</button>}
          {err && <span className="text-xs text-brick-600">{err}</span>}
        </div>
      </div>
    </div>
  );
}
