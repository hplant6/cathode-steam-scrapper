import React from 'react';

const GITHUB_URL = 'https://github.com/hplant6';

export default function About({ onBack }) {
  return (
    <div className="about-page">
      <button className="back-btn" onClick={onBack}>
        <img src="/icon-back-arrow.svg" alt="" className="back-btn-icon" />BACK
      </button>

      <div className="about-content">

        <div className="about-hero">
          <img src="/cathode-logo.svg" alt="Cathode" className="about-logo" />
          <h1 className="about-title">STEAM SCRAPPER</h1>
        </div>

        <div className="about-bio">
          <p>Lovingly built by <strong>hplant6</strong> in Long Beach, California.</p>
          <p>I built this tool out of frustration that nothing like this existed. I hope this tool will be as useful for you as it is for me.</p>
          <p>
            Be sure to check out my ES-DE theme <strong>Cathode</strong>, and stay tuned for the release of my new theme called <strong>Alpha</strong>.
            You can check them out <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">here</a>.
          </p>

          <div className="about-theme-gallery">
            <figure className="about-theme-figure">
              <img src="/theme-cathode.png" alt="Cathode ES-DE theme" className="about-theme-img" />
              <figcaption className="about-theme-caption">CATHODE</figcaption>
            </figure>
            <figure className="about-theme-figure">
              <img src="/theme-alpha.png" alt="Alpha ES-DE theme" className="about-theme-img" />
              <figcaption className="about-theme-caption">ALPHA</figcaption>
            </figure>
          </div>
          <p>
            I do this for the love of it, but tips are always appreciated.{' '}
            <a href="https://ko-fi.com/hplant6" target="_blank" rel="noopener noreferrer">You can buy me a coffee here</a>
          </p>
        </div>

        <div className="about-features">
          <h2 className="about-section-title">FEATURES</h2>

          <div className="about-feature-group">
            <h3 className="about-feature-group-title">GAME SEARCH</h3>
            <ul className="about-feature-list">
              <li>Search by game title or ROM filename</li>
              <li>Cover art from SteamGridDB and GOG</li>
              <li>Marquee logos from SteamGridDB</li>
              <li>Screenshots from Steam and SteamGridDB</li>
              <li>Trailers and videos from Steam</li>
              <li>ESRB rating auto-detected from Steam</li>
              <li>Release year auto-detected to pre-select the right assets</li>
            </ul>
          </div>

          <div className="about-feature-group">
            <h3 className="about-feature-group-title">3D BOX ART</h3>
            <ul className="about-feature-list">
              <li>7 DVD box styles + 1 Big Box style</li>
              <li>Auto-selects box style based on game release year</li>
              <li>Drag, pan, and zoom cover image with mouse or touch</li>
              <li>Spine background: use the cover image (with mirror option) or a solid color</li>
              <li>Spine name: rendered in font or replaced with a marquee logo</li>
              <li>White or black spine text with adjustable letter spacing</li>
              <li>ESRB rating badge perspective-warped to the cover face</li>
              <li>ESRB badge on the spine — Big Box style only</li>
              <li>Steam logo on spine and front cover — Big Box style only, 90° rotated on spine</li>
              <li>Per-element zoom controls</li>
            </ul>
          </div>

          <div className="about-feature-group">
            <h3 className="about-feature-group-title">PHYSICAL MEDIA</h3>
            <ul className="about-feature-list">
              <li>3 DVD/CD disc styles</li>
              <li>4 floppy disk styles</li>
              <li>Cover art overlay option</li>
              <li>Marquee logo placement with drag and zoom</li>
              <li>Steam logo and DVD / CD-ROM logo overlays</li>
              <li>Light and dark logo variants</li>
              <li>Auto-selects media type based on game release year</li>
            </ul>
          </div>

          <div className="about-feature-group">
            <h3 className="about-feature-group-title">GENERAL</h3>
            <ul className="about-feature-list">
              <li>Download any asset as a PNG</li>
              <li>Batch queue — process multiple games and download as a ZIP</li>
              <li>Mobile-friendly with pinch-to-zoom support</li>
              <li>Works with local ROM files — drag in a file to auto-fill the game title</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
