export const DXP_LAB_URL = 'https://dxp.korea.ac.kr';
export const DEFAULT_IMAGE_SRC = 'image7.png';

export const DATA_SOURCES = Object.freeze([
  { key: 'profile', path: 'data/profile.tsv', required: true },
  { key: 'interests', path: 'data/interests.tsv', required: true },
  { key: 'education', path: 'data/education.tsv', required: true },
  { key: 'experience', path: 'data/experience.tsv', required: true },
  { key: 'additionalExperience', path: 'data/additional_experience.tsv', required: false },
  { key: 'projects', path: 'data/projects.tsv', required: true },
  { key: 'publications', path: 'data/publications.tsv', required: true },
  { key: 'awards', path: 'data/awards.tsv', required: true },
  { key: 'contacts', path: 'data/contact.tsv', required: true }
]);

export const HERO_LINK_SPECS = Object.freeze([
  { key: 'linkedin', label: 'LinkedIn', type: 'url', icon: 'assets/icons/linkedin.svg' },
  { key: 'facebook', label: 'Facebook', type: 'url', icon: 'assets/icons/facebook.svg' },
  { key: 'portfolio', label: 'Website', type: 'url', icon: 'assets/icons/website.svg' },
  { key: 'email', label: 'Email', type: 'email', icon: 'assets/icons/email.svg' }
]);

export const CONTACT_LABEL_ORDER = Object.freeze([
  'email',
  'work email',
  'linkedin',
  'facebook',
  'website',
  'phone',
  'location',
  'cv'
]);

export const CONTACT_ICON_MAP = Object.freeze({
  email: { icon: 'assets/icons/email.svg', emoji: '✉️' },
  'work email': { icon: 'assets/icons/email.svg', emoji: '✉️' },
  linkedin: { icon: 'assets/icons/linkedin.svg', emoji: 'in' },
  facebook: { icon: 'assets/icons/facebook.svg', emoji: 'f' },
  website: { icon: 'assets/icons/website.svg', emoji: '🌐' },
  phone: { emoji: '📱' },
  location: { emoji: '📍' },
  default: { emoji: '•' }
});

export const ORGANIZATION_LINKS = [
  {
    pattern: /studio\s+bbb\s+inc\.?/i,
    href: 'https://studiobbb.games'
  }
];

export const INSTITUTION_LOGOS = [
  {
    key: 'korea university',
    src: 'assets/logos/korea-university-mark.svg',
    name: 'Korea University'
  },
  {
    key: 'sogang university',
    src: 'assets/logos/sogang-university-mark.png',
    name: 'Sogang University'
  },
  {
    key: 'korea institute of science and technology',
    src: 'assets/logos/kist-mark.png',
    name: 'KIST'
  }
];

export const GAME_AWARD_KEYWORDS = [
  'gamescom',
  'devcom',
  'aicon',
  'taipei game show',
  'gyeonggi game audition',
  'gigdc',
  'indiecraft',
  'made with unity',
  'kgdcon'
];

export const ACADEMIC_AWARD_KEYWORDS = [
  'kips',
  'paper',
  'conference',
  'sogang'
];
