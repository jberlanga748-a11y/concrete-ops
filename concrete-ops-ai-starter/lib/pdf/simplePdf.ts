type SimplePdfOptions = {
  title: string;
  lines: string[];
};

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const LEFT_MARGIN = 48;
const TOP_MARGIN = 742;
const FONT_SIZE = 11;
const LINE_HEIGHT = 15;
const MAX_CHARS_PER_LINE = 88;
const MAX_LINES_PER_PAGE = 44;

function sanitizeText(value: string) {
  return value
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapLine(line: string) {
  const normalized = line.replace(/\s+/g, " ").trim();
  if (!normalized) return [""];

  const words = normalized.split(" ");
  const wrapped: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= MAX_CHARS_PER_LINE) {
      current = next;
      continue;
    }

    if (current) {
      wrapped.push(current);
      current = word;
      continue;
    }

    wrapped.push(word.slice(0, MAX_CHARS_PER_LINE));
    current = word.slice(MAX_CHARS_PER_LINE);
  }

  if (current) {
    wrapped.push(current);
  }

  return wrapped;
}

function chunkLines(lines: string[]) {
  const chunks: string[][] = [];
  for (let index = 0; index < lines.length; index += MAX_LINES_PER_PAGE) {
    chunks.push(lines.slice(index, index + MAX_LINES_PER_PAGE));
  }
  return chunks.length > 0 ? chunks : [[]];
}

function buildPageStream(lines: string[], pageNumber: number, pageCount: number) {
  const contentLines = [
    "BT",
    `/F1 ${FONT_SIZE} Tf`,
    `${LEFT_MARGIN} ${TOP_MARGIN} Td`,
    `${LINE_HEIGHT} TL`,
    `(${sanitizeText(`Page ${pageNumber} of ${pageCount}`)}) Tj`,
    "T*",
    `(${sanitizeText("")}) Tj`,
  ];

  for (const line of lines) {
    contentLines.push("T*");
    contentLines.push(`(${sanitizeText(line)}) Tj`);
  }

  contentLines.push("ET");
  return contentLines.join("\n");
}

export function createSimplePdf(options: SimplePdfOptions) {
  const wrappedLines = [
    options.title.toUpperCase(),
    "",
    ...options.lines.flatMap((line) => wrapLine(line)),
  ];
  const pages = chunkLines(wrappedLines);
  const objects: string[] = [];

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");

  const pageIds: number[] = [];
  const contentIds: number[] = [];
  let nextObjectId = 3;

  for (let index = 0; index < pages.length; index += 1) {
    pageIds.push(nextObjectId);
    nextObjectId += 1;
    contentIds.push(nextObjectId);
    nextObjectId += 1;
  }

  const fontObjectId = nextObjectId;
  objects.push(`<< /Type /Pages /Count ${pages.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`);

  for (let index = 0; index < pages.length; index += 1) {
    const stream = buildPageStream(pages[index], index + 1, pages.length);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentIds[index]} 0 R >>`,
    );
    objects.push(`<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`);
  }

  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}
