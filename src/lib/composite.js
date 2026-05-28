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

  const canvas = document.createElement('canvas');
  canvas.width = templateImg.naturalWidth;
  canvas.height = templateImg.naturalHeight;
  const ctx = canvas.getContext('2d');

  if (coverImg) {
    if (perspective === 0 && isAxisAlignedRect(corners)) {
      const [tl, tr, , bl] = corners;
      drawCoverFit(ctx, coverImg, tl.x, tl.y, tr.x - tl.x, bl.y - tl.y);
    } else {
      const warped = warpPerspective(coverImg, corners, canvas.width, canvas.height, perspective);
      ctx.drawImage(warped, 0, 0);
    }
  }

  ctx.drawImage(templateImg, 0, 0);

  if (title) drawSpineTitle(ctx, title);

  return canvas;
}

// Draws the game title rotated 90° clockwise, centered over the cyan spine band.
function drawSpineTitle(ctx, title, spine = FRONT_FACE.spine) {
  const text = title.toUpperCase();
  ctx.save();
  ctx.translate(spine.cx, spine.cy);
  ctx.rotate(Math.PI / 2); // 90° clockwise

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
function drawCoverFit(ctx, img, dx, dy, dw, dh) {
  const sW = img.naturalWidth;
  const sH = img.naturalHeight;
  const srcAspect = sW / sH;
  const dstAspect = dw / dh;
  let sx = 0, sy = 0, sw = sW, sh = sH;
  if (srcAspect > dstAspect) {
    // source wider — crop sides
    sw = sH * dstAspect;
    sx = (sW - sw) / 2;
  } else {
    // source taller — crop top/bottom
    sh = sW / dstAspect;
    sy = (sH - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

// WebGL warp with projective texture mapping. The quad is drawn at the 4
// destination corners (which may be a trapezoid). Texture coordinates use a
// `q` (perspective) component so the LEFT side of the quad samples a smaller
// portion of the texture and the RIGHT side samples a larger portion — this
// foreshortens the content as if the right edge is receding from the viewer.
// `perspective` is the strength: 0 = affine, 0.6 = strong foreshortening.
function warpPerspective(img, corners, canvasW, canvasH, perspective = 0) {
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
  const srcAspect = img.naturalWidth / img.naturalHeight;
  let u0 = 0, u1 = 1, v0 = 0, v1 = 1;
  if (srcAspect > dstAspect) {
    const crop = (1 - dstAspect / srcAspect) / 2;
    u0 = crop; u1 = 1 - crop;
  } else {
    const crop = (1 - srcAspect / dstAspect) / 2;
    v0 = crop; v1 = 1 - crop;
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
