import React, { useCallback, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import SearchForm from './components/SearchForm.jsx';
import Results from './components/Results.jsx';
import BoxartPreview from './components/BoxartPreview.jsx';
import FramePicker, { FRAMES, PhysicalPicker, PHYSICAL_DISKS } from './components/FramePicker.jsx';
import Queue from './components/Queue.jsx';
import VideoPlayer from './components/VideoPlayer.jsx';
import PhysicalPreview from './components/PhysicalPreview.jsx';
import ApiKeySetup from './components/ApiKeySetup.jsx';
import Lightbox from './components/Lightbox.jsx';
import { downloadCanvas } from './lib/composite.js';

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('sgdb-key') || '');
  const [query, setQuery] = useState('');
  const [useCover, setUseCover] = useState(true);
  const [use3dBox, setUse3dBox] = useState(true);
  const [useMarquee, setUseMarquee] = useState(true);
  const [useScreenshot, setUseScreenshot] = useState(true);
  const [useVideo, setUseVideo] = useState(true);
  const [usePhysical, setUsePhysical] = useState(true);

  const [loading, setLoading] = useState(false);
  const [steamgrid, setSteamgrid] = useState(null);
  const [gog, setGog] = useState(null);
  const [logos, setLogos] = useState(null);
  const [screenshots, setScreenshots] = useState(null);
  const [videos, setVideos] = useState(null);
  const [searchedFor, setSearchedFor] = useState('');
  const [error, setError] = useState(null);

  const [selected, setSelected] = useState(null);
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [frameSrc, setFrameSrc] = useState(FRAMES[0].src);
  const [diskChoice, setDiskChoice] = useState(PHYSICAL_DISKS[0]);
  const [showSteamLogo, setShowSteamLogo] = useState(true);
  const [showDvdLogo, setShowDvdLogo] = useState(true);
  const [showMarquee, setShowMarquee] = useState(true);
  const [searchMode, setSearchMode] = useState('title'); // 'title' | 'rom'

  // Reset drag target to first valid option when disk style changes
  React.useEffect(() => {
    if (diskChoice.mask) setDragTarget('cover');
    else if (!diskChoice.noMarquee) setDragTarget('logo');
    else setDragTarget('steam');
  }, [diskChoice]);

  // Local file: { stem: filename without extension }
  const [localFile, setLocalFile] = useState(null);
  const canvasRef = useRef(null);
  const physicalCanvasRef = useRef(null);
  const physicalPreviewRef = useRef(null);

  const [queue, setQueue] = useState([]);
  const [view, setView] = useState('main'); // 'main' | 'queue' | 'settings'
  const [expandedPanel, setExpandedPanel] = useState(null); // null | '3dbox' | 'physical'
  const [dragTarget, setDragTarget] = useState('cover'); // 'cover' | 'logo' | 'steam' | 'dvd'
  const [justAdded, setJustAdded] = useState(false);
  const [physPreviewOpen, setPhysPreviewOpen] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  // Mobile swipe panel
  const [mobilePanel, setMobilePanel] = useState('search'); // 'search' | 'assets'
  const mobilePanelRef = useRef('search');
  const swipePanelsRef = useRef(null);
  const switchPanel = useCallback((panel) => {
    mobilePanelRef.current = panel;
    setMobilePanel(panel);
    if (swipePanelsRef.current && window.innerWidth <= 768) {
      swipePanelsRef.current.style.transition = 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1)';
      swipePanelsRef.current.style.transform = panel === 'assets' ? 'translateX(-50%)' : 'translateX(0%)';
    }
  }, []);

  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const stem = file.name.replace(/\.[^.]+$/, '');
    setLocalFile({ stem });
  };

  const onSaveApiKey = (key) => {
    localStorage.setItem('sgdb-key', key);
    setApiKey(key);
    setView('main');
  };

  const doSearch = useCallback(async (q) => {
    setError(null);
    setLoading(true);
    setSteamgrid(null);
    setGog(null);
    setLogos(null);
    setScreenshots(null);
    setVideos(null);
    setSelected(null);
    setSelectedLogo(null);
    setSelectedScreenshot(null);
    setSelectedVideo(null);
    setSearchedFor(q);

    const tasks = [
      fetch(`/api/search/steamgrid?q=${encodeURIComponent(q)}`, { headers: { 'x-sgdb-key': apiKey } })
        .then((r) => r.json())
        .then((j) => {
          if (j.error) throw new Error(`SteamGridDB: ${j.error}`);
          setSteamgrid(j.images || []);
          const logoList = j.logos || [];
          setLogos(logoList);
          if (logoList[0]) setSelectedLogo(logoList[0]);
          return { images: j.images || [], screenshots: [], videos: [] };
        }),
      fetch(`/api/search/gog?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((j) => {
          if (j.error) throw new Error(`GOG: ${j.error}`);
          setGog(j.images || []);
          return { images: j.images || [], screenshots: j.screenshots || [], videos: [] };
        }),
      fetch(`/api/search/steam?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((j) => {
          if (j.error) throw new Error(`Steam: ${j.error}`);
          return { images: [], screenshots: j.screenshots || [], videos: j.videos || [] };
        }),
    ];

    try {
      const settled = await Promise.allSettled(tasks);
      const results = settled.filter((r) => r.status === 'fulfilled').map((r) => r.value);
      const errors = settled.filter((r) => r.status === 'rejected').map((r) => r.reason?.message || 'unknown error');
      if (errors.length > 0) setError(errors.join(' | '));
      const allImages = results.flatMap((r) => r.images);
      const allScreenshots = results.flatMap((r) => r.screenshots);
      const allVideos = results.flatMap((r) => r.videos);
      setScreenshots(allScreenshots);
      setVideos(allVideos);
      if (allImages[0]) setSelected(allImages[0]);
      if (allScreenshots[0]) setSelectedScreenshot(allScreenshots[0]);
      if (allVideos[0]) setSelectedVideo(allVideos[0]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onSearch = useCallback(() => {
    if (query.trim()) doSearch(query.trim());
  }, [query, doSearch]);

  const onRomSearch = useCallback((stem) => {
    setQuery(stem);
    doSearch(stem);
  }, [doSearch]);

  const coverUrl = selected?.full ?? null;

  // Download name: local file stem → search query → fallback.
  const onDownload = () => {
    if (!canvasRef.current) return;
    const raw = localFile?.stem || searchedFor || 'boxart';
    const safe = raw.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'boxart';
    downloadCanvas(canvasRef.current, `${safe}.png`);
  };

  const onAddToQueue = () => {
    const gameName = localFile?.stem || searchedFor;
    if (!gameName || !canvasRef.current) return;
    const boxartPng = canvasRef.current.toDataURL('image/png');
    const id = `${Date.now()}-${Math.random()}`;
    setQueue((prev) => [
      ...prev,
      {
        id,
        gameName,
        boxartPng: use3dBox ? boxartPng : null,
        coverUrl: useCover ? (selected?.full ?? null) : null,
        logoUrl: useMarquee ? (selectedLogo?.full ?? null) : null,
        screenshotUrl: useScreenshot ? (selectedScreenshot?.full ?? null) : null,
        videoUrl: useVideo ? (selectedVideo?.full ?? null) : null,
        videoExt: selectedVideo?.ext ?? 'mp4',
        videoStreaming: selectedVideo?.streaming ?? false,
        status: 'pending',
      },
    ]);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const onRemoveFromQueue = (id) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const onClearQueue = () => {
    setQueue([]);
  };

  const onStatusUpdate = (id, status, error) => {
    setQueue((prev) =>
      prev.map((item) => item.id === id ? { ...item, status, error } : item)
    );
  };

  const hasResults = steamgrid != null || gog != null;
  const hasCanvas = coverUrl != null;
  const gameName = localFile?.stem || searchedFor;
  const hasAnySelected = !!(selected || selectedLogo || selectedScreenshot || selectedVideo);


  return (
    <div className={`app${view === 'main' && (queue.length > 0 || (hasCanvas && !!gameName)) ? ' has-sticky-footer' : ''}`}>
      <div className="sticky-header-wrap">
        <Header onSettings={() => setView('settings')} />
        {view === 'main' && apiKey && hasResults && (
          <div className="mobile-tabs">
            <button className={`mobile-tab${mobilePanel === 'search' ? ' active' : ''}`} onClick={() => switchPanel('search')}>SEARCH</button>
            <button className={`mobile-tab${mobilePanel === 'assets' ? ' active' : ''}`} onClick={() => switchPanel('assets')}>ASSETS</button>
          </div>
        )}
      </div>
      {view === 'settings' && (
        <ApiKeySetup currentKey={apiKey} onSave={onSaveApiKey} onBack={() => setView('main')} />
      )}
      {view === 'main' && !apiKey && (
        <ApiKeySetup onSave={onSaveApiKey} />
      )}
      {view === 'main' && apiKey && (
      <>
      <div className={`layout${hasAnySelected ? ' col-visible' : ''}`}>
        <div
          className="swipe-panels"
          ref={swipePanelsRef}
        >
        <div className="left-col">
          <div className="col-title">ASSET PREVIEWS</div>

          <>
              {(!expandedPanel || expandedPanel === 'physical') && selectedLogo?.full && (
                <div className="asset-card asset-media-extra">
                  <div className="asset-card-bar">
                    <span className="label">MARQUEE</span>
                  </div>
                  <div className="asset-card-body">
                    <img className="preview-mini-logo" src={selectedLogo.full} alt="" />
                    <button className="asset-zoom-btn" onClick={() => setLightbox({ src: selectedLogo.full, type: 'image' })}><img src="/icon-zoom.svg" alt="zoom" /></button>
                  </div>
                </div>
              )}
              <div className="asset-pair">
                {use3dBox && (!expandedPanel || expandedPanel === '3dbox') && (
                <div className={`asset-card${expandedPanel === '3dbox' ? ' expanded' : ''}`}>
                  <div className="asset-card-bar">
                    <span className="label">3DBOX</span>
                    {expandedPanel === '3dbox'
                      ? <button className="asset-card-close" onClick={() => setExpandedPanel(null)}>✕ CLOSE</button>
                      : <button className="asset-card-edit" onClick={() => setExpandedPanel('3dbox')}>EDIT</button>
                    }
                  </div>
                  <div className="asset-card-body">
                    <BoxartPreview
                      coverUrl={coverUrl}
                      title={searchedFor || 'Game Name'}
                      frameSrc={frameSrc}
                      onCanvasReady={(c) => { canvasRef.current = c; }}
                    />
                    {expandedPanel === '3dbox' && use3dBox && (
                      <FramePicker value={frameSrc} onChange={setFrameSrc} />
                    )}
                    <button className="asset-zoom-btn" onClick={() => setLightbox({ src: canvasRef.current?.toDataURL('image/png'), type: 'image' })}><img src="/icon-zoom.svg" alt="zoom" /></button>
                  </div>
                </div>
                )}
                {usePhysical && (!expandedPanel || expandedPanel === 'physical') && (
                <div className={`asset-card${expandedPanel === 'physical' ? ' expanded' : ''}`}>
                  <div className="asset-card-bar">
                    <span className="label">PHYSICAL MEDIA</span>
                    {expandedPanel === 'physical'
                      ? <button className="asset-card-close" onClick={() => setExpandedPanel(null)}>✕ CLOSE</button>
                      : <button className="asset-card-edit" onClick={() => setExpandedPanel('physical')}>EDIT</button>
                    }
                  </div>
                  <div className="asset-card-body" style={{ justifyContent: 'flex-end', paddingBottom: 11 }}>
                    <div className={`phys-preview-drawer${physPreviewOpen ? ' open' : ''}`} style={{ position: 'relative' }}>
                      <button className="asset-zoom-btn" onClick={() => setLightbox({ src: physicalCanvasRef.current?.toDataURL('image/png'), type: 'image' })}><img src="/icon-zoom.svg" alt="zoom" /></button>
                      <PhysicalPreview
                        ref={physicalPreviewRef}
                        dragTarget={dragTarget}
                        enableDrag={expandedPanel === 'physical'}
                        logoUrl={selectedLogo?.full ?? null}
                        coverUrl={coverUrl}
                        diskSrc={diskChoice.src}
                        maskSrc={diskChoice.mask ?? null}
                        defaultScale={diskChoice.defaultScale ?? 1.21}
                        flip={diskChoice.flip}
                        layout={diskChoice.layout ?? null}
                        steamLogoSrc={diskChoice.steamLogoSrc ?? null}
                        dvdLogoSrc={diskChoice.dvdLogoSrc ?? null}
                        showSteamLogo={showSteamLogo}
                        showDvdLogo={showDvdLogo}
                        showMarquee={!diskChoice.mask ? true : showMarquee}
                        onCanvasReady={(c) => { physicalCanvasRef.current = c; }}
                      />
                    </div>
                    {expandedPanel === 'physical' && (
                      <div className="physical-zoom-wrap">
                        <span className="physical-zoom-label">DRAG TO MOVE</span>
                        <div className="physical-zoom-row">
                          <div className="mode-toggle">
                            {diskChoice.mask && <button type="button" className={`mode-btn ${dragTarget === 'cover' ? 'active' : ''}`} onClick={() => setDragTarget('cover')}>COVER</button>}
                            {(!diskChoice.mask || (!diskChoice.noMarquee && showMarquee)) && <button type="button" className={`mode-btn ${dragTarget === 'logo' ? 'active' : ''}`} onClick={() => setDragTarget('logo')}>MARQUEE</button>}
                            {!diskChoice.mask && showSteamLogo && <button type="button" className={`mode-btn ${dragTarget === 'steam' ? 'active' : ''}`} onClick={() => setDragTarget('steam')}>STEAM</button>}
                            {diskChoice.dvdLogoSrc && showDvdLogo && <button type="button" className={`mode-btn ${dragTarget === 'dvd' ? 'active' : ''}`} onClick={() => setDragTarget('dvd')}>DVD</button>}
                          </div>
                          <button type="button" className="zoom-btn" onClick={() => physicalPreviewRef.current?.zoom(0.9)}>−</button>
                          <button type="button" className="zoom-btn" onClick={() => physicalPreviewRef.current?.zoom(1.1)}>+</button>
                        </div>
                      </div>
                    )}
                    {expandedPanel === 'physical' && (
                      <>
                        <div className="physical-controls-row">
                          <LogoToggle label="STEAM LOGO" value={showSteamLogo} onChange={setShowSteamLogo} />
                          {diskChoice.dvdLogoSrc && <LogoToggle label="DVD LOGO" value={showDvdLogo} onChange={setShowDvdLogo} />}
                          {!diskChoice.noMarquee && !diskChoice.noMarqueeToggle && <LogoToggle label="MARQUEE" value={showMarquee} onChange={(v) => { setShowMarquee(v); if (!v) setDragTarget('cover'); }} />}
                        </div>
                        <PhysicalPicker
                          value={diskChoice.src}
                          onChange={(src) => setDiskChoice(PHYSICAL_DISKS.find(d => d.src === src))}
                        />
                        <button
                          className="phys-drawer-toggle"
                          onClick={() => setPhysPreviewOpen((v) => !v)}
                        >
                          {physPreviewOpen ? '▲ HIDE PREVIEW' : '▼ SHOW PREVIEW'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                )}
              </div>
              <div className="asset-pair asset-pair-media asset-media-extra">
                {(!expandedPanel || expandedPanel === 'physical') && useScreenshot && selectedScreenshot?.full && (
                  <div className="asset-card">
                    <div className="asset-card-bar">
                      <span className="label">SCREENSHOT</span>
                    </div>
                    <div className="asset-card-body">
                      <img className="preview-full-img" src={selectedScreenshot.full} alt="" />
                      <button className="asset-zoom-btn" onClick={() => setLightbox({ src: selectedScreenshot.full, type: 'image' })}><img src="/icon-zoom.svg" alt="zoom" /></button>
                    </div>
                  </div>
                )}
                {(!expandedPanel || expandedPanel === 'physical') && coverUrl && (
                  <div className="asset-card">
                    <div className="asset-card-bar">
                      <span className="label">COVER</span>
                    </div>
                    <div className="asset-card-body">
                      <img className="preview-mini-cover" src={coverUrl} alt="" />
                      <button className="asset-zoom-btn" onClick={() => setLightbox({ src: coverUrl, type: 'image' })}><img src="/icon-zoom.svg" alt="zoom" /></button>
                    </div>
                  </div>
                )}
              </div>
              {(!expandedPanel || expandedPanel === 'physical') && selectedVideo?.full && (
                <div className="asset-card asset-media-extra">
                  <div className="asset-card-bar">
                    <span className="label">VIDEO</span>
                  </div>
                  <div className="asset-card-body">
                    <VideoPlayer className="preview-full-video" src={selectedVideo.full} />
                  </div>
                </div>
              )}
          </>
        </div>

        <div className="right-col">
          <div className="col-title">SELECT GAME ASSETS</div>
          {!expandedPanel && (
            <SearchForm
              query={query} setQuery={setQuery}
              loading={loading} onSearch={onSearch} onRomSearch={onRomSearch}
              mode={searchMode} setMode={setSearchMode}
              localFile={localFile} onPickFile={onPickFile}
            />
          )}

          {!expandedPanel && (
            <div className="asset-checks">
              <AssetCheck label="COVER"          checked={useCover}      onChange={(v) => { setUseCover(v);      if (!v) setSelected(null); }} />
              <AssetCheck label="3D BOX"         checked={use3dBox}      onChange={setUse3dBox} />
              <AssetCheck label="MARQUEE"        checked={useMarquee}    onChange={(v) => { setUseMarquee(v);    if (!v) setSelectedLogo(null); }} />
              <AssetCheck label="SCREENSHOT"     checked={useScreenshot} onChange={(v) => { setUseScreenshot(v); if (!v) setSelectedScreenshot(null); }} />
              <AssetCheck label="VIDEO"          checked={useVideo}      onChange={(v) => { setUseVideo(v);      if (!v) setSelectedVideo(null); }} />
              <AssetCheck label="PHYSICAL MEDIA" checked={usePhysical}   onChange={setUsePhysical} />
            </div>
          )}

          {!expandedPanel && error && <div className="error banner">{error}</div>}

          {hasResults && (
            <Results
              steamgrid={steamgrid}
              gog={gog}
              logos={logos}
              screenshots={screenshots}
              videos={videos}
              selectedId={selected?.id}
              selectedLogoId={selectedLogo?.id}
              selectedScreenshotId={selectedScreenshot?.id}
              selectedVideoId={selectedVideo?.id}
              onSelect={setSelected}
              onSelectLogo={setSelectedLogo}
              onSelectScreenshot={setSelectedScreenshot}
              onSelectVideo={setSelectedVideo}
              useCover={useCover}
              useMarquee={useMarquee}
              useScreenshot={useScreenshot}
              useVideo={useVideo}
              coversOnly={!!expandedPanel}
            />
          )}
        </div>
        </div>{/* swipe-panels */}
      </div>
      </>
      )}
      {view === 'queue' && (
        <div className="queue-page">
          <button className="back-btn" onClick={() => setView('main')}><img src="/icon-back-arrow.svg" alt="" className="back-btn-icon" />BACK</button>
          <Queue
            items={queue}
            onRemove={onRemoveFromQueue}
            onClearAll={() => { onClearQueue(); setView('main'); }}
            onStatusUpdate={onStatusUpdate}
          />
        </div>
      )}
      {view === 'main' && (queue.length > 0 || (hasCanvas && !!gameName)) && (
        <div className="sticky-footer">
          <div className="sticky-footer-inner">
            {hasCanvas && gameName && (
              <button className="queue-add-btn" onClick={onAddToQueue}>
                {justAdded ? (
                  <>ADDED TO QUEUE <svg className="check-icon" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="1.5,6 4.5,9 10.5,3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></>
                ) : '+ ADD TO QUE'}
              </button>
            )}
            {queue.length > 0 && (
              <button className="download-btn" onClick={() => setView('queue')}>
                DOWNLOAD QUEUE ({queue.length})
              </button>
            )}
          </div>
        </div>
      )}
      <Lightbox src={lightbox?.src} type={lightbox?.type} onClose={() => setLightbox(null)} />
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

function AssetCheck({ label, checked, onChange }) {
  return (
    <label className="asset-check">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="asset-check-label">{label}</span>
    </label>
  );
}
