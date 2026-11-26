export type HeadingPosition = {
  text: string;
  ratio: number;
};

export type ScrollAnchor = {
  editor: number;
  preview: number;
};

/**
 * 规范化标题文本，去除常见 Markdown 行内标记并统一大小写与空白，用于编辑区与预览区标题匹配。
 */
export function normalizeHeadingText(raw: string): string {
  return raw
    .trim()
    .replace(/\s+#+\s*$/, "")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_~`]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function estimateVisualColumns(line: string): number {
  let cols = 0;
  for (const ch of line) {
    const code = ch.codePointAt(0) ?? 0;
    if (ch === "\t") {
      cols += 2;
    } else if (code >= 0x1100) {
      cols += 2;
    } else {
      cols += 1;
    }
  }
  return cols;
}

/**
 * 扫描 Markdown 原文，跳过围栏代码块并按估算视觉折行位置提取各标题的相对垂直比例。
 */
export function extractMarkdownHeadingRatios(markdown: string, charsPerLine: number): HeadingPosition[] {
  if (!markdown) return [];

  const safeCols = Math.max(10, Math.floor(charsPerLine));
  const lines = markdown.split(/\r?\n/);
  const headings: Array<{ text: string; lineOffset: number }> = [];

  let totalVisualLines = 0;
  let inFence = false;
  let fenceChar = "";
  let fenceLen = 0;

  for (const line of lines) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
    if (!inFence && fenceMatch?.[1]) {
      inFence = true;
      fenceChar = fenceMatch[1][0] ?? "`";
      fenceLen = fenceMatch[1].length;
    } else if (inFence) {
      const closeMatch = line.match(/^\s*(`{3,}|~{3,})\s*$/);
      if (closeMatch?.[1] && closeMatch[1][0] === fenceChar && closeMatch[1].length >= fenceLen) {
        inFence = false;
      }
    } else {
      const headingMatch = line.match(/^\s{0,3}#{1,6}[ \t]+(.+?)\s*$/);
      if (headingMatch?.[1]) {
        const normalized = normalizeHeadingText(headingMatch[1]);
        if (normalized) {
          headings.push({ text: normalized, lineOffset: totalVisualLines });
        }
      }
    }

    const visualLines = Math.max(1, Math.ceil(estimateVisualColumns(line) / safeCols));
    totalVisualLines += visualLines;
  }

  if (totalVisualLines <= 0) return [];
  return headings.map((h) => ({
    text: h.text,
    ratio: h.lineOffset / totalVisualLines,
  }));
}

/**
 * 结合编辑区标题估算位置与预览区真实 DOM 标题坐标构建单调递增的分段锚点表。
 */
export function buildScrollAnchors(params: {
  headingRatios: HeadingPosition[];
  previewHeadings: Array<{ text: string; top: number }>;
  editorScrollHeight: number;
  editorMaxScroll: number;
  previewMaxScroll: number;
}): ScrollAnchor[] {
  const { headingRatios, previewHeadings, editorScrollHeight, editorMaxScroll, previewMaxScroll } = params;

  if (editorMaxScroll <= 0 || previewMaxScroll <= 0) {
    return [{ editor: 0, preview: 0 }];
  }

  const anchors: ScrollAnchor[] = [{ editor: 0, preview: 0 }];
  const normalizedPreview = previewHeadings.map((item) => ({
    text: normalizeHeadingText(item.text),
    top: item.top,
  }));

  let previewCursor = 0;
  for (const mdHeading of headingRatios) {
    let matchedIndex = -1;
    for (let j = previewCursor; j < normalizedPreview.length; j += 1) {
      if (normalizedPreview[j]?.text === mdHeading.text) {
        matchedIndex = j;
        break;
      }
    }
    if (matchedIndex === -1) continue;

    previewCursor = matchedIndex + 1;
    const editorY = mdHeading.ratio * editorScrollHeight;
    const previewY = normalizedPreview[matchedIndex]?.top ?? 0;
    const prev = anchors[anchors.length - 1];
    if (
      prev &&
      editorY > prev.editor &&
      editorY < editorMaxScroll &&
      previewY > prev.preview &&
      previewY < previewMaxScroll
    ) {
      anchors.push({ editor: editorY, preview: previewY });
    }
  }

  anchors.push({ editor: editorMaxScroll, preview: previewMaxScroll });
  return anchors;
}

/**
 * 基于锚点表进行分段线性插值，在编辑区与预览区 scrollTop 之间双向映射。
 */
export function mapScrollPosition(
  anchors: ScrollAnchor[],
  scrollTop: number,
  direction: "editorToPreview" | "previewToEditor",
): number {
  if (anchors.length === 0 || !Number.isFinite(scrollTop)) return 0;

  const srcKey = direction === "editorToPreview" ? "editor" : "preview";
  const dstKey = direction === "editorToPreview" ? "preview" : "editor";

  const first = anchors[0];
  const last = anchors[anchors.length - 1];
  if (!first || !last) return 0;

  if (scrollTop <= first[srcKey]) return Math.max(0, first[dstKey]);
  if (scrollTop >= last[srcKey]) return Math.max(0, last[dstKey]);

  for (let i = 0; i < anchors.length - 1; i += 1) {
    const a = anchors[i];
    const b = anchors[i + 1];
    if (!a || !b) continue;
    if (scrollTop >= a[srcKey] && scrollTop <= b[srcKey]) {
      const span = b[srcKey] - a[srcKey];
      if (span <= 0) return Math.max(0, a[dstKey]);
      const t = (scrollTop - a[srcKey]) / span;
      return Math.max(0, a[dstKey] + t * (b[dstKey] - a[dstKey]));
    }
  }

  return Math.max(0, last[dstKey]);
}
