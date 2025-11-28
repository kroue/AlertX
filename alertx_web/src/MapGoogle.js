import React, { useEffect, useRef } from 'react';
import { useLoadScript } from '@react-google-maps/api';

const libraries = ['drawing'];

// MapGoogle: uses @react-google-maps/api to load Google Maps and Drawing library.
// Props: markers, setMarkers, fixedBounds (optional: [[south, west],[north, east]])
export default function MapGoogle({ markers = [], setMarkers = () => {}, center = [8.459, 124.643], zoom = 16, fixedBounds = null }) {
  const mapRef = useRef(null);
  const overlaysRef = useRef([]);
  const markersRef = useRef([]);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
    preventGoogleFontsLoading: true,
  });

  useEffect(() => {
    if (!isLoaded || loadError) return;
    // no-op here; actual map is created in container onLoad below
  }, [isLoaded, loadError]);

  // helper to render markers when markers prop changes
  useEffect(() => {
    if (!window.google || !mapRef.current) return;
    // clear previous markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    markers.forEach(m => {
      const mk = new window.google.maps.Marker({ position: { lat: m.lat, lng: m.lng }, map: mapRef.current });
      markersRef.current.push(mk);
    });
  }, [markers]);

  const onMapLoad = (map) => {
    mapRef.current = map;

    // restore saved polygon from localStorage if present
    try {
      const raw = localStorage.getItem('brgy26-polygon');
      if (raw) {
        const gj = JSON.parse(raw);
        if (gj && gj.type) {
          const coords = (gj.type === 'FeatureCollection' ? gj.features[0] : gj).geometry.coordinates[0];
          const path = coords.map(c => ({ lat: c[1], lng: c[0] }));
          const poly = new window.google.maps.Polygon({ paths: path, strokeColor: '#e05543', fillColor: '#fff5f5', fillOpacity: 0.35, map });
          overlaysRef.current.push(poly);
          const bounds = new window.google.maps.LatLngBounds();
          path.forEach(p => bounds.extend(p));
          map.fitBounds(bounds);
          map.setOptions({ restriction: { latLngBounds: bounds, strictBounds: false } });
        }
      } else if (fixedBounds) {
        try {
          const sw = new window.google.maps.LatLng(fixedBounds[0][0], fixedBounds[0][1]);
          const ne = new window.google.maps.LatLng(fixedBounds[1][0], fixedBounds[1][1]);
          const bounds = new window.google.maps.LatLngBounds(sw, ne);
          map.fitBounds(bounds);
          map.setOptions({ restriction: { latLngBounds: bounds, strictBounds: false } });
        } catch (e) {}
      }

    } catch (e) {}

    // click to add markers
    map.addListener('click', (e) => {
      setMarkers(prev => [...prev, { lat: e.latLng.lat(), lng: e.latLng.lng() }]);
    });

    // init DrawingManager
    if (window.google && window.google.maps && window.google.maps.drawing) {
      const drawingManager = new window.google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: true,
        drawingControlOptions: { position: window.google.maps.ControlPosition.TOP_CENTER, drawingModes: ['polygon'] },
        polygonOptions: { fillColor: '#e05543', fillOpacity: 0.15, strokeColor: '#e05543' }
      });
      drawingManager.setMap(map);
      window.google.maps.event.addListener(drawingManager, 'overlaycomplete', (e) => {
        if (e.type === 'polygon') {
          // save polygon coords as GeoJSON (Polygon)
          const path = e.overlay.getPath().getArray().map(p => [p.lng(), p.lat()]);
          const gj = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [path] } };
          try { localStorage.setItem('brgy26-polygon', JSON.stringify(gj)); } catch (err) {}
          // persist overlay and set bounds
          overlaysRef.current.push(e.overlay);
          const bounds = new window.google.maps.LatLngBounds();
          path.forEach(c => bounds.extend({ lat: c[1], lng: c[0] }));
          map.fitBounds(bounds);
          map.setOptions({ restriction: { latLngBounds: bounds, strictBounds: false } });
        }
      });
    }
  };

  const clearSavedPolygon = () => {
    overlaysRef.current.forEach(o => { try { o.setMap(null); } catch (e) {} });
    overlaysRef.current = [];
    try { localStorage.removeItem('brgy26-polygon'); } catch (e) {}
    if (mapRef.current) mapRef.current.setOptions({ restriction: null });
  };

  if (!isLoaded) return <div className="cc-map-container">Loading map...</div>;
  if (loadError) return <div className="cc-map-container">Map failed to load</div>;

  return (
    <div className="cc-map-wrap">
      <div style={{ height: 300 }}>
        <div id="gmap" style={{ height: '300px' }} ref={(el) => {
          if (!el || mapRef.current) return;
          // create the map instance
          const map = new window.google.maps.Map(el, { center: { lat: center[0], lng: center[1] }, zoom });
          onMapLoad(map);
        }} />
      </div>
      <div className="cc-map-toolbar">
        <button type="button" className="cc-map-btn" onClick={() => { if (overlaysRef.current.length === 0) { alert('Draw a polygon then Save'); return; } /* noop */ }}>Boundary set</button>
        <button type="button" className="cc-map-btn cc-map-btn--danger" onClick={clearSavedPolygon}>Clear Boundary</button>
      </div>
      <div className="cc-map-hint">Use the drawing control to trace Brgy 26; polygon is saved locally. Click map to add markers.</div>
    </div>
  );
}
