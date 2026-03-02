import { DATA_SOURCES, DEFAULT_IMAGE_SRC } from './config.js';

export const hasText = (value = '') => String(value).trim().length > 0;
export const isPlaceholderValue = (value = '') => String(value).trim().startsWith('[');
export const isHttpLink = (value = '') => /^https?:\/\//i.test(String(value).trim());
export const isMailtoLink = (value = '') => /^mailto:/i.test(String(value).trim());
export const includesDXPLab = (value = '') => /digital\s+experience\s+lab|dxp\s*lab|dxp\.korea\.ac\.kr/i.test(String(value));

export const toSafeMailto = (email = '') => {
  const trimmed = String(email).trim();
  if (!trimmed || isPlaceholderValue(trimmed)) return '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return '';
  return `mailto:${trimmed}`;
};

export const toSafeHref = (value = '') => {
  const trimmed = String(value).trim();
  if (!trimmed || isPlaceholderValue(trimmed)) return '';

  if (isMailtoLink(trimmed)) {
    return toSafeMailto(trimmed.slice('mailto:'.length));
  }

  if (!isHttpLink(trimmed)) return '';

  try {
    const parsed = new URL(trimmed);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') ? parsed.href : '';
  } catch {
    return '';
  }
};

export const toSafeImageSrc = (value = '') => {
  const trimmed = String(value).trim();
  if (!trimmed || isPlaceholderValue(trimmed)) return DEFAULT_IMAGE_SRC;
  if (isHttpLink(trimmed)) return trimmed;
  if (/^(?!.*:\/\/)(?!javascript:)(?!data:)[a-zA-Z0-9._/-]+$/.test(trimmed)) return trimmed;
  return DEFAULT_IMAGE_SRC;
};

export const parseTSV = (text = '') => {
  const lines = String(text)
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) return [];

  const headers = lines[0]
    .replace(/^\uFEFF/, '')
    .split('\t')
    .map((header) => header.trim());

  if (headers.length === 0) return [];

  return lines.slice(1).map((line) => {
    const cols = line.split('\t');
    return headers.reduce((acc, key, index) => {
      acc[key] = (cols[index] ?? '').trim();
      return acc;
    }, {});
  });
};

export const isPlaceholderRow = (row) => Object.values(row).some((value) => isPlaceholderValue(value));

export const loadTSV = async (path, { required = true } = {}) => {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to load ${path}`);
    const rows = parseTSV(await response.text());
    return rows.filter((row) => !isPlaceholderRow(row));
  } catch (error) {
    if (!required) {
      console.warn(`[cv] optional TSV not loaded: ${path}`, error);
      return [];
    }
    throw error;
  }
};

export const loadAllTSV = async () => {
  const pairs = await Promise.all(
    DATA_SOURCES.map(async (source) => [source.key, await loadTSV(source.path, { required: source.required })])
  );
  return Object.fromEntries(pairs);
};

export const buildMarkdownFragment = (value = '') => {
  const source = String(value);
  const fragment = document.createDocumentFragment();
  const pattern = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match = null;

  while ((match = pattern.exec(source)) !== null) {
    if (match.index > lastIndex) {
      fragment.append(document.createTextNode(source.slice(lastIndex, match.index)));
    }

    const strong = document.createElement('strong');
    strong.textContent = match[1];
    fragment.append(strong);
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < source.length) {
    fragment.append(document.createTextNode(source.slice(lastIndex)));
  }

  return fragment;
};

export const createAnchor = (label, href) => {
  if (!hasText(label) || !hasText(href)) return null;

  const a = document.createElement('a');
  a.textContent = label;
  a.href = href;

  if (isHttpLink(href)) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }

  return a;
};

export const toLabelKey = (value = '') => String(value).trim().toLowerCase();

export const sortRowsByLabelOrder = (rows, field, order) => {
  const orderMap = new Map(order.map((key, index) => [toLabelKey(key), index]));
  return [...rows].sort((a, b) => {
    const aOrder = orderMap.get(toLabelKey(a[field])) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = orderMap.get(toLabelKey(b[field])) ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return toLabelKey(a[field]).localeCompare(toLabelKey(b[field]));
  });
};

export const createIconImage = (src, className, { onError } = {}) => {
  if (!hasText(src)) return null;
  const icon = document.createElement('img');
  icon.className = className;
  icon.src = src;
  icon.alt = '';
  icon.width = 16;
  icon.height = 16;
  icon.setAttribute('aria-hidden', 'true');
  icon.loading = 'lazy';
  icon.decoding = 'async';
  icon.addEventListener('error', () => {
    if (typeof onError === 'function') onError();
    icon.remove();
  });
  return icon;
};

export const appendAnchorIcon = (anchor, iconPath, className) => {
  if (!anchor || !hasText(iconPath)) return;
  const icon = createIconImage(iconPath, className);
  if (icon) anchor.prepend(icon);
};

export const parseYearMonthScore = (value = '') => {
  const normalized = String(value).trim();
  if (!normalized) return -1;

  const direct = normalized.match(/^(\d{4})(?:[.-](\d{1,2}))?$/);
  if (direct) {
    const year = Number(direct[1]);
    const month = direct[2] ? Math.min(Math.max(Number(direct[2]), 1), 12) : 12;
    return (year * 100) + month;
  }

  const loose = normalized.match(/(\d{4})/);
  if (!loose) return -1;
  return (Number(loose[1]) * 100) + 12;
};
