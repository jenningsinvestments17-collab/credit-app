import fs from "node:fs";
import { execFileSync } from "node:child_process";

function escapePythonPath(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export type PdfExtractionResult = {
  text: string | null;
  extractionStrategy: "native_text" | "ocr" | "none";
  scannedLikely: boolean;
  ocrUsed: boolean;
  pageCount: number;
  error?: string;
};

export function extractPdfText(pdfPath: string): string | null {
  return extractPdfContent(pdfPath).text;
}

export function extractPdfContent(pdfPath: string): PdfExtractionResult {
  if (!pdfPath || !fs.existsSync(pdfPath)) {
    return {
      text: null,
      extractionStrategy: "none",
      scannedLikely: false,
      ocrUsed: false,
      pageCount: 0,
      error: "File not found.",
    };
  }

  const script = [
    "import io, json, re",
    "from pypdf import PdfReader",
    "",
    `pdf_path = r'${escapePythonPath(pdfPath)}'`,
    "native_pages = []",
    "native_error = None",
    "page_count = 0",
    "try:",
    "    reader = PdfReader(pdf_path)",
    "    page_count = len(reader.pages)",
    "    for i, page in enumerate(reader.pages, start=1):",
    "        text = page.extract_text() or ''",
    "        native_pages.append(f'--- PAGE {i} ---\\n{text}\\n')",
    "except Exception as exc:",
    "    native_error = str(exc)",
    "",
    "native_text = '\\n'.join(native_pages).strip()",
    "native_plain = re.sub(r'\\s+', '', native_text)",
    "scanned_likely = page_count > 0 and len(native_plain) < max(250, page_count * 60)",
    "",
    "result = {",
    "    'text': native_text or None,",
    "    'extractionStrategy': 'native_text' if native_text else 'none',",
    "    'scannedLikely': scanned_likely,",
    "    'ocrUsed': False,",
    "    'pageCount': page_count,",
    "}",
    "if native_error:",
    "    result['error'] = native_error",
    "",
    "if scanned_likely:",
    "    try:",
    "        import fitz",
    "        import numpy as np",
    "        from PIL import Image",
    "        from rapidocr_onnxruntime import RapidOCR",
    "",
    "        engine = RapidOCR()",
    "        doc = fitz.open(pdf_path)",
    "        ocr_pages = []",
    "        for i, page in enumerate(doc, start=1):",
    "            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)",
    "            image = Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGB')",
    "            ocr_output, _ = engine(np.array(image))",
    "            lines = []",
    "            if ocr_output:",
    "                for item in ocr_output:",
    "                    if isinstance(item, (list, tuple)) and len(item) >= 2 and isinstance(item[1], str):",
    "                        lines.append(item[1])",
    "            ocr_pages.append(f'--- PAGE {i} ---\\n' + '\\n'.join(lines) + '\\n')",
    "",
    "        ocr_text = '\\n'.join(ocr_pages).strip()",
    "        ocr_plain = re.sub(r'\\s+', '', ocr_text)",
    "        if ocr_text and len(ocr_plain) >= len(native_plain):",
    "            result['text'] = ocr_text",
    "            result['extractionStrategy'] = 'ocr'",
    "            result['ocrUsed'] = True",
    "    except Exception as exc:",
    "        result['error'] = str(exc)",
    "",
    "print(json.dumps(result))",
  ].join("\n");

  try {
    const output = execFileSync("python", ["-c", script], {
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 20,
      windowsHide: true,
    });

    return JSON.parse(output.trim()) as PdfExtractionResult;
  } catch (error) {
    return {
      text: null,
      extractionStrategy: "none",
      scannedLikely: false,
      ocrUsed: false,
      pageCount: 0,
      error: error instanceof Error ? error.message : "Extraction failed.",
    };
  }
}
