declare module "qrcode/lib/core/qrcode" {
  export function create(
    text: string,
    options?: { errorCorrectionLevel?: "L" | "M" | "Q" | "H" }
  ): unknown;
}

declare module "qrcode/lib/renderer/svg-tag" {
  export function render(
    qrData: unknown,
    options?: {
      margin?: number;
      width?: number;
      color?: { dark?: string; light?: string };
    }
  ): string;
}

