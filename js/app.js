import { mergeExperienceRows } from './domain.js';
import {
  hydrateProfile,
  linkRelatedEntries,
  renderAwards,
  renderContacts,
  renderEducation,
  renderExperience,
  renderInterests,
  renderProjects,
  renderPublications,
  renderStaticMeta
} from './renderers.js';
import { initCardTilt, initCursorGlow, initNavState, initReveal, initScrollProgress } from './ui.js';
import { loadAllTSV } from './utils.js';

export const boot = async () => {
  renderStaticMeta();

  try {
    const data = await loadAllTSV();
    const {
      profile,
      interests,
      education,
      experience,
      additionalExperience,
      projects,
      publications,
      awards,
      contacts
    } = data;

    const mergedExperience = mergeExperienceRows(experience, additionalExperience);

    hydrateProfile(profile);
    renderInterests(interests);
    renderEducation(education);
    renderExperience(mergedExperience);
    renderProjects(projects);
    renderPublications(publications);
    renderAwards(awards);
    renderContacts(contacts);
    linkRelatedEntries();

    initReveal();
    initNavState();
    initScrollProgress();
    initCardTilt();
    initCursorGlow();
  } catch (error) {
    console.error(error);
    const heroName = document.getElementById('hero-name');
    const heroSummary = document.getElementById('hero-summary');
    if (heroName) heroName.textContent = 'Failed to load CV data';
    if (heroSummary) {
      heroSummary.textContent = 'Run this site via a local/server URL (not file://) and check console/network paths.';
    }
  }
};
