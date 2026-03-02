#!/usr/bin/env node

import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');

const FILE_RULES = [
  {
    key: 'profile',
    file: 'profile.tsv',
    requiredHeaders: ['key', 'value'],
    requiredRowFields: ['key']
  },
  {
    key: 'contact',
    file: 'contact.tsv',
    requiredHeaders: ['label', 'value', 'link'],
    requiredRowFields: ['label', 'value']
  },
  {
    key: 'education',
    file: 'education.tsv',
    requiredHeaders: ['school', 'degree', 'period', 'note'],
    requiredRowFields: ['school', 'degree', 'period']
  },
  {
    key: 'interests',
    file: 'interests.tsv',
    requiredHeaders: ['text'],
    requiredRowFields: ['text']
  },
  {
    key: 'experience',
    file: 'experience.tsv',
    requiredHeaders: ['role', 'org', 'period', 'summary', 'relation_key'],
    requiredRowFields: ['role', 'org', 'period']
  },
  {
    key: 'additionalExperience',
    file: 'additional_experience.tsv',
    requiredHeaders: ['title', 'org', 'period', 'summary', 'link', 'relation_key'],
    requiredRowFields: ['title', 'org', 'period']
  },
  {
    key: 'projects',
    file: 'projects.tsv',
    requiredHeaders: ['title', 'role', 'period', 'image', 'summary', 'tags', 'link', 'relation_key'],
    requiredRowFields: ['title', 'role', 'period']
  },
  {
    key: 'publications',
    file: 'publications.tsv',
    requiredHeaders: ['title', 'venue', 'year', 'link', 'relation_key'],
    requiredRowFields: ['title', 'venue', 'year']
  },
  {
    key: 'awards',
    file: 'awards.tsv',
    requiredHeaders: ['award', 'org', 'year', 'relation_key'],
    requiredRowFields: ['award', 'org', 'year']
  }
];

const PERIOD_PATTERN = /^\d{4}(?:\.\d{2})?(?:\s*[–-]\s*(?:\d{4}(?:\.\d{2})?|Present(?:\s*\([^)]*\))?))?$/i;
const YEAR_MONTH_PATTERN = /^\d{4}(?:\.\d{2})?$/;
const HTTP_LINK_PATTERN = /^https?:\/\//i;
const MAILTO_PATTERN = /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const LOCAL_IMAGE_PATTERN = /^(?!.*:\/\/)(?!javascript:)(?!data:)[a-zA-Z0-9._/-]+$/;

const hasText = (value = '') => String(value).trim().length > 0;
const toText = (value = '') => String(value ?? '').trim();
const toKey = (value = '') => String(value).trim().toLowerCase();
const isPlaceholderValue = (value = '') => toText(value).startsWith('[');

const parseTSV = (text = '') => {
  const lines = String(text)
    .split(/\r?\n/)
    .map((line) => line.replace(/\r$/, ''))
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0]
    .replace(/^\uFEFF/, '')
    .split('\t')
    .map((header) => header.trim());

  const rows = lines.slice(1).map((line, index) => {
    const cols = line.split('\t');
    const row = headers.reduce((acc, key, headerIndex) => {
      acc[key] = toText(cols[headerIndex] ?? '');
      return acc;
    }, {});

    return {
      ...row,
      __line: index + 2,
      __rawColumnCount: cols.length
    };
  });

  return { headers, rows };
};

const isSafeLink = (value = '') => HTTP_LINK_PATTERN.test(toText(value)) || MAILTO_PATTERN.test(toText(value));
const isLocalAssetPath = (value = '') => {
  const text = toText(value);
  return hasText(text) && !HTTP_LINK_PATTERN.test(text) && LOCAL_IMAGE_PATTERN.test(text);
};

const collectRelationKeys = (rows = []) => rows
  .map((row) => toText(row.relation_key))
  .filter((value) => hasText(value));

const createReporter = () => {
  const warnings = [];
  const errors = [];

  return {
    warnings,
    errors,
    warn: (message) => warnings.push(message),
    error: (message) => errors.push(message)
  };
};

const checkHeaders = (rule, table, report) => {
  rule.requiredHeaders.forEach((header) => {
    if (!table.headers.includes(header)) {
      report.error(`[${rule.file}] Missing required header: "${header}"`);
    }
  });
};

