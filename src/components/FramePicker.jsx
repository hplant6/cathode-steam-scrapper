import React from 'react';
import { BOX3D_5, BOX3D_8 } from '../lib/composite.js';

const DEFAULT_COVER_OFFSET    = { x: 20, y: 20, scale: 1 };
const DEFAULT_SPINE_OFFSET    = { x: 0,  y: 20, scale: 1 };
const DEFAULT_COVER_OFFSET_57 = { x: 17, y: 0,  scale: 1    };
const DEFAULT_SPINE_OFFSET_57 = { x: -3, y: 0,  scale: 1    };
const DEFAULT_COVER_OFFSET_8  = { x: 43,  y: -21, scale: 0.95   };
const DEFAULT_SPINE_OFFSET_8  = { x: 57,  y: 0,   scale: 1.2155 };
const DEFAULT_ESRB_OFFSET_8   = { x: 98,  y: 37,  scale: 1      };
const DEFAULT_LOGO_OFFSET_8        = { x: 20,  y: 0,   scale: 1.5514 };
const DEFAULT_SPINE_ESRB_OFFSET_8  = { x: 20,  y: 60,  scale: 1      };

export const FRAMES = [
  {
    src: '/box3d-1.png',
    coverMask: '/box3d-1-cover-mask.png',
    spineMask: '/box3d-1-spine-mask.png',
    defaultCoverTransform: DEFAULT_COVER_OFFSET,
    defaultSpineTransform: DEFAULT_SPINE_OFFSET,
  },
  {
    src: '/box3d-2.png',
    coverMask: '/box3d-2-cover-mask.png',
    spineMask: '/box3d-2-spine-mask.png',
    defaultCoverTransform: DEFAULT_COVER_OFFSET,
    defaultSpineTransform: DEFAULT_SPINE_OFFSET,
  },
  {
    src: '/box3d-3.png',
    coverMask: '/box3d-3-cover-mask.png',
    spineMask: '/box3d-3-spine-mask.png',
    defaultCoverTransform: DEFAULT_COVER_OFFSET,
    defaultSpineTransform: DEFAULT_SPINE_OFFSET,
  },
  {
    src: '/box3d-4.png',
    coverMask: '/box3d-4-cover-mask.png',
    spineMask: '/box3d-4-spine-mask.png',
    defaultCoverTransform: DEFAULT_COVER_OFFSET,
    defaultSpineTransform: DEFAULT_SPINE_OFFSET,
  },
  {
    src: '/box3d-5.png',
    coverMask: '/box3d-5-cover-mask.png',
    spineMask: '/box3d-5-spine-mask.png',
    box3dConfig: BOX3D_5,
    defaultCoverTransform: DEFAULT_COVER_OFFSET_57,
    defaultSpineTransform: DEFAULT_SPINE_OFFSET_57,
  },
  {
    src: '/box3d-6.png',
    coverMask: '/box3d-6-cover-mask.png',
    spineMask: '/box3d-6-spine-mask.png',
    box3dConfig: BOX3D_5,
    defaultCoverTransform: DEFAULT_COVER_OFFSET_57,
    defaultSpineTransform: DEFAULT_SPINE_OFFSET_57,
  },
  {
    src: '/box3d-7.png',
    coverMask: '/box3d-7-cover-mask.png',
    spineMask: '/box3d-7-spine-mask.png',
    box3dConfig: BOX3D_5,
    defaultCoverTransform: DEFAULT_COVER_OFFSET_57,
    defaultSpineTransform: DEFAULT_SPINE_OFFSET_57,
  },
  {
    src: '/box3d-8.png',
    coverMask: '/box3d-8-cover-mask.png',
    spineMask: '/box3d-8-spine-mask.png',
    box3dConfig: BOX3D_8,
    defaultCoverTransform: DEFAULT_COVER_OFFSET_8,
    defaultSpineTransform: DEFAULT_SPINE_OFFSET_8,
    defaultEsrbTransform: DEFAULT_ESRB_OFFSET_8,
    defaultLogoTransform: DEFAULT_LOGO_OFFSET_8,
    defaultSpineEsrbTransform: DEFAULT_SPINE_ESRB_OFFSET_8,
    defaultSpineShowText: false,
    defaultSpineEsrb: true,
  },
];

export const PHYSICAL_DISKS = [
  { src: '/physical-cd1.png', flip: false, dvdLogoSrc: '/dvd-logo.svg', noMarquee: true },
  { src: '/physical-cd2.png', flip: true,  dvdLogoSrc: '/dvd-logo.svg', noMarquee: true },
  { src: '/physical-cd3.png', flip: false, mask: '/physical-cd3-mask.png', defaultScale: 1.4641, dvdLogoSrc: '/dvd-logo.svg', noMarquee: true },
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

const DVD_FRAMES     = FRAMES.slice(0, 7);
const BIG_BOX_FRAME  = FRAMES[7];

// value is the full frame object from FRAMES; onChange(frameObject)
export default function FramePicker({ value, onChange }) {
  const isBigBox = value?.src === BIG_BOX_FRAME.src;

  const handleModeChange = (mode) => {
    if (mode === 'bigbox') onChange(BIG_BOX_FRAME);
    else if (isBigBox) onChange(DVD_FRAMES[0]);
  };

  return (
    <div className="frame-picker">
      <div className="label">3D BOX STYLE</div>
      <div className="mode-toggle mode-toggle-equal" style={{ marginBottom: 8 }}>
        <button type="button" className={`mode-btn ${!isBigBox ? 'active' : ''}`} onClick={() => handleModeChange('dvd')}>DVD</button>
        <button type="button" className={`mode-btn ${isBigBox ? 'active' : ''}`} onClick={() => handleModeChange('bigbox')}>BIG BOX</button>
      </div>
      {!isBigBox && (
        <div className="frame-options">
          {DVD_FRAMES.map((f, i) => (
            <button
              key={f.src}
              className={`frame-btn ${value?.src === f.src ? 'selected' : ''}`}
              onClick={() => onChange(f)}
            >
              {String(i + 1).padStart(2, '0')}
            </button>
          ))}
        </div>
      )}
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
