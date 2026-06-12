import { Resvg } from '@resvg/resvg-js';

export type RasterOptions = {
  // Optional pixel-height override; otherwise inherits the SVG's intrinsic height.
  height?: number;
  background?: string;
};

export const svgToPng = (svg: string, opts: RasterOptions = {}): Buffer => {
  const resvg = new Resvg(svg, {
    background: opts.background,
    fitTo: opts.height ? { mode: 'height', value: opts.height } : { mode: 'original' },
  });
  return resvg.render().asPng();
};