const checkRows = (rule, table, report) => {
  const expectedColumnCount = table.headers.length;

  table.rows.forEach((row) => {
    if (row.__rawColumnCount > expectedColumnCount) {
      report.warn(
        `[${rule.file}:${row.__line}] Row has extra columns (${row.__rawColumnCount} > ${expectedColumnCount}).`
      );
    }

    if (Object.values(row).some((value) => isPlaceholderValue(value))) {
      report.warn(`[${rule.file}:${row.__line}] Placeholder-like value detected.`);
    }

    rule.requiredRowFields.forEach((field) => {
      if (!hasText(row[field])) {
        report.error(`[${rule.file}:${row.__line}] Required field "${field}" is empty.`);
      }
    });
  });
};

const checkPeriodFormats = (tables, report) => {
  [
    ['education', 'period', 'education.tsv'],
    ['experience', 'period', 'experience.tsv'],
    ['additionalExperience', 'period', 'additional_experience.tsv'],
    ['projects', 'period', 'projects.tsv']
  ].forEach(([tableKey, field, file]) => {
    const table = tables[tableKey];
    if (!table) return;
    table.rows.forEach((row) => {
      const value = toText(row[field]);
      if (value && !PERIOD_PATTERN.test(value)) {
        report.warn(`[${file}:${row.__line}] Unusual period format: "${value}"`);
      }
    });
  });
};

const checkYearFormats = (tables, report) => {
  [
    ['publications', 'year', 'publications.tsv'],
    ['awards', 'year', 'awards.tsv']
  ].forEach(([tableKey, field, file]) => {
    const table = tables[tableKey];
    if (!table) return;
    table.rows.forEach((row) => {
      const value = toText(row[field]);
      if (value && !YEAR_MONTH_PATTERN.test(value)) {
        report.warn(`[${file}:${row.__line}] Unusual year format: "${value}"`);
      }
    });
  });
};

const checkLinks = (tables, report) => {
  const profileTable = tables.profile;
  if (profileTable) {
    profileTable.rows.forEach((row) => {
      if (!['linkedin', 'facebook', 'portfolio', 'github'].includes(toKey(row.key))) return;
      const value = toText(row.value);
      if (value && !HTTP_LINK_PATTERN.test(value)) {
        report.warn(`[profile.tsv:${row.__line}] Profile link is not http(s): "${value}"`);
      }
    });
  }

  const contactTable = tables.contact;
  if (contactTable) {
    contactTable.rows.forEach((row) => {
      const value = toText(row.link);
      if (value && !isSafeLink(value)) {
        report.warn(`[contact.tsv:${row.__line}] Contact link is invalid: "${value}"`);
      }
    });
  }

  const additionalExperienceTable = tables.additionalExperience;
  if (additionalExperienceTable) {
    additionalExperienceTable.rows.forEach((row) => {
      const value = toText(row.link);
      if (value && !HTTP_LINK_PATTERN.test(value)) {
        report.warn(`[additional_experience.tsv:${row.__line}] Link is not http(s): "${value}"`);
      }
    });
  }

  const projectsTable = tables.projects;
  if (projectsTable) {
    projectsTable.rows.forEach((row) => {
      const link = toText(row.link);
      if (link && !HTTP_LINK_PATTERN.test(link)) {
        report.warn(`[projects.tsv:${row.__line}] Project link is not http(s): "${link}"`);
      }

      const image = toText(row.image);
      if (image && !HTTP_LINK_PATTERN.test(image) && !LOCAL_IMAGE_PATTERN.test(image)) {
        report.warn(`[projects.tsv:${row.__line}] Project image path looks unsafe: "${image}"`);
      }
    });
  }

  const publicationsTable = tables.publications;
  if (publicationsTable) {
    publicationsTable.rows.forEach((row) => {
      const value = toText(row.link);
      if (value && !HTTP_LINK_PATTERN.test(value)) {
        report.warn(`[publications.tsv:${row.__line}] Publication link is not http(s): "${value}"`);
      }
    });
  }
};

