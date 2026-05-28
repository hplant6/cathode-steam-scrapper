import React, { useEffect, useState } from 'react';

const PAGE_SIZE       = { default: 10, logo: 8, screenshot: 8, video: 8 };
const PAGE_SIZE_PHONE = { default: 9, logo: 6, screenshot: 6, video: 8 };

function useIsPhone() {
  const [phone, setPhone] = useState(() => window.matchMedia('(max-width: 768px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e) => setPhone(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return phone;
}

export default function Results({
  steamgrid, gog, logos, screenshots, videos,
  selectedId, selectedLogoId, selectedScreenshotId, selectedVideoId,
  onSelect, onSelectLogo, onSelectScreenshot, onSelectVideo,
  useCover, useMarquee, useScreenshot, useVideo, coversOnly = false,
}) {
  const coverImages = [...(steamgrid || []), ...(gog || [])];
  const showCovers = useCover && (steamgrid != null || gog != null);
  const showLogos = useMarquee && logos != null && logos.length > 0;
  const showScreenshots = !coversOnly && useScreenshot && screenshots != null && screenshots.length > 0;
  const showVideos = !coversOnly && useVideo && videos != null && videos.length > 0;
  if (!showCovers && !showLogos && !showScreenshots && !showVideos) return null;
  return (
    <div className="results">
      {showCovers && (
        <>
          <div className="results-divider" />
          <div className="results-section-title">COVERS</div>
          <ResultGroup
            title="STEAMGRIDDB.COM / GOG"
            images={coverImages}
            selectedId={selectedId}
            onSelect={onSelect}
            empty="No cover results."
          />
        </>
      )}
      {showLogos && (
        <>
          <div className="results-divider" />
          <div className="results-section-title">MARQUEES</div>
          <ResultGroup
            title="STEAMGRIDDB.COM"
            images={logos}
            selectedId={selectedLogoId}
            onSelect={onSelectLogo}
            empty="No logos found."
            aspect="logo"
          />
        </>
      )}
      {showScreenshots && (
        <>
          <div className="results-divider" />
          <div className="results-section-title">SCREENSHOTS</div>
          <ResultGroup
            title="GOG / STEAM"
            images={screenshots}
            selectedId={selectedScreenshotId}
            onSelect={onSelectScreenshot}
            empty="No screenshots found."
            aspect="screenshot"
          />
        </>
      )}
      {showVideos && (
        <>
          <div className="results-divider" />
          <div className="results-section-title">VIDEOS</div>
          <ResultGroup
            title="STEAM"
            images={videos}
            selectedId={selectedVideoId}
            onSelect={onSelectVideo}
            empty="No videos found."
            aspect="video"
          />
        </>
      )}
    </div>
  );
}

function ResultGroup({ title, images, selectedId, onSelect, empty, aspect }) {
  const [page, setPage] = useState(0);
  const isPhone = useIsPhone();

  useEffect(() => { setPage(0); }, [images]);

  const sizes = isPhone ? PAGE_SIZE_PHONE : PAGE_SIZE;
  const pageSize = sizes[aspect] ?? sizes.default;
  const totalPages = Math.max(1, Math.ceil(images.length / pageSize));

  const gridClass = [
    'grid carousel-page',
    aspect === 'logo' ? 'grid-logo' : '',
    aspect === 'screenshot' || aspect === 'video' ? 'grid-screenshot' : '',
  ].join(' ').trim();

  const vpClass = [
    'carousel-viewport',
    aspect === 'logo' ? 'vp-logo' : '',
    aspect === 'screenshot' || aspect === 'video' ? 'vp-screenshot' : '',
  ].join(' ').trim();

  return (
    <div className="result-group">
      <div className="group-title">
        <span>{title}</span>
        {totalPages > 1 && (
          <div className="group-nav">
            <button
              className="nav-arrow"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous page"
            >
              <img src="/icon-arrow-left.svg" alt="" className="nav-arrow-icon" />
            </button>
            <span className="nav-page">{page + 1} / {totalPages}</span>
            <button
              className="nav-arrow"
              disabled={page === totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next page"
            >
              <img src="/icon-arrow-right.svg" alt="" className="nav-arrow-icon" />
            </button>
          </div>
        )}
      </div>
      {images.length === 0 ? (
        <div className="empty">{empty}</div>
      ) : (
        <div className={vpClass}>
          <div
            className="carousel-track"
            style={{ transform: `translateX(calc(-${page} * 100%))` }}
          >
            {Array.from({ length: totalPages }, (_, i) => (
              <div key={i} className={gridClass}>
                {images.slice(i * pageSize, (i + 1) * pageSize).map((img) => {
                  const selected = img.id === selectedId;
                  return (
                    <button
                      key={img.id}
                      type="button"
                      className={[
                        'thumb',
                        aspect === 'logo' ? 'thumb-logo' : '',
                        aspect === 'screenshot' || aspect === 'video' ? 'thumb-screenshot' : '',
                        selected ? 'selected' : '',
                      ].join(' ').trim()}
                      onClick={() => selected ? onSelect(null) : onSelect(img)}
                      title={img.title || ''}
                    >
                      <img src={img.thumb || img.full} alt="" loading="lazy" />
                      {selected && <span className="check" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
