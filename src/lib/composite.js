// Front face of public/steam-boxart.png (template is 567x878).
// The transparent window is a PARALLELOGRAM, not a rectangle — the STEAM
// banner's bottom edge is angled (lower on the right), so TL sits above TR
// and BL sits below BR.  Setting perspective: 0 lets the
// parallelogram geometry supply the 3D lean on its own; no extra warp needed.
//
// To add projective foreshortening on top of the lean, set perspective > 0
// (positive → LEFT closer / right compressed) or < 0 (RIGHT closer).
export const FRONT_FACE = {
  templateWidth: 567,
  templateHeight: 878,
  corners: [
    { x: 38,  y: 112 }, // [0] top-left  (TL)
    { x: 547, y: 148 }, // [1] top-right (TR) — 36px lower (matches template slope)
    { x: 547, y: 837 }, // [2] bottom-right (BR)
    { x: 38,  y: 869 }, // [3] bottom-left  (BL) — 32px lower (matches template slope)
  ],
  perspective: 0,
  // Spine title: rendered rotated 90° CW over the cyan band on the case spine.
  // Coordinates are in template pixel space (567x878).
  spine: {
    cx: 23,        // horizontal center of the cyan spine band
    cy: 476,       // vertical center between case top and bottom
    maxLength: 660, // max length of rotated text (≈ inner spine height)
    fontFamily: '"Inter", system-ui, sans-serif',
    fontWeight: 700,
    fontSize: 22,  // base size; auto-shrinks if title doesn't fit
    color: '#ffffff',
  },
};

// Style 1 box art (box3d-1.png / 567×878).
// coverQuad: extends to spine left edge so the spine bg naturally shows
// the left-edge continuation of the same warp.
export const BOX3D = {
  coverQuad: [
    { x: 9,   y: 115 }, // TL — extends left to include spine face
    { x: 546, y: 150 }, // TR
    { x: 546, y: 832 }, // BR
    { x: 9,   y: 862 }, // BL
  ],
  spineText: {
    cx: 23, cy: 488,
    maxLength: 700,
    fontFamily: '"Barlow Condensed", system-ui, sans-serif',
    fontWeight: 600,
    fontSize: 20,
    color: '#ffffff',
  },
  spineLogoArea: { cx: 23, cy: 488, maxW: 26, maxH: 680 },
};

// Style 5 — taller cover face, starts at y=20 instead of y=115
export const BOX3D_5 = {
  coverQuad: [
    { x: 9,   y: 20  }, // TL
    { x: 546, y: 64  }, // TR
    { x: 546, y: 833 }, // BR
    { x: 9,   y: 862 }, // BL
  ],
  spineText: {
    cx: 23, cy: 441,
    maxLength: 820,
    fontFamily: '"Barlow Condensed", system-ui, sans-serif',
    fontWeight: 600,
    fontSize: 20,
    color: '#ffffff',
  },
  spineLogoArea: { cx: 23, cy: 441, maxW: 26, maxH: 820 },
};

// Style 8 — BOX3D_5 quad expanded ~10px on each side to fill the wider face
export const BOX3D_8 = {
  coverQuad: [
    { x: -1,  y: 10  }, // TL
    { x: 556, y: 54  }, // TR
    { x: 556, y: 843 }, // BR
    { x: -1,  y: 872 }, // BL
  ],
  // Spine face corners (narrow left strip, steep lean to match box bottom slope)
  spineQuad: [
    { x: 0,  y: 25  }, // TL
    { x: 46, y: 0   }, // TR
    { x: 46, y: 878 }, // BR
    { x: 0,  y: 853 }, // BL
  ],
  spineText: {
    cx: 43, cy: 441,
    maxLength: 820,
    fontFamily: '"Barlow Condensed", system-ui, sans-serif',
    fontWeight: 600,
    fontSize: 20,
    color: '#ffffff',
  },
  spineLogoArea: { cx: 23, cy: 441, maxW: 26, maxH: 820 },
};

