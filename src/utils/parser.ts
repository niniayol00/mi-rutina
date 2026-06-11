import { Exercise, Section } from '../types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/** Normaliza los distintos símbolos de "por" (×, ✕, *) a la letra x. */
function normalizeX(s: string): string {
  return s.replace(/[×✕✖⨯*]/g, 'x');
}

function parseRest(text: string): number {
  // "pausa 30", "descanso 40"
  const pausaMatch = text.match(/(?:pausa|descanso)\s+(\d+)/i);
  if (pausaMatch) return parseInt(pausaMatch[1]);

  // 30" (comillas = segundos de pausa)
  const quotedMatch = text.match(/(\d+)\s*["""]/);
  if (quotedMatch) return parseInt(quotedMatch[1]);

  return 0;
}

function parseWeight(text: string): string {
  const weightMatch = text.match(/(\d+(?:[.,]\d+)?)\s*kg/i);
  if (weightMatch) return `${weightMatch[1].replace(',', '.')} kg`;
  return '';
}

interface ParsedDetails {
  series: number;
  reps: string;
  weight: string;
  restSeconds: number;
  workSeconds?: number;
}

/**
 * Interpreta la parte del texto con series/reps/tiempo/peso.
 * Soporta, entre otros:
 *   "3 × 10"            → 3 series, 10 reps
 *   "3 x 10 | 30 kg"   → 3 series, 10 reps, 30 kg
 *   "12 rep × 3"       → 3 series, 12 reps
 *   "35 seg × 3"       → 3 series, retención 35 seg
 *   "10 rep"           → 1 serie, 10 reps
 *   "1 serie"          → 1 serie
 *   "20 seg"           → 1 serie, retención 20 seg
 *   "8 por lado"       → 1 serie, 8 por lado
 *   "5 min"            → 1 serie, 5 min
 */
function parseDetails(details: string): ParsedDetails {
  const d = normalizeX(details);
  let series = 1;
  let reps = '';
  let workSeconds: number | undefined;

  const weight = parseWeight(d);
  const restSeconds = parseRest(d);
  const perSide = /por\s+lado/i.test(d);

  const UNIT = '(?:repeticiones?|reps|rep|segundos?|seg)';

  // 1) "<valor> <unidad> x <series>"  (ej: "35 seg × 3", "12 rep × 3")
  let m = d.match(new RegExp(`(\\d+)\\s*(${UNIT})\\s*x\\s*(\\d+)`, 'i'));
  if (m) {
    const val = parseInt(m[1]);
    const unit = m[2].toLowerCase();
    series = parseInt(m[3]);
    if (unit.startsWith('seg')) workSeconds = val;
    else reps = String(val);
  } else if ((m = d.match(/(\d+)\s*x\s*(\d+)\s*(?:["""]|segundos?|seg)/i))) {
    // 2) "<series> x <segundos>""  (ej: 3x30" → 3 series de 30 seg)
    series = parseInt(m[1]);
    workSeconds = parseInt(m[2]);
  } else {
    // 3) "<series> x <reps>"  (ej: "3 × 10")
    m = d.match(/(\d+)\s*x\s*(\d+)/i);
    if (m) {
      series = parseInt(m[1]);
      reps = m[2];
    } else {
      // 4) valores sueltos
      const serieM = d.match(/(\d+)\s*series?/i);
      const repM = d.match(/(\d+)\s*(?:repeticiones?|reps|rep)/i);
      const segM = d.match(/(\d+)\s*(?:segundos?|seg|["""])/i);
      const minM = d.match(/(\d+)\s*min/i);

      if (serieM) series = parseInt(serieM[1]);

      if (repM) reps = repM[1];
      else if (segM) workSeconds = parseInt(segM[1]);
      else if (minM) reps = `${minM[1]} min`;
      else if (!weight && restSeconds === 0 && !serieM) {
        // Número suelto sin unidad (ej: "8 por lado") → repeticiones
        const loneNum = d.match(/\b(\d+)\b/);
        if (loneNum) reps = loneNum[1];
      }
    }
  }

  if (perSide && reps && !/lado/i.test(reps)) reps = `${reps} por lado`;

  return { series: Math.max(1, series), reps, weight, restSeconds, workSeconds };
}

/** Limpieza de nombre cuando la línea no tiene ":" como separador. */
function stripTokens(text: string): string {
  return normalizeX(text)
    .replace(/\d+\s*x\s*\d+\s*["""]?/gi, '')
    .replace(/\d+\s*(?:repeticiones?|reps|rep)/gi, '')
    .replace(/\d+\s*series?/gi, '')
    .replace(/\d+\s*(?:segundos?|seg)/gi, '')
    .replace(/\d+\s*min/gi, '')
    .replace(/(?:pausa|descanso)\s+\d+/gi, '')
    .replace(/\d+\s*["""]/g, '')
    .replace(/\d+(?:[.,]\d+)?\s*kg/gi, '')
    .replace(/por\s+lado/gi, '')
    .replace(/[-–—|:,]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseLine(line: string): Partial<Exercise> | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 3) return null;

  let name: string;
  let details: string;

  const colonIdx = trimmed.indexOf(':');
  if (colonIdx > 0) {
    // "Nombre: detalles"
    name = trimmed.slice(0, colonIdx).trim();
    details = trimmed.slice(colonIdx + 1).trim();
  } else {
    name = stripTokens(trimmed);
    details = trimmed;
  }

  const { series, reps, weight, restSeconds, workSeconds } = parseDetails(details);

  if (!name) name = trimmed;

  return {
    id: generateId(),
    name,
    series,
    reps,
    weight: weight || undefined,
    restSeconds,
    workSeconds,
    seriesCompleted: Array(series).fill(false),
    editable: true,
  };
}

/** Decide si una línea es un encabezado de sección. */
function isSectionHeader(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3) return false;

  // "MOVILIDAD:" (termina en dos puntos, sin contenido después)
  if (trimmed.endsWith(':')) return true;
  // Markdown: "# Título" o "**Título**"
  if (/^#{1,3}\s/.test(trimmed) || /^\*\*[^*]+\*\*$/.test(trimmed)) return true;
  // TODO EN MAYÚSCULAS sin números
  if (trimmed === trimmed.toUpperCase() && !/\d/.test(trimmed)) return true;
  // Línea sin ":" y sin ningún número → título de sección
  // (ej: "Entrada en calor y movilidad", "Trabajo principal", "Elongación")
  if (!trimmed.includes(':') && !/\d/.test(trimmed)) return true;

  return false;
}

export function parseRoutineText(text: string): Section[] {
  const lines = text.split('\n').filter((l) => l.trim());
  const sections: Section[] = [];
  let currentSection: Section | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (isSectionHeader(trimmed)) {
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

  // Descartar secciones vacías (ej: el título de la rutina sin ejercicios)
  const nonEmpty = sections.filter((s) => s.exercises.length > 0);
  return nonEmpty.length > 0 ? nonEmpty : [{ name: 'Ejercicios', exercises: [] }];
}
