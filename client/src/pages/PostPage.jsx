import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api, { errMsg } from '../api';
import PostCard from '../components/PostCard';
import { Spinner, ErrorNote } from '../components/ui';

export default function PostPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get(`/posts/${id}`).then((r) => setPost(r.data)).catch((e) => setError(errMsg(e))); }, [id]);

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <button onClick={() => nav(-1)} className="btn-ghost !px-2"><ArrowLeft className="h-4 w-4" /> Back</button>
      <ErrorNote error={error} />
      {!post && !error && <Spinner />}
      {post && <PostCard post={post} showCommunity defaultOpen onUpdate={setPost} onRemove={() => nav('/')} />}
    </div>
  );
}
