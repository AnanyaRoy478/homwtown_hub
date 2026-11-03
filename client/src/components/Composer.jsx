import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar, ErrorNote, ImagePicker } from './ui';

export default function Composer({ communityId, role, onCreated }) {
  const { user } = useAuth();
  const mod = role === 'moderator' || role === 'admin';
  const [type, setType] = useState('post');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState([]);
  const [cats, setCats] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.get('/categories').then((r) => setCats(r.data)).catch(() => {}); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post(`/communities/${communityId}/posts`, { type, title, content, category, images });
      onCreated(data);
      setTitle(''); setContent(''); setImages([]); setCategory(''); setType('post');
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="card space-y-3 p-4">
      <div className="flex gap-3">
        <Avatar user={user} />
        <div className="min-w-0 flex-1 space-y-2">
          {type !== 'post' && <input className="input" placeholder={type === 'announcement' ? 'Announcement headline' : 'Discussion topic'} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} aria-label="Title" />}
          <textarea className="input min-h-[84px] resize-y" placeholder="What's happening back home?" value={content} onChange={(e) => setContent(e.target.value)} maxLength={5000} aria-label="Post content" />
        </div>
      </div>
      <ImagePicker value={images} onChange={setImages} />
      <div className="flex flex-wrap items-center gap-2">
        <select className="input !w-auto" value={type} onChange={(e) => setType(e.target.value)} aria-label="Post type">
          <option value="post">Post</option>
          <option value="discussion">Discussion</option>
          {mod && <option value="announcement">Announcement</option>}
        </select>
        <select className="input !w-auto" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          <option value="">No category</option>
          {cats.filter((c) => c.kind === 'category').map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
        </select>
        <button className="btn-primary ml-auto" disabled={busy || !content.trim()}>{busy ? 'Posting…' : type === 'announcement' ? 'Publish announcement' : 'Post'}</button>
      </div>
      <ErrorNote error={error} />
    </form>
  );
}
