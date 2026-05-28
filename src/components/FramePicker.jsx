import React from 'react';

export const FRAMES = [
  { src: '/steam-boxart.png' },
  { src: '/steam-boxart-v2.png' },
  { src: '/steam-boxart-v3.png' },
];

export const PHYSICAL_DISKS = [
  { src: '/physical-cd1.png', flip: false, dvdLogoSrc: '/dvd-logo.svg', noMarquee: true },
  { src: '/physical-cd2.png', flip: true,  dvdLogoSrc: '/dvd-logo.svg', noMarquee: true },
  { src: '/physical-cd3.png', flip: false, mask: '/physical-cd3-mask.png', defaultScale: 1.4641 },
  {
    src: '/physical-floppy1.png',
    flip: false,
    noMarqueeToggle: true,
    layout: {
      marqueeCx: 375, marqueeCy: 470, marqueeMaxW: 449, marqueeMaxH: 156, marqueeAlpha: 0.8,
      steamCx:   375, steamCy:  695, steamMaxW:   180, steamMaxH:    52, steamAlpha:   0.8,
    },
  },
  {
    src: '/physical-floppy2.png',
    flip: false,
    noMarqueeToggle: true,
    steamLogoSrc: '/steam-logo-white.svg',
    layout: {
      marqueeCx: 375, marqueeCy: 470, marqueeMaxW: 449, marqueeMaxH: 156, marqueeAlpha: 0.8,
      steamCx:   375, steamCy:  695, steamMaxW:   180, steamMaxH:    52, steamAlpha:   0.8,
    },
  },
  { src: '/physical-floppy4.png', flip: false, mask: '/physical-floppy-mask.png', layout: { marqueeCx: 450, marqueeCy: 564, marqueeMaxW: 539, marqueeMaxH: 187, marqueeAlpha: 1.0 } },
  { src: '/physical-floppy5.png', flip: false, mask: '/physical-floppy-mask.png', layout: { marqueeCx: 450, marqueeCy: 564, marqueeMaxW: 539, marqueeMaxH: 187, marqueeAlpha: 1.0 } },
];

export default function FramePicker({ value, onChange }) {
  return (
    <div className="frame-picker">
      <div className="label">3D BOX STYLE</div>
      <div className="frame-options">
        {FRAMES.map((f, i) => (
          <button
            key={f.src}
            className={`frame-btn ${value === f.src ? 'selected' : ''}`}
            onClick={() => onChange(f.src)}
          >
            {String(i + 1).padStart(2, '0')}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PhysicalPicker({ value, onChange }) {
  return (
    <div className="frame-picker">
      <div className="label">PHYSICAL MEDIA STYLE</div>
      <div className="frame-options">
        {PHYSICAL_DISKS.map((d, i) => (
          <button
            key={d.src}
            className={`frame-btn ${value === d.src ? 'selected' : ''}`}
            onClick={() => onChange(d.src)}
          >
            {String(i + 1).padStart(2, '0')}
          </button>
        ))}
      </div>
    </div>
  );
}