function lerpQuad(quad, u, v) {
  const [tl, tr, br, bl] = quad;
  return {
    x: (1-u)*(1-v)*tl.x + u*(1-v)*tr.x + u*v*br.x + (1-u)*v*bl.x,
    y: (1-u)*(1-v)*tl.y + u*(1-v)*tr.y + u*v*br.y + (1-u)*v*bl.y,
  };
}

// Draw ESRB badge perspective-warped onto the cover face.
// Position (tx,ty) are pixel offsets from the default UV anchor (u=0.085, v=0.875).
function esrbBadgeQuad(coverQuad, transform, esrbImg) {
  const [tl, tr, , bl] = coverQuad;
  const quadW = Math.hypot(tr.x - tl.x, tr.y - tl.y);
  const quadH = Math.hypot(bl.x - tl.x, bl.y - tl.y);
  const s   = transform?.scale ?? 1;
  const tx  = transform?.x ?? 0;
  const ty  = transform?.y ?? 0;
  const cu  = 0.085 + tx / quadW;
  const cv  = 0.875 + ty / quadH;
  const buFrac = 0.13 * s;
  const bvFrac = buFrac * (esrbImg.naturalHeight / esrbImg.naturalWidth) * (quadW / quadH);
  return [
    lerpQuad(coverQuad, cu - buFrac / 2, cv - bvFrac / 2), // TL
    lerpQuad(coverQuad, cu + buFrac / 2, cv - bvFrac / 2), // TR
    lerpQuad(coverQuad, cu + buFrac / 2, cv + bvFrac / 2), // BR
    lerpQuad(coverQuad, cu - buFrac / 2, cv + bvFrac / 2), // BL
  ];
}

function drawEsrbOnFace(ctx, esrbImg, coverQuad, transform, W, H) {
  const quad = esrbBadgeQuad(coverQuad, transform, esrbImg);
  // SVGs fail silently as WebGL textures — rasterize to a bitmap canvas first.
  const rw = esrbImg.naturalWidth  || 200;
  const rh = esrbImg.naturalHeight || 200;
  const raster = document.createElement('canvas');
  raster.width  = rw;
  raster.height = rh;
  raster.getContext('2d').drawImage(esrbImg, 0, 0, rw, rh);
  const warped = warpPerspective(raster, quad, W, H, 0);
  ctx.drawImage(warped, 0, 0);
}

// Draw ESRB badge perspective-warped onto the spine face.
function drawEsrbOnSpine(ctx, esrbImg, spineQuad, transform, W, H) {
  const [tl, tr, , bl] = spineQuad;
  const quadW = Math.hypot(tr.x - tl.x, tr.y - tl.y);
  const quadH = Math.hypot(bl.x - tl.x, bl.y - tl.y);
  const s  = transform?.scale ?? 1;
  const tx = transform?.x ?? 0;
  const ty = transform?.y ?? 0;
  const cu = 0.5 + tx / quadW;
  const cv = 0.82 + ty / quadH;
  const buFrac = 0.8 * s;
  const bvFrac = buFrac * (esrbImg.naturalHeight / esrbImg.naturalWidth) * (quadW / quadH);
  const quad = [
    lerpQuad(spineQuad, cu - buFrac / 2, cv - bvFrac / 2),
    lerpQuad(spineQuad, cu + buFrac / 2, cv - bvFrac / 2),
    lerpQuad(spineQuad, cu + buFrac / 2, cv + bvFrac / 2),
    lerpQuad(spineQuad, cu - buFrac / 2, cv + bvFrac / 2),
  ];
  const rw = esrbImg.naturalWidth  || 200;
  const rh = esrbImg.naturalHeight || 200;
  const raster = document.createElement('canvas');
  raster.width = rw; raster.height = rh;
  raster.getContext('2d').drawImage(esrbImg, 0, 0, rw, rh);
  const warped = warpPerspective(raster, quad, W, H, 0);
  ctx.drawImage(warped, 0, 0);
}

