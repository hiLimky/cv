import {
  CONTACT_LABEL_ORDER
} from './config.js';
import {
  appendEducationNote,
  appendOrganization,
  buildHeroLinks,
  createContactIconElement,
  createInstitutionMarks,
  classifyAward,
  isShortEducationNote,
  normalizeEducationNote,
  profileFromRows,
  sortAwardsNewestFirst,
  sortPublicationsNewestFirst
} from './domain.js';
import {
  buildMarkdownFragment,
  createAnchor,
  hasText,
  isPlaceholderValue,
  appendAnchorIcon,
  toLabelKey,
  sortRowsByLabelOrder,
  toSafeHref,
  toSafeImageSrc
} from './utils.js';

const appendMarkdownText = (element, value = '') => {
  if (!element) return;
  element.replaceChildren();
  element.append(buildMarkdownFragment(value));
};

const toSlug = (value = '') => String(value)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '') || 'entry';
const toPlainText = (value = '') => String(value).replace(/\*\*/g, '').trim();
const getRelationKey = (row = {}) => String(row.relation_key || row.relationKey || '').trim();

const getExperienceEntryLabel = (row, relationKey, titleText) => {
  if (relationKey === 'studio-bbb' && hasText(row.org)) return row.org;
  return titleText;
};

const setEntryMeta = (element, { relationKey = '', entryLabel = '' } = {}) => {
  if (!element) return;
  if (hasText(relationKey)) element.dataset.relationKey = relationKey;
  if (hasText(entryLabel)) element.dataset.entryLabel = entryLabel;
};

const appendCrossLink = (container, label, targetId, text) => {
  if (!container || !hasText(label) || !hasText(targetId)) return;
  const href = `#${targetId}`;
  const anchor = createAnchor(label, href);
  if (!anchor) return;

  const line = document.createElement('p');
  line.className = 'cross-link';
  line.append(document.createTextNode(text));
  line.append(anchor);
  container.append(line);
};

const indexByRelationKey = (elements) => {
  const relationIndex = new Map();
  Array.from(elements).forEach((element) => {
    const key = String(element.dataset.relationKey || '').trim();
    if (key && !relationIndex.has(key)) relationIndex.set(key, element);
  });
  return relationIndex;
};

const queryRelationIndex = (selector) => indexByRelationKey(document.querySelectorAll(selector));

export const renderStaticMeta = () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const lastUpdatedEl = document.getElementById('last-updated');
  if (lastUpdatedEl) {
    lastUpdatedEl.textContent = `Last updated: ${new Date().toISOString().slice(0, 10)}`;
  }
};

export const hydrateProfile = (rows) => {
  const profile = profileFromRows(rows);
  const heroName = document.getElementById('hero-name');
  const heroTitle = document.getElementById('hero-title');
  const heroSummary = document.getElementById('hero-summary');
  const footerName = document.getElementById('footer-name');
  const profileImage = document.querySelector('.profile-pic');

  if (heroName) {
    heroName.replaceChildren();
    heroName.append(document.createTextNode(profile.name || ''));
    if (hasText(profile.name_native)) {
      const nativeName = document.createElement('span');
      nativeName.textContent = ` (${profile.name_native})`;
      heroName.append(nativeName);
    }
  }

  if (heroTitle) heroTitle.textContent = profile.title || '';
  appendMarkdownText(heroSummary, profile.summary || '');
  if (profileImage) profileImage.src = toSafeImageSrc(profile.profile_image);
  if (footerName) footerName.textContent = profile.name || '';

  const heroLinks = document.getElementById('hero-links');
  if (heroLinks) {
    heroLinks.replaceChildren();

    const links = buildHeroLinks(profile);

    links.forEach((link) => {
      const anchor = createAnchor(link.label, link.href);
      if (anchor) {
        appendAnchorIcon(anchor, link.icon, 'hero-link-icon');
        heroLinks.append(anchor);
      }
    });

    heroLinks.hidden = links.length === 0;
  }
};

