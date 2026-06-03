import React, { useEffect, useRef, useState } from 'react';
import JSZip from 'jszip';

const FSAPI_SUPPORTED = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

function safeName(gameName) {
  return gameName.replace(/[<>:"/\\|?*]/g, '').trim();
}

async function dataUrlToBytes(dataUrl) {
  const b64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function fetchProxied(url) {
  const r = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
  if (!r.ok) throw new Error(`proxy ${r.status}`);
  return r.arrayBuffer();
}

async function fetchDirect(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`fetch ${r.status}`);
  return r.arrayBuffer();
}

async function writeEntry(dirHandle, subfolder, filename, data) {
  const sub = await dirHandle.getDirectoryHandle(subfolder, { create: true });
  const fh = await sub.getFileHandle(filename, { create: true });
  const w = await fh.createWritable();
  await w.write(data);
  await w.close();
}

const REVEAL_W = 72;
const DELETE_EXTRA = 30; // px past the reveal edge that triggers instant delete

function QueueRow({ item, onRemove, onRename, triggerDiskRename }) {
  const wrapRef = useRef(null);
  const innerRef = useRef(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const baseOffsetRef = useRef(0);   // offset at the start of each gesture
  const currentOffsetRef = useRef(0);
  const isDraggingRef = useRef(false);
  const onRemoveRef = useRef(onRemove);
  onRemoveRef.current = onRemove;
  const doDeleteRef = useRef(null);

  const doDelete = () => {
    isDraggingRef.current = false;
    if (innerRef.current) {
      innerRef.current.style.transition = 'transform 180ms ease';
      innerRef.current.style.transform = 'translateX(-110%)';
    }
    setTimeout(() => onRemoveRef.current(item.id), 170);
  };
  doDeleteRef.current = doDelete;

  const snapToOpen = () => {
    if (innerRef.current) {
      innerRef.current.style.transition = 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)';
      innerRef.current.style.transform = `translateX(${-REVEAL_W}px)`;
    }
    currentOffsetRef.current = -REVEAL_W;
  };

  const snapToClose = () => {
    if (innerRef.current) {
      innerRef.current.style.transition = 'transform 250ms cubic-bezier(0.25, 1, 0.5, 1)';
      innerRef.current.style.transform = 'translateX(0)';
    }
    currentOffsetRef.current = 0;
  };

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onTouchMove = (e) => {
      if (!isDraggingRef.current) return;
      const dx = e.touches[0].clientX - startXRef.current;
      const dy = e.touches[0].clientY - startYRef.current;
      // Ignore primarily-vertical touches only when starting from closed
      if (Math.abs(dy) > Math.abs(dx) && baseOffsetRef.current === 0 && currentOffsetRef.current === 0) {
        isDraggingRef.current = false;
        return;
      }
      e.preventDefault();
      const tentative = Math.min(0, baseOffsetRef.current + dx);
      // Past delete threshold → remove immediately
      if (tentative <= -(REVEAL_W + DELETE_EXTRA)) {
        doDeleteRef.current();
        return;
      }
      // Cap visual travel at the reveal edge
      const visual = Math.max(-REVEAL_W, tentative);
      currentOffsetRef.current = visual;
      if (innerRef.current) {
        innerRef.current.style.transform = `translateX(${visual}px)`;
        innerRef.current.style.transition = 'none';
      }
    };
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', onTouchMove);
  }, []);

  const onTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    baseOffsetRef.current = currentOffsetRef.current; // carry open/closed state
    isDraggingRef.current = true;
  };

  const onTouchEnd = () => {
    isDraggingRef.current = false;
    // Snap open if past halfway, otherwise close
    if (currentOffsetRef.current <= -(REVEAL_W / 2)) {
      snapToOpen();
    } else {
      snapToClose();
    }
  };

  const onTouchCancel = () => {
    isDraggingRef.current = false;
    snapToClose();
  };

  return (
    <li
      ref={wrapRef}
      className="queue-swipe-wrap"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
    >
      <div className="queue-swipe-reveal" onClick={doDelete}>
        <img src="/icon-trash.svg" alt="delete" width="20" height="20" />
      </div>
      <div ref={innerRef} className={`queue-item status-${item.status}`}>
        {item.status === 'pending' ? (
          <div className="queue-name-wrap">
            <img src="/icon-pen.svg" className="pen-icon" alt="" />
            <input
              className="queue-name-input"
              value={item.gameName}
              onChange={(e) => onRename(item.id, e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
            />
          </div>
        ) : (
          <span className="queue-name">{item.gameName}</span>
        )}
        <span className="queue-badges">
          {item.coverUrl && <span className="badge">COVER</span>}
          {item.logoUrl && <span className="badge">LOGO</span>}
          {item.screenshotUrl && <span className="badge">SS</span>}
          {item.videoUrl && <span className="badge">VID</span>}
          <span className="badge">3D</span>
        </span>
        {item.status === 'saved' && <span className="queue-ok"><img src="/icon-check.svg" alt="saved" width="16" height="16" /></span>}
        {item.status === 'error' && <span className="queue-err" title={item.error}><img src="/icon-remove.svg" alt="error" width="16" height="16" /></span>}
        {item.status === 'pending' && (
          <>
            <button
              className="queue-disk-btn"
              onClick={() => triggerDiskRename(item.id)}
              title="Select as game file to rename these assets for ES-DE"
            >
              <img src="/icon-disk-drive.svg" alt="rename from file" width="16" height="16" />
            </button>
            <button className="queue-remove" onClick={() => onRemove(item.id)}>
              <img src="/icon-trash.svg" alt="remove" width="16" height="16" />
            </button>
          </>
        )}
      </div>
    </li>
  );
}

export default function Queue({ items, onRemove, onClearAll, onStatusUpdate, onRename }) {
  const [dirHandle, setDirHandle] = useState(null);
  const [saving, setSaving] = useState(false);
  const [zipping, setZipping] = useState(false);
  const diskInputRef = useRef(null);
  const renamingIdRef = useRef(null);

  const hasPending = items.some((i) => i.status === 'pending');

  const onDiskPick = (e) => {
    const file = e.target.files?.[0];
    if (!file || !renamingIdRef.current) return;
    const stem = file.name.replace(/\.[^.]+$/, '');
    onRename(renamingIdRef.current, stem);
    renamingIdRef.current = null;
    e.target.value = '';
  };

  const triggerDiskRename = (id) => {
    renamingIdRef.current = id;
    diskInputRef.current?.click();
  };

  const pickFolder = async () => {
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      setDirHandle(handle);
    } catch (e) {
      if (e.name !== 'AbortError') console.error(e);
    }
  };

  const saveToEsde = async () => {
    if (!dirHandle) return;
    setSaving(true);
    const pending = items.filter((i) => i.status === 'pending');
    await Promise.all(pending.map(async (item) => {
      const name = safeName(item.gameName);
      const filename = `${name}.png`;
      const errs = [];
      const saved = [];
      if (item.boxartPng) {
        try {
          await writeEntry(dirHandle, '3dboxes', filename, await dataUrlToBytes(item.boxartPng));
          saved.push('3dboxes');
        } catch (e) { errs.push(`3dboxes: ${e.message}`); }
      }
      if (item.coverUrl) {
        try {
          await writeEntry(dirHandle, 'covers', filename, await fetchProxied(item.coverUrl));
          saved.push('covers');
        } catch (e) { errs.push(`covers: ${e.message}`); }
      }
      if (item.logoUrl) {
        try {
          await writeEntry(dirHandle, 'marquees', filename, await fetchProxied(item.logoUrl));
          saved.push('marquees');
        } catch (e) { errs.push(`marquees: ${e.message}`); }
      }
      if (item.screenshotUrl) {
        try {
          await writeEntry(dirHandle, 'screenshots', filename, await fetchProxied(item.screenshotUrl));
          saved.push('screenshots');
        } catch (e) { errs.push(`screenshots: ${e.message}`); }
      }
      if (item.videoUrl && !item.videoStreaming) {
        try {
          const ext = item.videoExt || 'mp4';
          await writeEntry(dirHandle, 'videos', `${name}.${ext}`, await fetchDirect(item.videoUrl));
          saved.push('videos');
        } catch (e) { errs.push(`videos: ${e.message}`); }
      }
      const status = saved.length === 0 ? 'error' : 'saved';
      onStatusUpdate(item.id, status, errs.join('; '));
    }));
    setSaving(false);
  };

  const downloadZip = async () => {
    setZipping(true);
    const zip = new JSZip();
    const pending = items.filter((i) => i.status === 'pending');
    await Promise.all(pending.map(async (item) => {
      const name = safeName(item.gameName);
      const filename = `${name}.png`;
      if (item.boxartPng) {
        try {
          zip.file(`3dboxes/${filename}`, await dataUrlToBytes(item.boxartPng));
        } catch (e) { console.error('3dboxes zip error', e); }
      }
      if (item.coverUrl) {
        try {
          zip.file(`covers/${filename}`, await fetchProxied(item.coverUrl));
        } catch (e) { console.error('covers zip error', e); }
      }
      if (item.logoUrl) {
        try {
          zip.file(`marquees/${filename}`, await fetchProxied(item.logoUrl));
        } catch (e) { console.error('marquees zip error', e); }
      }
      if (item.screenshotUrl) {
        try {
          zip.file(`screenshots/${filename}`, await fetchProxied(item.screenshotUrl));
        } catch (e) { console.error('screenshots zip error', e); }
      }
      if (item.videoUrl && !item.videoStreaming) {
        try {
          const ext = item.videoExt || 'mp4';
          zip.file(`videos/${name}.${ext}`, await fetchDirect(item.videoUrl));
        } catch (e) { console.error('videos zip error', e); }
      }
    }));
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'esde-media.zip';
    a.click();
    URL.revokeObjectURL(a.href);
    setZipping(false);
  };

  return (
    <div className="queue">
      <input ref={diskInputRef} type="file" style={{ display: 'none' }} onChange={onDiskPick} />
      <div className="queue-header">
        <span className="queue-title">DOWNLOAD QUEUE ({items.length})</span>
        {items.length > 0 && (
          <button className="queue-clear-btn" onClick={onClearAll}>
            CLEAR ALL
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="empty">No items in queue yet. Search for a game and click + ADD TO QUE.</div>
      ) : (
        <ul className="queue-list">
          {items.map((item) => (
            <QueueRow
              key={item.id}
              item={item}
              onRemove={onRemove}
              onRename={onRename}
              triggerDiskRename={triggerDiskRename}
            />
          ))}
        </ul>
      )}
      {hasPending && (
        <div className="queue-actions">
          {FSAPI_SUPPORTED && (
            <div className="queue-actions-col">
              <div className="queue-actions-label">SAVE TO ES-DE</div>
              <div style={{ position: 'relative' }}>
                <button className="folder-btn" onClick={pickFolder}>
                  {dirHandle ? `📁 ${dirHandle.name}` : 'SELECT ES-DE MEDIA FOLDER'}
                </button>
                {dirHandle && (
                  <button className="input-clear" onClick={(e) => { e.stopPropagation(); setDirHandle(null); }} title="Clear folder">
                    <img src="/icon-remove.svg" alt="clear" width="12" height="12" />
                  </button>
                )}
              </div>
              {dirHandle && (
                <button className="save-all-btn" onClick={saveToEsde} disabled={saving}>
                  {saving ? 'SAVING…' : 'SAVE TO FOLDER'}
                </button>
              )}
            </div>
          )}
          <div className="queue-actions-col">
            <div className="queue-actions-label">DOWNLOAD AS ZIP</div>
            <button className="zip-btn" onClick={downloadZip} disabled={zipping}>
              {zipping ? 'ZIPPING…' : 'DOWNLOAD AS ZIP'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
