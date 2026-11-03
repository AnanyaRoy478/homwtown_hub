import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Spinner, ErrorNote, timeAgo } from './ui';

export default function Comments({ postId, canModerate, onCountChange }) {
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/posts/${postId}/comments`).then((r) => setItems(r.data.items)).catch((e) => { setError(errMsg(e)); setItems([]); });
  }, [postId]);

  const add = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post(`/posts/${postId}/comments`, { content: text });
      setItems((c) => [...c, data]);
      setText('');
      onCountChange?.(1);
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/posts/comments/${id}`);
      setItems((c) => c.filter((x) => x._id !== id));
      onCountChange?.(-1);
    } catch (err) { setError(errMsg(err)); }
  };

  return (
    <div className="border-t border-ink/10 px-4 py-3">
      {items === null ? <Spinner /> : (
        <ul className="space-y-3">
          {items.map((c) => (
            <li key={c._id} className="flex gap-2.5">
              <Avatar user={c.author} size={30} />
              <div className="min-w-0 flex-1 rounded-xl bg-paper px-3 py-2">
                <p className="text-sm"><span className="font-semibold">{c.author?.name}</span> <span className="text-xs text-ink/50">{timeAgo(c.createdAt)}</span></p>
                <p className="whitespace-pre-wrap break-words text-sm">{c.content}</p>
              </div>
              {(c.author?._id === user._id || canModerate) && (
                <button onClick={() => remove(c._id)} className="self-start rounded p-1 text-ink/40 hover:text-brick-600" aria-label="Delete comment">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
          {!items.length && <li className="text-sm text-ink/55">No comments yet. Start the conversation.</li>}
        </ul>
      )}
      <form onSubmit={add} className="mt-3 flex gap-2">
        <input className="input" placeholder="Write a comment" value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} aria-label="Write a comment" />
        <button className="btn-primary" disabled={busy || !text.trim()}>Post</button>
      </form>
      <div className="mt-2"><ErrorNote error={error} /></div>
    </div>
  );
}
