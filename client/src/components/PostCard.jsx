import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, MoreHorizontal, Pin, Megaphone } from 'lucide-react';
import api, { assetUrl, errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar, timeAgo, placeLabel } from './ui';
import Comments from './Comments';

const REASONS = ['Spam', 'Abusive or hateful', 'Misinformation', 'Not relevant to this community'];

export default function PostCard({ post, onUpdate, onRemove, showCommunity = false, defaultOpen = false }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(defaultOpen);
  const [menu, setMenu] = useState(false);
  const [msg, setMsg] = useState('');
  const mod = post.myRole === 'moderator' || post.myRole === 'admin';
  const own = post.author?._id === user._id;
  const isAnn = post.type === 'announcement';

  const patch = (changes) => onUpdate?.({ ...post, ...changes });
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const like = async () => {
    patch({ liked: !post.liked, likeCount: post.likeCount + (post.liked ? -1 : 1) }); // optimistic
    try { await api.put(`/posts/${post._id}/like`); } catch { patch({ liked: post.liked, likeCount: post.likeCount }); }
  };

  const share = async () => {
    try {
      const { data } = await api.post(`/posts/${post._id}/share`);
      const url = data.url || `${window.location.origin}/posts/${post._id}`;
      if (navigator.share) await navigator.share({ title: post.title || 'Hometown Hub', url }).catch(() => {});
      else { await navigator.clipboard.writeText(url); flash('Link copied'); }
      patch({ shareCount: data.shareCount });
    } catch (e) { flash(errMsg(e)); }
  };

  const pin = async () => {
    setMenu(false);
    try { const { data } = await api.put(`/posts/${post._id}/pin`); patch({ pinned: data.pinned }); } catch (e) { flash(errMsg(e)); }
  };

  const del = async () => {
    setMenu(false);
    if (!window.confirm('Delete this post?')) return;
    try { await api.delete(`/posts/${post._id}`); onRemove?.(post._id); } catch (e) { flash(errMsg(e)); }
  };

  const report = async (reason) => {
    setMenu(false);
    try { const { data } = await api.post('/reports', { targetType: 'post', targetId: post._id, reason }); flash(data.message); } catch (e) { flash(errMsg(e)); }
  };

  return (
    <article className={`card overflow-hidden ${isAnn ? 'border-marigold-400/60' : ''}`}>
      {(post.pinned || isAnn) && (
        <div className="flex items-center gap-2 bg-marigold-100 px-4 py-1.5 text-xs font-semibold text-marigold-600">
          {isAnn ? <Megaphone className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          {isAnn ? 'Announcement' : 'Pinned'}{isAnn && post.pinned ? ' · Pinned' : ''}
        </div>
      )}
      <div className="flex items-start gap-3 px-4 pt-3">
        <Avatar user={post.author} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{post.author?.name}</p>
          <p className="truncate text-xs text-ink/55">
            {placeLabel(post.author) && `From ${placeLabel(post.author)} · `}{timeAgo(post.createdAt)}
            {showCommunity && post.community && <> · <Link className="font-medium text-river-700 hover:underline" to={`/communities/${post.community._id}`}>{post.community.name}</Link></>}
          </p>
        </div>
        <div className="relative">
          <button onClick={() => setMenu(!menu)} className="rounded-md p-1.5 text-ink/50 hover:bg-ink/5" aria-label="Post options" aria-expanded={menu}>
            <MoreHorizontal className="h-5 w-5" />
          </button>
          {menu && (
            <div className="absolute right-0 z-10 mt-1 w-56 rounded-lg border border-ink/10 bg-white py-1 text-sm shadow-lg">
              {mod && <button onClick={pin} className="block w-full px-3 py-2 text-left hover:bg-paper">{post.pinned ? 'Unpin post' : 'Pin to top'}</button>}
              {(own || mod) && <button onClick={del} className="block w-full px-3 py-2 text-left text-brick-600 hover:bg-paper">Delete post</button>}
              {!own && (
                <>
                  <p className="px-3 pb-1 pt-2 text-xs text-ink/50">Report this post</p>
                  {REASONS.map((r) => <button key={r} onClick={() => report(r)} className="block w-full px-3 py-1.5 text-left hover:bg-paper">{r}</button>)}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-3">
        {post.title && <h3 className="mb-1 text-lg font-semibold leading-snug">{post.title}</h3>}
        <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{post.content}</p>
        {post.images?.length > 0 && (
          <div className={`mt-3 grid gap-1.5 ${post.images.length > 1 ? 'grid-cols-2' : ''}`}>
            {post.images.map((src) => (
              <a key={src} href={assetUrl(src)} target="_blank" rel="noreferrer"><img src={assetUrl(src)} alt="" loading="lazy" className="max-h-80 w-full rounded-lg object-cover" /></a>
            ))}
          </div>
        )}
        {(post.category || post.tags?.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.category && <span className="chip bg-river-50 text-river-700">{post.category}</span>}
            {post.tags?.map((t) => <span key={t} className="chip">#{t}</span>)}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 border-t border-ink/10 px-2 py-1">
        <button onClick={like} className={`btn-ghost !px-3 ${post.liked ? '!text-brick-600' : ''}`} aria-pressed={post.liked}>
          <Heart className={`h-4 w-4 ${post.liked ? 'fill-current' : ''}`} /> {post.likeCount || ''} <span className="sr-only">Like</span>
        </button>
        <button onClick={() => setOpen(!open)} className="btn-ghost !px-3" aria-expanded={open}>
          <MessageCircle className="h-4 w-4" /> {post.commentCount || ''} <span className="sr-only">Comments</span>
        </button>
        <button onClick={share} className="btn-ghost !px-3">
          <Share2 className="h-4 w-4" /> {post.shareCount || ''} <span className="sr-only">Share</span>
        </button>
        {msg && <span className="ml-auto pr-2 text-xs text-ink/60" role="status">{msg}</span>}
      </div>
      {open && <Comments postId={post._id} canModerate={mod} onCountChange={(d) => patch({ commentCount: Math.max(0, (post.commentCount || 0) + d) })} />}
    </article>
  );
}
