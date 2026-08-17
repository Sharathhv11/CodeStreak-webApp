// ── Language Color Mapping ───────────────────────────────────────

export const LANGUAGE_COLORS = {
  'c++': '#ffffff', cpp: '#ffffff', python: '#e4e4e7', python3: '#e4e4e7',
  java: '#d4d4d8', javascript: '#a1a1aa', typescript: '#e4e4e7',
  go: '#a1a1aa', golang: '#a1a1aa', rust: '#71717a', c: '#52525b',
  ruby: '#71717a', swift: '#d4d4d8', kotlin: '#a1a1aa', php: '#52525b',
  csharp: '#71717a', 'c#': '#71717a', dart: '#a1a1aa', scala: '#52525b',
};

export const getLangColor = (lang) => LANGUAGE_COLORS[(lang || '').toLowerCase()] || '#a1a1aa';