export const renderInterests = (rows) => {
  const list = document.getElementById('interests-list');
  if (!list) return;
  list.replaceChildren();

  rows.forEach((row) => {
    if (!hasText(row.text)) return;
    const item = document.createElement('li');
    item.append(buildMarkdownFragment(row.text));
    list.append(item);
  });
};

export const renderEducation = (rows) => {
  const list = document.getElementById('education-list');
  if (!list) return;
  list.replaceChildren();

  rows.forEach((row) => {
    if (!hasText(row.school)) return;

    const item = document.createElement('li');
    item.className = 'education-item';

    const schoolLine = document.createElement('div');
    schoolLine.className = 'institution-line';
    createInstitutionMarks(row.school).forEach((mark) => schoolLine.append(mark));

    const school = document.createElement('h3');
    school.className = 'education-school';
    school.textContent = row.school;
    schoolLine.append(school);
    item.append(schoolLine);

    if (hasText(row.period)) {
      const period = document.createElement('p');
      period.className = 'meta';
      period.textContent = row.period;
      item.append(period);
    }

    if (hasText(row.degree)) {
      const degree = document.createElement('p');
      degree.className = 'education-degree';
      degree.append(buildMarkdownFragment(row.degree));
      item.append(degree);
    }

    if (hasText(row.note)) {
      const cleanedNote = normalizeEducationNote(row.note);
      if (isShortEducationNote(cleanedNote)) {
        const honor = document.createElement('span');
        honor.className = 'education-honor';
        honor.textContent = cleanedNote;
        item.append(honor);
      } else {
        const note = document.createElement('p');
        note.className = 'education-note';
        appendEducationNote(note, row.note);
        item.append(note);
      }
    }

    list.append(item);
  });
};

export const renderExperience = (rows) => {
  const list = document.getElementById('experience-list');
  if (!list) return;
  list.replaceChildren();

  rows.forEach((row, index) => {
    if (!hasText(row.title) && !hasText(row.org)) return;

    const item = document.createElement('li');
    const hasOrg = hasText(row.org);

    const title = document.createElement('h3');
    const titleText = row.title || row.org || 'Experience';
    item.id = `experience-${index + 1}-${toSlug(titleText)}`;
    const relationKey = getRelationKey(row);
    setEntryMeta(item, {
      relationKey,
      entryLabel: getExperienceEntryLabel(row, relationKey, titleText)
    });

    const link = toSafeHref(row.link);
    if (link) {
      const anchor = createAnchor(titleText, link);
      if (anchor) {
        anchor.className = 'inline-link';
        title.append(anchor);
      } else {
        title.textContent = titleText;
      }
    } else {
      title.textContent = titleText;
    }
    item.append(title);

    const hasPeriod = hasText(row.period);
    if (hasOrg || hasPeriod) {
      const meta = document.createElement('p');
      meta.className = 'meta';
      if (hasOrg) {
        appendOrganization(meta, row.org || '');
      }
      if (hasOrg && hasPeriod) {
        meta.append(document.createTextNode(' · '));
      }
      if (hasPeriod) {
        meta.append(document.createTextNode(row.period));
      }
      item.append(meta);
    }

    if (hasText(row.summary)) {
      const summary = document.createElement('p');
      summary.append(buildMarkdownFragment(row.summary));
      item.append(summary);
    }

    list.append(item);
  });
};

