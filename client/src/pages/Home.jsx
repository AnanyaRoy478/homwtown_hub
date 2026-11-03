import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import { Spinner, Empty, ErrorNote } from '../components/ui';

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState('');
  const [more, setMore] = useState(false);

  const load = useCallback(async (p) => {
    try {
      const { data } = await api.get('/posts/feed', { params: { page: p } });
      setPosts((cur) => (p === 1 ? data.items : [...(cur || []), ...data.items]));
      setPages(data.pages); setPage(p);
    } catch (e) { setError(errMsg(e)); setPosts((c) => c || []); } finally { setMore(false); }
  }, []);
  useEffect(() => { load(1); }, [load]);

  const city = user?.hometown?.city;
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Hi {user?.name?.split(' ')[0]}</h1>
        <p className="text-sm text-ink/60">{city ? `Here's the latest from ${city} and your other communities.` : "Here's the latest from your communities."}</p>
      </div>
      <ErrorNote error={error} />
      {posts === null ? <Spinner /> : posts.length === 0 ? (
        <Empty title="Your feed is quiet" action={<Link className="btn-primary" to={city ? `/explore?q=${encodeURIComponent(city)}` : '/explore'}>{city ? `Find communities in ${city}` : 'Find communities'}</Link>}>
          Join a city or village community to see its posts, announcements and events here.
        </Empty>
      ) : (
        <>
          {posts.map((p) => (
            <PostCard key={p._id} post={p} showCommunity
              onUpdate={(u) => setPosts((l) => l.map((x) => (x._id === u._id ? u : x)))}
              onRemove={(id) => setPosts((l) => l.filter((x) => x._id !== id))} />
          ))}
          {page < pages && <button className="btn-soft w-full" disabled={more} onClick={() => { setMore(true); load(page + 1); }}>{more ? 'Loading…' : 'Show more posts'}</button>}
        </>
      )}
    </div>
  );
}
