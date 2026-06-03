import React, { useRef, useState, useEffect } from 'react';

export default function SearchForm({
  query, setQuery,
  loading, onSearch, onRomSearch, onSearchDirect,
  mode, setMode,
  localFile, onPickFile,
  apiKey,
}) {
  const romInputRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestionId, setActiveSuggestionId] = useState(null);
  const [pickedFileName, setPickedFileName] = useState(null);
  const suppressRef = useRef(false);

  // Debounced autocomplete fetch
  useEffect(() => {
    if (mode !== 'title' || !query.trim() || !apiKey) {
      setSuggestions([]);
      return;
    }
    if (suppressRef.current) {
      suppressRef.current = false;
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(query.trim())}`, {
          headers: { 'x-sgdb-key': apiKey },
        });
        const data = await res.json();
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, mode, apiKey]);

  const submit = (e) => {
    e.preventDefault();
    if (mode === 'title' && query.trim() && !loading) onSearch();
    if (mode === 'rom') romInputRef.current.click();
  };

  const onRomPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const stem = file.name.replace(/\.[^.]+$/, '');
    setPickedFileName(file.name);
    onRomSearch(stem);
    e.target.value = '';
  };

  const clearRom = () => {
    setPickedFileName(null);
    setQuery('');
  };

  const selectSuggestion = (name, appId) => {
    suppressRef.current = true;
    setActiveSuggestionId(appId);
    onSearchDirect(name, appId);
  };

  return (
    <form className="search-form" onSubmit={submit}>

      <div className="mode-toggle">
        <button
          type="button"
          className={`mode-btn ${mode === 'title' ? 'active' : ''}`}
          onClick={() => setMode('title')}
        >
          GAME TITLE
        </button>
        <button
          type="button"
          className={`mode-btn ${mode === 'rom' ? 'active' : ''}`}
          onClick={() => setMode('rom')}
        >
          SEARCH VIA GAME FILE
        </button>
      </div>

      {mode === 'title' && (
        <>
          <div className="label">GAME TITLE</div>
          <div className="input-wrap">
            <input
              className="text-input cmd-input"
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveSuggestionId(null); }}
              placeholder="Enter game title"
              autoFocus
            />
            {query && (
              <button
                type="button"
                className="input-clear"
                onClick={() => { setQuery(''); setSuggestions([]); setActiveSuggestionId(null); }}
                aria-label="Clear"
              >
                <img src="/icon-remove.svg" alt="" width="12" height="12" />
              </button>
            )}
          </div>
        </>
      )}

      {mode === 'rom' && (
        <>
          <input ref={romInputRef} type="file" style={{ display: 'none' }} onChange={onRomPick} />
          <div className="input-wrap">
            <button
              type="button"
              className={`text-input input-btn${pickedFileName ? ' input-btn-active' : ''}`}
              onClick={() => romInputRef.current.click()}
            >
              {pickedFileName || 'SELECT FILE'}
            </button>
            {pickedFileName && (
              <button type="button" className="input-clear" onClick={clearRom} aria-label="Clear">
                <img src="/icon-remove.svg" alt="" width="12" height="12" />
              </button>
            )}
          </div>
        </>
      )}

      {mode === 'title' && suggestions.length > 0 && (
        <div className="search-suggestions-box">
          <div className="label">MATCHING TITLES</div>
          <ul className="search-suggestions">
            {suggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`search-suggestion-btn${s.id === activeSuggestionId ? ' active' : ''}`}
                  onClick={() => selectSuggestion(s.name, s.id)}
                >
                  {s.name}
                  {s.id === activeSuggestionId && (
                    <svg className="suggestion-check" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <polyline points="1.5,6 4.5,9 10.5,3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {mode === 'title' && (
        <button
          type="submit"
          className="search-btn"
          disabled={loading || !query.trim()}
        >
          {loading ? 'SEARCHING…' : 'SEARCH'}
        </button>
      )}

    </form>
  );
}
