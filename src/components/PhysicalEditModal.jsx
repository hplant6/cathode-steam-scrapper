import React, { useRef, useState } from 'react';
import PhysicalPreview from './PhysicalPreview.jsx';
import Results from './Results.jsx';
import { EsrbPicker, ESRB_RATINGS } from './EsrbPicker.jsx';

export default function PhysicalEditModal({
  coverUrl, logoUrl,
  diskChoice,
  mediaType, setMediaType,
  coverArtOn, setCoverArtOn,
  styleVariant, setStyleVariant,
  dragTarget, setDragTarget,
  showSteamLogo, setShowSteamLogo,
  showDvdLogo, setShowDvdLogo,
  showMarquee, setShowMarquee,
  steamLogoVariant, setSteamLogoVariant,
  dvdLogoVariant, setDvdLogoVariant,
  dvdLogoType, setDvdLogoType,
  steamLogoSrc, dvdLogoSrc, esrbLogoSrc,
  showEsrb, setShowEsrb,
  esrbRating, setEsrbRating,
  physicalPreviewRef, onCanvasReady,
  onClose, onLightbox,
  hasResults,
  steamgrid, gog, logos,
  selectedId, selectedLogoId,
  onSelect, onSelectLogo,
  useCover, useMarquee,
}) {
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [section, setSection] = useState(null); // null | 'cover' | 'marquee' | 'logos'

  const toggleSection = (name, dragMode) => {
    setSection(s => {
      const next = s === name ? null : name;
      if (next && dragMode) setDragTarget(dragMode);
      return next;
    });
  };

  const showStyleToggle = !(mediaType === 'dvd' && coverArtOn);
  const showDragControls = coverArtOn || section === 'marquee' || section === 'logos';

  return (
    <div className="box3d-modal">
      <button className="modal-close-btn" onClick={onClose}>✕ CLOSE</button>

      <div className="box3d-modal-layout">

        {/* Preview column */}
        <div className="box3d-modal-preview">
          <div className="col-title">PHYSICAL MEDIA PREVIEW</div>
          <div className="preview-hint">Click elements to select · Drag to move · Scroll or pinch to zoom</div>
          <div style={{ position: 'relative' }}>
            <PhysicalPreview
              ref={physicalPreviewRef}
              dragTarget={dragTarget}
              enableDrag
              onDragTargetChange={(target) => {
                setDragTarget(target);
                if (target === 'logo') setSection('marquee');
                else if (target === 'steam' || target === 'dvd' || target === 'esrb') setSection('logos');
              }}
              logoUrl={logoUrl}
              coverUrl={coverUrl}
              diskSrc={diskChoice.src}
              maskSrc={diskChoice.mask ?? null}
              defaultScale={diskChoice.defaultScale ?? 1.21}
              flip={diskChoice.flip}
              layout={diskChoice.layout ?? null}
              steamLogoSrc={steamLogoSrc}
              dvdLogoSrc={dvdLogoSrc}
              esrbLogoSrc={esrbLogoSrc}
              showSteamLogo={showSteamLogo}
              showDvdLogo={showDvdLogo}
              showMarquee={!diskChoice.mask ? true : showMarquee}
              onCanvasReady={onCanvasReady}
            />
            <button className="asset-zoom-btn" onClick={onLightbox}>
              <img src="/icon-zoom.svg" alt="zoom" />
            </button>
          </div>
          {showDragControls && (
            <div className="physical-zoom-wrap">
              {section === 'logos' ? (
                <>
                  <div className="physical-zoom-row">
                    <div className="mode-toggle" style={{ width: '100%' }}>
                      <button type="button" className={`mode-btn ${dragTarget === 'steam' ? 'active' : ''}`} onClick={() => setDragTarget('steam')}>STEAM</button>
                      {diskChoice.dvdLogoSrc && <button type="button" className={`mode-btn ${dragTarget === 'dvd' ? 'active' : ''}`} onClick={() => setDragTarget('dvd')}>{dvdLogoType === 'cdrom' ? 'CD' : 'DVD'}</button>}
                      {esrbLogoSrc && <button type="button" className={`mode-btn ${dragTarget === 'esrb' ? 'active' : ''}`} onClick={() => setDragTarget('esrb')}>ESRB</button>}
                    </div>
                  </div>
                  <div className="physical-zoom-row zoom-row-center">
                    <div className="zoom-controls">
                      <span className="zoom-row-label">
                        {dragTarget === 'steam' ? 'ZOOM STEAM' : dragTarget === 'esrb' ? 'ZOOM ESRB' : dvdLogoType === 'cdrom' ? 'ZOOM CD' : 'ZOOM DVD'}
                      </span>
                      <button type="button" className="zoom-btn" onClick={() => physicalPreviewRef.current?.zoom(0.95)}>−</button>
                      <button type="button" className="zoom-btn" onClick={() => physicalPreviewRef.current?.zoom(1.05)}>+</button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="physical-zoom-row">
                  <div className="zoom-controls">
                    <span className="zoom-row-label">{section === 'cover' ? 'ZOOM COVER' : 'ZOOM MARQUEE'}</span>
                    <button type="button" className="zoom-btn" onClick={() => physicalPreviewRef.current?.zoom(0.95)}>−</button>
                    <button type="button" className="zoom-btn" onClick={() => physicalPreviewRef.current?.zoom(1.05)}>+</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls column */}
        <div className={`box3d-modal-controls${mobileSheetOpen ? ' mobile-sheet-open' : ''}`}>
          <div className="mobile-sheet-handle" onClick={() => setMobileSheetOpen(v => !v)}>
            <span className="mobile-sheet-label">IMAGE CONTROLS</span>
          </div>
          <div className="col-title">IMAGE CONTROLS</div>

          {/* Physical media type selector */}
          <div className="label">PHYSICAL MEDIA STYLE</div>
          <div className="physical-zoom-row">
            <div className="mode-toggle">
              <button type="button" className={`mode-btn ${mediaType === 'dvd' ? 'active' : ''}`} onClick={() => setMediaType('dvd')}>DVD</button>
              <button type="button" className={`mode-btn ${mediaType === 'floppy' ? 'active' : ''}`} onClick={() => setMediaType('floppy')}>FLOPPY</button>
            </div>
          </div>

          {/* Style variant toggle */}
          {showStyleToggle && (
            <div className="physical-zoom-row">
              <div className="mode-toggle mode-toggle-spaced mode-toggle-fill">
                <button type="button" className={`mode-btn ${styleVariant === 'a' ? 'active' : ''}`} onClick={() => setStyleVariant('a')}>
                  {mediaType === 'floppy' ? 'LIGHT' : 'STYLE 1'}
                </button>
                <button type="button" className={`mode-btn ${styleVariant === 'b' ? 'active' : ''}`} onClick={() => setStyleVariant('b')}>
                  {mediaType === 'floppy' ? 'DARK' : 'STYLE 2'}
                </button>
              </div>
            </div>
          )}

          <PhysicalDrawer
            title="COVER ART"
            isOpen={section === 'cover'}
            onToggle={() => toggleSection('cover', 'cover')}
          >
            <div className="physical-controls-row">
              <LogoToggle label="COVER ART" value={coverArtOn} onChange={setCoverArtOn} />
            </div>
            <UploadButton label="UPLOAD COVER IMAGE" onFile={(url) => onSelect({ id: `upload-cover-${Date.now()}`, full: url, thumb: url, source: 'upload' })} />
            {hasResults && (
              <Results
                steamgrid={steamgrid} gog={gog} logos={logos}
                screenshots={null} videos={null}
                selectedId={selectedId} selectedLogoId={selectedLogoId}
                selectedScreenshotId={null} selectedVideoId={null}
                onSelect={onSelect} onSelectLogo={onSelectLogo}
                onSelectScreenshot={() => {}} onSelectVideo={() => {}}
                useCover={useCover} useMarquee={false}
                useScreenshot={false} useVideo={false}
                coversOnly
              />
            )}
          </PhysicalDrawer>

          <PhysicalDrawer
            title="MARQUEE"
            isOpen={section === 'marquee'}
            onToggle={() => toggleSection('marquee', 'logo')}
          >
            {!diskChoice.noMarquee && !diskChoice.noMarqueeToggle && (
              <div className="physical-controls-row">
                <LogoToggle
                  label="MARQUEE"
                  value={showMarquee}
                  onChange={(v) => { setShowMarquee(v); if (!v) setDragTarget('cover'); }}
                />
              </div>
            )}
            <UploadButton label="UPLOAD MARQUEE IMAGE" onFile={(url) => onSelectLogo({ id: `upload-logo-${Date.now()}`, full: url, thumb: url, source: 'upload' })} />
            {hasResults && (
              <Results
                steamgrid={steamgrid} gog={gog} logos={logos}
                screenshots={null} videos={null}
                selectedId={selectedId} selectedLogoId={selectedLogoId}
                selectedScreenshotId={null} selectedVideoId={null}
                onSelect={onSelect} onSelectLogo={onSelectLogo}
                onSelectScreenshot={() => {}} onSelectVideo={() => {}}
                useCover={false} useMarquee={useMarquee}
                useScreenshot={false} useVideo={false}
                logosOnly
              />
            )}
          </PhysicalDrawer>

          <PhysicalDrawer
            title="LOGOS"
            isOpen={section === 'logos'}
            onToggle={() => toggleSection('logos', diskChoice.dvdLogoSrc ? (showSteamLogo ? 'steam' : 'dvd') : 'steam')}
          >
            <LogoControlRow
              label="STEAM LOGO"
              value={showSteamLogo} onChange={setShowSteamLogo}
              variant={steamLogoVariant} setVariant={setSteamLogoVariant}
              border
            />
            {diskChoice.dvdLogoSrc && (
              <LogoControlRow
                label="MEDIA TYPE LOGO"
                value={showDvdLogo} onChange={setShowDvdLogo}
                type={dvdLogoType} setType={setDvdLogoType}
                variant={dvdLogoVariant} setVariant={setDvdLogoVariant}
                border
              />
            )}
            <LogoControlRow
              label="ESRB"
              value={showEsrb} onChange={setShowEsrb}
              extra={showEsrb ? <EsrbPicker value={esrbRating} onChange={setEsrbRating} /> : null}
            />
          </PhysicalDrawer>

        </div>

      </div>
    </div>
  );
}

function UploadButton({ label, onFile }) {
  const inputRef = useRef(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(URL.createObjectURL(file));
          e.target.value = '';
        }}
      />
      <button type="button" className="upload-btn" onClick={() => inputRef.current?.click()}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 2v9M4 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        {label}
      </button>
    </>
  );
}

function LogoControlRow({ label, value, onChange, type, setType, variant, setVariant, border, extra }) {
  return (
    <div className={`logo-control-row${border ? ' logo-control-row-border' : ''}`}>
      <div className="logo-control-row-top">
        <div className="logo-control-row-left">
          <span className="toggle-label">{label}</span>
          <button
            type="button"
            className={`switch ${value ? 'on' : 'off'}`}
            onClick={() => onChange(v => !v)}
          >
            <span className="switch-track">{value ? 'ON' : 'OFF'}</span>
            <span className="switch-thumb" />
          </button>
        </div>
        {value && type && setType && (
          <div className="mode-toggle mode-toggle-equal">
            <button type="button" className={`mode-btn ${type === 'dvd' ? 'active' : ''}`} onClick={() => setType('dvd')}>DVD</button>
            <button type="button" className={`mode-btn ${type === 'cdrom' ? 'active' : ''}`} onClick={() => setType('cdrom')}>CD</button>
          </div>
        )}
        {value && extra}
      </div>
      {value && variant && setVariant && (
        <div className="mode-toggle">
          <button type="button" className={`mode-btn ${variant === 'dark' ? 'active' : ''}`} onClick={() => setVariant('dark')}>DARK</button>
          <button type="button" className={`mode-btn ${variant === 'light' ? 'active' : ''}`} onClick={() => setVariant('light')}>LIGHT</button>
        </div>
      )}
    </div>
  );
}

function LogoToggle({ label, value, onChange }) {
  return (
    <div className="toggle">
      <span className="toggle-label">{label}</span>
      <button
        type="button"
        className={`switch ${value ? 'on' : 'off'}`}
        onClick={() => onChange((v) => !v)}
      >
        <span className="switch-track">{value ? 'ON' : 'OFF'}</span>
        <span className="switch-thumb" />
      </button>
    </div>
  );
}

function PhysicalDrawer({ title, isOpen, onToggle, children }) {
  return (
    <div className="box3d-drawer">
      <button type="button" className="box3d-drawer-header" onClick={onToggle}>
        <span className="box3d-drawer-title">{title}</span>
        <svg className={`box3d-drawer-caret${isOpen ? ' open' : ''}`} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polyline points="2,4 6,8 10,4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div className={`box3d-drawer-body${isOpen ? ' open' : ''}`}>
        <div className="box3d-drawer-inner">
          {children}
        </div>
      </div>
    </div>
  );
}