const checkLocalAssets = async (tables, report) => {
  const profileTable = tables.profile;
  if (profileTable) {
    const profileImageRow = profileTable.rows.find((row) => toKey(row.key) === 'profile_image');
    const profileImage = toText(profileImageRow?.value);
    if (isLocalAssetPath(profileImage)) {
      const profileImagePath = path.join(ROOT_DIR, profileImage);
      try {
        await access(profileImagePath);
      } catch {
        report.error(`[profile.tsv:${profileImageRow.__line}] Missing local profile image: "${profileImage}"`);
      }
    }
  }

  const projectsTable = tables.projects;
  if (!projectsTable) return;

  for (const row of projectsTable.rows) {
    const image = toText(row.image);
    if (!isLocalAssetPath(image)) continue;
    const imagePath = path.join(ROOT_DIR, image);
    try {
      await access(imagePath);
    } catch {
      report.error(`[projects.tsv:${row.__line}] Missing local image asset: "${image}"`);
    }
  }
};

const checkProfileContactConsistency = (tables, report) => {
  const profileTable = tables.profile;
  const contactTable = tables.contact;
  if (!profileTable || !contactTable) return;

  const profileByKey = new Map(
    profileTable.rows.map((row) => [toKey(row.key), toText(row.value)])
  );
  const contactByLabel = new Map(
    contactTable.rows.map((row) => [toKey(row.label), toText(row.value)])
  );

  const pairs = [
    ['email', 'email'],
    ['linkedin', 'linkedin'],
    ['facebook', 'facebook'],
    ['portfolio', 'website'],
    ['location', 'location']
  ];

  pairs.forEach(([profileKey, contactLabel]) => {
    const profileValue = toText(profileByKey.get(profileKey));
    const contactValue = toText(contactByLabel.get(contactLabel));

    if (!profileValue || !contactValue) return;
    if (profileValue !== contactValue) {
      report.warn(
        `[profile/contact] "${profileKey}" and "${contactLabel}" mismatch: "${profileValue}" vs "${contactValue}"`
      );
    }
  });
};

const checkRelationKeyConsistency = (tables, report) => {
  const keysByType = {
    project: new Set(collectRelationKeys(tables.projects?.rows || [])),
    experience: new Set([
      ...collectRelationKeys(tables.experience?.rows || []),
      ...collectRelationKeys(tables.additionalExperience?.rows || [])
    ]),
    publication: new Set(collectRelationKeys(tables.publications?.rows || [])),
    award: new Set(collectRelationKeys(tables.awards?.rows || []))
  };

  const allKeys = new Set([
    ...keysByType.project,
    ...keysByType.experience,
    ...keysByType.publication,
    ...keysByType.award
  ]);

  allKeys.forEach((key) => {
    const usedIn = Object.entries(keysByType)
      .filter(([, keySet]) => keySet.has(key))
      .map(([type]) => type);

    if (usedIn.length < 2) {
      report.warn(`[relation_key:${key}] Appears in only one dataset: ${usedIn.join(', ')}`);
    }

    if (keysByType.award.has(key) && !keysByType.experience.has(key)) {
      report.warn(`[relation_key:${key}] Used in awards but missing from experience datasets.`);
    }
  });
};

const loadTables = async () => {
  const entries = await Promise.all(
    FILE_RULES.map(async (rule) => {
      const filePath = path.join(DATA_DIR, rule.file);
      const raw = await readFile(filePath, 'utf8');
      return [rule.key, parseTSV(raw)];
    })
  );
  return Object.fromEntries(entries);
};

const run = async () => {
  const report = createReporter();
  const tables = await loadTables();

  FILE_RULES.forEach((rule) => {
    const table = tables[rule.key];
    if (!table) {
      report.error(`[${rule.file}] Table failed to load.`);
      return;
    }

    checkHeaders(rule, table, report);
    checkRows(rule, table, report);
  });

  checkPeriodFormats(tables, report);
  checkYearFormats(tables, report);
  checkLinks(tables, report);
  await checkLocalAssets(tables, report);
  checkProfileContactConsistency(tables, report);
  checkRelationKeyConsistency(tables, report);

  if (report.errors.length > 0) {
    console.log('Data consistency check: FAIL');
    report.errors.forEach((message) => console.log(`ERROR: ${message}`));
    if (report.warnings.length > 0) {
      report.warnings.forEach((message) => console.log(`WARN: ${message}`));
    }
    process.exitCode = 1;
    return;
  }

  if (report.warnings.length > 0) {
    console.log('Data consistency check: PASS (with warnings)');
    report.warnings.forEach((message) => console.log(`WARN: ${message}`));
    return;
  }

  console.log('Data consistency check: PASS');
};

run().catch((error) => {
  console.error('Data consistency check: ERROR');
  console.error(error);
  process.exitCode = 1;
});
