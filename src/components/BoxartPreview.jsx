import React, { useEffect, useRef, useState } from 'react';
import { composite, loadImage, FRONT_FACE } from '../lib/composite.js';

export default function BoxartPreview({ coverUrl, title, frameSrc = '/steam-boxart.png', onCanvasReady }) {
  const containerRef = useRef(null);
  const [template, setTemplate] = useState(null);
  const [fontReady, setFontReady] = useState(false);
  const [hmrTick, setHmrTick] = useState(0);
  const [error, setError] = useState(null);

  // Re-render the canvas when composite.js hot-updates.
  useEffect(() => {
    if (import.meta.hot) {
      import.meta.hot.accept('../lib/composite.js', () => {
        setHmrTick((t) => t + 1);
      });
    }
  }, []);

  // Reload template when frameSrc changes.
  useEffect(() => {
    let cancelled = false;
    setTemplate(null);
    loadImage(frameSrc, { crossOrigin: null })
      .then((img) => { if (!cancelled) setTemplate(img); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [frameSrc]);

  // Preload Inter so the canvas-drawn spine title has the right glyphs.
  useEffect(() => {
    let cancelled = false;
    const probeFont = `${FRONT_FACE.spine.fontWeight} ${FRONT_FACE.spine.fontSize}px ${FRONT_FACE.spine.fontFamily}`;
    document.fonts.load(probeFont)
      .catch(() => null)
      .finally(() => { if (!cancelled) setFontReady(true); });
    return () => { cancelled = true; };
  }, []);

  // Re-composite whenever cover, title, or debug flag changes.
  useEffect(() => {
    if (!template || !fontReady || !containerRef.current) return;
    let cancelled = false;
    const render = async () => {
      try {
        let cover = null;
        if (coverUrl) {
          const proxied = `/api/proxy?url=${encodeURIComponent(coverUrl)}`;
          cover = await loadImage(proxied);
          if (cancelled) return;
        }
        const canvas = composite(cover, template, { title });
        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = '';
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        canvas.style.display = 'block';
        container.appendChild(canvas);
        onCanvasReady?.(canvas);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    };
    render();
    return () => { cancelled = true; };
  }, [template, fontReady, coverUrl, title, onCanvasReady, hmrTick]);

  return (
    <div className="boxart-preview">
      <div className="boxart-frame" ref={containerRef} />
      {error && <div className="error">{error}</div>}
    </div>
  );
}