function _steamSpineQuad(spineQuad, steamImg, transform) {
  const [tl, tr, , bl] = spineQuad;
  const quadW = Math.hypot(tr.x - tl.x, tr.y - tl.y);
  const quadH = Math.hypot(bl.x - tl.x, bl.y - tl.y);
  const rw = steamImg.naturalWidth  || steamImg.width  || 295;
  const rh = steamImg.naturalHeight || steamImg.height || 90;
  const sc = transform?.scale ?? 1;
  const tx = transform?.x ?? 0;
  const ty = transform?.y ?? 0;
  const buFrac = 0.7 * sc;
  const bvFrac = buFrac * (rw / rh) * (quadW / quadH);
  const cu = 0.5 + tx / quadW;
  const cv = 0.12 + ty / quadH;
  return [
    lerpQuad(spineQuad, cu - buFrac / 2, cv - bvFrac / 2),
    lerpQuad(spineQuad, cu + buFrac / 2, cv - bvFrac / 2),
    lerpQuad(spineQuad, cu + buFrac / 2, cv + bvFrac / 2),
    lerpQuad(spineQuad, cu - buFrac / 2, cv + bvFrac / 2),
  ];
}

function _steamFaceQuad(coverQuad, steamImg, transform) {
  const [tl, tr, , bl] = coverQuad;
  const quadW = Math.hypot(tr.x - tl.x, tr.y - tl.y);
  const quadH = Math.hypot(bl.x - tl.x, bl.y - tl.y);
  const rw = steamImg.naturalWidth  || steamImg.width  || 295;
  const rh = steamImg.naturalHeight || steamImg.height || 90;
  const sc = transform?.scale ?? 1;
  const tx = transform?.x ?? 0;
  const ty = transform?.y ?? 0;
  const buFrac = 0.15 * sc;
  const bvFrac = buFrac * (rh / rw) * (quadW / quadH);
  const cu = 0.5 + tx / quadW;
  const cv = 0.93 + ty / quadH;
  return [
    lerpQuad(coverQuad, cu - buFrac / 2, cv - bvFrac / 2),
    lerpQuad(coverQuad, cu + buFrac / 2, cv - bvFrac / 2),
    lerpQuad(coverQuad, cu + buFrac / 2, cv + bvFrac / 2),
    lerpQuad(coverQuad, cu - buFrac / 2, cv + bvFrac / 2),
  ];
}

// Steam logo rotated 90° CW and perspective-warped onto the spine face (top portion).
function drawSteamOnSpine(ctx, steamImg, spineQuad, transform, W, H) {
  const rw = steamImg.naturalWidth  || steamImg.width  || 295;
  const rh = steamImg.naturalHeight || steamImg.height || 90;
  const rot = document.createElement('canvas');
  rot.width = rh; rot.height = rw;
  const rCtx = rot.getContext('2d');
  rCtx.translate(rh / 2, rw / 2);
  rCtx.rotate(Math.PI / 2);
  rCtx.drawImage(steamImg, 0, 0, rw, rh, -rw / 2, -rh / 2, rw, rh);
  const warped = warpPerspective(rot, _steamSpineQuad(spineQuad, steamImg, transform), W, H, 0);
  ctx.drawImage(warped, 0, 0);
}

// Steam logo perspective-warped onto the cover face (bottom-center).
function drawSteamOnFace(ctx, steamImg, coverQuad, transform, W, H) {
  const rw = steamImg.naturalWidth  || steamImg.width  || 295;
  const rh = steamImg.naturalHeight || steamImg.height || 90;
  const raster = document.createElement('canvas');
  raster.width = rw; raster.height = rh;
  raster.getContext('2d').drawImage(steamImg, 0, 0, rw, rh);
  const warped = warpPerspective(raster, _steamFaceQuad(coverQuad, steamImg, transform), W, H, 0);
  ctx.drawImage(warped, 0, 0);
}

