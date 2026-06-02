import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

export const ESRB_RATINGS = [
  { value: 'early-childhood', label: 'Early Childhood', src: '/esrb-early-childhood.svg' },
  { value: 'everyone',        label: 'Everyone',         src: '/esrb-everyone.svg' },
  { value: 'everyone-10',     label: 'Everyone 10+',     src: '/esrb-everyone+10.svg' },
  { value: 'teen',            label: 'Teen',             src: '/esrb-teen.svg' },
  { value: 'mature',          label: 'Mature',           src: '/esrb-mature.svg' },
  { value: 'adults-only',     label: 'Adults Only',      src: '/esrb-adults.svg' },
  { value: 'rating-pending',  label: 'Rating Pending',   src: '/esrb-RP.svg' },
];

export function EsrbPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const btnRef = useRef(null);
  const dropdownRef = useRef(null);
  const selected = ESRB_RATINGS.find(r => r.value === value);

  useEffect(() => {
    const handler = (e) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        !(dropdownRef.current && dropdownRef.current.contains(e.target))
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        bottom: window.innerHeight - rect.top + 4,
        right: window.innerWidth - rect.right,
        width: 200,
        zIndex: 9999,
      });
    }
    setOpen(v => !v);
  };

  return (
    <div className="esrb-picker">
      <button type="button" className="esrb-picker-btn" ref={btnRef} onClick={handleOpen}>
        <span>{selected?.label}</span>
        <svg className={`box3d-drawer-caret${open ? ' open' : ''}`} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polyline points="2,4 6,8 10,4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && ReactDOM.createPortal(
        <div className="esrb-picker-dropdown" style={dropdownStyle} ref={dropdownRef}>
          {ESRB_RATINGS.map(r => (
            <button
              key={r.value}
              type="button"
              className={`esrb-picker-option${r.value === value ? ' selected' : ''}`}
              onClick={() => { onChange(r.value); setOpen(false); }}
            >
              {r.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
