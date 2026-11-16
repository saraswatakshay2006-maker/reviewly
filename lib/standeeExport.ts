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
 * Converts an SVG element to an HTML5 Canvas at exact pixel dimensions.
 * Uses high-density scaling and geometric precision context for razor-sharp text and vectors.
 */
export async function svgToCanvas(
  svgElement: SVGSVGElement,
  targetWidth: number = 2480,
  targetHeight: number = 3496
): Promise<HTMLCanvasElement> {
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(svgElement);

  // Ensure xmlns and rendering hints are present
  if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgString = svgString.replace(
      "<svg ",
      '<svg xmlns="http://www.w3.org/2000/svg" text-rendering="geometricPrecision" shape-rendering="geometricPrecision" '
    );
  } else if (!svgString.includes("text-rendering")) {
    svgString = svgString.replace(
      "<svg ",
      '<svg text-rendering="geometricPrecision" shape-rendering="geometricPrecision" '
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
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) {
        URL.revokeObjectURL(blobURL);
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Maximize canvas smoothing quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Fill pure white background
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
 * Exports ultra-high-definition print-ready A6 PDF (105mm × 148mm)
 * Rendered at 600 DPI commercial press resolution (2480 × 3496 px)
 * for razor-sharp typography, crisp QR code, and perfect logo rendering.
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

  // Exact physical A6 dimensions:
  // Trim: 105 mm x 148 mm
  // Bleed (3mm): 111 mm x 154 mm
  const pdfWidthMm = hasBleed ? 111 : 105;
  const pdfHeightMm = hasBleed ? 154 : 148;

  // Ultra-HD 600 DPI canvas resolution for pin-sharp print text
  // 105mm at 600 DPI = ~2480 px
  // 148mm at 600 DPI = ~3496 px
  // 111mm at 600 DPI = ~2622 px
  // 154mm at 600 DPI = ~3638 px
  const targetPxW = (hasBleed ? 1311 : 1240) * 2;
  const targetPxH = (hasBleed ? 1819 : 1748) * 2;

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
    "SLOW" // Highest quality resampling in jsPDF
  );

  // If crop marks requested
  if (hasCropMarks && hasBleed) {
    const bleedMm = 3;
    const markLen = 4;
    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.25);

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
 * Exports ultra-high resolution 600 DPI PNG (2480 × 3496 px trim)
 * for crisp digital printing and sign shops.
 */
export async function exportStandeePng(
  svgElement: SVGSVGElement,
  filename: string = "a6-standee",
  options: ExportOptions = {}
): Promise<void> {
  const hasBleed = Boolean(options.bleed);
  // 600 DPI Ultra-HD resolution
  const targetPxW = (hasBleed ? 1311 : 1240) * 2;
  const targetPxH = (hasBleed ? 1819 : 1748) * 2;

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

/**
 * Exports standard CR80 Smart NFC Card (85.6mm × 53.98mm) as 300 DPI PNG.
 */
export async function exportCardPng(
  svgElement: SVGSVGElement,
  filename: string = "nfc-card"
): Promise<void> {
  const targetPxW = 1011;
  const targetPxH = 638;

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
 * Exports standard CR80 Smart NFC Card (85.6mm × 53.98mm) as print-ready PDF.
 * If both front and back SVGs are provided, outputs a 2-page duplex print PDF.
 */
export async function exportCardPdf(
  frontSvg: SVGSVGElement,
  backSvg?: SVGSVGElement | null,
  filename: string = "nfc-card-print"
): Promise<void> {
  const cardWidthMm = 85.6;
  const cardHeightMm = 53.98;

  const canvasFront = await svgToCanvas(frontSvg, 1011, 638);
  const frontImgData = canvasFront.toDataURL("image/png", 1.0);

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [cardWidthMm, cardHeightMm],
    compress: true,
  });

  doc.addImage(frontImgData, "PNG", 0, 0, cardWidthMm, cardHeightMm, undefined, "FAST");

  if (backSvg) {
    doc.addPage([cardWidthMm, cardHeightMm], "landscape");
    const canvasBack = await svgToCanvas(backSvg, 1011, 638);
    const backImgData = canvasBack.toDataURL("image/png", 1.0);
    doc.addImage(backImgData, "PNG", 0, 0, cardWidthMm, cardHeightMm, undefined, "FAST");
  }

  doc.save(`${filename}.pdf`);
}


