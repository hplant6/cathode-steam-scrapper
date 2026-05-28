import React, { useEffect } from 'react';

export default function Lightbox({ src, type, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!src) return null;

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose}>✕</button>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        {type === 'video'
          ? <video src={src} controls autoPlay className="lightbox-media" />
          : <img src={src} alt="" className="lightbox-media" />
        }
      </div>
    </div>
  );
}
