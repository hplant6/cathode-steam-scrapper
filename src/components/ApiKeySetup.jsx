import React, { useState, useEffect, useRef } from 'react';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

export default function ApiKeySetup({ currentKey = '', onSave, onBack }) {
  const [value, setValue] = useState(currentKey);

  const [bugText, setBugText] = useState('');
  const [bugLoading, setBugLoading] = useState(false);
  const [bugResult, setBugResult] = useState(null); // null | { url } | { error }
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaContainerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY || !captchaContainerRef.current) return;

    const renderWidget = () => {
      if (captchaContainerRef.current && widgetIdRef.current === null) {
        widgetIdRef.current = window.grecaptcha.render(captchaContainerRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          theme: 'dark',
          callback: (token) => setCaptchaToken(token),
          'expired-callback': () => setCaptchaToken(null),
          'error-callback': () => setCaptchaToken(null),
        });
      }
    };

    if (window.grecaptcha) {
      window.grecaptcha.ready(renderWidget);
    } else {
      const existing = document.getElementById('recaptcha-script');
      if (!existing) {
        const script = document.createElement('script');
        script.id = 'recaptcha-script';
        script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
        script.async = true;
        script.onload = () => window.grecaptcha.ready(renderWidget);
        document.head.appendChild(script);
      } else {
        existing.addEventListener('load', () => window.grecaptcha.ready(renderWidget));
      }
    }

    return () => { widgetIdRef.current = null; };
  }, []);

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed) onSave(trimmed);
  };

  const handleBugSubmit = async () => {
    const description = bugText.trim();
    if (!description || bugLoading) return;
    if (RECAPTCHA_SITE_KEY && !captchaToken) return;
    setBugLoading(true);
    setBugResult(null);
    try {
      const r = await fetch('/api/report-bug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, captchaToken }),
      });
      const j = await r.json();
      if (!r.ok) {
        setBugResult({ error: j.error || 'Something went wrong.' });
      } else {
        setBugResult({ url: j.url });
        setBugText('');
        setCaptchaToken(null);
        if (RECAPTCHA_SITE_KEY && widgetIdRef.current !== null) {
          window.grecaptcha.reset(widgetIdRef.current);
        }
      }
    } catch {
      setBugResult({ error: 'Could not reach the server.' });
    } finally {
      setBugLoading(false);
    }
  };

  const canSubmit = bugText.trim() && !bugLoading && (!RECAPTCHA_SITE_KEY || captchaToken);

  return (
    <div className="setup-page">
      {onBack && (
        <button className="back-btn" onClick={onBack}><img src="/icon-back-arrow.svg" alt="" className="back-btn-icon" />BACK</button>
      )}
      <div className="setup-card">
        <div className="setup-title">STEAMGRIDDB API KEY</div>
        <p className="setup-desc">
          This app uses SteamGridDB to find game artwork. A free API key is required — it only takes a minute to get one.
        </p>
        <p className="setup-desc">
          Your API key is stored locally on your device and never leaves your browser except to call SteamGridDB directly.
        </p>
        <ol className="setup-steps">
          <li>Create a free account at <strong>steamgriddb.com</strong></li>
          <li>Open your profile and go to <strong>Preferences</strong></li>
          <li>Select the <strong>API</strong> tab</li>
          <li>Generate a key and paste it below</li>
        </ol>
        <a
          href="https://www.steamgriddb.com/profile/preferences/api"
          target="_blank"
          rel="noopener noreferrer"
          className="setup-link-btn"
        >
          GET YOUR FREE API KEY →
        </a>
        <div className="setup-input-row">
          <input
            className="setup-input"
            type="password"
            placeholder="Paste your API key here"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <button
            className="setup-save-btn"
            onClick={handleSave}
            disabled={!value.trim()}
          >
            SAVE
          </button>
        </div>
      </div>

      <div className="setup-card setup-bug-card">
        <div className="setup-title">REPORT A BUG</div>
        <p className="setup-desc">
          Something broken? Describe what happened and we'll log it as a GitHub issue.
        </p>
        <textarea
          className="setup-input setup-textarea"
          placeholder="Describe the bug — what did you do, what did you expect, what actually happened?"
          value={bugText}
          onChange={(e) => { setBugText(e.target.value); setBugResult(null); }}
          rows={5}
          maxLength={4000}
          spellCheck={false}
        />
        {RECAPTCHA_SITE_KEY && (
          <div ref={captchaContainerRef} className="setup-captcha" />
        )}
        {bugResult?.error && (
          <p className="setup-bug-status setup-bug-error">{bugResult.error}</p>
        )}
        {bugResult?.url && (
          <p className="setup-bug-status setup-bug-ok">
            Filed! <a href={bugResult.url} target="_blank" rel="noopener noreferrer" className="setup-bug-link">View issue →</a>
          </p>
        )}
        <button
          className="setup-submit-btn"
          onClick={handleBugSubmit}
          disabled={!canSubmit}
        >
          {bugLoading ? 'SUBMITTING…' : 'SUBMIT REPORT'}
        </button>
      </div>
    </div>
  );
}
