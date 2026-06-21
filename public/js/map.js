document.addEventListener('DOMContentLoaded', () => {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  // Read coordinates and configurations
  const lat = parseFloat(mapElement.dataset.lat) || 12.9716; // Default to Bangalore center if empty
  const lng = parseFloat(mapElement.dataset.lng) || 77.5946;
  const isPicker = mapElement.dataset.picker === 'true';
  const venueName = mapElement.dataset.venue || 'Event Venue';
  const mapboxToken = mapElement.dataset.token;

  if (mapboxToken && typeof mapboxgl !== 'undefined') {
    // Mapbox implementation
    initMapbox(mapboxToken, lat, lng, isPicker, venueName);
  } else {
    // Leaflet implementation (free, no token needed)
    initLeaflet(lat, lng, isPicker, venueName);
  }
});

/**
 * Initializes a Mapbox Map
 */
function initMapbox(token, lat, lng, isPicker, venueName) {
  mapboxgl.accessToken = token;
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11', // Beautiful dark map to match our aesthetics
    center: [lng, lat],
    zoom: 14
  });

  // Create Marker
  const marker = new mapboxgl.Marker({
    color: '#6366f1',
    draggable: isPicker
  })
    .setLngLat([lng, lat])
    .addTo(map);

  if (!isPicker) {
    // Show Popup on detail page
    const popup = new mapboxgl.Popup({ offset: 25 })
      .setHTML(`<h5>📍 ${venueName}</h5>`);
    marker.setPopup(popup);
  } else {
    // Update inputs on drag
    marker.on('dragend', () => {
      const lngLat = marker.getLngLat();
      updateCoordinateInputs(lngLat.lat, lngLat.lng);
    });

    // Update inputs on map click
    map.on('click', (e) => {
      marker.setLngLat(e.lngLat);
      updateCoordinateInputs(e.lngLat.lat, e.lngLat.lng);
    });

    // Automatically update marker and center map when coordinate inputs are changed manually
    const latInput = document.getElementById('event-lat');
    const lngInput = document.getElementById('event-lng');
    if (latInput && lngInput) {
      let debounceTimer;
      const updateMarkerFromInputs = () => {
        const newLat = parseFloat(latInput.value);
        const newLng = parseFloat(lngInput.value);
        if (!isNaN(newLat) && !isNaN(newLng) && newLat >= -90 && newLat <= 90 && newLng >= -180 && newLng <= 180) {
          // Update marker position immediately (smooth)
          marker.setLngLat([newLng, newLat]);
          
          // Debounce the map flyTo centering to avoid violent jumping while typing
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            map.flyTo({ center: [newLng, newLat] });
          }, 400);
        }
      };
      latInput.addEventListener('input', updateMarkerFromInputs);
      lngInput.addEventListener('input', updateMarkerFromInputs);
      latInput.addEventListener('change', updateMarkerFromInputs);
      lngInput.addEventListener('change', updateMarkerFromInputs);
    }
  }

  // Add navigation controls
  map.addControl(new mapboxgl.NavigationControl());
}

/**
 * Initializes a Leaflet Map (Free / OpenStreetMap fallback)
 */
function initLeaflet(lat, lng, isPicker, venueName) {
  // Leaflet expects L to be globally defined via CDN link
  if (typeof L === 'undefined') {
    console.error('Leaflet library is not loaded.');
    return;
  }

  const map = L.map('map').setView([lat, lng], 14);

  // Add dark styled tiles (looks premium!)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  const markerOptions = {
    draggable: isPicker
  };

  const marker = L.marker([lat, lng], markerOptions).addTo(map);

  if (!isPicker) {
    marker.bindPopup(`<strong>📍 ${venueName}</strong>`).openPopup();
  } else {
    // Update coordinates on drag end
    marker.on('dragend', function (event) {
      const position = marker.getLatLng();
      updateCoordinateInputs(position.lat, position.lng);
    });

    // Update coordinates on map click
    map.on('click', function (e) {
      marker.setLatLng(e.latlng);
      updateCoordinateInputs(e.latlng.lat, e.latlng.lng);
    });

    // Automatically update marker and center map when coordinate inputs are changed manually
    const latInput = document.getElementById('event-lat');
    const lngInput = document.getElementById('event-lng');
    if (latInput && lngInput) {
      let debounceTimer;
      const updateMarkerFromInputs = () => {
        const newLat = parseFloat(latInput.value);
        const newLng = parseFloat(lngInput.value);
        if (!isNaN(newLat) && !isNaN(newLng) && newLat >= -90 && newLat <= 90 && newLng >= -180 && newLng <= 180) {
          // Update marker position immediately (smooth)
          marker.setLatLng([newLat, newLng]);
          
          // Debounce the map view centering to avoid violent jumping while typing
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            map.setView([newLat, newLng], map.getZoom());
          }, 400);
        }
      };
      latInput.addEventListener('input', updateMarkerFromInputs);
      lngInput.addEventListener('input', updateMarkerFromInputs);
      latInput.addEventListener('change', updateMarkerFromInputs);
      lngInput.addEventListener('change', updateMarkerFromInputs);
    }
  }
}

/**
 * Updates form input fields with selected coordinates
 */
function updateCoordinateInputs(lat, lng) {
  const latInput = document.getElementById('event-lat');
  const lngInput = document.getElementById('event-lng');
  
  if (latInput) latInput.value = lat.toFixed(6);
  if (lngInput) lngInput.value = lng.toFixed(6);
}
