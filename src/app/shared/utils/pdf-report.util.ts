import jsPDF from 'jspdf';
import { Player } from '../../core/models/player.model';
import { WellnessResponse } from '../../core/models/wellness.model';
import { RpeResponse } from '../../core/models/rpe.model';
import { FicheEntry } from '../../core/models/fiche.model';
import { Injury } from '../../core/models/injury.model';
import { Goal } from '../../core/models/goal.model';
import { Exercise, LOAD_FEEDBACK_LABELS } from '../../core/models/exercise.model';

export interface PlayerReportData {
  player: Player;
  wellnessHistory: WellnessResponse[];
  rpeHistory: RpeResponse[];
  fiche: FicheEntry[];
  injuries: Injury[];
  goals: Goal[];
  exercises: Exercise[];
}

type RGB = [number, number, number];

// Palette CHARGE. (mêmes teintes que l'appli, adaptées pour un rendu imprimé sur fond clair)
const INK: RGB = [20, 22, 26];
const CHALK: RGB = [243, 241, 234];
const STEEL: RGB = [138, 143, 152];
const INK_TEXT: RGB = [32, 34, 38];
const ROW_ALT: RGB = [245, 245, 242];
const BORDER: RGB = [225, 225, 220];
const PLATE_RED: RGB = [229, 72, 77];
const PLATE_BLUE: RGB = [62, 124, 177];
const PLATE_YELLOW: RGB = [201, 149, 22];
const PLATE_GREEN: RGB = [76, 154, 106];

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_X = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const BOTTOM_LIMIT = 275;

