export interface ExtractedPdfIdea {
  id: string;
  title: string;
  details: string;
  selected: boolean;
}

export interface PdfExtractionResult {
  fileName: string;
  pageCount: number;
  fullText: string;
  candidates: ExtractedPdfIdea[];
}

function splitTextIntoIdeas(fullText: string, fileName: string): ExtractedPdfIdea[] {
  const cleaned = fullText
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  if (!cleaned) {
    return [
      {
        id: crypto.randomUUID(),
        title: fileName.replace(/\.pdf$/i, ''),
        details:
          'ملف PDF مرفق للمعاينة (لم يتم العثور على نص قابل للاستخراج، يمكن معاينة الملف مباشرة).',
        selected: true,
      },
    ];
  }

  // Try splitting by numbered headings or clear paragraph breaks
  const numberedSplit = cleaned
    .split(/\n(?=(?:\d+[\.\-\)]|\u2022|\-|فكرة\s*\d*|المشهد\s*\d*|الحلقة\s*\d*)\s)/g)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 12);

  const rawChunks =
    numberedSplit.length >= 2
      ? numberedSplit
      : cleaned
          .split(/\n{2,}/)
          .map((chunk) => chunk.trim())
          .filter((chunk) => chunk.length > 15);

  const finalChunks = rawChunks.length > 0 ? rawChunks.slice(0, 30) : [cleaned];

  return finalChunks.map((chunk, index) => {
    const lines = chunk
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const firstLine = lines[0] ?? `فكرة ${index + 1}`;
    const trimmedTitle =
      firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine;
    const bodyLines = lines.length > 1 ? lines.slice(1).join('\n') : chunk;

    return {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      details: bodyLines,
      selected: true,
    };
  });
}

function ensureIteratorPolyfill(): void {
  const g = globalThis as Record<string, unknown>;
  if (typeof g.Iterator === 'undefined') {
    class IteratorShim {}
    g.Iterator = IteratorShim;
  }
}

export async function extractIdeasFromPdf(file: File): Promise<PdfExtractionResult> {
  ensureIteratorPolyfill();

  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
  const pdf = await loadingTask.promise;

  const pageTexts: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const strings = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .filter(Boolean);
    const pageText = strings.join(' ').trim();
    if (pageText) {
      pageTexts.push(pageText);
    }
  }

  const fullText = pageTexts.join('\n\n');
  const candidates = splitTextIntoIdeas(fullText, file.name);

  return {
    fileName: file.name,
    pageCount: pdf.numPages,
    fullText,
    candidates,
  };
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('تعذر قراءة الملف'));
    reader.readAsDataURL(file);
  });
}
