export const theme = {
  backgroundColor: '#0B0B0B',
  cardBackground: '#161616',
  sectionBackground: '#111111',
  textColor: '#FFFFFF',
  textMuted: '#9E9E9E',
  timerColor: '#C6FF00',
  accentColor: '#C6FF00',
  accent2: '#00E676',
  checkboxActive: '#00E676',
  checkboxInactive: '#2A2A2A',
  strikeColor: '#444444',
  borderColor: '#2A2A2A',
  success: '#00E676',
  workColor: '#FF6B35',
  warning: '#FFC107',
  danger: '#FF5252',
  fontSize: {
    title: 24,
    exercise: 18,
    timer: 72,
    button: 16,
    small: 13,
    section: 14,
  },
} as const;

export const categoryColors: Record<string, string> = {
  'Piernas': '#B388FF',
  'Cardio': '#40C4FF',
  'Tren Superior': '#00E676',
  'Full Body': '#FF9100',
  'Movilidad': '#FFD740',
  'Personalizada': '#C6FF00',
};

export const categoryIcons: Record<string, string> = {
  'Piernas': '🟣',
  'Cardio': '🔵',
  'Tren Superior': '🟢',
  'Full Body': '🟠',
  'Movilidad': '🟡',
  'Personalizada': '⚡',
};

export const CATEGORIES = [
  'Piernas',
  'Cardio',
  'Tren Superior',
  'Full Body',
  'Movilidad',
  'Personalizada',
] as const;
