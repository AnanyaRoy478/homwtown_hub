import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import api, { errMsg } from '../api';
import CommunityCard from '../components/CommunityCard';
import { Spinner, Empty, ErrorNote } from '../components/ui';

export default function Explore() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [type, setType] = useState('');
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/communities', { params: { q: q || undefined, type: type || undefined } });
        setItems(data.items); setError('');
      } catch (e) { setError(errMsg(e)); setItems([]); }
    }, 250);
    return () => clearTimeout(t);
  }, [q, type]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Find your community</h1>
        <Link to="/communities/new" className="btn-primary"><Plus className="h-4 w-4" /> Start one</Link>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink/40" />
          <input className="input !pl-9" placeholder="Search by city, village or name" value={q} onChange={(e) => { setQ(e.target.value); setParams(e.target.value ? { q: e.target.value } : {}, { replace: true }); }} aria-label="Search communities" />
        </div>
        <select className="input !w-auto" value={type} onChange={(e) => setType(e.target.value)} aria-label="Community type">
          <option value="">All</option><option value="city">Cities</option><option value="town">Towns</option><option value="village">Villages</option>
        </select>
      </div>
      <ErrorNote error={error} />
      {items === null ? <Spinner /> : items.length === 0 ? (
        <Empty title={q ? `No communities for "${q}" yet` : 'No communities yet'} action={<Link to="/communities/new" className="btn-primary">Start the first one</Link>}>
          Be the first to bring your hometown online. New communities are reviewed before they go live.
        </Empty>
      ) : items.map((c) => <CommunityCard key={c._id} community={c} onChange={(u) => setItems((l) => l.map((x) => (x._id === u._id ? u : x)))} />)}
    </div>
  );
}
