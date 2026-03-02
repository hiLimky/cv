import {
  ACADEMIC_AWARD_KEYWORDS,
  CONTACT_ICON_MAP,
  DXP_LAB_URL,
  GAME_AWARD_KEYWORDS,
  HERO_LINK_SPECS,
  INSTITUTION_LOGOS,
  ORGANIZATION_LINKS
} from './config.js';
import {
  buildMarkdownFragment,
  createAnchor,
  createIconImage,
  hasText,
  includesDXPLab,
  parseYearMonthScore,
  toLabelKey,
  toSafeHref,
  toSafeMailto
} from './utils.js';

export const getContactIconSpec = (label = '') => CONTACT_ICON_MAP[toLabelKey(label)] || CONTACT_ICON_MAP.default;

export const createContactIconElement = (label = '') => {
  const icon = document.createElement('span');
  icon.className = 'contact-icon';
  icon.setAttribute('aria-hidden', 'true');

  const iconSpec = getContactIconSpec(label);
  if (iconSpec.icon) {
    const fallbackEmoji = iconSpec.emoji || CONTACT_ICON_MAP.default.emoji;
    const iconImg = createIconImage(iconSpec.icon, 'contact-icon-img', {
      onError: () => {
        icon.textContent = fallbackEmoji;
      }
    });
    if (iconImg) {
      icon.append(iconImg);
      return icon;
    }
  }

  icon.textContent = iconSpec.emoji || CONTACT_ICON_MAP.default.emoji;
  return icon;
};

const toHeroHref = (spec, profile) => {
  if (spec.type === 'email') return toSafeMailto(profile[spec.key]);
  return toSafeHref(profile[spec.key]);
};

export const buildHeroLinks = (profile) => HERO_LINK_SPECS
  .map((spec) => ({ ...spec, href: toHeroHref(spec, profile) }))
  .filter((spec) => hasText(spec.href));

export const getOrganizationHref = (org = '') => {
  const source = String(org).trim();
  if (!source) return '';

  if (includesDXPLab(source)) return DXP_LAB_URL;
  const matched = ORGANIZATION_LINKS.find((item) => item.pattern.test(source));
  return matched ? matched.href : '';
};

const getInstitutionLogos = (value = '') => {
  const source = String(value).toLowerCase();
  return INSTITUTION_LOGOS
    .map((item, order) => ({ item, order, index: source.indexOf(item.key) }))
    .filter((entry) => entry.index >= 0)
    .sort((a, b) => a.index - b.index || a.order - b.order)
    .map((entry) => entry.item);
};

const createInstitutionMark = (logo) => {
  if (!logo) return null;

  const img = document.createElement('img');
  img.className = 'institution-logo';
  img.src = logo.src;
  img.alt = '';
  img.setAttribute('aria-hidden', 'true');
  img.loading = 'lazy';
  img.decoding = 'async';
  img.title = logo.name;
  return img;
};

export const createInstitutionMarks = (value = '') => getInstitutionLogos(value)
  .map((logo) => createInstitutionMark(logo))
  .filter(Boolean);

export const appendInstitutionMarks = (element, value = '', wrapperClass = 'institution-inline') => {
  if (!element) return;
  const marks = createInstitutionMarks(value);
  if (marks.length === 0) return;

  const wrapper = document.createElement('span');
  wrapper.className = wrapperClass;
  marks.forEach((mark) => wrapper.append(mark));
  element.append(wrapper);
};

export const appendOrganization = (element, org = '') => {
  if (!element || !hasText(org)) return;

  appendInstitutionMarks(element, org, 'institution-inline');

  const orgHref = toSafeHref(getOrganizationHref(org));
  if (orgHref) {
    const linkedOrg = createAnchor(org, orgHref);
    if (linkedOrg) {
      linkedOrg.className = 'org-link';
      element.append(linkedOrg);
      return;
    }
  }

  element.append(document.createTextNode(org));
};

export const normalizeEducationNote = (note = '') => String(note).replace(/\s*\(dxp\.korea\.ac\.kr\)\.?/i, '').trim();

export const appendEducationNote = (element, note = '') => {
  if (!element || !hasText(note)) return;
  const normalized = normalizeEducationNote(note);
  const marker = 'Digital eXPerience Lab (DXP Lab)';
  const markerIndex = normalized.toLowerCase().indexOf(marker.toLowerCase());

  if (markerIndex < 0) {
    element.append(buildMarkdownFragment(normalized));
    return;
  }

  const before = normalized.slice(0, markerIndex);
  const after = normalized.slice(markerIndex + marker.length);

  if (before) element.append(buildMarkdownFragment(before));

  const link = createAnchor(marker, DXP_LAB_URL);
  if (link) {
    link.className = 'inline-link';
    element.append(link);
  } else {
    element.append(document.createTextNode(marker));
  }

  if (after) element.append(buildMarkdownFragment(after));
};