export const renderProjects = (rows) => {
  const list = document.getElementById('projects-list');
  if (!list) return;
  list.replaceChildren();

  rows.forEach((row, index) => {
    if (!hasText(row.title)) return;

    const project = document.createElement('article');
    project.className = 'card project reveal';
    project.id = `project-${index + 1}-${toSlug(row.title)}`;
    const relationKey = getRelationKey(row);
    setEntryMeta(project, { relationKey, entryLabel: row.title });

    const image = document.createElement('img');
    image.src = toSafeImageSrc(row.image);
    image.alt = `${row.title} thumbnail`;
    project.append(image);

    const body = document.createElement('div');

    const title = document.createElement('h3');
    const link = toSafeHref(row.link);
    if (link) {
      const anchor = createAnchor(row.title, link);
      if (anchor) {
        anchor.className = 'project-title-link';
        title.append(anchor);
      } else {
        title.textContent = row.title;
      }
    } else {
      title.textContent = row.title;
    }
    body.append(title);

    const hasRole = hasText(row.role);
    const hasPeriod = hasText(row.period);
    if (hasRole || hasPeriod) {
      const meta = document.createElement('p');
      meta.className = 'meta';
      meta.textContent = `${row.role || ''}${hasRole && hasPeriod ? ' · ' : ''}${row.period || ''}`;
      body.append(meta);
    }

    if (hasText(row.summary)) {
      const summary = document.createElement('p');
      summary.append(buildMarkdownFragment(row.summary));
      body.append(summary);
    }

    const tagList = (row.tags || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0 && !isPlaceholderValue(tag));

    if (tagList.length > 0) {
      const tags = document.createElement('div');
      tags.className = 'tags';
      tagList.forEach((tag) => {
        const chip = document.createElement('span');
        chip.textContent = tag;
        tags.append(chip);
      });
      body.append(tags);
    }

    project.append(body);
    list.append(project);
  });
};

export const linkRelatedEntries = () => {
  document.querySelectorAll('.cross-link').forEach((el) => el.remove());

  const projectByKey = queryRelationIndex('#projects-list .project[data-relation-key]');
  const experienceByKey = queryRelationIndex('#experience-list > li[data-relation-key]');
  const publicationByKey = queryRelationIndex('#publications-list > li[data-relation-key]');
  const awardByKey = queryRelationIndex('#awards-list .award-item[data-relation-key]');
  if ([projectByKey, experienceByKey, publicationByKey, awardByKey].every((map) => map.size === 0)) return;

  projectByKey.forEach((project, key) => {
    const experience = experienceByKey.get(key);
    if (!experience) return;

    const projectLabel = project.dataset.entryLabel || 'Project';
    const experienceLabel = experience.dataset.entryLabel || 'Experience';
    appendCrossLink(experience, projectLabel, project.id, 'Related project: ');

    const projectBody = project.querySelector('div') || project;
    appendCrossLink(projectBody, experienceLabel, experience.id, 'Related experience: ');
  });

  experienceByKey.forEach((experience, key) => {
    const publication = publicationByKey.get(key);
    const award = awardByKey.get(key);
    if (!publication && !award) return;

    if (publication) {
      const publicationLabel = publication.dataset.entryLabel || 'Publication';
      appendCrossLink(experience, publicationLabel, publication.id, 'Related publication: ');
    }
    if (award) {
      const awardLabel = award.dataset.entryLabel || 'Award';
      appendCrossLink(experience, awardLabel, award.id, 'Related award: ');
    }
  });

  awardByKey.forEach((award, key) => {
    const experience = experienceByKey.get(key);
    if (!experience) return;
    const experienceLabel = experience.dataset.entryLabel || 'Experience';
    appendCrossLink(award, experienceLabel, experience.id, 'Related experience: ');
  });
};