export function hitTestBoxartSpineSteam(px, py, steamImg, transform, spineQuad) {
  if (!steamImg || !spineQuad) return false;
  const quad = _steamSpineQuad(spineQuad, steamImg, transform);
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const p = { x: px, y: py };
  const signs = [cross(quad[0], quad[1], p), cross(quad[1], quad[2], p), cross(quad[2], quad[3], p), cross(quad[3], quad[0], p)];
  return signs.every(v => v >= 0) || signs.every(v => v <= 0);
}

export function hitTestBoxartFrontSteam(px, py, steamImg, transform, coverQuad) {
  if (!steamImg) return false;
  const quad = _steamFaceQuad(coverQuad, steamImg, transform);
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const p = { x: px, y: py };
  const signs = [cross(quad[0], quad[1], p), cross(quad[1], quad[2], p), cross(quad[2], quad[3], p), cross(quad[3], quad[0], p)];
  return signs.every(v => v >= 0) || signs.every(v => v <= 0);
}

export function hitTestBoxartSpineEsrb(px, py, esrbImg, transform, spineQuad) {
  if (!esrbImg || !spineQuad) return false;
  const [tl, tr, , bl] = spineQuad;
  const quadW = Math.hypot(tr.x - tl.x, tr.y - tl.y);
  const quadH = Math.hypot(bl.x - tl.x, bl.y - tl.y);
  const s  = transform?.scale ?? 1;
  const tx = transform?.x ?? 0;
  const ty = transform?.y ?? 0;
  const cu = 0.5 + tx / quadW;
  const cv = 0.82 + ty / quadH;
  const buFrac = 0.8 * s;
  const bvFrac = buFrac * (esrbImg.naturalHeight / esrbImg.naturalWidth) * (quadW / quadH);
  const quad = [
    lerpQuad(spineQuad, cu - buFrac / 2, cv - bvFrac / 2),
    lerpQuad(spineQuad, cu + buFrac / 2, cv - bvFrac / 2),
    lerpQuad(spineQuad, cu + buFrac / 2, cv + bvFrac / 2),
    lerpQuad(spineQuad, cu - buFrac / 2, cv + bvFrac / 2),
  ];
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const p = { x: px, y: py };
  const signs = [
    cross(quad[0], quad[1], p),
    cross(quad[1], quad[2], p),
    cross(quad[2], quad[3], p),
    cross(quad[3], quad[0], p),
  ];
  return signs.every(s => s >= 0) || signs.every(s => s <= 0);
}

export function hitTestBoxartEsrb(px, py, esrbImg, esrbTransform, box3dConfig = BOX3D) {
  if (!esrbImg) return false;
  const quad = esrbBadgeQuad(box3dConfig.coverQuad, esrbTransform, esrbImg);
  // Point-in-convex-quad via cross-product sign consistency
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const p = { x: px, y: py };
  const signs = [
    cross(quad[0], quad[1], p),
    cross(quad[1], quad[2], p),
    cross(quad[2], quad[3], p),
    cross(quad[3], quad[0], p),
  ];
  return signs.every(s => s >= 0) || signs.every(s => s <= 0);
}

