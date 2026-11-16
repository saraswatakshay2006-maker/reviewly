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

  // 3. Cut Guidelines & Trim Marks
  doc.setDrawColor(150, 150, 150);
  doc.setLineDashPattern([2, 1.5], 0);
  doc.setLineWidth(0.35);

  // Center vertical cut line (from top edge through 156 mm)
  doc.line(a6WidthMm, 0, a6WidthMm, 156);

  // Horizontal bottom cut line (from 0 to 210 mm)
  doc.line(0, a6HeightMm, a4WidthMm, a6HeightMm);

  // Reset dash pattern for solid guide lines
  doc.setLineDashPattern([], 0);

  // Scissors markers & cut text
  doc.setFontSize(8);
  doc.setTextColor(100, 110, 120);

  // Center cut label
  doc.text("✂ CUT HERE (105 mm Center)", a6WidthMm, 153, { align: "center" });

  // Left & right horizontal cut labels
  doc.text("✂ CUT LINE (148 mm)", 8, 146);
  doc.text("✂ CUT LINE (148 mm)", a4WidthMm - 8, 146, { align: "right" });

  // 4. Lower Half: Professional Print & Assembly Instructions Box
  const boxX = 14;
  const boxY = 166;
  const boxW = a4WidthMm - boxX * 2;
  const boxH = 115;

  // Background card for lower instructions
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(boxX, boxY, boxW, boxH, 4, 4, "FD");

  // Title
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("2x A6 Tabletop Review Standees — Ready to Print & Cut", boxX + 8, boxY + 12);

  // Subtitle / Specs badge
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(
    `A4 Sheet (210 × 297 mm) • Top Half 2-Up Layout • 600 DPI Commercial Press Master`,
    boxX + 8,
    boxY + 19
  );

  // Divider line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(boxX + 8, boxY + 24, boxX + boxW - 8, boxY + 24);

  // Instructions Header
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Quick 3-Step Setup Guide:", boxX + 8, boxY + 32);

  // Step 1
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(2, 132, 199);
  doc.text("1. Print at 100% Scale:", boxX + 8, boxY + 41);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(
    "Print on heavy cardstock (300–350 GSM) or glossy photo paper. In your printer dialog, ensure",
    boxX + 46,
    boxY + 41
  );
  doc.text(
    "scaling is set to 100% / Actual Size (disable 'Fit to Page' or 'Shrink to Fit').",
    boxX + 8,
    boxY + 47
  );

  // Step 2
  doc.setFont("helvetica", "bold");
  doc.setTextColor(2, 132, 199);
  doc.text("2. Trim Both Cards:", boxX + 8, boxY + 57);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(
    "Using a paper cutter or scissors, slice along the horizontal dashed line (148 mm),",
    boxX + 42,
    boxY + 57
  );
  doc.text(
    "then cut straight down the vertical center line (105 mm). You now have two identical A6 standees.",
    boxX + 8,
    boxY + 63
  );

  // Step 3
  doc.setFont("helvetica", "bold");
  doc.setTextColor(2, 132, 199);
  doc.text("3. Tabletop Stand & NFC:", boxX + 8, boxY + 73);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(
    "Slide each card into an A6 acrylic L-stand or T-stand. Stick an NTAG213/215 NFC sticker on",
    boxX + 50,
    boxY + 73
  );
  doc.text(
    "the back of the TAP area on each standee and program it to your live review link.",
    boxX + 8,
    boxY + 79
  );

  // Business Metadata Footer inside guide box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(boxX + 8, boxY + 86, boxW - 16, 20, 2, 2, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(`Business: ${design.businessName || "Your Business"}`, boxX + 12, boxY + 94);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Theme: ${design.themeId} • Mode: Dual Standee A4 2-Up`, boxX + 12, boxY + 101);

  doc.text(
    `Reviewly SaaS Print Master • Generated: ${new Date().toLocaleDateString()}`,
    boxX + boxW - 12,
    boxY + 98,
    { align: "right" }
  );

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

  // 3. Dashed Cut Guidelines
  ctx.strokeStyle = "#94A3B8";
  ctx.lineWidth = 4;
  ctx.setLineDash([16, 12]);

  // Center vertical line
  ctx.beginPath();
  ctx.moveTo(a6Width, 0);
  ctx.lineTo(a6Width, a6Height + 80);
  ctx.stroke();

  // Horizontal bottom line
  ctx.beginPath();
  ctx.moveTo(0, a6Height);
  ctx.lineTo(a4Width, a6Height);
  ctx.stroke();

  // Reset dash
  ctx.setLineDash([]);

  // Cut text
  ctx.fillStyle = "#64748B";
  ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("✂ CUT HERE (105 mm Center)", a6Width, a6Height + 60);

  ctx.textAlign = "left";
  ctx.fillText("✂ CUT LINE (148 mm Bottom)", 40, a6Height - 20);
  ctx.textAlign = "right";
  ctx.fillText("✂ CUT LINE (148 mm Bottom)", a4Width - 40, a6Height - 20);

  // 4. Instructions Box on Lower Half
  const boxX = 140;
  const boxY = 1960;
  const boxW = a4Width - boxX * 2;
  const boxH = 1350;

  // Background rounded card
  ctx.fillStyle = "#F8FAFC";
  ctx.strokeStyle = "#CBD5E1";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 32);
  ctx.fill();
  ctx.stroke();

  // Title
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 56px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("2x A6 Tabletop Review Standees — Ready to Print & Cut", boxX + 80, boxY + 130);

  // Subtitle
  ctx.fillStyle = "#64748B";
  ctx.font = "600 32px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(
    "A4 Sheet (210 × 297 mm) • Top Half 2-Up Layout • Ultra-HD 300 DPI Master",
    boxX + 80,
    boxY + 200
  );

  // Horizontal line
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(boxX + 80, boxY + 260);
  ctx.lineTo(boxX + boxW - 80, boxY + 260);
  ctx.stroke();

  // Section Header
  ctx.fillStyle = "#1E293B";
  ctx.font = "bold 40px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("Quick 3-Step Setup Guide:", boxX + 80, boxY + 350);

  // Step 1
  ctx.fillStyle = "#0284C7";
  ctx.font = "bold 34px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("1. Print at 100% Scale:", boxX + 80, boxY + 450);
  ctx.fillStyle = "#334155";
  ctx.font = "500 32px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(
    "Print on heavy cardstock (300–350 GSM) or glossy photo paper. Set scale to 100% (disable 'Fit to Page').",
    boxX + 80,
    boxY + 510
  );

  // Step 2
  ctx.fillStyle = "#0284C7";
  ctx.font = "bold 34px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("2. Trim Along Guidelines:", boxX + 80, boxY + 630);
  ctx.fillStyle = "#334155";
  ctx.font = "500 32px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(
    "Cut across the horizontal line (148 mm), then down the center line (105 mm) to get 2 identical A6 standees.",
    boxX + 80,
    boxY + 690
  );

  // Step 3
  ctx.fillStyle = "#0284C7";
  ctx.font = "bold 34px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("3. Tabletop Stand & NFC:", boxX + 80, boxY + 810);
  ctx.fillStyle = "#334155";
  ctx.font = "500 32px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(
    "Slide cards into A6 acrylic stands. Stick NTAG213/215 stickers behind TAP and program to your review URL.",
    boxX + 80,
    boxY + 870
  );

  // Footer inside box
  ctx.fillStyle = "#E2E8F0";
  ctx.beginPath();
  ctx.roundRect(boxX + 80, boxY + 980, boxW - 160, 240, 20);
  ctx.fill();

  ctx.fillStyle = "#1E293B";
  ctx.font = "bold 34px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("Reviewly SaaS Print Master", boxX + 130, boxY + 1070);
  ctx.fillStyle = "#64748B";
  ctx.font = "500 28px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("A6 Tabletop QR + NFC Standee Designer • Ready for commercial or desktop printing", boxX + 130, boxY + 1140);

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


