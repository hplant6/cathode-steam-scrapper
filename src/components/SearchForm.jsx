import React, { useRef } from 'react';

export default function SearchForm({
  query, setQuery,
  loading, onSearch, onRomSearch,
  mode, setMode,
  localFile, onPickFile,
}) {
  const romInputRef = useRef(null);
  const namingInputRef = useRef(null);

  const submit = (e) => {
    e.preventDefault();
    if (mode === 'title' && query.trim() && !loading) onSearch();
    if (mode === 'rom') romInputRef.current.click();
  };

  const onRomPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const stem = file.name.replace(/\.[^.]+$/, '');
    onRomSearch(stem);
    e.target.value = '';
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
              className="text-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter game title"
              autoFocus
            />
            {query && (
              <button
                type="button"
                className="input-clear"
                onClick={() => setQuery('')}
                aria-label="Clear"
              >
                <img src="/icon-remove.svg" alt="" width="12" height="12" />
              </button>
            )}
          </div>
          {/* USE LOCAL FILE FOR PRECISE NAMING — hidden while deciding placement
          <div className="field">
            <div className="label">USE LOCAL FILE FOR PRECISE NAMING</div>
            <input
              ref={namingInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={onPickFile}
            />
            <button className="search-btn" onClick={() => namingInputRef.current.click()}>
              {localFile ? localFile.stem : 'SELECT FILE'}
            </button>
          </div>
          */}
        </>
      )}

      {mode === 'rom' && (
        <>
          <input ref={romInputRef} type="file" style={{ display: 'none' }} onChange={onRomPick} />
          <button type="button" className="text-input input-btn" onClick={() => romInputRef.current.click()}>
            SELECT FILE
          </button>
        </>
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

