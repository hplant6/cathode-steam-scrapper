import React, { useState } from 'react';

export default function ApiKeySetup({ currentKey = '', onSave, onBack }) {
  const [value, setValue] = useState(currentKey);

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed) onSave(trimmed);
  };

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
    </div>
  );
}
