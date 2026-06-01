import React, { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { compositePhysical, hitTestPhysicalLogos, loadImage } from '../lib/compositePhysical.js';

const PhysicalPreview = forwardRef(function PhysicalPreview(
  { logoUrl, coverUrl, diskSrc = '/physical-cd1.png', maskSrc = null, flip = false, layout = null, steamLogoSrc = null, dvdLogoSrc = null, esrbLogoSrc = null, showSteamLogo = true, showDvdLogo = true, showMarquee = true, defaultScale = 1.21, onCanvasReady, dragTarget = 'cover', enableDrag = false, onDragTargetChange = null },
  ref
) {
  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const dragTargetRef = useRef(dragTarget);
  useEffect(() => { dragTargetRef.current = dragTarget; }, [dragTarget]);

  // Images stay as state so React re-renders when they load
  const [diskTemplate, setDiskTemplate] = useState(null);
  const [maskImg, setMaskImg] = useState(null);
  const [steamLogo, setSteamLogo] = useState(null);
  const [dvdLogo, setDvdLogo] = useState(null);
  const [esrbLogo, setEsrbLogo] = useState(null);
  const [logoImg, setLogoImg] = useState(null);
  const [coverImg, setCoverImg] = useState(null);
  const [error, setError] = useState(null);

  // Transforms as refs — updates bypass React's render cycle during drag
  const coverTransformRef  = useRef({ x: 0, y: 0, scale: defaultScale });
  const logoTransformRef   = useRef({ x: 0, y: 0, scale: 1 });
  const steamTransformRef  = useRef({ x: 0, y: 0, scale: 1 });
  const dvdTransformRef    = useRef({ x: 0, y: 0, scale: 1 });
  const esrbTransformRef   = useRef({ x: 0, y: 0, scale: 1.1025 });

  const getTransformRef = (target) =>
    target === 'logo'  ? logoTransformRef  :
    target === 'steam' ? steamTransformRef :
    target === 'dvd'   ? dvdTransformRef   :
    target === 'esrb'  ? esrbTransformRef  :
    coverTransformRef;

  const pinchRef = useRef(null);

  // Always-current draw function — reassigned each render so it closes over latest props/state
  const redrawRef = useRef(null);
  redrawRef.current = () => {
    if (!diskTemplate || !containerRef.current) return;
    try {
      const canvas = compositePhysical(
        logoImg, diskTemplate, showSteamLogo ? steamLogo : null,
        flip, coverImg, maskImg, coverTransformRef.current, layout,
        showDvdLogo ? dvdLogo : null, showMarquee,
        logoTransformRef.current, steamTransformRef.current, dvdTransformRef.current,
        esrbLogo, esrbTransformRef.current
      );
      const container = containerRef.current;
      container.innerHTML = '';
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      canvas.style.display = 'block';
      if (maskImg || enableDrag) canvas.style.cursor = 'move';
      container.appendChild(canvas);
      onCanvasReady?.(canvas);
    } catch (e) {
      setError(e.message);
    }
  };

  const zoomRef = useRef(null);
  zoomRef.current = (factor) => {
    const t = getTransformRef(dragTargetRef.current);
    t.current = { ...t.current, scale: Math.max(0.3, Math.min(4, t.current.scale * factor)) };
    redrawRef.current?.();
  };

  useImperativeHandle(ref, () => ({
    zoom: (factor) => zoomRef.current?.(factor),
  }));

  useEffect(() => {
    let cancelled = false;
    loadImage(diskSrc, { crossOrigin: null })
      .then((img) => { if (!cancelled) setDiskTemplate(img); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [diskSrc]);

  useEffect(() => {
    if (!maskSrc) { setMaskImg(null); return; }
    let cancelled = false;
    loadImage(maskSrc, { crossOrigin: null })
      .then((img) => { if (!cancelled) setMaskImg(img); })
      .catch(() => { if (!cancelled) setMaskImg(null); });
    return () => { cancelled = true; };
  }, [maskSrc]);

  useEffect(() => {
    let cancelled = false;
    const src = steamLogoSrc || '/steam-logo.svg';
    loadImage(src, { crossOrigin: null })
      .then((img) => { if (!cancelled) setSteamLogo(img); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [steamLogoSrc]);

  useEffect(() => {
    if (!dvdLogoSrc) { setDvdLogo(null); return; }
    let cancelled = false;
    loadImage(dvdLogoSrc, { crossOrigin: null })
      .then((img) => { if (!cancelled) setDvdLogo(img); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [dvdLogoSrc]);

  useEffect(() => {
    if (!esrbLogoSrc) { setEsrbLogo(null); return; }
    let cancelled = false;
    loadImage(esrbLogoSrc, { crossOrigin: null })
      .then((img) => { if (!cancelled) setEsrbLogo(img); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [esrbLogoSrc]);

  useEffect(() => {
    if (!logoUrl) { setLogoImg(null); return; }
    let cancelled = false;
    const src = logoUrl.startsWith('blob:') || logoUrl.startsWith('data:') ? logoUrl : `/api/proxy?url=${encodeURIComponent(logoUrl)}`;
    loadImage(src)
      .then((img) => { if (!cancelled) setLogoImg(img); })
      .catch(() => { if (!cancelled) setLogoImg(null); });
    return () => { cancelled = true; };
  }, [logoUrl]);

  useEffect(() => {
    if (!coverUrl || !maskSrc) { setCoverImg(null); return; }
    let cancelled = false;
    const src = coverUrl.startsWith('blob:') || coverUrl.startsWith('data:') ? coverUrl : `/api/proxy?url=${encodeURIComponent(coverUrl)}`;
    loadImage(src)
      .then((img) => { if (!cancelled) setCoverImg(img); })
      .catch(() => { if (!cancelled) setCoverImg(null); });
    return () => { cancelled = true; };
  }, [coverUrl, maskSrc]);

  // Reset transforms when source assets change
  useEffect(() => {
    coverTransformRef.current = { x: 0, y: 0, scale: defaultScale };
  }, [diskSrc, coverUrl, defaultScale]);

  useEffect(() => {
    logoTransformRef.current  = { x: 0, y: 0, scale: 1 };
    steamTransformRef.current = { x: 0, y: 0, scale: 1 };
    dvdTransformRef.current   = { x: 0, y: 0, scale: 1 };
    esrbTransformRef.current  = { x: 0, y: 0, scale: 1.1025 };
  }, [diskSrc]);

  // Redraw when images or display settings change; transforms are excluded
  useLayoutEffect(() => {
    redrawRef.current?.();
  }, [diskTemplate, maskImg, steamLogo, dvdLogo, esrbLogo, logoImg, coverImg, showSteamLogo, showDvdLogo, showMarquee, flip, layout, enableDrag, onCanvasReady]);

  // Drag listeners — mousemove writes directly to refs and redraws without React
  useEffect(() => {
    if (!maskImg && !enableDrag) return;
    const onMouseMove = (e) => {
      if (!dragRef.current) return;
      const canvas = containerRef.current?.querySelector('canvas');
      if (!canvas) return;
      const displayScale = canvas.getBoundingClientRect().width / canvas.width;
      const dx = (e.clientX - dragRef.current.startX) / displayScale;
      const dy = (e.clientY - dragRef.current.startY) / displayScale;
      const t = getTransformRef(dragTargetRef.current);
      t.current = { ...t.current, x: dragRef.current.originX + dx, y: dragRef.current.originY + dy };
      redrawRef.current?.();
    };
    const onMouseUp = () => { dragRef.current = null; };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [maskImg, enableDrag]);

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
    if (!maskImg && !enableDrag) return;
    e.preventDefault();
    const canvas = containerRef.current?.querySelector('canvas');
    if (canvas && onDragTargetChange && diskTemplate) {
      const rect = canvas.getBoundingClientRect();
      const displayScale = rect.width / canvas.width;
      const canvasX = (e.clientX - rect.left) / displayScale;
      const canvasY = (e.clientY - rect.top) / displayScale;
      const hit = hitTestPhysicalLogos(canvasX, canvasY, {
        diskImg: diskTemplate,
        logoImg: showMarquee ? logoImg : null,
        steamLogoImg: showSteamLogo ? steamLogo : null,
        dvdLogoImg: showDvdLogo ? dvdLogo : null,
        esrbLogoImg: esrbLogo,
        flip, maskImg, layout,
        showMarquee, showSteamLogo, showDvdLogo,
        logoTransform: logoTransformRef.current,
        steamTransform: steamTransformRef.current,
        dvdTransform: dvdTransformRef.current,
        esrbTransform: esrbTransformRef.current,
      });
      if (hit) {
        dragTargetRef.current = hit;
        onDragTargetChange(hit);
      }
    }
    const t = getTransformRef(dragTargetRef.current);
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: t.current.x, originY: t.current.y };
  };

  return (
    <div className="boxart-preview">
      <div
        className="boxart-frame"
        ref={containerRef}
        onMouseDown={onMouseDown}
        style={maskImg || enableDrag ? { userSelect: 'none' } : undefined}
      />
      {error && <div className="error">{error}</div>}
    </div>
  );
});

export default PhysicalPreview;
