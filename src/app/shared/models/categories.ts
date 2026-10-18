export interface Category {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: 'Ciencia',     label: 'Ciencia',     emoji: '🔭', color: '#5bb4f5' },
  { id: 'Cultura',     label: 'Cultura',     emoji: '🎨', color: '#f5d565' },
  { id: 'Historia',    label: 'Historia',    emoji: '🏛️', color: '#f5a65b' },
  { id: 'Música',      label: 'Música',      emoji: '🎸', color: '#e879c6' },
  { id: 'Deportes',    label: 'Deportes',    emoji: '⚽', color: '#6ee09a' },
  { id: 'Gastronomía', label: 'Gastronomía', emoji: '🌮', color: '#ef5a6f' },
];

const FALLBACK: Category = { id: 'otro', label: 'General', emoji: '✨', color: '#6d5cf6' };

export const categoryOf = (topic?: string): Category =>
  CATEGORIES.find(c => c.id === topic) ?? { ...FALLBACK, label: topic ?? FALLBACK.label };