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

/**
 * Exports two A6 standees placed side-by-side at the top of a single A4 sheet (210mm × 297mm)
 * at maximum commercial print quality (600 DPI Ultra-HD press resolution).
 * Standee 1 is placed at (0, 0, 105mm, 148mm)
 * Standee 2 is placed at (105mm, 0, 105mm, 148mm)
 * Exactly fits across the top of an A4 sheet with dashed cut lines and scissor markers.
 */
export async function exportTwoUpA4Pdf(
  svgElement: SVGSVGElement,
  design: StandeeDesign,
  filename: string = "reviewly-2up-a4-standees",
  options: ExportOptions = {}
): Promise<void> {
  const a4WidthMm = 210;
  const a4HeightMm = 297;
  const a6WidthMm = 105;
  const a6HeightMm = 148;

  // Render A6 artwork at 600 DPI press resolution (2480 × 3496 px)
  const targetPxW = 2480;
  const targetPxH = 3496;

  const canvas = await svgToCanvas(svgElement, targetPxW, targetPxH);
  const imgData = canvas.toDataURL("image/png", 1.0);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  // 1. Draw Standee 1 (Top Left: 0 to 105 mm)
  doc.addImage(
    imgData,
    "PNG",
    0,
    0,
    a6WidthMm,
    a6HeightMm,
    undefined,
    "SLOW" // Highest quality Lanczos/bicubic resampling
  );

  // 2. Draw Standee 2 (Top Right: 105 to 210 mm)
  doc.addImage(
    imgData,
    "PNG",
    a6WidthMm,
    0,
    a6WidthMm,
    a6HeightMm,
    undefined,
    "SLOW"
  );

  // 3. Cut Guidelines & Trim Marks (Strictly within the top 148 mm boundary)
  doc.setDrawColor(160, 160, 160);
  doc.setLineDashPattern([2, 1.5], 0);
  doc.setLineWidth(0.35);

  // Center vertical cut line (from top edge 0 mm to bottom cut boundary 148 mm only)
  doc.line(a6WidthMm, 0, a6WidthMm, a6HeightMm);

  // Horizontal bottom cut line across the page at 148 mm boundary
  doc.line(0, a6HeightMm, a4WidthMm, a6HeightMm);

  // Reset dash pattern for solid guide lines
  doc.setLineDashPattern([], 0);

  // Subtle scissors markers and trim text placed along the cut boundary inside the standee area (y = 146 mm)
  // so the bottom half (y > 148 mm) remains 100% pure blank paper for printer reuse.
  doc.setFontSize(7.5);
  doc.setTextColor(130, 140, 150);

  // Center cut label
  doc.text("✂ 105 mm", a6WidthMm, 146, { align: "center" });

  // Left & right horizontal cut labels
  doc.text("✂ CUT LINE (148 mm)", 6, 146);
  doc.text("✂ CUT LINE (148 mm)", a4WidthMm - 6, 146, { align: "right" });

  // 4. Lower Half (148 mm to 297 mm): 100% Pure Blank Paper
  // Intentionally left blank with zero ink so the user can cleanly trim off the 2 A6 standees
  // and reload the pristine leftover A5-size sheet (210 × 149 mm) back into any printer or reuse it.

  doc.save(`${filename}.pdf`);
}

/**
 * Exports two A6 standees placed side-by-side at the top of a single A4 sheet as a high-resolution PNG
 * (2480 × 3508 px at 300 DPI) ready for any photo printer or digital print service.
 */
export async function exportTwoUpA4Png(
  svgElement: SVGSVGElement,
  filename: string = "reviewly-2up-a4-standees",
  options: ExportOptions = {}
): Promise<void> {
  // A4 at 300 DPI: 2480 × 3508 px
  // Each A6 at 300 DPI: 1240 × 1748 px
  const a4Width = 2480;
  const a4Height = 3508;
  const a6Width = 1240;
  const a6Height = 1748;

  // Render standee SVG at A6 300 DPI
  const standeeCanvas = await svgToCanvas(svgElement, a6Width, a6Height);

  // Create A4 master canvas
  const masterCanvas = document.createElement("canvas");
  masterCanvas.width = a4Width;
  masterCanvas.height = a4Height;
  const ctx = masterCanvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Could not create A4 canvas context");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Pure white paper background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, a4Width, a4Height);

  // 1. Draw Standee 1 on Top Left (0, 0, 1240, 1748)
  ctx.drawImage(standeeCanvas, 0, 0, a6Width, a6Height);

  // 2. Draw Standee 2 on Top Right (1240, 0, 1240, 1748)
  ctx.drawImage(standeeCanvas, a6Width, 0, a6Width, a6Height);

  // 3. Dashed Cut Guidelines (Strictly within top 1748 px)
  ctx.strokeStyle = "#94A3B8";
  ctx.lineWidth = 4;
  ctx.setLineDash([16, 12]);

  // Center vertical line (from y = 0 to y = 1748 only - stops at cut boundary)
  ctx.beginPath();
  ctx.moveTo(a6Width, 0);
  ctx.lineTo(a6Width, a6Height);
  ctx.stroke();

  // Horizontal bottom line across the sheet at 148 mm boundary (y = 1748)
  ctx.beginPath();
  ctx.moveTo(0, a6Height);
  ctx.lineTo(a4Width, a6Height);
  ctx.stroke();

  // Reset dash
  ctx.setLineDash([]);

  // Cut text markers (positioned at y = 1724 inside top half so zero ink on lower half)
  ctx.fillStyle = "#94A3B8";
  ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("✂ 105 mm", a6Width, a6Height - 24);

  ctx.textAlign = "left";
  ctx.fillText("✂ CUT LINE (148 mm)", 30, a6Height - 24);
  ctx.textAlign = "right";
  ctx.fillText("✂ CUT LINE (148 mm)", a4Width - 30, a6Height - 24);

  // 4. Lower Half (y: 1748 -> 3508): 100% Clean Blank White Paper
  // Intentionally left blank with zero ink so the user can cleanly trim off the 2 A6 standees
  // and reload the pristine leftover A5-size sheet (210 × 149 mm) back into any printer or reuse it.

  // Download Blob
  masterCanvas.toBlob((blob) => {
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


