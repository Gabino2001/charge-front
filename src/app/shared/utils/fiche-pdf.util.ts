import jsPDF from 'jspdf';
import { FicheEntry } from '../../core/models/fiche.model';
import {
  BORDER,
  CONTENT_WIDTH,
  drawPdfFooters,
  drawPdfHeader,
  ensurePdfSpace,
  formatPdfDate,
  INK_TEXT,
  MARGIN_X,
  PdfPerson,
  PLATE_RED,
  PLATE_YELLOW,
  ROW_ALT,
  STEEL,
} from './pdf-theme.util';

/** Génère et télécharge la fiche de charges du joueur (1RM et paliers de 0% à 100% par exercice). */
export function exportFichePdf(person: PdfPerson, fiche: FicheEntry[]): void {
  const doc = new jsPDF();
  let y = drawPdfHeader(doc, person, 'Fiche de charges — 1RM et paliers de %RM');

  if (fiche.length === 0) {
    doc.setTextColor(...STEEL);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('Aucune charge de référence enregistrée pour le moment.', MARGIN_X, y);
    doc.save(fileName(person));
    return;
  }

  doc.setTextColor(...STEEL);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    "Charges calculées à partir d'un seul test (poids × répétitions), formule de Brzycki.",
    MARGIN_X,
    y
  );
  y += 8;

  for (const f of fiche) {
    y = ensurePdfSpace(doc, y, 26);

    doc.setTextColor(...INK_TEXT);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(f.exerciseName, MARGIN_X, y);
    doc.setTextColor(...PLATE_RED);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`1RM ${f.oneRepMax} kg`, MARGIN_X + doc.getTextWidth(f.exerciseName) + 6, y);
    doc.setTextColor(...STEEL);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`testé le ${formatPdfDate(f.testedAt)}`, MARGIN_X + CONTENT_WIDTH, y, { align: 'right' });
    y += 6;

    y = drawPercentTable(doc, y, f);
    y += 8;
  }

  drawPdfFooters(doc, person);
  doc.save(fileName(person));
}

/** Table compacte % du 1RM -> poids, en une bande large (comme une fiche murale de salle). */
function drawPercentTable(doc: jsPDF, startY: number, f: FicheEntry): number {
  const cols = f.rmTable.length;
  const colWidth = CONTENT_WIDTH / cols;
  let y = startY;

  doc.setFillColor(...PLATE_YELLOW);
  doc.rect(MARGIN_X, y, CONTENT_WIDTH, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  f.rmTable.forEach((r, i) => {
    doc.text(`${r.percentage}%`, MARGIN_X + i * colWidth + colWidth / 2, y + 4, { align: 'center' });
  });
  y += 6;

  doc.setFillColor(...ROW_ALT);
  doc.rect(MARGIN_X, y, CONTENT_WIDTH, 7, 'F');
  doc.setTextColor(...INK_TEXT);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  f.rmTable.forEach((r, i) => {
    doc.text(`${r.weight}`, MARGIN_X + i * colWidth + colWidth / 2, y + 4.8, { align: 'center' });
  });
  y += 7;

  doc.setDrawColor(...BORDER);
  doc.rect(MARGIN_X, startY, CONTENT_WIDTH, y - startY);
  for (let i = 1; i < cols; i++) {
    doc.line(MARGIN_X + i * colWidth, startY, MARGIN_X + i * colWidth, y);
  }

  return y;
}

function fileName(person: PdfPerson): string {
  return `charge-fiche-rm-${person.fullName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
}
