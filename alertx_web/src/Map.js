import React, { useRef, useEffect } from 'react';

// Static image "map" component.
// Use a static image placed at `public/brgy26_map.png` as the map background.
// - markers: array of marker objects. This component is tolerant of several shapes:
//    * { x: 0.12, y: 0.34 }  -> x/y are fractions (0..1) relative to image dims
//    * { lat: 8.456, lng: 124.643 } -> real lat/lng coords, converted via fixedBounds
//  When the user clicks the image (if allowClick), the component will call
//  `setMarkers(prev => [...prev, { lat, lng }])` with real lat/lng coordinates.
// - setMarkers: callback to update markers
// - fixedBounds: [[south, west], [north, east]] for converting lat/lng to image coords

export default function Map({ markers = [], setMarkers = () => {}, allowClick = true, fixedBounds = null }) {
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
      
      // Convert fractional x/y to lat/lng if fixedBounds provided
      if (fixedBounds) {
        const [[south, west], [north, east]] = fixedBounds;
        const lat = south + (1 - y) * (north - south);
        const lng = west + x * (east - west);
        setMarkers(prev => [...prev, { lat, lng }]);
      } else {
        // fallback: store as fractions
        setMarkers(prev => [...prev, { x, y, lat: y, lng: x }]);
      }
    };

    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [allowClick, setMarkers, fixedBounds]);

  // helper to get marker position in percent for rendering
  const markerStyle = (m) => {
    let x = null; let y = null;
    
    // If we have real lat/lng and fixedBounds, convert to image fractions
    if (typeof m.lat === 'number' && typeof m.lng === 'number' && fixedBounds) {
      const [[south, west], [north, east]] = fixedBounds;
      x = (m.lng - west) / (east - west);
      y = 1 - (m.lat - south) / (north - south); // inverted y-axis
    }
    // Otherwise try x/y fractions
    else if (typeof m.x === 'number' && typeof m.y === 'number') {
      x = m.x;
      y = m.y;
    }
    // Fallback: treat lat/lng as fractions (old behavior)
    else if (typeof m.lng === 'number' && typeof m.lat === 'number') {
      x = m.lng;
      y = m.lat;
    }
    
    if (x === null || y === null || x < 0 || x > 1 || y < 0 || y > 1) {
      return { display: 'none' };
    }
    
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
      <div className="cc-map-hint">This view uses a static image (brgy26_map.png). Click the image to add points.</div>
    </div>
  );
}
