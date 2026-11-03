exports.escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
exports.clampInt = (v, def, min, max) => {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return def;
  return Math.min(Math.max(n, min), max);
};
exports.cleanStr = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
exports.cleanImages = (arr) =>
  Array.isArray(arr) ? arr.filter((s) => typeof s === 'string' && s.startsWith('/uploads/')).slice(0, 4) : [];
exports.cleanTags = (arr) =>
  Array.isArray(arr)
    ? [...new Set(arr.filter((t) => typeof t === 'string').map((t) => t.trim().toLowerCase().slice(0, 30)).filter(Boolean))].slice(0, 5)
    : [];
