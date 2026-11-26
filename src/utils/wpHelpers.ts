import type { CaseHistoryItem, PdfAttachment } from '../types/caseHistory';

const ITALIAN_MONTHS = [
  'gennaio',
  'febbraio',
  'marzo',
  'aprile',
  'maggio',
  'giugno',
  'luglio',
  'agosto',
  'settembre',
  'ottobre',
  'novembre',
  'dicembre',
];

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'case-history';
}

export function formatItalianDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  const day = date.getDate();
  const month = ITALIAN_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatShortDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const regex of patterns) {
    const match = trimmed.match(regex);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function getStatusLabel(status: CaseHistoryItem['status']): string {
  switch (status) {
    case 'publish':
      return 'Pubblicata';
    case 'draft':
      return 'Bozza';
    case 'future':
      return 'Schedulata';
  }
}

/**
 * Generates a valid downloadable PDF document for sample or generated technical attachments
 * so every PDF link in Case History details is genuinely functional.
 */
export function downloadPdfAttachment(attachment: PdfAttachment, caseItem: CaseHistoryItem): void {
  if (attachment.url && attachment.url.startsWith('data:application/pdf')) {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.fileName || 'allegato.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  const sanitizePdfText = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[()\\]/g, '')
      .replace(/[^\x20-\x7E]/g, ' ');

  const lines = [
    `CASE HISTORY STUDIO - ALLEGATO TECNICO`,
    `Documento: ${sanitizePdfText(attachment.title)}`,
    `Categoria: ${sanitizePdfText(attachment.category)}`,
    `Progetto: ${sanitizePdfText(caseItem.title)}`,
    `Codice Commessa (casehistory_codice): ${sanitizePdfText(caseItem.meta.codice || 'N/D')}`,
    `Anno (casehistory_anno): ${sanitizePdfText(caseItem.meta.anno || 'N/D')}`,
    `Permalink: /casehistory/${sanitizePdfText(caseItem.slug)}/`,
    `------------------------------------------------------------`,
    `${sanitizePdfText(attachment.summary || caseItem.excerpt)}`,
  ];

  const streamContent = [
    'BT',
    '/F1 14 Tf',
    '48 760 Td',
    `(${lines[0]}) Tj`,
    '/F1 10 Tf',
    ...lines.slice(1).flatMap((line) => ['0 -20 Td', `(${line.slice(0, 88)}) Tj`]),
    'ET',
  ].join('\n');

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
    `4 0 obj << /Length ${streamContent.length} >> stream\n${streamContent}\nendstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj + '\n';
  }
  const xrefPos = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

  const blob = new Blob([pdf], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = attachment.fileName || 'documento-case-history.pdf';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 2500);
}