export const isShortEducationNote = (note = '') => {
  const text = String(note).trim();
  if (!text) return false;
  return text.length <= 24 && !/[.,;:]/.test(text);
};

const MONTH_MAP = Object.freeze({
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12
});

const toPeriodScore = (token = '', { preferEnd = false } = {}) => {
  const source = String(token)
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .trim();

  if (!source) return -1;
  if (/present|current|now/.test(source)) return 999912;

  const monthYear = source.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s./-]*(\d{4})\b/);
  if (monthYear) {
    const month = MONTH_MAP[monthYear[1].slice(0, 3)] || 1;
    return (Number(monthYear[2]) * 100) + month;
  }

  const yearMonth = source.match(/\b((?:19|20)\d{2})(?:\s*[./-]\s*(\d{1,2}))?\b/);
  if (yearMonth) {
    const year = Number(yearMonth[1]);
    const month = yearMonth[2] ? Math.min(Math.max(Number(yearMonth[2]), 1), 12) : (preferEnd ? 12 : 1);
    return (year * 100) + month;
  }

  return -1;
};

const parsePeriodRange = (period = '') => {
  const normalized = String(period).replace(/[–—]/g, '-');
  const parts = normalized.split('-').map((part) => part.trim()).filter(Boolean);

  if (parts.length === 0) return { start: -1, end: -1 };
  if (parts.length === 1) {
    const point = toPeriodScore(parts[0], { preferEnd: true });
    return { start: point, end: point };
  }

  const start = toPeriodScore(parts[0], { preferEnd: false });
  const parsedEnd = toPeriodScore(parts[parts.length - 1], { preferEnd: true });
  const end = parsedEnd >= 0 ? parsedEnd : start;
  return { start, end };
};

export const mergeExperienceRows = (experienceRows, additionalRows) => {
  const mainRows = experienceRows.map((row, index) => ({
    title: row.role || '',
    org: row.org || '',
    period: row.period || '',
    summary: row.summary || '',
    relationKey: row.relation_key || '',
    link: '',
    source: 'main',
    index
  }));

  const extraRows = additionalRows.map((row, index) => ({
    title: row.title || row.org || '',
    org: row.org || '',
    period: row.period || '',
    summary: row.summary || '',
    relationKey: row.relation_key || '',
    link: row.link || '',
    source: 'extra',
    index
  }));

  return [...mainRows, ...extraRows]
    .filter((row) => hasText(row.title) || hasText(row.org))
    .sort((a, b) => {
      const aRange = parsePeriodRange(a.period);
      const bRange = parsePeriodRange(b.period);

      const endDiff = bRange.end - aRange.end;
      if (endDiff !== 0) return endDiff;

      const startDiff = bRange.start - aRange.start;
      if (startDiff !== 0) return startDiff;
      if (a.source !== b.source) return a.source === 'main' ? -1 : 1;
      return a.index - b.index;
    });
};

export const classifyAward = (row) => {
  const haystack = `${row.award || ''} ${row.org || ''}`.toLowerCase();
  if (ACADEMIC_AWARD_KEYWORDS.some((keyword) => haystack.includes(keyword))) return 'academic';
  if (GAME_AWARD_KEYWORDS.some((keyword) => haystack.includes(keyword))) return 'game';
  return 'game';
};

export const profileFromRows = (rows) => rows.reduce((acc, row) => {
  if (!hasText(row.key)) return acc;
  acc[row.key.trim()] = String(row.value ?? '').trim();
  return acc;
}, {});

export const sortPublicationsNewestFirst = (rows) => [...rows].sort((a, b) => {
  const dateDiff = parseYearMonthScore(b.year) - parseYearMonthScore(a.year);
  if (dateDiff !== 0) return dateDiff;

  const bVenueYear = parseYearMonthScore(b.venue);
  const aVenueYear = parseYearMonthScore(a.venue);
  const venueDiff = bVenueYear - aVenueYear;
  if (venueDiff !== 0) return venueDiff;

  return (a.title || '').localeCompare((b.title || ''));
});

export const sortAwardsNewestFirst = (rows) => [...rows].sort((a, b) => {
  const dateDiff = parseYearMonthScore(b.year) - parseYearMonthScore(a.year);
  if (dateDiff !== 0) return dateDiff;

  const orgDiff = (a.org || '').localeCompare(b.org || '');
  if (orgDiff !== 0) return orgDiff;

  return (a.award || '').localeCompare((b.award || ''));
});
