import React, { useRef, useEffect } from 'react';

// Static image "map" component.
// Use a static image placed at `public/brgy26_map.png` as the map background.
// - markers: array of marker objects. This component is tolerant of several shapes:
//    * { x: 0.12, y: 0.34 }  -> x/y are fractions (0..1) relative to image dims
//    * { lat: 0.34, lng: 0.12 } -> lat treated as y fraction, lng as x fraction
//  When the user clicks the image (if allowClick), the component will call
//  `setMarkers(prev => [...prev, { x, y, lat: y, lng: x }])` where x/y are fractions.
// - setMarkers: callback to update markers

export default function Map({ markers = [], setMarkers = () => {}, allowClick = true }) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onClick = (e) => {
      if (!allowClick) return;
      const img = imgRef.current;
      if (!img) return;
      const rect = img.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      if (x < 0 || x > 1 || y < 0 || y > 1) return;
      // push marker with both x/y and lat/lng fields (lat= y, lng= x) for compatibility
      setMarkers(prev => [...prev, { x, y, lat: y, lng: x }]);
    };

    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [allowClick, setMarkers]);

  // helper to get marker position in percent for rendering
  const markerStyle = (m) => {
    let x = null; let y = null;
    if (typeof m.x === 'number' && typeof m.y === 'number') { x = m.x; y = m.y; }
    else if (typeof m.lng === 'number' && typeof m.lat === 'number') { x = m.lng; y = m.lat; }
    if (x === null || y === null) return { display: 'none' };
    return {
      position: 'absolute',
      left: `${x * 100}%`,
      top: `${y * 100}%`,
      transform: 'translate(-50%, -100%)',
      pointerEvents: 'none'
    };
  };

  return (
    <div className="cc-map-wrap" style={{ position: 'relative' }}>
      <div ref={containerRef} className="cc-map-container" style={{ position: 'relative', width: '100%', height: '100%', cursor: allowClick ? 'crosshair' : 'default' }} aria-label="map">
        <img ref={imgRef} src="/brgy26_map.png" alt="Map" style={{ display: 'block', maxWidth: '100%', height: 'auto', userSelect: 'none' }} />
        {markers && markers.map((m, idx) => (
          <div key={idx} className="cc-map-marker" style={markerStyle(m)}>
            <div style={{ width: 18, height: 18, borderRadius: 9, background: '#e11', border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
          </div>
        ))}
      </div>
      <div className="cc-map-toolbar">
        <button type="button" className="cc-map-btn" disabled title="Save boundary is unavailable for static image">Save Boundary</button>
        <button type="button" className="cc-map-btn cc-map-btn--danger" onClick={() => { try { localStorage.removeItem('brgy26-polygon'); } catch (e) {} }}>
          Clear Boundary
        </button>
      </div>
      <div className="cc-map-hint">This view uses a static image (brgy26_map.png). Click the image to add points.</div>
    </div>
  );
}
