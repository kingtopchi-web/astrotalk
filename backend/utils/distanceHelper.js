/**
 * Distance Calculation & Geospatial Helper using the Haversine Formula
 */
const Setting = require('../models/Setting');

/**
 * Calculates the great-circle distance between two geographic coordinates in kilometers
 * using the Haversine formula.
 *
 * @param {number} lat1 Latitude of point 1 in degrees
 * @param {number} lon1 Longitude of point 1 in degrees
 * @param {number} lat2 Latitude of point 2 in degrees
 * @param {number} lon2 Longitude of point 2 in degrees
 * @returns {number} Distance in kilometers
 */
function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);

  if (
    isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)
  ) {
    return null;
  }

  const R = 6371; // Earth's mean radius in kilometers
  const toRad = deg => (deg * Math.PI) / 180;

  const dLat = toRad(numLat2 - numLat1);
  const dLon = toRad(numLon2 - numLon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(numLat1)) * Math.cos(toRad(numLat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Extracts and validates { lat, lng } from an entity (Expert, User, or query object).
 * Supports:
 * - entity.latitude / entity.longitude
 * - entity.lat / entity.lng or entity.lon
 * - entity.location.coordinates ([lng, lat])
 * - entity.location.latitude / entity.location.longitude
 *
 * @param {Object} entity
 * @returns {{lat: number, lng: number} | null}
 */
function extractCoordinates(entity) {
  if (!entity || typeof entity !== 'object') return null;

  let lat = null;
  let lng = null;

  // Direct lat property
  if (entity.latitude !== undefined && entity.latitude !== null && entity.latitude !== '') {
    lat = Number(entity.latitude);
  } else if (entity.lat !== undefined && entity.lat !== null && entity.lat !== '') {
    lat = Number(entity.lat);
  } else if (entity.location?.latitude !== undefined && entity.location?.latitude !== null && entity.location?.latitude !== '') {
    lat = Number(entity.location.latitude);
  } else if (Array.isArray(entity.location?.coordinates) && entity.location.coordinates.length >= 2) {
    lat = Number(entity.location.coordinates[1]); // GeoJSON is [lon, lat]
  }

  // Direct lng property
  if (entity.longitude !== undefined && entity.longitude !== null && entity.longitude !== '') {
    lng = Number(entity.longitude);
  } else if (entity.lng !== undefined && entity.lng !== null && entity.lng !== '') {
    lng = Number(entity.lng);
  } else if (entity.lon !== undefined && entity.lon !== null && entity.lon !== '') {
    lng = Number(entity.lon);
  } else if (entity.location?.longitude !== undefined && entity.location?.longitude !== null && entity.location?.longitude !== '') {
    lng = Number(entity.location.longitude);
  } else if (Array.isArray(entity.location?.coordinates) && entity.location.coordinates.length >= 2) {
    lng = Number(entity.location.coordinates[0]); // GeoJSON is [lon, lat]
  }

  if (
    lat !== null && lng !== null &&
    !isNaN(lat) && !isNaN(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  ) {
    return { lat, lng };
  }

  return null;
}

/**
 * Reads the Admin-configured minimum expert distance in KM.
 * Dynamically fetched from the Setting model.
 * Defaults to 0 (disabled) if not configured.
 *
 * @returns {Promise<number>}
 */
async function getAdminMinimumDistanceKm() {
  try {
    const setting = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' }).select('minimumExpertDistanceKm');
    if (!setting || typeof setting.minimumExpertDistanceKm !== 'number') {
      return 0;
    }
    return Math.max(0, Number(setting.minimumExpertDistanceKm) || 0);
  } catch (err) {
    console.error('Error fetching admin minimum distance setting:', err);
    return 0;
  }
}

/**
 * Filters an array of experts based on user coordinates and minimum distance.
 * Rule: Display ONLY experts whose distance is >= adminMinimumDistance.
 * If user or expert valid coordinates are unavailable, handled safely without assuming distance.
 *
 * @param {Array} experts List of Expert objects
 * @param {{lat: number, lng: number} | null} userCoords User's actual coordinates
 * @param {number} minDistanceKm Admin configured minimum distance in KM
 * @returns {Array} Filtered list of experts
 */
function filterExpertsByMinimumDistance(experts, userCoords, minDistanceKm) {
  if (!Array.isArray(experts)) return [];

  const requiredMin = Number(minDistanceKm) || 0;

  // If no minimum distance is configured (<= 0), no filtering needed
  if (requiredMin <= 0) {
    return experts;
  }

  const validUserCoords = extractCoordinates(userCoords);

  // If user coordinates are not available, cannot calculate distance; preserve existing convention
  if (!validUserCoords) {
    return experts;
  }

  return experts.filter(expert => {
    const expertCoords = extractCoordinates(expert);

    // If expert's valid coordinates are unavailable, do not assume distance
    if (!expertCoords) {
      return true;
    }

    const distance = calculateHaversineDistanceKm(
      validUserCoords.lat,
      validUserCoords.lng,
      expertCoords.lat,
      expertCoords.lng
    );

    if (distance === null || isNaN(distance)) {
      return true;
    }

    const roundedDistance = Number(distance.toFixed(2));

    // Attach computed distance in KM
    if (typeof expert.toObject === 'function') {
      expert.distanceKm = roundedDistance;
    } else {
      expert.distanceKm = roundedDistance;
    }

    // STRICT REQUIREMENT: expertDistance >= adminMinimumDistance
    return roundedDistance >= requiredMin;
  });
}

module.exports = {
  calculateHaversineDistanceKm,
  extractCoordinates,
  getAdminMinimumDistanceKm,
  filterExpertsByMinimumDistance
};
