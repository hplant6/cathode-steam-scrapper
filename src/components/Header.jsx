import React, { useEffect, useRef, useState } from 'react';

export default function Header({ onSettings, onAbout }) {
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastScrollY.current && y > 80) {
        setHidden(true);
      } else if (y < lastScrollY.current) {
        setHidden(false);
      }
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSettings = () => { setMenuOpen(false); onSettings(); };
  const handleAbout    = () => { setMenuOpen(false); onAbout?.(); };

  return (
    <>
      <header className={`header${hidden ? ' header-hidden' : ''}`}>
        <div className="header-inner">
          <div className="header-logo">
            <img src="/cathode-logo.svg" alt="Cathode" className="header-logo-img" />
          </div>
          <span className="header-title">STEAM SCRAPPER</span>
          <nav className="header-nav">
            <button className="header-link" onClick={handleAbout}>ABOUT</button>
            <button className="header-settings-btn" onClick={onSettings}>SETTINGS</button>
          </nav>
          <button className="header-menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <svg viewBox="0 0 20 20" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="2" y1="5" x2="18" y2="5" />
              <line x1="2" y1="10" x2="18" y2="10" />
              <line x1="2" y1="15" x2="18" y2="15" />
            </svg>
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="header-overlay">
          <div className="header-overlay-top">
            <button className="header-overlay-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
              <svg viewBox="0 0 20 20" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </svg>
            </button>
          </div>
          <nav className="header-overlay-nav">
            <button className="header-overlay-link" onClick={handleAbout}>ABOUT</button>
            <button className="header-overlay-link" onClick={handleSettings}>SETTINGS</button>
          </nav>
        </div>
      )}
    </>
  );
}
