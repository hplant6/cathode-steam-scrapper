import React, { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { composite, compositeBoxart, hitTestBoxartLogo, hitTestBoxartEsrb, hitTestBoxartSpineEsrb, hitTestBoxartSpineSteam, hitTestBoxartFrontSteam, loadImage, FRONT_FACE, BOX3D } from '../lib/composite.js';

const BoxartPreview = forwardRef(function BoxartPreview(
  {
    coverUrl, title, frameSrc = '/box3d-1.png',
    coverMaskSrc = null, spineMaskSrc = null,
    logoUrl = null, esrbLogoSrc = null,
    spineShowText = true, spineTextColor = '#ffffff',
    spineLetterSpacing = 0,
    spineBgMode = 'cover', spineBgColor = '#000000', spineBgMirror = false,
    dragTarget = 'cover', box3dConfig = BOX3D,
    defaultCoverTransform = null, defaultSpineTransform = null, defaultEsrbTransform = null, defaultLogoTransform = null,
    defaultSpineEsrbTransform = null,
    showSpineEsrb = false,
    steamLogoSrc = null,
    showSpineSteam = false,
    showFrontSteam = false,
    onCanvasReady, enableDrag = false, onDragTargetChange = null,
  },
  ref
) {
  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const dragTargetRef = useRef(dragTarget);
  useEffect(() => { dragTargetRef.current = dragTarget; }, [dragTarget]);

  const pinchRef = useRef(null);

  const coverTransformRef   = useRef({ x: 0, y: 0, scale: 1 });
  const spineBgTransformRef = useRef(null); // null = same warp as cover
  const logoTransformRef    = useRef({ x: 0, y: 0, scale: 1 });
  const esrbTransformRef      = useRef({ x: 38, y: 27, scale: 1 });
  const spineEsrbTransformRef  = useRef({ x: 0, y: 0, scale: 1 });
  const spineSteamTransformRef = useRef({ x: 0, y: 0, scale: 1 });
  const frontSteamTransformRef = useRef({ x: 0, y: 0, scale: 1 });

  const [template, setTemplate] = useState(null);
  const [coverMaskImg, setCoverMaskImg] = useState(null);
  const [spineMaskImg, setSpineMaskImg] = useState(null);
  const [coverImg, setCoverImg] = useState(null);
  const [logoImg, setLogoImg] = useState(null);
  const [esrbLogo, setEsrbLogo] = useState(null);
  const [steamImg, setSteamImg] = useState(null);
  const [fontReady, setFontReady] = useState(false);
  const [hmrTick, setHmrTick] = useState(0);
  const [error, setError] = useState(null);

  const isMasked = !!(coverMaskSrc && spineMaskSrc);

  const redrawRef = useRef(null);
  redrawRef.current = () => {
    if (!template || !fontReady || !containerRef.current) return;
    try {
      let canvas;
      if (isMasked && coverMaskImg && spineMaskImg) {
        canvas = compositeBoxart(coverImg, template, coverMaskImg, spineMaskImg, {
          title,
          coverTransform: coverTransformRef.current,
          spineBgTransform: spineBgTransformRef.current,
          logoImg,
          logoTransform: logoTransformRef.current,
          spineShowText,
          spineTextColor,
          spineLetterSpacing,
          spineBgMode,
          spineBgColor,
          spineBgMirror,
          box3dConfig,
          esrbImg: esrbLogo,
          esrbTransform: esrbTransformRef.current,
          showSpineEsrb,
          spineEsrbTransform: spineEsrbTransformRef.current,
          steamImg,
          showSpineSteam,
          showFrontSteam,
          spineSteamTransform: spineSteamTransformRef.current,
          frontSteamTransform: frontSteamTransformRef.current,
        });
      } else {
        canvas = composite(coverImg, template, {
          title,
          coverTransform: coverTransformRef.current,
          spineTextColor,
        });
      }
      const container = containerRef.current;
      container.innerHTML = '';
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      canvas.style.display = 'block';
      if (enableDrag) canvas.style.cursor = 'move';
      container.appendChild(canvas);
      onCanvasReady?.(canvas);
    } catch (e) {
      setError(e.message);
    }
  };

  const getTransformRef = (target) => {
    if (target === 'spine')       return spineBgTransformRef;
    if (target === 'logo')        return logoTransformRef;
    if (target === 'esrb')        return esrbTransformRef;
    if (target === 'spine-esrb')  return spineEsrbTransformRef;
    if (target === 'spine-steam') return spineSteamTransformRef;
    if (target === 'front-steam') return frontSteamTransformRef;
    return coverTransformRef;
  };

  const zoomRef = useRef(null);
  zoomRef.current = (factor) => {
    const target = dragTargetRef.current;
    if (target === 'spine' && spineBgTransformRef.current === null) {
      spineBgTransformRef.current = { ...coverTransformRef.current };
    }
    const tRef = getTransformRef(target);
    const t = tRef.current ?? { x: 0, y: 0, scale: 1 };
    tRef.current = { ...t, scale: Math.max(0.3, Math.min(4, t.scale * factor)) };
    redrawRef.current?.();
  };

  useImperativeHandle(ref, () => ({
    zoom: (factor) => zoomRef.current?.(factor),
  }));

  useEffect(() => {
    if (import.meta.hot) {
      import.meta.hot.accept('../lib/composite.js', () => setHmrTick((t) => t + 1));
    }
  }, []);

  // Load template
  useEffect(() => {
    let cancelled = false;
    setTemplate(null);
    loadImage(frameSrc, { crossOrigin: null })
      .then((img) => { if (!cancelled) setTemplate(img); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [frameSrc]);

  // Load cover mask
  useEffect(() => {
    if (!coverMaskSrc) { setCoverMaskImg(null); return; }
    let cancelled = false;
    loadImage(coverMaskSrc, { crossOrigin: null })
      .then((img) => { if (!cancelled) setCoverMaskImg(img); })
      .catch(() => { if (!cancelled) setCoverMaskImg(null); });
    return () => { cancelled = true; };
  }, [coverMaskSrc]);

  // Load spine mask
  useEffect(() => {
    if (!spineMaskSrc) { setSpineMaskImg(null); return; }
    let cancelled = false;
    loadImage(spineMaskSrc, { crossOrigin: null })
      .then((img) => { if (!cancelled) setSpineMaskImg(img); })
      .catch(() => { if (!cancelled) setSpineMaskImg(null); });
    return () => { cancelled = true; };
  }, [spineMaskSrc]);

  // Load cover art
  useEffect(() => {
    if (!coverUrl) { setCoverImg(null); return; }
    let cancelled = false;
    loadImage(`/api/proxy?url=${encodeURIComponent(coverUrl)}`)
      .then((img) => { if (!cancelled) setCoverImg(img); })
      .catch(() => { if (!cancelled) setCoverImg(null); });
    return () => { cancelled = true; };
  }, [coverUrl]);

  // Load logo
  useEffect(() => {
    if (!logoUrl) { setLogoImg(null); return; }
    let cancelled = false;
    loadImage(`/api/proxy?url=${encodeURIComponent(logoUrl)}`)
      .then((img) => { if (!cancelled) setLogoImg(img); })
      .catch(() => { if (!cancelled) setLogoImg(null); });
    return () => { cancelled = true; };
  }, [logoUrl]);

  // Load ESRB logo
  useEffect(() => {
    if (!esrbLogoSrc) { setEsrbLogo(null); return; }
    let cancelled = false;
    loadImage(esrbLogoSrc, { crossOrigin: null })
      .then((img) => { if (!cancelled) setEsrbLogo(img); })
      .catch(() => { if (!cancelled) setEsrbLogo(null); });
    return () => { cancelled = true; };
  }, [esrbLogoSrc]);

  // Load Steam logo
  useEffect(() => {
    if (!steamLogoSrc) { setSteamImg(null); return; }
    let cancelled = false;
    loadImage(steamLogoSrc, { crossOrigin: null })
      .then((img) => { if (!cancelled) setSteamImg(img); })
      .catch(() => { if (!cancelled) setSteamImg(null); });
    return () => { cancelled = true; };
  }, [steamLogoSrc]);

  // Preload font
  useEffect(() => {
    let cancelled = false;
    const spine = BOX3D.spineText;
    document.fonts.load(`${spine.fontWeight} ${spine.fontSize}px ${spine.fontFamily}`)
      .catch(() => null)
      .finally(() => { if (!cancelled) setFontReady(true); });
    return () => { cancelled = true; };
  }, []);

  // Reset transforms when source assets change
  useEffect(() => {
    coverTransformRef.current      = defaultCoverTransform ? { ...defaultCoverTransform } : { x: 0, y: 0, scale: 1 };
    spineBgTransformRef.current    = defaultSpineTransform ? { ...defaultSpineTransform } : null;
    logoTransformRef.current       = defaultLogoTransform ? { ...defaultLogoTransform } : { x: 0, y: 0, scale: 1 };
    esrbTransformRef.current       = defaultEsrbTransform ? { ...defaultEsrbTransform } : { x: 38, y: 27, scale: 1 };
    spineEsrbTransformRef.current  = defaultSpineEsrbTransform ? { ...defaultSpineEsrbTransform } : { x: 0, y: 0, scale: 1 };
    spineSteamTransformRef.current = { x: 25, y: 10, scale: 1 };
    frontSteamTransformRef.current = { x: 210, y: 10, scale: 1 };
  }, [coverUrl, frameSrc]);

  useLayoutEffect(() => {
    if (!fontReady) return;
    redrawRef.current?.();
  }, [template, coverMaskImg, spineMaskImg, coverImg, logoImg, esrbLogo, steamImg, fontReady, title, spineShowText, spineTextColor, spineLetterSpacing, spineBgMode, spineBgColor, spineBgMirror, showSpineEsrb, showSpineSteam, showFrontSteam, enableDrag, onCanvasReady, hmrTick]);

  // Drag listeners
  useEffect(() => {
    if (!enableDrag) return;
    const onMouseMove = (e) => {
      if (!dragRef.current) return;
      const canvas = containerRef.current?.querySelector('canvas');
      if (!canvas) return;
      const displayScale = canvas.getBoundingClientRect().width / canvas.width;
      const dx = (e.clientX - dragRef.current.startX) / displayScale;
      const dy = (e.clientY - dragRef.current.startY) / displayScale;
      const tRef = getTransformRef(dragRef.current.target);
      const t = tRef.current ?? { scale: 1 };
      tRef.current = { ...t, x: dragRef.current.originX + dx, y: dragRef.current.originY + dy };
      redrawRef.current?.();
    };
    const onMouseUp = () => { dragRef.current = null; };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [enableDrag]);

  // Scroll-wheel and pinch zoom
  useEffect(() => {
    if (!enableDrag) return;
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (e) => {
      e.preventDefault();
      const normalized = e.deltaMode === 0 ? e.deltaY / 100 : e.deltaMode === 1 ? e.deltaY / 3 : e.deltaY;
      zoomRef.current?.(Math.pow(0.95, normalized));
    };
    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        pinchRef.current = { dist: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY) };
      }
    };
    const onTouchMove = (e) => {
      if (e.touches.length !== 2 || !pinchRef.current) return;
      e.preventDefault();
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      zoomRef.current?.(dist / pinchRef.current.dist);
      pinchRef.current.dist = dist;
    };
    const onTouchEnd = () => { pinchRef.current = null; };
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);
    return () => {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [enableDrag]);

  const onMouseDown = (e) => {
    if (!enableDrag) return;
    e.preventDefault();
    if (isMasked && onDragTargetChange) {
      const canvas = containerRef.current?.querySelector('canvas');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const displayScale = rect.width / canvas.width;
        const canvasX = (e.clientX - rect.left) / displayScale;
        const canvasY = (e.clientY - rect.top) / displayScale;
        if (!spineShowText && logoImg && hitTestBoxartLogo(canvasX, canvasY, logoImg, logoTransformRef.current, box3dConfig)) {
          dragTargetRef.current = 'logo';
          onDragTargetChange('logo');
        } else if (steamImg && showFrontSteam && hitTestBoxartFrontSteam(canvasX, canvasY, steamImg, frontSteamTransformRef.current, box3dConfig.coverQuad)) {
          dragTargetRef.current = 'front-steam';
          onDragTargetChange('front-steam');
        } else if (steamImg && showSpineSteam && box3dConfig.spineQuad && hitTestBoxartSpineSteam(canvasX, canvasY, steamImg, spineSteamTransformRef.current, box3dConfig.spineQuad)) {
          dragTargetRef.current = 'spine-steam';
          onDragTargetChange('spine-steam');
        } else if (esrbLogo && box3dConfig.spineQuad && hitTestBoxartSpineEsrb(canvasX, canvasY, esrbLogo, spineEsrbTransformRef.current, box3dConfig.spineQuad)) {
          dragTargetRef.current = 'spine-esrb';
          onDragTargetChange('spine-esrb');
        } else if (esrbLogo && hitTestBoxartEsrb(canvasX, canvasY, esrbLogo, esrbTransformRef.current, box3dConfig)) {
          dragTargetRef.current = 'esrb';
          onDragTargetChange('esrb');
        }
      }
    }
    const target = dragTargetRef.current;
    if (target === 'spine' && spineBgTransformRef.current === null) {
      spineBgTransformRef.current = { ...coverTransformRef.current };
    }
    const tRef = getTransformRef(target);
    const t = tRef.current ?? { x: 0, y: 0, scale: 1 };
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: t.x, originY: t.y, target };
  };

  return (
    <div className="boxart-preview">
      <div
        className="boxart-frame"
        ref={containerRef}
        onMouseDown={onMouseDown}
        style={enableDrag ? { userSelect: 'none' } : undefined}
      />
      {error && <div className="error">{error}</div>}
    </div>
  );
});

export default BoxartPreview;
