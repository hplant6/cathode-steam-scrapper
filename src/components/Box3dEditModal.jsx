import React, { useState } from 'react';
import BoxartPreview from './BoxartPreview.jsx';
import FramePicker from './FramePicker.jsx';
import Results from './Results.jsx';
import { EsrbPicker } from './EsrbPicker.jsx';

export default function Box3dEditModal({
  coverUrl, title, frame, setFrame,
  logoUrl, spineShowText, setSpineShowText,
  spineTextColor, spineLetterSpacing, setSpineLetterSpacing,
  spineBgMode, setSpineBgMode, spineBgColor, spineBgMirror, setSpineBgMirror,
  dragTarget, setDragTarget, boxartPreviewRef, onCanvasReady,
  box3dSection, setBox3dSection,
  hasResults, steamgrid, gog, logos, screenshots, videos,
  selectedId, selectedLogoId, selectedScreenshotId, selectedVideoId,
  onSelect, onSelectLogo, onSelectScreenshot, onSelectVideo,
  useCover, useMarquee, useScreenshot, useVideo,
  spineTextWhite, setSpineTextWhite,
  showEsrb, setShowEsrb, esrbRating, setEsrbRating, esrbLogoSrc,
  showSpineEsrb, setShowSpineEsrb,
  defaultSpineEsrbTransform,
  showSpineSteamLogo, setShowSpineSteamLogo,
  showFrontSteamLogo, setShowFrontSteamLogo,
  box3dSteamLogoWhite, setBox3dSteamLogoWhite,
  box3dSteamLogoSrc,
  onClose, onLightbox,
}) {
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const showZoom = (
    box3dSection === 'drag' ||
    (box3dSection === 'spine-name' && !spineShowText) ||
    (box3dSection === 'spine-bg' && spineBgMode === 'cover') ||
    box3dSection === 'esrb' ||
    (box3dSection === 'steam-logo' && (showSpineSteamLogo || showFrontSteamLogo))
  );

  return (
    <div className="box3d-modal">
      <button className="modal-close-btn" onClick={onClose}>✕ CLOSE</button>

      <div className="box3d-modal-layout">

        {/* Preview column */}
        <div className="box3d-modal-preview">
          <div className="col-title">3D BOX PREVIEW</div>
          <div className="preview-hint">Click elements to select · Drag to move · Scroll or pinch to zoom</div>
          <div style={{ position: 'relative' }}>
            <BoxartPreview
              ref={boxartPreviewRef}
              coverUrl={coverUrl}
              title={title}
              frameSrc={frame.src}
              coverMaskSrc={frame.coverMask ?? null}
              spineMaskSrc={frame.spineMask ?? null}
              defaultCoverTransform={frame.defaultCoverTransform ?? null}
              defaultSpineTransform={frame.defaultSpineTransform ?? null}
              defaultEsrbTransform={frame.defaultEsrbTransform ?? null}
              defaultLogoTransform={frame.defaultLogoTransform ?? null}
              logoUrl={logoUrl}
              esrbLogoSrc={esrbLogoSrc}
              showSpineEsrb={showSpineEsrb}
              defaultSpineEsrbTransform={defaultSpineEsrbTransform}
              steamLogoSrc={box3dSteamLogoSrc}
              showSpineSteam={showSpineSteamLogo}
              showFrontSteam={showFrontSteamLogo}
              spineShowText={spineShowText}
              spineTextColor={spineTextColor}
              spineLetterSpacing={spineLetterSpacing}
              spineBgMode={spineBgMode}
              spineBgColor={spineBgColor}
              spineBgMirror={spineBgMirror}
              box3dConfig={frame.box3dConfig}
              dragTarget={dragTarget}
              onCanvasReady={onCanvasReady}
              enableDrag
              onDragTargetChange={(target) => {
                setDragTarget(target);
                if (target === 'logo') setBox3dSection('spine-name');
                else if (target === 'esrb' || target === 'spine-esrb') setBox3dSection('esrb');
                else if (target === 'spine-steam' || target === 'front-steam') setBox3dSection('steam-logo');
              }}
            />
            <button className="asset-zoom-btn" onClick={onLightbox}>
              <img src="/icon-zoom.svg" alt="zoom" />
            </button>
          </div>
          {showZoom && (
            <div className="preview-zoom-container">
              {box3dSection === 'steam-logo' && showSpineSteamLogo && showFrontSteamLogo && (
                <div className="physical-zoom-row zoom-row-center">
                  <div className="mode-toggle" style={{ width: '100%', paddingBottom: '10px' }}>
                    <button type="button" className={`mode-btn ${dragTarget === 'front-steam' ? 'active' : ''}`} onClick={() => setDragTarget('front-steam')}>FRONT</button>
                    <button type="button" className={`mode-btn ${dragTarget === 'spine-steam' ? 'active' : ''}`} onClick={() => setDragTarget('spine-steam')}>SPINE</button>
                  </div>
                </div>
              )}
              <div className="physical-zoom-row zoom-row-center">
                <div className="zoom-controls">
                  <span className="zoom-row-label">
                    {box3dSection === 'spine-bg' ? 'ZOOM SPINE' : box3dSection === 'esrb' ? 'ZOOM ESRB' : box3dSection === 'spine-name' ? 'ZOOM LOGO' : box3dSection === 'steam-logo' ? 'ZOOM STEAM' : 'ZOOM COVER'}
                  </span>
                  <button type="button" className="zoom-btn" onClick={() => boxartPreviewRef.current?.zoom(0.95)}>−</button>
                  <button type="button" className="zoom-btn" onClick={() => boxartPreviewRef.current?.zoom(1.05)}>+</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls column */}
        <div className={`box3d-modal-controls${mobileSheetOpen ? ' mobile-sheet-open' : ''}`}>
          <div className="mobile-sheet-handle" onClick={() => setMobileSheetOpen(v => !v)}>
            <span className="mobile-sheet-label">IMAGE CONTROLS</span>
            <span className="mobile-sheet-icon">{mobileSheetOpen ? '−' : '+'}</span>
          </div>
          <div className="col-title">IMAGE CONTROLS</div>

          <FramePicker value={frame} onChange={setFrame} />

          <Box3dDrawer title="BOX COVER IMAGE" isOpen={box3dSection === 'drag'} onToggle={() => setBox3dSection(s => s === 'drag' ? null : 'drag')}>
            {hasResults && (
              <Results
                steamgrid={steamgrid} gog={gog} logos={logos}
                screenshots={screenshots} videos={videos}
                selectedId={selectedId} selectedLogoId={selectedLogoId}
                selectedScreenshotId={selectedScreenshotId} selectedVideoId={selectedVideoId}
                onSelect={onSelect} onSelectLogo={onSelectLogo}
                onSelectScreenshot={onSelectScreenshot} onSelectVideo={onSelectVideo}
                useCover={useCover} useMarquee={useMarquee}
                useScreenshot={useScreenshot} useVideo={useVideo}
                coversOnly
              />
            )}
          </Box3dDrawer>

          <Box3dDrawer title="SPINE NAME STYLE" isOpen={box3dSection === 'spine-name'} onToggle={() => setBox3dSection(s => s === 'spine-name' ? null : 'spine-name')}>
            <div className="physical-zoom-row">
              <div className="mode-toggle">
                <button type="button" className={`mode-btn ${spineShowText ? 'active' : ''}`} onClick={() => setSpineShowText(true)}>USE FONT</button>
                <button type="button" className={`mode-btn ${!spineShowText ? 'active' : ''}`} onClick={() => setSpineShowText(false)}>USE MARQUEE</button>
              </div>
            </div>
            {spineShowText && (
              <div className="physical-zoom-row zoom-row-spread">
                <div className="mode-toggle mode-toggle-spaced">
                  <button type="button" className={`mode-btn ${spineTextWhite ? 'active' : ''}`} onClick={() => setSpineTextWhite(true)}>WHITE TEXT</button>
                  <button type="button" className={`mode-btn ${!spineTextWhite ? 'active' : ''}`} onClick={() => setSpineTextWhite(false)}>BLACK TEXT</button>
                </div>
                <div className="zoom-controls">
                  <span className="zoom-row-label">TEXT SPACING</span>
                  <button type="button" className="zoom-btn" onClick={() => setSpineLetterSpacing(s => Math.max(-5, s - 1))}>−</button>
                  <button type="button" className="zoom-btn" onClick={() => setSpineLetterSpacing(s => Math.min(20, s + 1))}>+</button>
                </div>
              </div>
            )}
            {!spineShowText && hasResults && (
              <Results
                steamgrid={steamgrid} gog={gog} logos={logos}
                screenshots={screenshots} videos={videos}
                selectedId={selectedId} selectedLogoId={selectedLogoId}
                selectedScreenshotId={selectedScreenshotId} selectedVideoId={selectedVideoId}
                onSelect={onSelect} onSelectLogo={onSelectLogo}
                onSelectScreenshot={onSelectScreenshot} onSelectVideo={onSelectVideo}
                useCover={useCover} useMarquee={useMarquee}
                useScreenshot={useScreenshot} useVideo={useVideo}
                logosOnly
              />
            )}
          </Box3dDrawer>

          <Box3dDrawer title="SPINE BACKGROUND" isOpen={box3dSection === 'spine-bg'} onToggle={() => setBox3dSection(s => s === 'spine-bg' ? null : 'spine-bg')}>
            <div className="physical-zoom-row">
              <div className="mode-toggle">
                <button type="button" className={`mode-btn ${spineBgMode === 'cover' ? 'active' : ''}`} onClick={() => setSpineBgMode('cover')}>COVER IMAGE</button>
                <button type="button" className={`mode-btn ${spineBgMode !== 'cover' ? 'active' : ''}`} onClick={() => { if (spineBgMode === 'cover') setSpineBgMode('black'); }}>COLOR</button>
              </div>
            </div>
            {spineBgMode === 'cover' && (
              <div className="logo-control-row">
                <div className="logo-control-row-left">
                  <span className="toggle-label">MIRROR</span>
                  <button
                    type="button"
                    className={`switch ${spineBgMirror ? 'on' : 'off'}`}
                    onClick={() => setSpineBgMirror(v => !v)}
                  >
                    <span className="switch-track">{spineBgMirror ? 'ON' : 'OFF'}</span>
                    <span className="switch-thumb" />
                  </button>
                </div>
              </div>
            )}
            {spineBgMode !== 'cover' && (
              <div className="spine-bg-row">
                <button type="button" className={`spine-bg-btn black-btn${spineBgMode === 'black' ? ' active' : ''}`} onClick={() => setSpineBgMode('black')}>BLACK</button>
                <button type="button" className={`spine-bg-btn white-btn${spineBgMode === 'white' ? ' active' : ''}`} onClick={() => setSpineBgMode('white')}>WHITE</button>
                <button type="button" className={`spine-bg-btn blue-btn${spineBgMode === 'blue' ? ' active' : ''}`} onClick={() => setSpineBgMode('blue')}>BLUE</button>
                <button type="button" className={`spine-bg-btn red-btn${spineBgMode === 'red' ? ' active' : ''}`} onClick={() => setSpineBgMode('red')}>RED</button>
                <button type="button" className={`spine-bg-btn yellow-btn${spineBgMode === 'yellow' ? ' active' : ''}`} onClick={() => setSpineBgMode('yellow')}>YELLOW</button>
              </div>
            )}
          </Box3dDrawer>

          <Box3dDrawer title="ESRB" isOpen={box3dSection === 'esrb'} onToggle={() => setBox3dSection(s => s === 'esrb' ? null : 'esrb')}>
            <div className="logo-control-row-inline">
              <div className="logo-control-row-left">
                <span className="toggle-label">ESRB</span>
                <button
                  type="button"
                  className={`switch ${showEsrb ? 'on' : 'off'}`}
                  onClick={() => setShowEsrb(v => !v)}
                >
                  <span className="switch-track">{showEsrb ? 'ON' : 'OFF'}</span>
                  <span className="switch-thumb" />
                </button>
              </div>
              {showEsrb && <EsrbPicker value={esrbRating} onChange={setEsrbRating} />}
            </div>
            {showEsrb && frame.src === '/box3d-8.png' && (
              <>
                <div className="drawer-divider" />
                <div className="logo-control-row">
                  <div className="logo-control-row-left">
                    <span className="toggle-label">SPINE ESRB</span>
                    <button
                      type="button"
                      className={`switch ${showSpineEsrb ? 'on' : 'off'}`}
                      onClick={() => setShowSpineEsrb(v => !v)}
                    >
                      <span className="switch-track">{showSpineEsrb ? 'ON' : 'OFF'}</span>
                      <span className="switch-thumb" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </Box3dDrawer>

          <Box3dDrawer title="STEAM LOGO" isOpen={box3dSection === 'steam-logo'} onToggle={() => setBox3dSection(s => s === 'steam-logo' ? null : 'steam-logo')}>
            {frame.src === '/box3d-8.png' && (
              <div className="logo-control-row">
                <div className="logo-control-row-left">
                  <span className="toggle-label">SPINE LOGO</span>
                  <button
                    type="button"
                    className={`switch ${showSpineSteamLogo ? 'on' : 'off'}`}
                    onClick={() => setShowSpineSteamLogo(v => !v)}
                  >
                    <span className="switch-track">{showSpineSteamLogo ? 'ON' : 'OFF'}</span>
                    <span className="switch-thumb" />
                  </button>
                </div>
              </div>
            )}
            <div className="logo-control-row">
              <div className="logo-control-row-left">
                <span className="toggle-label">FRONT LOGO</span>
                <button
                  type="button"
                  className={`switch ${showFrontSteamLogo ? 'on' : 'off'}`}
                  onClick={() => setShowFrontSteamLogo(v => !v)}
                >
                  <span className="switch-track">{showFrontSteamLogo ? 'ON' : 'OFF'}</span>
                  <span className="switch-thumb" />
                </button>
              </div>
            </div>
            {(showSpineSteamLogo || showFrontSteamLogo) && (
              <>
                <div className="drawer-divider" />
                <div className="physical-zoom-row">
                  <div className="mode-toggle">
                    <button type="button" className={`mode-btn ${!box3dSteamLogoWhite ? 'active' : ''}`} onClick={() => setBox3dSteamLogoWhite(false)}>DARK</button>
                    <button type="button" className={`mode-btn ${box3dSteamLogoWhite ? 'active' : ''}`} onClick={() => setBox3dSteamLogoWhite(true)}>WHITE</button>
                  </div>
                </div>
              </>
            )}
          </Box3dDrawer>
        </div>

      </div>
    </div>
  );
}

function Box3dDrawer({ title, isOpen, onToggle, children }) {
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