export const renderPublications = (rows) => {
  const list = document.getElementById('publications-list');
  if (!list) return;
  list.replaceChildren();

  const sortedRows = sortPublicationsNewestFirst(rows);
  const projectByRelationKey = queryRelationIndex('#projects-list .project[id][data-entry-label][data-relation-key]');

  sortedRows.forEach((row, index) => {
    if (!hasText(row.title)) return;

    const item = document.createElement('li');
    item.id = `publication-${index + 1}-${toSlug(toPlainText(row.title))}`;
    const relationKey = getRelationKey(row);
    setEntryMeta(item, {
      relationKey,
      entryLabel: hasText(row.venue)
        ? `${row.venue}${hasText(row.year) ? ` (${row.year})` : ''}`
        : 'Publication'
    });

    const title = document.createElement('span');
    title.append(buildMarkdownFragment(row.title));
    item.append(title);

    const venue = hasText(row.venue) ? row.venue : '';
    const year = hasText(row.year) ? row.year : '';
    if (venue || year) {
      item.append(document.createTextNode(` — ${venue}${venue && year ? ' ' : ''}${year ? `(${year})` : ''}`));
    }

    const link = toSafeHref(row.link);
    if (link) {
      item.append(document.createTextNode(', '));
      const anchor = createAnchor('link', link);
      if (anchor) item.append(anchor);
    }

    const relatedProject = relationKey ? projectByRelationKey.get(relationKey) : null;
    if (relatedProject) {
      item.append(document.createTextNode(', project: '));
      const projectLabel = relatedProject.dataset.entryLabel || 'project';
      const projectAnchor = createAnchor(projectLabel, `#${relatedProject.id}`);
      if (projectAnchor) {
        projectAnchor.className = 'inline-link';
        item.append(projectAnchor);
      } else {
        item.append(document.createTextNode(projectLabel));
      }
    }

    list.append(item);
  });
};

export const renderAwards = (rows) => {
  const root = document.getElementById('awards-list');
  if (!root) return;
  root.replaceChildren();

  const grouped = rows.reduce((acc, row) => {
    if (!hasText(row.award)) return acc;
    const key = classifyAward(row);
    acc[key].push(row);
    return acc;
  }, { game: [], academic: [] });

  const sections = [
    { key: 'game', title: 'Game / Industry Awards' },
    { key: 'academic', title: 'Academic / Research Awards' }
  ];

  let awardSeq = 0;
  sections.forEach((sectionData) => {
    const items = grouped[sectionData.key];
    if (!items || items.length === 0) return;
    const sortedItems = sortAwardsNewestFirst(items);

    const section = document.createElement('section');
    section.className = 'award-group';

    const heading = document.createElement('h3');
    heading.className = 'award-heading';
    heading.textContent = sectionData.title;
    section.append(heading);

    const list = document.createElement('ul');
    list.className = 'award-group-list';

    sortedItems.forEach((row) => {
      awardSeq += 1;
      const item = document.createElement('li');
      item.className = 'award-item';
      item.id = `award-${awardSeq}-${toSlug(row.award)}`;
      const relationKey = getRelationKey(row);
      setEntryMeta(item, { relationKey, entryLabel: row.award || 'Award' });

      const award = document.createElement('strong');
      award.textContent = row.award;
      item.append(award);

      const org = hasText(row.org) ? row.org : '';
      const year = hasText(row.year) ? row.year : '';
      if (org || year) {
        item.append(document.createTextNode(` · ${org}${org && year ? ' · ' : ''}${year}`));
      }

      list.append(item);
    });

    section.append(list);
    root.append(section);
  });
};

export const renderContacts = (rows) => {
  const root = document.getElementById('contact-list');
  if (!root) return;
  root.replaceChildren();

  const list = document.createElement('ul');
  list.className = 'contact-rows';

  const sortedRows = sortRowsByLabelOrder(rows, 'label', CONTACT_LABEL_ORDER);

  sortedRows.forEach((row) => {
    if (!hasText(row.label) || !hasText(row.value)) return;
    if (toLabelKey(row.label) === 'cv') return;

    const item = document.createElement('li');
    item.className = 'contact-row';
    item.append(createContactIconElement(row.label));

    const label = document.createElement('span');
    label.className = 'contact-label';
    label.textContent = `${row.label}:`;
    item.append(label);

    const value = document.createElement('span');
    value.className = 'contact-value';

    const link = toSafeHref(row.link);
    if (link) {
      const anchor = createAnchor(row.value, link);
      if (anchor) {
        value.append(anchor);
      } else {
        value.textContent = row.value;
      }
    } else {
      value.textContent = row.value;
    }

    item.append(value);
    list.append(item);
  });

  root.append(list);
};
