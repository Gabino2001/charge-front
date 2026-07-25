import jsPDF from 'jspdf';

export type RGB = [number, number, number];

// Palette CHARGE. (mêmes teintes que l'appli, adaptées pour un rendu imprimé sur fond clair)
export const INK: RGB = [20, 22, 26];
export const CHALK: RGB = [243, 241, 234];
export const STEEL: RGB = [138, 143, 152];
export const STEEL_LIGHT: RGB = [190, 192, 196];
export const INK_TEXT: RGB = [32, 34, 38];
export const ROW_ALT: RGB = [245, 245, 242];
export const BORDER: RGB = [225, 225, 220];
export const PLATE_RED: RGB = [229, 72, 77];
export const PLATE_BLUE: RGB = [62, 124, 177];
export const PLATE_YELLOW: RGB = [201, 149, 22];
export const PLATE_GREEN: RGB = [76, 154, 106];

export const PAGE_WIDTH = 210;
export const PAGE_HEIGHT = 297;
export const MARGIN_X = 14;
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
export const BOTTOM_LIMIT = 275;

export interface PdfPerson {
  fullName: string;
  poste?: string | null;
}

/** Bandeau d'en-tête de marque CHARGE., avec le nom du joueur et la date de génération. */
export function drawPdfHeader(doc: jsPDF, person: PdfPerson, subtitle: string): number {
  doc.setFillColor(...INK);
  doc.rect(0, 0, PAGE_WIDTH, 30, 'F');

  doc.setTextColor(...CHALK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('CHARGE.', MARGIN_X, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...STEEL_LIGHT);
  doc.text(subtitle, MARGIN_X, 22);

  doc.setTextColor(...CHALK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const nameLine = person.poste ? `${person.fullName} — ${person.poste}` : person.fullName;
  doc.text(nameLine, PAGE_WIDTH - MARGIN_X, 15, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...STEEL_LIGHT);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, PAGE_WIDTH - MARGIN_X, 21, { align: 'right' });

  return 40;
}

export function ensurePdfSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > BOTTOM_LIMIT) {
    doc.addPage();
    return 20;
  }
  return y;
}

/** Pied de page (numérotation + nom) sur toutes les pages du document, à appeler en tout dernier. */
export function drawPdfFooters(doc: jsPDF, person: PdfPerson): void {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...BORDER);
    doc.line(MARGIN_X, PAGE_HEIGHT - 14, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 14);
    doc.setTextColor(...STEEL);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`CHARGE. — ${person.fullName}`, MARGIN_X, PAGE_HEIGHT - 9);
    doc.text(`Page ${i} / ${totalPages}`, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 9, { align: 'right' });
  }
}

export function formatPdfDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('fr-FR');
}
