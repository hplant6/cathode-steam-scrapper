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

function hitTestDrawFit(px, py, img, cx, cy, maxW, maxH, transform) {
  if (!img) return false;
  const s = transform ? transform.scale : 1;
  const scale = Math.min((maxW * s) / img.naturalWidth, (maxH * s) / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const tx = transform ? transform.x : 0;
  const ty = transform ? transform.y : 0;
  const x = cx + tx - dw / 2;
  const y = cy + ty - dh / 2;
  return px >= x && px <= x + dw && py >= y && py <= y + dh;
}

export function hitTestPhysicalLogos(px, py, {
  diskImg, logoImg, steamLogoImg, dvdLogoImg, esrbLogoImg,
  flip, maskImg, layout,
  showMarquee, showSteamLogo, showDvdLogo,
  logoTransform, steamTransform, dvdTransform, esrbTransform,
}) {
  const W = diskImg.naturalWidth;
  const H = diskImg.naturalHeight;
  const cx = W / 2;
  const cy = H / 2;
  const diskRadius = W * 0.463;

  if (maskImg) {
    if (showMarquee && logoImg) {
      if (layout) {
        if (hitTestDrawFit(px, py, logoImg, layout.marqueeCx, layout.marqueeCy, layout.marqueeMaxW, layout.marqueeMaxH, logoTransform)) return 'logo';
      } else {
        const marqueeCy = flip ? cy + diskRadius * 0.42 + 100 : cy - diskRadius * 0.36 - 90;
        const yFromCenter = Math.abs(marqueeCy - cy);
        const chordHalfW = Math.sqrt(Math.max(0, diskRadius * diskRadius - yFromCenter * yFromCenter));
        if (hitTestDrawFit(px, py, logoImg, cx, marqueeCy, chordHalfW * 1.5, diskRadius * 0.30, logoTransform)) return 'logo';
      }
    }
    if (esrbLogoImg) {
      const eCx = layout ? W * 0.14 + 40 : cx - diskRadius * 0.72;
      const eCy = layout ? H * 0.89 : cy;
      const eSz = layout ? Math.min(W, H) * 0.12 : diskRadius * 0.22;
      if (hitTestDrawFit(px, py, esrbLogoImg, eCx, eCy, eSz, eSz, esrbTransform)) return 'esrb';
    }
    return null;
  }

  if (layout) {
    if (showMarquee && logoImg) {
      if (hitTestDrawFit(px, py, logoImg, layout.marqueeCx, layout.marqueeCy, layout.marqueeMaxW, layout.marqueeMaxH, logoTransform)) return 'logo';
    }
    if (showSteamLogo && steamLogoImg) {
      if (hitTestDrawFit(px, py, steamLogoImg, layout.steamCx, layout.steamCy, layout.steamMaxW, layout.steamMaxH, steamTransform)) return 'steam';
    }
    if (esrbLogoImg) {
      if (hitTestDrawFit(px, py, esrbLogoImg, W * 0.14 + 40, H * 0.89, W * 0.12, H * 0.12, esrbTransform)) return 'esrb';
    }
    return null;
  }

  const marqueeCy = flip ? cy + diskRadius * 0.42 + 100 : cy - diskRadius * 0.36 - 90;
  const steamCy   = flip ? cy - diskRadius * 0.36 - 120  : cy + diskRadius * 0.42 + 100;

  if (showMarquee && logoImg) {
    const yFromCenter = Math.abs(marqueeCy - cy);
    const chordHalfW = Math.sqrt(Math.max(0, diskRadius * diskRadius - yFromCenter * yFromCenter));
    if (hitTestDrawFit(px, py, logoImg, cx, marqueeCy, chordHalfW * 1.5, diskRadius * 0.30, logoTransform)) return 'logo';
  }
  if (showSteamLogo && steamLogoImg) {
    const yFromCenter = Math.abs(steamCy - cy);
    const chordHalfW = Math.sqrt(Math.max(0, diskRadius * diskRadius - yFromCenter * yFromCenter));
    if (hitTestDrawFit(px, py, steamLogoImg, cx, steamCy, chordHalfW * 1.17, diskRadius * 0.182, steamTransform)) return 'steam';
  }
  if (showDvdLogo && dvdLogoImg) {
    const dvdCx = cx + diskRadius * 0.70 + 15;
    if (hitTestDrawFit(px, py, dvdLogoImg, dvdCx, cy, diskRadius * 0.331, diskRadius * 0.144, dvdTransform)) return 'dvd';
  }
  if (esrbLogoImg) {
    if (hitTestDrawFit(px, py, esrbLogoImg, cx - diskRadius * 0.72, cy, diskRadius * 0.22, diskRadius * 0.22, esrbTransform)) return 'esrb';
  }
  return null;
}

export function compositePhysical(logoImg, diskImg, steamLogoImg, flip = false, coverImg = null, maskImg = null, coverTransform = { x: 0, y: 0, scale: 1 }, layout = null, dvdLogoImg = null, showMarquee = false, logoTransform = null, steamTransform = null, dvdTransform = null, esrbLogoImg = null, esrbTransform = null) {
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
    if (esrbLogoImg) {
      if (layout) {
        drawFit(ctx, esrbLogoImg, W * 0.14 + 40, H * 0.89, W * 0.12, H * 0.12, 1, esrbTransform);
      } else {
        drawFit(ctx, esrbLogoImg, cx - diskRadius * 0.72, cy, diskRadius * 0.22, diskRadius * 0.22, 1, esrbTransform);
      }
    }
    return canvas;
  }

  // Style with explicit layout (e.g. floppy)
  if (layout) {
    if (showMarquee && logoImg) drawFit(ctx, logoImg, layout.marqueeCx, layout.marqueeCy, layout.marqueeMaxW, layout.marqueeMaxH, layout.marqueeAlpha ?? 1, logoTransform);
    if (steamLogoImg) drawFit(ctx, steamLogoImg, layout.steamCx, layout.steamCy, layout.steamMaxW, layout.steamMaxH, layout.steamAlpha ?? 1, steamTransform);
    if (esrbLogoImg) drawFit(ctx, esrbLogoImg, W * 0.14 + 40, H * 0.89, W * 0.12, H * 0.12, 1, esrbTransform);
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

  // ESRB badge: vertical center, left side of disk
  if (esrbLogoImg) {
    drawFit(ctx, esrbLogoImg, cx - diskRadius * 0.72, cy, diskRadius * 0.22, diskRadius * 0.22, 1, esrbTransform);
  }

  return canvas;
}
