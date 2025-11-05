declare module 'qrcode.react' {
  import type { ComponentClass, CanvasHTMLAttributes, SVGProps } from 'react';

  interface ImageSettings {
    src: string;
    x?: number;
    y?: number;
    height?: number;
    width?: number;
    excavate?: boolean;
  }

  interface BaseQRCodeProps {
    value: string;
    size?: number;
    includeMargin?: boolean;
    bgColor?: string;
    fgColor?: string;
    level?: 'L' | 'M' | 'Q' | 'H';
    imageSettings?: ImageSettings;
  }

  type CanvasQRCodeProps = BaseQRCodeProps & {
    renderAs?: 'canvas';
  } & CanvasHTMLAttributes<HTMLCanvasElement>;

  type SvgQRCodeProps = BaseQRCodeProps & {
    renderAs: 'svg';
  } & SVGProps<SVGSVGElement>;

  type QRCodeComponent = ComponentClass<CanvasQRCodeProps | SvgQRCodeProps>;

  const QRCode: QRCodeComponent;
  export default QRCode;
}