/** Génère et télécharge un rapport PDF récapitulatif du joueur (bien-être, RPE, 1RM, blessures, objectifs). */
export function exportPlayerReportPdf(data: PlayerReportData): void {
  const doc = new jsPDF();
  let y = drawHeader(doc, data.player);
  y = drawStatCards(doc, y, data);

  y = drawTableSection(
    doc, y, 'Bien-être — historique récent', PLATE_YELLOW,
    ['Date', 'Humeur', 'Sommeil', 'Fatigue', 'Douleur', 'Stress', 'Note'],
    [24, 20, 20, 20, 20, 20, CONTENT_WIDTH - 124],
    data.wellnessHistory.slice(0, 20).map((w) => [
      formatDate(w.entryDate),
      `${w.mood}/5`, `${w.sleep}/5`, `${w.fatigue}/5`, `${w.soreness}/5`, `${w.stress}/5`,
      w.painLocation ?? '—',
    ]),
    'Aucune donnée de bien-être enregistrée.'
  );

  y = drawTableSection(
    doc, y, "Ressenti à l'effort (RPE) — historique récent", PLATE_BLUE,
    ['Séance', 'RPE', 'Durée', 'Charge'],
    [70, 30, 35, CONTENT_WIDTH - 135],
    data.rpeHistory.slice(0, 20).map((r) => [
      r.entryDate,
      `${r.rpe}/10`,
      r.durationMinutes ? `${r.durationMinutes} min` : '—',
      r.trainingLoad ? `${r.trainingLoad}` : '—',
    ]),
    'Aucun ressenti de séance enregistré.'
  );

  y = drawTableSection(
    doc, y, 'Exercices récents — type de séance et ressenti sur la charge', PLATE_BLUE,
    ['Date', 'Exercice', 'Type', '%RM', 'RPE', 'Ressenti charge'],
    [22, CONTENT_WIDTH - 152, 26, 18, 16, 70],
    [...data.exercises]
      .sort((a, b) => b.id - a.id)
      .slice(0, 25)
      .map((e) => [
        formatDate(e.scheduledFor),
        e.title,
        e.sessionType === 'SUPERSET' ? 'Superset' : e.sessionType === 'ATELIER' ? 'Circuit' : '—',
        e.percentRm ? `${e.percentRm}%` : '—',
        e.exerciseRpe != null ? `${e.exerciseRpe}/10` : '—',
        e.loadFeedback ? LOAD_FEEDBACK_LABELS[e.loadFeedback] + (e.loadComment ? ` — ${e.loadComment}` : '') : '—',
      ]),
    'Aucun exercice assigné pour le moment.'
  );

  y = drawTableSection(
    doc, y, 'Fiche de musculation — 1RM par exercice', PLATE_RED,
    ['Exercice', '1RM estimé', 'Dernier test', 'Testé le'],
    [55, 35, 45, CONTENT_WIDTH - 135],
    data.fiche.map((f) => [
      f.exerciseName,
      `${f.oneRepMax} kg`,
      `${f.weight} kg x ${f.reps}`,
      formatDate(f.testedAt),
    ]),
    'Aucune charge de référence enregistrée.'
  );

  y = drawTableSection(
    doc, y, 'Objectifs', PLATE_GREEN,
    ['Exercice', 'Cible', 'Actuel', 'Progression', 'Statut'],
    [50, 30, 30, 35, CONTENT_WIDTH - 145],
    data.goals.map((g) => [
      g.exerciseName,
      `${g.targetOneRepMax} kg`,
      g.currentOneRepMax != null ? `${g.currentOneRepMax} kg` : '—',
      g.progressPercent != null ? `${g.progressPercent}%` : '—',
      g.achieved ? 'Atteint' : 'En cours',
    ]),
    'Aucun objectif défini.'
  );

  y = drawTableSection(
    doc, y, 'Registre de blessures', PLATE_RED,
    ['Début', 'Blessure', 'Statut', 'Fin'],
    [28, CONTENT_WIDTH - 118, 40, 28],
    data.injuries.map((i) => [
      formatDate(i.startDate),
      i.title,
      i.status === 'EN_COURS' ? 'En cours' : 'Rétabli',
      i.endDate ? formatDate(i.endDate) : '—',
    ]),
    'Aucune blessure enregistrée.'
  );

  drawFooters(doc, data.player);

  const fileName = `charge-rapport-${data.player.fullName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
  doc.save(fileName);
}

// ---- En-tête ----

function drawHeader(doc: jsPDF, player: Player): number {
  doc.setFillColor(...INK);
  doc.rect(0, 0, PAGE_WIDTH, 30, 'F');

  doc.setTextColor(...CHALK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('CHARGE.', MARGIN_X, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...STEEL_LIGHT());
  doc.text('Rapport de suivi', MARGIN_X, 22);

  doc.setTextColor(...CHALK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const nameLine = player.poste ? `${player.fullName} — ${player.poste}` : player.fullName;
  doc.text(nameLine, PAGE_WIDTH - MARGIN_X, 15, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...STEEL_LIGHT());
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, PAGE_WIDTH - MARGIN_X, 21, { align: 'right' });

  return 40;
}

function STEEL_LIGHT(): RGB {
  return [190, 192, 196];
}

// ---- Cartes de synthèse ----

function drawStatCards(doc: jsPDF, startY: number, data: PlayerReportData): number {
  const cards: { label: string; value: string; color: RGB }[] = [
    {
      label: 'DERNIER RPE',
      value: data.rpeHistory[0] ? `${data.rpeHistory[0].rpe}/10` : '—',
      color: PLATE_BLUE,
    },
    {
      label: 'BIEN-ÊTRE (MOY.)',
      value: data.wellnessHistory[0] ? `${averageWellness(data.wellnessHistory[0])}/5` : '—',
      color: PLATE_YELLOW,
    },
    {
      label: 'CHARGES SUIVIES',
      value: `${data.fiche.length}`,
      color: PLATE_RED,
    },
    {
      label: 'BLESSURES ACTIVES',
      value: `${data.injuries.filter((i) => i.status === 'EN_COURS').length}`,
      color: PLATE_GREEN,
    },
  ];

  const gap = 4;
  const cardWidth = (CONTENT_WIDTH - gap * 3) / 4;
  const cardHeight = 20;
  let x = MARGIN_X;

  cards.forEach((card) => {
    doc.setFillColor(...card.color);
    doc.rect(x, startY, cardWidth, 1.3, 'F');
    doc.setDrawColor(...BORDER);
    doc.setFillColor(250, 250, 248);
    doc.rect(x, startY + 1.3, cardWidth, cardHeight - 1.3, 'FD');

    doc.setTextColor(...STEEL);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(card.label, x + 3, startY + 8);

    doc.setTextColor(...INK_TEXT);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(card.value, x + 3, startY + 16);

    x += cardWidth + gap;
  });

  return startY + cardHeight + 10;
}

function averageWellness(w: WellnessResponse): string {
  const avg = (w.mood + w.sleep + w.fatigue + w.soreness + w.stress) / 5;
  return avg.toFixed(1);
}

// ---- Sections avec tableau ----

function drawTableSection(
  doc: jsPDF,
  startY: number,
  title: string,
  accentColor: RGB,
  headers: string[],
  colWidths: number[],
  rows: string[][],
  emptyLabel: string
): number {
  let y = ensureSpace(doc, startY, 20);
  y = drawSectionTitle(doc, y, title, accentColor);

  if (rows.length === 0) {
    doc.setTextColor(...STEEL);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text(emptyLabel, MARGIN_X, y);
    return y + 12;
  }

  return drawTable(doc, y, headers, colWidths, rows, accentColor) + 8;
}

function drawSectionTitle(doc: jsPDF, y: number, title: string, accentColor: RGB): number {
  doc.setFillColor(...accentColor);
  doc.rect(MARGIN_X, y - 4, 3, 5, 'F');
  doc.setTextColor(...INK_TEXT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text(title, MARGIN_X + 6, y);
  return y + 7;
}

function drawTable(
  doc: jsPDF,
  startY: number,
  headers: string[],
  colWidths: number[],
  rows: string[][],
  accentColor: RGB
): number {
  const headerHeight = 7.5;
  const rowHeight = 7;
  let y = startY;

  const drawHeaderRow = () => {
    doc.setFillColor(...accentColor);
    doc.rect(MARGIN_X, y, CONTENT_WIDTH, headerHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    let cx = MARGIN_X;
    headers.forEach((h, i) => {
      doc.text(h, cx + 2, y + headerHeight - 2.6);
      cx += colWidths[i];
    });
    y += headerHeight;
  };

  drawHeaderRow();

  rows.forEach((row, rowIndex) => {
    if (y + rowHeight > BOTTOM_LIMIT) {
      doc.addPage();
      y = 20;
      drawHeaderRow();
    }
    if (rowIndex % 2 === 1) {
      doc.setFillColor(...ROW_ALT);
      doc.rect(MARGIN_X, y, CONTENT_WIDTH, rowHeight, 'F');
    }
    doc.setTextColor(...INK_TEXT);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.3);
    let cx = MARGIN_X;
    row.forEach((cell, i) => {
      const truncated = doc.splitTextToSize(cell, colWidths[i] - 4)[0] ?? '';
      doc.text(truncated, cx + 2, y + rowHeight - 2.3);
      cx += colWidths[i];
    });
    doc.setDrawColor(...BORDER);
    doc.line(MARGIN_X, y + rowHeight, MARGIN_X + CONTENT_WIDTH, y + rowHeight);
    y += rowHeight;
  });

  return y;
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > BOTTOM_LIMIT) {
    doc.addPage();
    return 20;
  }
  return y;
}

// ---- Pied de page ----

function drawFooters(doc: jsPDF, player: Player): void {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...BORDER);
    doc.line(MARGIN_X, PAGE_HEIGHT - 14, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 14);
    doc.setTextColor(...STEEL);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`CHARGE. — ${player.fullName}`, MARGIN_X, PAGE_HEIGHT - 9);
    doc.text(`Page ${i} / ${totalPages}`, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 9, { align: 'right' });
  }
}

// ---- Utilitaires ----

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('fr-FR');
}
