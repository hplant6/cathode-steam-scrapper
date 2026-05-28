export { loadImage } from './composite.js';

function containFit(ctx, img, dx, dy, dw, dh) {
  const scale = Math.min(dw / img.naturalWidth, dh / img.naturalHeight);
  const scaledW = img.naturalWidth * scale;
  const scaledH = img.naturalHeight * scale;
  ctx.drawImage(img, dx + (dw - scaledW) / 2, dy + (dh - scaledH) / 2, scaledW, scaledH);
}

function drawFit(ctx, img, cx, cy, maxW, maxH, alpha = 1, transform = null) {
  const s = transform ? transform.scale : 1;
  const scale = Math.min((maxW * s) / img.naturalWidth, (maxH * s) / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const tx = transform ? transform.x : 0;
  const ty = transform ? transform.y : 0;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, cx + tx - dw / 2, cy + ty - dh / 2, dw, dh);
  ctx.restore();
}

export function compositePhysical(logoImg, diskImg, steamLogoImg, flip = false, coverImg = null, maskImg = null, coverTransform = { x: 0, y: 0, scale: 1 }, layout = null, dvdLogoImg = null, showMarquee = false, logoTransform = null, steamTransform = null, dvdTransform = null) {
  const W = diskImg.naturalWidth;
  const H = diskImg.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const cx = W / 2;
  const cy = H / 2;
  const diskRadius = W * 0.463;

  // Style 3: fill label donut with cover art using mask, then overlay disk
  if (coverImg && maskImg) {
    const tmp = document.createElement('canvas');
    tmp.width = W; tmp.height = H;
    const tc = tmp.getContext('2d');
    tc.save();
    tc.translate(cx + coverTransform.x, cy + coverTransform.y);
    tc.scale(coverTransform.scale, coverTransform.scale);
    tc.translate(-cx, -cy);
    containFit(tc, coverImg, 0, 0, W, H);
    tc.restore();
    tc.globalCompositeOperation = 'destination-in';
    tc.drawImage(maskImg, 0, 0, W, H);
    ctx.drawImage(tmp, 0, 0);
  }

  ctx.drawImage(diskImg, 0, 0);

  if (maskImg) {
    if (showMarquee && logoImg) {
      if (layout) {
        drawFit(ctx, logoImg, layout.marqueeCx, layout.marqueeCy, layout.marqueeMaxW, layout.marqueeMaxH, layout.marqueeAlpha ?? 1, logoTransform);
      } else {
        const marqueeCy = flip ? cy + diskRadius * 0.42 + 100 : cy - diskRadius * 0.36 - 90;
        const yFromCenter = Math.abs(marqueeCy - cy);
        const chordHalfW = Math.sqrt(Math.max(0, diskRadius * diskRadius - yFromCenter * yFromCenter));
        drawFit(ctx, logoImg, cx, marqueeCy, chordHalfW * 1.5, diskRadius * 0.30, 1, logoTransform);
      }
    }
    return canvas;
  }

  // Style with explicit layout (e.g. floppy)
  if (layout) {
    if (showMarquee && logoImg) drawFit(ctx, logoImg, layout.marqueeCx, layout.marqueeCy, layout.marqueeMaxW, layout.marqueeMaxH, layout.marqueeAlpha ?? 1, logoTransform);
    if (steamLogoImg) drawFit(ctx, steamLogoImg, layout.steamCx, layout.steamCy, layout.steamMaxW, layout.steamMaxH, layout.steamAlpha ?? 1, steamTransform);
    return canvas;
  }

  // CD styles 1 & 2: chord-constrained positioning
  const marqueeCy = flip ? cy + diskRadius * 0.42 + 100 : cy - diskRadius * 0.36 - 90;
  const steamCy   = flip ? cy - diskRadius * 0.36 - 120  : cy + diskRadius * 0.42 + 100;

  if (showMarquee && logoImg) {
    const yFromCenter = Math.abs(marqueeCy - cy);
    const chordHalfW = Math.sqrt(Math.max(0, diskRadius * diskRadius - yFromCenter * yFromCenter));
    drawFit(ctx, logoImg, cx, marqueeCy, chordHalfW * 1.5, diskRadius * 0.30, 1, logoTransform);
  }

  if (steamLogoImg) {
    const yFromCenter = Math.abs(steamCy - cy);
    const chordHalfW = Math.sqrt(Math.max(0, diskRadius * diskRadius - yFromCenter * yFromCenter));
    drawFit(ctx, steamLogoImg, cx, steamCy, chordHalfW * 1.17, diskRadius * 0.182, 1, steamTransform);
  }

  // DVD logo: vertical center, right 30% of disk
  if (dvdLogoImg) {
    const dvdCx = cx + diskRadius * 0.70 + 15;
    drawFit(ctx, dvdLogoImg, dvdCx, cy, diskRadius * 0.331, diskRadius * 0.144, 1, dvdTransform);
  }

  return canvas;
}
