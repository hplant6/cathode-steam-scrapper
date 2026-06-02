import React, { useCallback, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import SearchForm from './components/SearchForm.jsx';
import Results from './components/Results.jsx';
import BoxartPreview from './components/BoxartPreview.jsx';
import Box3dEditModal from './components/Box3dEditModal.jsx';
import PhysicalEditModal from './components/PhysicalEditModal.jsx';
import FramePicker, { FRAMES, PhysicalPicker, PHYSICAL_DISKS } from './components/FramePicker.jsx';
import Queue from './components/Queue.jsx';
import VideoPlayer from './components/VideoPlayer.jsx';
import PhysicalPreview from './components/PhysicalPreview.jsx';
import ApiKeySetup from './components/ApiKeySetup.jsx';
import About from './components/About.jsx';
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

  const [selected, setSelected] = useState(null);         // physical media cover
  const [box3dSelected, setBox3dSelected] = useState(null); // 3D box cover
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [frame, setFrame] = useState(FRAMES[0]);
  const [mediaType, setMediaType] = useState('dvd'); // 'dvd' | 'floppy'
  const [coverArtOn, setCoverArtOn] = useState(false);
  const [styleVariant, setStyleVariant] = useState('a'); // 'a' | 'b'

  const diskChoice = React.useMemo(() => {
    if (mediaType === 'dvd') {
      if (coverArtOn) return PHYSICAL_DISKS.find(d => d.src === '/physical-cd3.png');
      return PHYSICAL_DISKS.find(d => d.src === (styleVariant === 'a' ? '/physical-cd1.png' : '/physical-cd2.png'));
    }
    if (coverArtOn) {
      return PHYSICAL_DISKS.find(d => d.src === (styleVariant === 'a' ? '/physical-floppy5.png' : '/physical-floppy4.png'));
    }
    return PHYSICAL_DISKS.find(d => d.src === (styleVariant === 'a' ? '/physical-floppy1.png' : '/physical-floppy2.png'));
  }, [mediaType, coverArtOn, styleVariant]);

  const [showSteamLogo, setShowSteamLogo] = useState(true);
  const [showDvdLogo, setShowDvdLogo] = useState(true);
  const [showMarquee, setShowMarquee] = useState(true);
  const [steamLogoVariant, setSteamLogoVariant] = useState('dark'); // 'light' | 'dark'
  const [dvdLogoVariant, setDvdLogoVariant] = useState('dark'); // 'light' | 'dark'

  React.useEffect(() => {
    if (coverArtOn) {
      setSteamLogoVariant('light');
      setDvdLogoVariant('light');
    } else {
      setSteamLogoVariant('dark');
      setDvdLogoVariant('dark');
    }
  }, [coverArtOn]);
  const [dvdLogoType, setDvdLogoType] = useState('dvd'); // 'dvd' | 'cdrom'
  const [showEsrb, setShowEsrb] = useState(false);
  const [esrbRating, setEsrbRating] = useState('everyone');
  const [showSpineEsrb, setShowSpineEsrb] = useState(false);
  const [showSpineSteamLogo, setShowSpineSteamLogo] = useState(false);
  const [showFrontSteamLogo, setShowFrontSteamLogo] = useState(false);
  const [box3dSteamLogoWhite, setBox3dSteamLogoWhite] = useState(true);

  const steamLogoSrc = steamLogoVariant === 'light' ? '/steam-logo-white.svg' : '/steam-logo.svg';
  const dvdLogoSrc = dvdLogoType === 'cdrom'
    ? (dvdLogoVariant === 'light' ? '/cdda-logo-white.svg' : '/cdda-logo.svg')
    : (dvdLogoVariant === 'light' ? '/dvd-logo-white.svg' : '/dvd-logo.svg');

  const ESRB_SRC_MAP = {
    'early-childhood': '/esrb-early-childhood.svg',
    'everyone':        '/esrb-everyone.svg',
    'everyone-10':     '/esrb-everyone+10.svg',
    'teen':            '/esrb-teen.svg',
    'mature':          '/esrb-mature.svg',
    'adults-only':     '/esrb-adults.svg',
    'rating-pending':  '/esrb-RP.svg',
  };

  const STEAM_ESRB_MAP = {
    'e':   'everyone',
    'e10': 'everyone-10',
    'ec':  'early-childhood',
    't':   'teen',
    'm':   'mature',
    'ao':  'adults-only',
    'rp':  'rating-pending',
  };
  const esrbLogoSrc = showEsrb ? (ESRB_SRC_MAP[esrbRating] ?? null) : null;
  const box3dSteamLogoSrc = (showSpineSteamLogo || showFrontSteamLogo)
    ? (box3dSteamLogoWhite ? '/steam-logo-white.svg' : '/steam-logo.svg')
    : null;
  const [searchMode, setSearchMode] = useState('title'); // 'title' | 'rom'

  // Local file: { stem: filename without extension }
  const [localFile, setLocalFile] = useState(null);
  const canvasRef = useRef(null);
  const boxartPreviewRef = useRef(null);
  const physicalCanvasRef = useRef(null);
  const physicalPreviewRef = useRef(null);

  const [queue, setQueue] = useState([]);
  const [view, setView] = useState('main'); // 'main' | 'queue' | 'settings' | 'about'
  const [prevView, setPrevView] = useState('main');

  const goToAbout = () => { setPrevView(view); setView('about'); };
  const [expandedPanel, setExpandedPanel] = useState(null); // null | '3dbox' | 'physical'
  const [dragTarget, setDragTarget] = useState('cover'); // 'cover' | 'logo' | 'steam' | 'dvd'
  const [box3dDragTarget, setBox3dDragTarget] = useState('cover'); // 'cover' | 'spine' | 'logo'
  const [box3dSection, setBox3dSection] = useState(null); // null | 'drag' | 'spine-name' | 'spine-bg'
  const [spineShowText, setSpineShowText] = useState(true);
  const [spineTextWhite, setSpineTextWhite] = useState(true);
  const [spineLetterSpacing, setSpineLetterSpacing] = useState(0);
  const [spineBgMode, setSpineBgMode] = useState('cover'); // 'cover' | 'black' | 'white' | 'custom'
  const [spineBgMirror, setSpineBgMirror] = useState(false);
  const [spineBgCustomUrl, setSpineBgCustomUrl] = useState(null);

  // Reset spine defaults when frame changes
  React.useEffect(() => {
    setSpineShowText(frame.defaultSpineShowText ?? true);
    setShowSpineEsrb(frame.defaultSpineEsrb ?? false);
    setSpineBgMode(frame.src === '/box3d-8.png' ? 'black' : 'cover');
  }, [frame.src]);

  // Reset drag target to first valid option when disk style changes
  React.useEffect(() => {
    if (diskChoice.mask) setDragTarget('cover');
    else if (!diskChoice.noMarquee) setDragTarget('logo');
    else setDragTarget('steam');
  }, [diskChoice]);

  // Sync 3D box drag target with open drawer + active mode
  React.useEffect(() => {
    if (box3dSection === 'spine-bg' && spineBgMode === 'cover') setBox3dDragTarget('spine');
    else if (box3dSection === 'spine-name' && !spineShowText) setBox3dDragTarget('logo');
    else if (box3dSection === 'esrb') setBox3dDragTarget('esrb');
    else if (box3dSection === 'steam-logo') {
      if (showFrontSteamLogo) setBox3dDragTarget('front-steam');
      else if (showSpineSteamLogo) setBox3dDragTarget('spine-steam');
      else setBox3dDragTarget('cover');
    }
    else setBox3dDragTarget('cover');
  }, [box3dSection, spineBgMode, spineShowText, showSpineSteamLogo, showFrontSteamLogo]);
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

  const doSearch = useCallback(async (q, steamAppId = null) => {
    setError(null);
    setLoading(true);
    setSteamgrid(null);
    setGog(null);
    setLogos(null);
    setScreenshots(null);
    setVideos(null);
    setSelected(null);
    setBox3dSelected(null);
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
      fetch(`/api/search/steam?q=${encodeURIComponent(q)}${steamAppId ? `&appid=${steamAppId}` : ''}`)
        .then((r) => r.json())
        .then((j) => {
          if (j.error) throw new Error(`Steam: ${j.error}`);
          const mapped = j.esrbRating ? STEAM_ESRB_MAP[j.esrbRating] : null;
          if (mapped) { setEsrbRating(mapped); setShowEsrb(true); }
          if (j.releaseYear) {
            if (j.releaseYear <= 1991) {
              setMediaType('floppy');
              setFrame(FRAMES[7]);
            } else if (j.releaseYear <= 2001) {
              setMediaType('dvd');
              setDvdLogoType('cdrom');
              setFrame(FRAMES[0]);
            } else {
              setMediaType('dvd');
              setDvdLogoType('dvd');
              setFrame(FRAMES[0]);
            }
          }
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
      if (allImages[0]) { setSelected(allImages[0]); setBox3dSelected(allImages[0]); }
      if (allScreenshots[0]) setSelectedScreenshot(allScreenshots[0]);
      if (allVideos[0]) setSelectedVideo(allVideos[0]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onSearch = useCallback(() => {
    if (query.trim()) doSearch(query.trim());
  }, [query, doSearch]);

  const onSearchDirect = useCallback((q, steamAppId = null) => {
    setQuery(q);
    doSearch(q, steamAppId);
  }, [doSearch]);

  const onRomSearch = useCallback((stem) => {
    setQuery(stem);
    doSearch(stem);
  }, [doSearch]);

  const coverUrl = selected?.full ?? null;
  const box3dCoverUrl = box3dSelected?.full ?? null;

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

  const onRenameQueueItem = (id, newName) => {
    setQueue((prev) =>
      prev.map((item) => item.id === id ? { ...item, gameName: newName } : item)
    );
  };

  const hasResults = steamgrid != null || gog != null;
  const hasCanvas = box3dCoverUrl != null || coverUrl != null;
  const gameName = localFile?.stem || searchedFor;
  const hasAnySelected = !!(selected || box3dSelected || selectedLogo || selectedScreenshot || selectedVideo);


  return (
    <div className={`app${view === 'main' && (queue.length > 0 || (hasCanvas && !!gameName)) ? ' has-sticky-footer' : ''}`}>
      <div className="sticky-header-wrap">
        <Header onSettings={() => setView('settings')} onAbout={goToAbout} />
        {view === 'main' && apiKey && hasResults && (
          <div className="mobile-tabs">
            <button className={`mobile-tab${mobilePanel === 'search' ? ' active' : ''}`} onClick={() => switchPanel('search')}>SEARCH</button>
            <button className={`mobile-tab${mobilePanel === 'assets' ? ' active' : ''}`} onClick={() => switchPanel('assets')}>ASSETS</button>
          </div>
        )}
      </div>
      {view === 'about' && (
        <About onBack={() => setView(prevView)} />
      )}
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
          <div className="left-col-content">
          <>
              {selectedLogo?.full && (
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
                {use3dBox && (!expandedPanel || expandedPanel === 'physical') && (
                <div className="asset-card">
                  <div className="asset-card-bar">
                    <span className="label">3DBOX</span>
                  </div>
                  <div className="asset-card-body">
                    <div style={{ position: 'relative' }}>
                    <BoxartPreview
                      ref={boxartPreviewRef}
                      coverUrl={box3dCoverUrl}
                      title={searchedFor || 'Game Name'}
                      frameSrc={frame.src}
                      coverMaskSrc={frame.coverMask ?? null}
                      spineMaskSrc={frame.spineMask ?? null}
                      defaultCoverTransform={frame.defaultCoverTransform ?? null}
                      defaultSpineTransform={frame.defaultSpineTransform ?? null}
                      defaultEsrbTransform={frame.defaultEsrbTransform ?? null}
                      defaultLogoTransform={frame.defaultLogoTransform ?? null}
                      defaultSpineEsrbTransform={frame.defaultSpineEsrbTransform ?? null}
                      logoUrl={selectedLogo?.full ?? null}
                      esrbLogoSrc={esrbLogoSrc}
                      showSpineEsrb={showSpineEsrb}
                      steamLogoSrc={box3dSteamLogoSrc}
                      showSpineSteam={showSpineSteamLogo}
                      showFrontSteam={showFrontSteamLogo}
                      spineShowText={spineShowText}
                      spineTextColor={spineTextWhite ? '#ffffff' : '#000000'}
                      spineLetterSpacing={spineLetterSpacing}
                      spineBgMode={spineBgMode}
                      spineBgColor={{ black: '#000000', white: '#ffffff', blue: '#00d1ff', red: '#be4a3c', yellow: '#dfbf28' }[spineBgMode] ?? '#000000'}
                      spineBgMirror={spineBgMirror}
                      spineBgCustomUrl={spineBgCustomUrl}
                      box3dConfig={frame.box3dConfig}
                      dragTarget={box3dDragTarget}
                      onCanvasReady={(c) => { canvasRef.current = c; }}
                      enableDrag={false}
                    />
                    <button className="asset-zoom-btn" onClick={() => setLightbox({ src: canvasRef.current?.toDataURL('image/png'), type: 'image' })}><img src="/icon-zoom.svg" alt="zoom" /></button>
                    </div>
                    <button className="asset-card-edit" onClick={() => setExpandedPanel('3dbox')}>EDIT</button>
                  </div>
                </div>
                )}
                {usePhysical && (
                <div className="asset-card">
                  <div className="asset-card-bar">
                    <span className="label">PHYSICAL MEDIA</span>
                  </div>
                  <div className="asset-card-body">
                    <div style={{ position: 'relative' }}>
                      <button className="asset-zoom-btn" onClick={() => setLightbox({ src: physicalCanvasRef.current?.toDataURL('image/png'), type: 'image' })}><img src="/icon-zoom.svg" alt="zoom" /></button>
                      <PhysicalPreview
                        ref={physicalPreviewRef}
                        dragTarget={dragTarget}
                        enableDrag={false}
                        logoUrl={selectedLogo?.full ?? null}
                        coverUrl={coverUrl}
                        diskSrc={diskChoice.src}
                        maskSrc={diskChoice.mask ?? null}
                        defaultScale={diskChoice.defaultScale ?? 1.21}
                        flip={diskChoice.flip}
                        layout={diskChoice.layout ?? null}
                        steamLogoSrc={steamLogoSrc}
                        dvdLogoSrc={diskChoice.dvdLogoSrc ? dvdLogoSrc : null}
                        esrbLogoSrc={esrbLogoSrc}
                        showSteamLogo={showSteamLogo}
                        showDvdLogo={showDvdLogo}
                        showMarquee={!diskChoice.mask ? true : showMarquee}
                        onCanvasReady={(c) => { physicalCanvasRef.current = c; }}
                      />
                    </div>
                    <button className="asset-card-edit" onClick={() => setExpandedPanel('physical')}>EDIT</button>
                  </div>
                </div>
                )}
              </div>
              <div className="asset-pair asset-pair-media asset-media-extra">
                {useScreenshot && selectedScreenshot?.full && (
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
                {coverUrl && (
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
              {selectedVideo?.full && (
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
        </div>

        <div className="right-col">
          <div className="col-title">SELECT GAME ASSETS</div>
          <SearchForm
            query={query} setQuery={setQuery}
            loading={loading} onSearch={onSearch} onRomSearch={onRomSearch}
            onSearchDirect={onSearchDirect}
            mode={searchMode} setMode={setSearchMode}
            localFile={localFile} onPickFile={onPickFile}
            apiKey={apiKey}
          />

          <div className="asset-checks">
            <AssetCheck label="COVER"          checked={useCover}      onChange={(v) => { setUseCover(v);      if (!v) setSelected(null); }} />
            <AssetCheck label="3D BOX"         checked={use3dBox}      onChange={setUse3dBox} />
            <AssetCheck label="MARQUEE"        checked={useMarquee}    onChange={(v) => { setUseMarquee(v);    if (!v) setSelectedLogo(null); }} />
            <AssetCheck label="SCREENSHOT"     checked={useScreenshot} onChange={(v) => { setUseScreenshot(v); if (!v) setSelectedScreenshot(null); }} />
            <AssetCheck label="VIDEO"          checked={useVideo}      onChange={(v) => { setUseVideo(v);      if (!v) setSelectedVideo(null); }} />
            <AssetCheck label="PHYSICAL MEDIA" checked={usePhysical}   onChange={setUsePhysical} />
          </div>

          {error && <div className="error banner">{error}</div>}

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
              onSelect={(img) => { setSelected(img); setBox3dSelected(img); }}
              onSelectLogo={setSelectedLogo}
              onSelectScreenshot={setSelectedScreenshot}
              onSelectVideo={setSelectedVideo}
              useCover={useCover}
              useMarquee={useMarquee}
              useScreenshot={useScreenshot}
              useVideo={useVideo}
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
            onRename={onRenameQueueItem}
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
      {expandedPanel === '3dbox' && (
        <Box3dEditModal
          coverUrl={box3dCoverUrl}
          title={searchedFor || 'Game Name'}
          frame={frame} setFrame={setFrame}
          logoUrl={selectedLogo?.full ?? null}
          spineShowText={spineShowText} setSpineShowText={setSpineShowText}
          spineTextColor={spineTextWhite ? '#ffffff' : '#000000'}
          spineTextWhite={spineTextWhite} setSpineTextWhite={setSpineTextWhite}
          spineLetterSpacing={spineLetterSpacing} setSpineLetterSpacing={setSpineLetterSpacing}
          spineBgMode={spineBgMode} setSpineBgMode={setSpineBgMode}
          spineBgColor={{ black: '#000000', white: '#ffffff', blue: '#00d1ff', red: '#be4a3c', yellow: '#dfbf28' }[spineBgMode] ?? '#000000'}
          spineBgMirror={spineBgMirror} setSpineBgMirror={setSpineBgMirror}
          spineBgCustomUrl={spineBgCustomUrl} setSpineBgCustomUrl={setSpineBgCustomUrl}
          dragTarget={box3dDragTarget}
          setDragTarget={setBox3dDragTarget}
          boxartPreviewRef={boxartPreviewRef}
          onCanvasReady={(c) => { canvasRef.current = c; }}
          box3dSection={box3dSection} setBox3dSection={setBox3dSection}
          showEsrb={showEsrb} setShowEsrb={setShowEsrb}
          esrbRating={esrbRating} setEsrbRating={setEsrbRating}
          esrbLogoSrc={esrbLogoSrc}
          showSpineEsrb={showSpineEsrb} setShowSpineEsrb={setShowSpineEsrb}
          defaultSpineEsrbTransform={frame.defaultSpineEsrbTransform ?? null}
          showSpineSteamLogo={showSpineSteamLogo} setShowSpineSteamLogo={setShowSpineSteamLogo}
          showFrontSteamLogo={showFrontSteamLogo} setShowFrontSteamLogo={setShowFrontSteamLogo}
          box3dSteamLogoWhite={box3dSteamLogoWhite} setBox3dSteamLogoWhite={setBox3dSteamLogoWhite}
          box3dSteamLogoSrc={box3dSteamLogoSrc}
          hasResults={hasResults}
          steamgrid={steamgrid} gog={gog} logos={logos}
          screenshots={screenshots} videos={videos}
          selectedId={box3dSelected?.id} selectedLogoId={selectedLogo?.id}
          selectedScreenshotId={selectedScreenshot?.id} selectedVideoId={selectedVideo?.id}
          onSelect={setBox3dSelected} onSelectLogo={setSelectedLogo}
          onSelectScreenshot={setSelectedScreenshot} onSelectVideo={setSelectedVideo}
          useCover={useCover} useMarquee={useMarquee}
          useScreenshot={useScreenshot} useVideo={useVideo}
          onClose={() => setExpandedPanel(null)}
          onLightbox={() => setLightbox({ src: canvasRef.current?.toDataURL('image/png'), type: 'image' })}
        />
      )}
      {expandedPanel === 'physical' && (
        <PhysicalEditModal
          coverUrl={coverUrl}
          logoUrl={selectedLogo?.full ?? null}
          diskChoice={diskChoice}
          mediaType={mediaType} setMediaType={setMediaType}
          coverArtOn={coverArtOn} setCoverArtOn={setCoverArtOn}
          styleVariant={styleVariant} setStyleVariant={setStyleVariant}
          dragTarget={dragTarget} setDragTarget={setDragTarget}
          showSteamLogo={showSteamLogo} setShowSteamLogo={setShowSteamLogo}
          showDvdLogo={showDvdLogo} setShowDvdLogo={setShowDvdLogo}
          steamLogoVariant={steamLogoVariant} setSteamLogoVariant={setSteamLogoVariant}
          dvdLogoVariant={dvdLogoVariant} setDvdLogoVariant={setDvdLogoVariant}
          dvdLogoType={dvdLogoType} setDvdLogoType={setDvdLogoType}
          showEsrb={showEsrb} setShowEsrb={setShowEsrb}
          esrbRating={esrbRating} setEsrbRating={setEsrbRating}
          steamLogoSrc={steamLogoSrc} dvdLogoSrc={diskChoice.dvdLogoSrc ? dvdLogoSrc : null}
          esrbLogoSrc={esrbLogoSrc}
          showMarquee={showMarquee} setShowMarquee={setShowMarquee}
          physicalPreviewRef={physicalPreviewRef}
          onCanvasReady={(c) => { physicalCanvasRef.current = c; }}
          onClose={() => setExpandedPanel(null)}
          onLightbox={() => setLightbox({ src: physicalCanvasRef.current?.toDataURL('image/png'), type: 'image' })}
          hasResults={hasResults}
          steamgrid={steamgrid} gog={gog} logos={logos}
          selectedId={selected?.id} selectedLogoId={selectedLogo?.id}
          onSelect={(img) => setSelected(img)} onSelectLogo={(img) => setSelectedLogo(img)}
          useCover={useCover} useMarquee={useMarquee}
        />
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

