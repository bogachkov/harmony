// Full-face contact sheet: tile given pack PNGs (front/tq/profile) into one
// image so the WHOLE face is reviewed every change — guards against silent
// per-feature regressions.
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

const packs = process.argv.slice(2);
const views = ['front','tq','profile'];
const CELL = 200, PAD = 6;
const cols = views.length, rows = packs.length;
const W = cols*CELL + (cols+1)*PAD, H = rows*CELL + (rows+1)*PAD;
const sheet = new PNG({ width: W, height: H });
sheet.data.fill(255);
for (let r=0;r<rows;r++) for (let c=0;c<cols;c++){
  let png;
  try {
    const svg = readFileSync(`/tmp/grid/${packs[r]}-${views[c]}.svg`,'utf8');
    png = PNG.sync.read(new Resvg(svg,{fitTo:{mode:'width',value:CELL}}).render().asPng());
  } catch { continue; }
  const ox = PAD + c*(CELL+PAD), oy = PAD + r*(CELL+PAD);
  for (let y=0;y<png.height && y<CELL;y++) for (let x=0;x<png.width && x<CELL;x++){
    const si=(y*png.width+x)<<2, di=((oy+y)*W+(ox+x))<<2;
    sheet.data[di]=png.data[si]; sheet.data[di+1]=png.data[si+1];
    sheet.data[di+2]=png.data[si+2]; sheet.data[di+3]=255;
  }
}
writeFileSync('/tmp/contact.png', PNG.sync.write(sheet));
console.log('contact sheet:', packs.join(','), 'x', views.join(','));
