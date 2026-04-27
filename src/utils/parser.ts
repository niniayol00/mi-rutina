import { Exercise, Section } from '../types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function parseSeriesAndReps(text: string): { series: number; reps: string } {
  // Patterns: "3x12", "4 x 10", "3X12"
  const seriesRepsMatch = text.match(/(\d+)\s*[xX]\s*(\d+)/);
  if (seriesRepsMatch) {
    return { series: parseInt(seriesRepsMatch[1]), reps: seriesRepsMatch[2] };
  }

  // "repetir N veces"
  const repetirMatch = text.match(/repetir\s+(\d+)\s+veces?/i);
  if (repetirMatch) {
    return { series: parseInt(repetirMatch[1]), reps: '' };
  }

  return { series: 1, reps: '' };
}

function parseRest(text: string): number {
  // "pausa 30", "descanso 40", "30""
  const pausaMatch = text.match(/(?:pausa|descanso)\s+(\d+)/i);
  if (pausaMatch) return parseInt(pausaMatch[1]);

  const quotedMatch = text.match(/(\d+)[""]/);
  if (quotedMatch) return parseInt(quotedMatch[1]);

  return 0;
}

function parseWeight(text: string): string {
  const weightMatch = text.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (weightMatch) return `${weightMatch[1]} kg`;
  return '';
}

function parseTime(text: string): string {
  // "30"", "mantener 5"", "30 segundos"
  const timeMatch = text.match(/(\d+)\s*(?:["""]|segundos?)/i);
  if (timeMatch) return `${timeMatch[1]} segundos`;
  return '';
}

function parseLine(line: string): Partial<Exercise> | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 3) return null;

  const { series, reps: parsedReps } = parseSeriesAndReps(trimmed);
  const restSeconds = parseRest(trimmed);
  const weight = parseWeight(trimmed);
  const timeReps = parseTime(trimmed);

  // Remove parsed tokens to get the exercise name
  let name = trimmed
    .replace(/\d+\s*[xX]\s*\d+/g, '')
    .replace(/repetir\s+\d+\s+veces?/gi, '')
    .replace(/(?:pausa|descanso)\s+\d+/gi, '')
    .replace(/\d+[""]/g, '')
    .replace(/\d+(?:\.\d+)?\s*kg/gi, '')
    .replace(/\d+\s*segundos?/gi, '')
    .replace(/[-–—|:,]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!name) name = trimmed;

  return {
    id: generateId(),
    name,
    series,
    reps: timeReps || parsedReps,
    weight,
    restSeconds,
    seriesCompleted: Array(series).fill(false),
    editable: true,
  };
}

export function parseRoutineText(text: string): Section[] {
  const lines = text.split('\n').filter((l) => l.trim());
  const sections: Section[] = [];
  let currentSection: Section | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect section headers: lines that are all caps, or end with ":", or are short with no numbers
    const isHeader =
      trimmed.endsWith(':') ||
      (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !/\d/.test(trimmed)) ||
      /^#{1,3}\s/.test(trimmed) ||
      /^\*\*[^*]+\*\*$/.test(trimmed);

    if (isHeader) {
      const sectionName = trimmed
        .replace(/^#{1,3}\s/, '')
        .replace(/\*\*/g, '')
        .replace(/:$/, '')
        .trim();
      currentSection = { name: sectionName, exercises: [] };
      sections.push(currentSection);
      continue;
    }

    const exercise = parseLine(trimmed);
    if (exercise && exercise.name) {
      if (!currentSection) {
        currentSection = { name: 'Ejercicios', exercises: [] };
        sections.push(currentSection);
      }
      currentSection.exercises.push(exercise as Exercise);
    }
  }

  return sections.length > 0 ? sections : [{ name: 'Ejercicios', exercises: [] }];
}
