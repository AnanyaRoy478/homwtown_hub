import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { assetUrl, uploadImage, errMsg } from '../api';

const SWATCHES = ['#1E6B5A', '#14233A', '#A86A06', '#6B4E9B', '#B3402A', '#2F6690', '#3A7D44'];
const hash = (s = '') => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
export const swatch = (s) => SWATCHES[hash(s) % SWATCHES.length];

export function Avatar({ user, name, src, size = 40 }) {
  const n = name || user?.name || '?';
  const img = src || user?.avatar;
  const style = { width: size, height: size, fontSize: size * 0.4 };
  if (img) return <img src={assetUrl(img)} alt="" style={style} className="shrink-0 rounded-full object-cover" />;
  return (
    <span style={{ ...style, background: swatch(n) }} className="inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold text-white" aria-hidden="true">
      {n.trim().charAt(0).toUpperCase()}
    </span>
  );
}

export const Spinner = ({ label = 'Loading' }) => (
  <div className="flex items-center justify-center gap-2 py-12 text-sm text-ink/60" role="status">
    <Loader2 className="h-4 w-4 animate-spin" /> {label}…
  </div>
);

export const Empty = ({ title, children, action }) => (
  <div className="card px-6 py-10 text-center">
    <h3 className="text-lg font-semibold">{title}</h3>
    {children && <p className="mx-auto mt-1 max-w-sm text-sm text-ink/60">{children}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const ErrorNote = ({ error }) =>
  error ? <p role="alert" className="rounded-lg bg-brick-50 px-3 py-2 text-sm text-brick-600">{error}</p> : null;

export const Notice = ({ children }) => (
  <p className="rounded-lg bg-marigold-100 px-3 py-2 text-sm text-marigold-600">{children}</p>
);

export function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
export const fmtDateTime = (d) =>
  new Date(d).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
export const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export const placeLabel = (u) => {
  const h = u?.hometown || {};
  return [h.village, h.city].filter(Boolean).join(', ');
};

// Upload up to `max` images; calls onChange with the array of returned URLs.
export function ImagePicker({ value = [], onChange, max = 4, label = 'Add photos' }) {
  const ref = useRef();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async (e) => {
    const files = [...e.target.files].slice(0, max - value.length);
    e.target.value = '';
    if (!files.length) return;
    setBusy(true);
    setError('');
    try {
      const urls = [];
      for (const f of files) urls.push(await uploadImage(f));
      onChange([...value, ...urls]);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {value.map((u) => (
          <div key={u} className="relative">
            <img src={assetUrl(u)} alt="" className="h-16 w-16 rounded-lg object-cover" />
            <button type="button" onClick={() => onChange(value.filter((x) => x !== u))} className="absolute -right-1.5 -top-1.5 rounded-full bg-ink p-0.5 text-white" aria-label="Remove photo">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {value.length < max && (
          <button type="button" onClick={() => ref.current.click()} disabled={busy} className="btn-ghost !px-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} {label}
          </button>
        )}
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple={max > 1} hidden onChange={pick} />
      </div>
      {error && <p className="mt-1 text-xs text-brick-600">{error}</p>}
    </div>
  );
}

export const Tabs = ({ tabs, active, onChange }) => (
  <div className="flex gap-1 overflow-x-auto border-b border-ink/10" role="tablist">
    {tabs.map((t) => (
      <button
        key={t.id}
        role="tab"
        aria-selected={active === t.id}
        onClick={() => onChange(t.id)}
        className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${active === t.id ? 'border-river-600 text-river-700' : 'border-transparent text-ink/55 hover:text-ink'}`}
      >
        {t.label}
        {t.badge ? <span className="ml-1.5 rounded-full bg-marigold-400 px-1.5 text-xs text-ink">{t.badge}</span> : null}
      </button>
    ))}
  </div>
);
