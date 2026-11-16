import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import type { StandeeDesign } from "./types";

export interface ExportOptions {
  bleed?: boolean;
  cropMarks?: boolean;
  quality?: number;
}

/**
 * Generates high-contrast, error-corrected QR code data URL (PNG)
 * with Error Correction Level "H" (30% recovery) and clean quiet zone.
 */
export async function generateStandeeQrDataUrl(
  url: string,
  darkColor: string = "#111827"
): Promise<string> {
  try {
    return await QRCode.toDataURL(url, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 600,
      color: {
        dark: darkColor || "#111827",
        light: "#FFFFFF",
      },
    });
  } catch {
    // Fallback if custom dark color fails hex validation
    return await QRCode.toDataURL(url, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 600,
      color: {
        dark: "#111827",
        light: "#FFFFFF",
      },
    });
  }
}

/**
 * Converts an SVG element to an HTML5 Canvas at exact pixel dimensions (e.g. 1240 × 1748 for 300 DPI A6).
 */
export async function svgToCanvas(
  svgElement: SVGSVGElement,
  targetWidth: number = 1240,
  targetHeight: number = 1748
): Promise<HTMLCanvasElement> {
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(svgElement);

  // Ensure xmlns is present
  if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgString = svgString.replace(
      "<svg ",
      '<svg xmlns="http://www.w3.org/2000/svg" '
    );
  }

  const svgBlob = new Blob([svgString], {
    type: "image/svg+xml;charset=utf-8",
  });
  const URL = window.URL || window.webkitURL || window;
  const blobURL = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(blobURL);
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Fill background
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      URL.revokeObjectURL(blobURL);
      resolve(canvas);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(blobURL);
      reject(new Error(`Failed to load SVG into image: ${e}`));
    };
    img.src = blobURL;
  });
}

/**
 * Exports exact print-ready A6 PDF (105mm × 148mm at 300 DPI)
 * Supports optional 3mm bleed (111mm × 154mm) with crop marks.
 */
export async function exportStandeePdf(
  svgElement: SVGSVGElement,
  design: StandeeDesign,
  filename: string = "a6-standee",
  options: ExportOptions = {}
): Promise<void> {
  const hasBleed = Boolean(options.bleed ?? design.bleedEnabled);
  const hasCropMarks = Boolean(options.cropMarks ?? design.cropMarks);

  // Exact A6 dimensions:
  // Trim: 105 mm x 148 mm
  // Bleed (3mm): 111 mm x 154 mm
  const pdfWidthMm = hasBleed ? 111 : 105;
  const pdfHeightMm = hasBleed ? 154 : 148;

  // Render to 300 DPI canvas
  // 105mm / 25.4 * 300 = ~1240.16 px
  // 148mm / 25.4 * 300 = ~1748.03 px
  // 111mm / 25.4 * 300 = ~1311.02 px
  // 154mm / 25.4 * 300 = ~1818.90 px
  const targetPxW = hasBleed ? 1311 : 1240;
  const targetPxH = hasBleed ? 1819 : 1748;

  const canvas = await svgToCanvas(svgElement, targetPxW, targetPxH);
  const imgData = canvas.toDataURL("image/png", 1.0);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [pdfWidthMm, pdfHeightMm],
    compress: true,
  });

  doc.addImage(
    imgData,
    "PNG",
    0,
    0,
    pdfWidthMm,
    pdfHeightMm,
    undefined,
    "FAST"
  );

  // If crop marks requested
  if (hasCropMarks && hasBleed) {
    const bleedMm = 3;
    const markLen = 4;
    doc.setDrawColor(30, 30, 30);
    doc.setLineWidth(0.2);

    // Top-left
    doc.line(bleedMm, 0, bleedMm, bleedMm - 0.5);
    doc.line(0, bleedMm, bleedMm - 0.5, bleedMm);

    // Top-right
    doc.line(pdfWidthMm - bleedMm, 0, pdfWidthMm - bleedMm, bleedMm - 0.5);
    doc.line(pdfWidthMm, bleedMm, pdfWidthMm - bleedMm + 0.5, bleedMm);

    // Bottom-left
    doc.line(bleedMm, pdfHeightMm, bleedMm, pdfHeightMm - bleedMm + 0.5);
    doc.line(0, pdfHeightMm - bleedMm, bleedMm - 0.5, pdfHeightMm - bleedMm);

    // Bottom-right
    doc.line(
      pdfWidthMm - bleedMm,
      pdfHeightMm,
      pdfWidthMm - bleedMm,
      pdfHeightMm - bleedMm + 0.5
    );
    doc.line(
      pdfWidthMm,
      pdfHeightMm - bleedMm,
      pdfWidthMm - bleedMm + 0.5,
      pdfHeightMm - bleedMm
    );
  }

  doc.save(`${filename}.pdf`);
}

/**
 * Exports 300 DPI high-resolution PNG (1240 × 1748 px trim).
 */
export async function exportStandeePng(
  svgElement: SVGSVGElement,
  filename: string = "a6-standee",
  options: ExportOptions = {}
): Promise<void> {
  const hasBleed = Boolean(options.bleed);
  const targetPxW = hasBleed ? 1311 : 1240;
  const targetPxH = hasBleed ? 1819 : 1748;

  const canvas = await svgToCanvas(svgElement, targetPxW, targetPxH);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, "image/png");
}

/**
 * Exports pure vector SVG file.
 */
export function exportStandeeSvg(
  svgElement: SVGSVGElement,
  filename: string = "a6-standee"
): void {
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(svgElement);
  if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgString = svgString.replace(
      "<svg ",
      '<svg xmlns="http://www.w3.org/2000/svg" '
    );
  }
  const blob = new Blob([svgString], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