export function loadImage(src, { crossOrigin = 'anonymous' } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed to load ${src}`));
    img.src = src;
  });
}

// Composite the cover behind the template. The cover is fit "cover" style
// (fill area, crop overflow) into the quad. When the quad is axis-aligned
// AND no perspective foreshortening is requested, we use plain drawImage;
// otherwise we render via WebGL with projective texture mapping so the
// content (not just the outline) gets foreshortened.
export function composite(coverImg, templateImg, opts = {}) {
  const corners = opts.corners ?? FRONT_FACE.corners;
  const perspective = opts.perspective ?? FRONT_FACE.perspective;
  const title = opts.title ?? '';
  const coverTransform = opts.coverTransform ?? null;
  const spineTextColor = opts.spineTextColor ?? FRONT_FACE.spine.color;

  const canvas = document.createElement('canvas');
  canvas.width = templateImg.naturalWidth;
  canvas.height = templateImg.naturalHeight;
  const ctx = canvas.getContext('2d');

  if (coverImg) {
    if (perspective === 0 && isAxisAlignedRect(corners)) {
      const [tl, tr, , bl] = corners;
      drawCoverFit(ctx, coverImg, tl.x, tl.y, tr.x - tl.x, bl.y - tl.y, coverTransform);
    } else {
      const warped = warpPerspective(coverImg, corners, canvas.width, canvas.height, perspective, coverTransform);
      ctx.drawImage(warped, 0, 0);
    }
  }

  ctx.drawImage(templateImg, 0, 0);

  if (title) drawSpineTitle(ctx, title, { ...FRONT_FACE.spine, color: spineTextColor });

  return canvas;
}

// Draws the game title rotated 90° clockwise, centered over the cyan spine band.
function drawSpineTitle(ctx, title, spine = FRONT_FACE.spine) {
  const text = title.toUpperCase();
  const letterSpacing = spine.letterSpacing ?? 0;
  ctx.save();
  ctx.translate(spine.cx, spine.cy);
  ctx.rotate(Math.PI / 2); // 90° clockwise

  ctx.letterSpacing = `${letterSpacing}px`;

  // Shrink the font until the rotated text fits the available spine length.
  let size = spine.fontSize;
  ctx.font = `${spine.fontWeight} ${size}px ${spine.fontFamily}`;
  while (ctx.measureText(text).width > spine.maxLength && size > 8) {
    size -= 1;
    ctx.font = `${spine.fontWeight} ${size}px ${spine.fontFamily}`;
  }

  ctx.fillStyle = spine.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function isAxisAlignedRect(c) {
  return (
    c[0].y === c[1].y &&
    c[2].y === c[3].y &&
    c[0].x === c[3].x &&
    c[1].x === c[2].x
  );
}

// Fill the target rect with the image, cropping to preserve aspect.
// Optional transform { x, y, scale } pans and zooms the cover within the rect.
function drawCoverFit(ctx, img, dx, dy, dw, dh, transform = null) {
  const tx = transform?.x ?? 0;
  const ty = transform?.y ?? 0;
  const sc = transform?.scale ?? 1;

  ctx.save();
  ctx.beginPath();
  ctx.rect(dx, dy, dw, dh);
  ctx.clip();

  const qcx = dx + dw / 2;
  const qcy = dy + dh / 2;
  ctx.translate(qcx + tx, qcy + ty);
  ctx.scale(sc, sc);
  ctx.translate(-qcx, -qcy);

  const sW = img.naturalWidth;
  const sH = img.naturalHeight;
  const srcAspect = sW / sH;
  const dstAspect = dw / dh;
  let sx = 0, sy = 0, sw = sW, sh = sH;
  if (srcAspect > dstAspect) {
    sw = sH * dstAspect;
    sx = (sW - sw) / 2;
  } else {
    sh = sW / dstAspect;
    sy = (sH - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  ctx.restore();
}

// WebGL warp with projective texture mapping. The quad is drawn at the 4
// destination corners (which may be a trapezoid). Texture coordinates use a
// `q` (perspective) component so the LEFT side of the quad samples a smaller
// portion of the texture and the RIGHT side samples a larger portion — this
// foreshortens the content as if the right edge is receding from the viewer.
// `perspective` is the strength: 0 = affine, 0.6 = strong foreshortening.
function warpPerspective(img, corners, canvasW, canvasH, perspective = 0, coverTransform = null) {
  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const gl = canvas.getContext('webgl', { premultipliedAlpha: false, preserveDrawingBuffer: true });
  if (!gl) throw new Error('WebGL not supported');

  const vert = `
    attribute vec2 a_pos;
    attribute vec3 a_uvq;
    varying vec3 v_uvq;
    void main() {
      gl_Position = vec4(a_pos, 0.0, 1.0);
      v_uvq = a_uvq;
    }`;
  const frag = `
    precision mediump float;
    varying vec3 v_uvq;
    uniform sampler2D u_tex;
    void main() {
      gl_FragColor = texture2D(u_tex, v_uvq.xy / v_uvq.z);
    }`;

  const program = compileProgram(gl, vert, frag);
  gl.useProgram(program);

  const toNDC = (p) => [(p.x / canvasW) * 2 - 1, 1 - (p.y / canvasH) * 2];
  const [tl, tr, br, bl] = corners.map(toNDC);
  // Diagonal TR→BL avoids seam artifacts for left-side-closer perspective warp.
  const positions = new Float32Array([
    tl[0], tl[1],
    tr[0], tr[1],
    bl[0], bl[1],
    tr[0], tr[1],
    br[0], br[1],
    bl[0], bl[1],
  ]);

  // Cover-fit UV crop.
  const dstW = Math.hypot(corners[1].x - corners[0].x, corners[1].y - corners[0].y);
  const dstH = Math.hypot(corners[3].x - corners[0].x, corners[3].y - corners[0].y);
  const dstAspect = dstW / dstH;
  const srcAspect = (img.naturalWidth || img.width) / (img.naturalHeight || img.height);
  let u0 = 0, u1 = 1, v0 = 0, v1 = 1;
  if (srcAspect > dstAspect) {
    const crop = (1 - dstAspect / srcAspect) / 2;
    u0 = crop; u1 = 1 - crop;
  } else {
    const crop = (1 - srcAspect / dstAspect) / 2;
    v0 = crop; v1 = 1 - crop;
  }

  // Apply pan/zoom transform to UV window.
  if (coverTransform) {
    const tx = coverTransform.x ?? 0;
    const ty = coverTransform.y ?? 0;
    const sc = coverTransform.scale ?? 1;
    const uCenter = (u0 + u1) / 2 - tx / dstW;
    const vCenter = (v0 + v1) / 2 - ty / dstH;
    const uHalf = (u1 - u0) / 2 / sc;
    const vHalf = (v1 - v0) / 2 / sc;
    u0 = uCenter - uHalf;
    u1 = uCenter + uHalf;
    v0 = vCenter - vHalf;
    v1 = vCenter + vHalf;
  }

  // Projective texture coords for the foreshortening effect.
  //
  //   positive perspective → LEFT edge has the bigger q  → LEFT  closer
  //   negative perspective → RIGHT edge has the bigger q → RIGHT closer
  //
  // We pre-multiply (u,v) by q at each vertex so linear interpolation of
  // (u*q, v*q, q) across the triangle stays projective-correct; the fragment
  // shader divides by q to recover the perspective-warped texture coords.
  const qLeft  = perspective >= 0 ? 1 + perspective : 1;
  const qRight = perspective <  0 ? 1 - perspective : 1;
  const tlUVQ = [u0 * qLeft,  v0 * qLeft,  qLeft ]; // [0] TL — shares LEFT  q
  const trUVQ = [u1 * qRight, v0 * qRight, qRight]; // [1] TR — shares RIGHT q
  const brUVQ = [u1 * qRight, v1 * qRight, qRight]; // [2] BR — shares RIGHT q
  const blUVQ = [u0 * qLeft,  v1 * qLeft,  qLeft ]; // [3] BL — shares LEFT  q
  const uvqs = new Float32Array([
    ...tlUVQ, ...trUVQ, ...blUVQ,
    ...trUVQ, ...brUVQ, ...blUVQ,
  ]);

  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(program, 'a_pos');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uvBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
  gl.bufferData(gl.ARRAY_BUFFER, uvqs, gl.STATIC_DRAW);
  const uvLoc = gl.getAttribLocation(program, 'a_uvq');
  gl.enableVertexAttribArray(uvLoc);
  gl.vertexAttribPointer(uvLoc, 3, gl.FLOAT, false, 0, 0);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

  gl.viewport(0, 0, canvasW, canvasH);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  return canvas;
}

function compileProgram(gl, vertSrc, fragSrc) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p));
  }
  return p;
}

function compileShader(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s));
  }
  return s;
}

// Multi-layer box compositor used for the new mask-based styles (box3d-1 etc.).
// Layers (bottom-to-top):
//   1. Cover art warped to coverQuad → clipped by coverMaskImg (front face)
//   2. Same cover art (optionally with independent spineBgTransform) → clipped by spineMaskImg
//   3. Spine content: rotated title text OR logo image
//   4. templateImg overlay
export function compositeBoxart(coverImg, templateImg, coverMaskImg, spineMaskImg, opts = {}) {
  const W = templateImg.naturalWidth;
  const H = templateImg.naturalHeight;
  const {
    title = '',
    coverTransform = null,
    spineBgTransform = null,
    spineBgMode = 'cover',
    spineBgColor = '#000000',
    spineBgMirror = false,
    logoImg = null,
    logoTransform = null,
    spineShowText = true,
    spineTextColor = '#ffffff',
    spineLetterSpacing = 0,
    box3dConfig = BOX3D,
    esrbImg = null,
    esrbTransform = null,
    showSpineEsrb = false,
    spineEsrbTransform = null,
    steamImg = null,
    showSpineSteam = false,
    showFrontSteam = false,
    spineSteamTransform = null,
    frontSteamTransform = null,
  } = opts;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Front face layer (always needs cover art)
  if (coverImg) {
    const coverWarped = warpPerspective(coverImg, box3dConfig.coverQuad, W, H, 0, coverTransform);
    const frontTmp = document.createElement('canvas');
    frontTmp.width = W; frontTmp.height = H;
    const ftCtx = frontTmp.getContext('2d');
    ftCtx.drawImage(coverWarped, 0, 0);
    ftCtx.globalCompositeOperation = 'destination-in';
    ftCtx.drawImage(coverMaskImg, 0, 0, W, H);
    ctx.drawImage(frontTmp, 0, 0);
  }

  // Spine background layer — cover art or solid color
  {
    const spineTmp = document.createElement('canvas');
    spineTmp.width = W; spineTmp.height = H;
    const stCtx = spineTmp.getContext('2d');
    if (spineBgMode === 'cover' && coverImg) {
      const coverWarped = warpPerspective(coverImg, box3dConfig.coverQuad, W, H, 0, coverTransform);
      let spineSource = coverImg;
      if (spineBgMirror) {
        const mTmp = document.createElement('canvas');
        mTmp.width = coverImg.naturalWidth || coverImg.width;
        mTmp.height = coverImg.naturalHeight || coverImg.height;
        const mCtx = mTmp.getContext('2d');
        mCtx.translate(mTmp.width, 0);
        mCtx.scale(-1, 1);
        mCtx.drawImage(coverImg, 0, 0);
        spineSource = mTmp;
      }
      const spineWarped = spineBgTransform
        ? warpPerspective(spineSource, box3dConfig.coverQuad, W, H, 0, spineBgTransform)
        : spineBgMirror
          ? warpPerspective(spineSource, box3dConfig.coverQuad, W, H, 0, coverTransform)
          : coverWarped;
      stCtx.drawImage(spineWarped, 0, 0);
    } else {
      const effectiveColor = spineBgColor;
      stCtx.fillStyle = effectiveColor;
      stCtx.fillRect(0, 0, W, H);
    }
    stCtx.globalCompositeOperation = 'destination-in';
    stCtx.drawImage(spineMaskImg, 0, 0, W, H);
    ctx.drawImage(spineTmp, 0, 0);
  }

  // Spine content
  if (spineShowText) {
    if (title) {
      const spineConfig = {
        cx: box3dConfig.spineText.cx,
        cy: box3dConfig.spineText.cy,
        maxLength: box3dConfig.spineText.maxLength,
        fontFamily: box3dConfig.spineText.fontFamily,
        fontWeight: box3dConfig.spineText.fontWeight,
        fontSize: box3dConfig.spineText.fontSize,
        color: spineTextColor,
        letterSpacing: spineLetterSpacing,
      };
      drawSpineTitle(ctx, title, spineConfig);
    }
  } else if (logoImg) {
    const { cx, cy, maxW, maxH } = box3dConfig.spineLogoArea;
    const s = logoTransform?.scale ?? 1;
    // Rotated 90° CW: the logo's width becomes height and vice versa in spine space
    const scale = Math.min((maxH * s) / logoImg.naturalWidth, (maxW * s) / logoImg.naturalHeight);
    const dw = logoImg.naturalWidth * scale;
    const dh = logoImg.naturalHeight * scale;
    const tx = logoTransform?.x ?? 0;
    const ty = logoTransform?.y ?? 0;
    ctx.save();
    ctx.translate(cx + tx, cy + ty);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(logoImg, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }

  // ESRB badge on cover face (clipped by coverMask)
  if (esrbImg) {
    const esrbTmp = document.createElement('canvas');
    esrbTmp.width = W; esrbTmp.height = H;
    const eCtx = esrbTmp.getContext('2d');
    drawEsrbOnFace(eCtx, esrbImg, box3dConfig.coverQuad, esrbTransform, W, H);
    eCtx.globalCompositeOperation = 'destination-in';
    eCtx.drawImage(coverMaskImg, 0, 0, W, H);
    ctx.drawImage(esrbTmp, 0, 0);
  }

  // Steam logo on spine face (clipped by spineMask, requires spineQuad)
  if (steamImg && showSpineSteam && box3dConfig.spineQuad) {
    const spineSteamTmp = document.createElement('canvas');
    spineSteamTmp.width = W; spineSteamTmp.height = H;
    const ssCtx = spineSteamTmp.getContext('2d');
    drawSteamOnSpine(ssCtx, steamImg, box3dConfig.spineQuad, spineSteamTransform, W, H);
    ssCtx.globalCompositeOperation = 'destination-in';
    ssCtx.drawImage(spineMaskImg, 0, 0, W, H);
    ctx.drawImage(spineSteamTmp, 0, 0);
  }

  // Steam logo on cover face (clipped by coverMask)
  if (steamImg && showFrontSteam) {
    const frontSteamTmp = document.createElement('canvas');
    frontSteamTmp.width = W; frontSteamTmp.height = H;
    const fsCtx = frontSteamTmp.getContext('2d');
    drawSteamOnFace(fsCtx, steamImg, box3dConfig.coverQuad, frontSteamTransform, W, H);
    fsCtx.globalCompositeOperation = 'destination-in';
    fsCtx.drawImage(coverMaskImg, 0, 0, W, H);
    ctx.drawImage(frontSteamTmp, 0, 0);
  }

  // ESRB badge on spine face (clipped by spineMask, style-8 only)
  if (esrbImg && showSpineEsrb && box3dConfig.spineQuad) {
    const spineEsrbTmp = document.createElement('canvas');
    spineEsrbTmp.width = W; spineEsrbTmp.height = H;
    const seCtx = spineEsrbTmp.getContext('2d');
    drawEsrbOnSpine(seCtx, esrbImg, box3dConfig.spineQuad, spineEsrbTransform, W, H);
    seCtx.globalCompositeOperation = 'destination-in';
    seCtx.drawImage(spineMaskImg, 0, 0, W, H);
    ctx.drawImage(spineEsrbTmp, 0, 0);
  }

  // Template overlay
  ctx.drawImage(templateImg, 0, 0);
  return canvas;
}

export function hitTestBoxartLogo(px, py, logoImg, logoTransform, box3dConfig = BOX3D) {
  if (!logoImg) return false;
  const { cx, cy, maxW, maxH } = box3dConfig.spineLogoArea;
  const s = logoTransform?.scale ?? 1;
  const scale = Math.min((maxH * s) / logoImg.naturalWidth, (maxW * s) / logoImg.naturalHeight);
  const dw = logoImg.naturalWidth * scale;
  const dh = logoImg.naturalHeight * scale;
  const tx = logoTransform?.x ?? 0;
  const ty = logoTransform?.y ?? 0;
  // Logo is drawn rotated 90° CW — swap width/height for bounding box
  const x = cx + tx - dh / 2;
  const y = cy + ty - dw / 2;
  return px >= x && px <= x + dh && py >= y && py <= y + dw;
}

export function downloadCanvas(canvas, filename) {
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}
