export interface SiteTheme {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  // Thumbnail preview colors for the template picker
  preview: { bg: string; accent: string; text: string };
  // CSS custom properties applied to the site root
  vars: Record<string, string>;
  // Google Fonts URL
  fontsUrl: string;
}

export const THEMES: SiteTheme[] = [
  {
    id: 'bloom',
    name: 'Bloom',
    emoji: '🌿',
    tagline: 'Fresh · Modern · Clean',
    preview: { bg: '#f8faf7', accent: '#2d6a4f', text: '#1b2b1b' },
    fontsUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Nunito:wght@400;500;600&display=swap',
    vars: {
      '--s-bg':          '#f8faf7',
      '--s-bg2':         '#ffffff',
      '--s-bg3':         '#eef4ee',
      '--s-primary':     '#2d6a4f',
      '--s-primary-h':   '#1e4d38',
      '--s-accent':      '#f4a261',
      '--s-text':        '#1b2b1b',
      '--s-muted':       '#6b7280',
      '--s-border':      '#d1e8d1',
      '--s-nav-bg':      'rgba(255,255,255,0.97)',
      '--s-card-shadow': '0 2px 20px rgba(45,106,79,0.08)',
      '--s-heading-font':'"Poppins", sans-serif',
      '--s-body-font':   '"Nunito", sans-serif',
      '--s-radius':      '12px',
      '--s-radius-sm':   '8px',
    },
  },
  {
    id: 'ember',
    name: 'Ember',
    emoji: '🔥',
    tagline: 'Bold · Warm · Rustic',
    preview: { bg: '#0d0d0d', accent: '#e85d04', text: '#f4f3ee' },
    fontsUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=Lato:wght@300;400;700&display=swap',
    vars: {
      '--s-bg':          '#0d0d0d',
      '--s-bg2':         '#1a1a1a',
      '--s-bg3':         '#222222',
      '--s-primary':     '#e85d04',
      '--s-primary-h':   '#c44d02',
      '--s-accent':      '#faa307',
      '--s-text':        '#f4f3ee',
      '--s-muted':       '#a8a29e',
      '--s-border':      'rgba(232,93,4,0.2)',
      '--s-nav-bg':      'rgba(13,13,13,0.96)',
      '--s-card-shadow': '0 4px 30px rgba(232,93,4,0.12)',
      '--s-heading-font':'"Playfair Display", Georgia, serif',
      '--s-body-font':   '"Lato", sans-serif',
      '--s-radius':      '4px',
      '--s-radius-sm':   '2px',
    },
  },
  {
    id: 'luxe',
    name: 'Luxe',
    emoji: '✨',
    tagline: 'Elegant · Dark · Fine Dining',
    preview: { bg: '#0a0f1e', accent: '#c9a84c', text: '#f8f5ef' },
    fontsUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@300;400;500&display=swap',
    vars: {
      '--s-bg':          '#0a0f1e',
      '--s-bg2':         '#111827',
      '--s-bg3':         '#1a2035',
      '--s-primary':     '#c9a84c',
      '--s-primary-h':   '#a88838',
      '--s-accent':      '#8b1a1a',
      '--s-text':        '#f8f5ef',
      '--s-muted':       '#9ca3af',
      '--s-border':      'rgba(201,168,76,0.2)',
      '--s-nav-bg':      'rgba(10,15,30,0.97)',
      '--s-card-shadow': '0 4px 40px rgba(0,0,0,0.4)',
      '--s-heading-font':'"Cormorant Garamond", "Playfair Display", serif',
      '--s-body-font':   '"DM Sans", sans-serif',
      '--s-radius':      '2px',
      '--s-radius-sm':   '1px',
    },
  },
  {
    id: 'pearl',
    name: 'Pearl',
    emoji: '🤍',
    tagline: 'Premium · Light · Editorial',
    preview: { bg: '#faf8f4', accent: '#b5673d', text: '#1c1a17' },
    fontsUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600&display=swap',
    vars: {
      '--s-bg':          '#faf8f4',
      '--s-bg2':         '#ffffff',
      '--s-bg3':         '#f4efe8',
      '--s-primary':     '#b5673d',
      '--s-primary-h':   '#9a522f',
      '--s-accent':      '#d4a574',
      '--s-text':        '#1c1a17',
      '--s-muted':       '#7c7065',
      '--s-border':      '#e8ddd1',
      '--s-nav-bg':      'rgba(250,248,244,0.97)',
      '--s-card-shadow': '0 2px 30px rgba(176,103,61,0.09)',
      '--s-heading-font':'"Cormorant Garamond", Georgia, serif',
      '--s-body-font':   '"Inter", system-ui, sans-serif',
      '--s-radius':      '6px',
      '--s-radius-sm':   '4px',
    },
  },
];

export const THEME_MAP = Object.fromEntries(THEMES.map(t => [t.id, t]));
export const getTheme = (id: string): SiteTheme => THEME_MAP[id] || THEMES[0];
