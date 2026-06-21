/**
 * Service to handle geocoding using Nominatim (OpenStreetMap).
 */

/**
 * Geocode an address string into latitude & longitude coordinates.
 * @param {string} address - The address string to geocode.
 * @returns {Promise<{lat: number, lng: number}|null>} - Coordinates or null if not found/error.
 */
async function geocode(address) {
  if (!address || typeof address !== 'string' || !address.trim()) {
    return null;
  }

  try {
    const query = encodeURIComponent(address.trim());
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'CollegeEventHub/1.0 (contact@collegeeventhub.edu)'
      }
    });

    if (!response.ok) {
      console.warn(`Geocoding warning: Nominatim returned status ${response.status}`);
      return null;
    }

    const results = await response.json();
    if (results && results.length > 0) {
      const firstResult = results[0];
      return {
        lat: parseFloat(firstResult.lat),
        lng: parseFloat(firstResult.lon)
      };
    }
    return null;
  } catch (err) {
    console.error('Geocoding error:', err);
    return null;
  }
}

module.exports = {
  geocode
};
