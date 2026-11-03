const {
  calculateHaversineDistanceKm,
  extractCoordinates,
  filterExpertsByMinimumDistance
} = require('../utils/distanceHelper');

/**
 * Helper to compute destination coordinates given a starting point (lat, lon),
 * a bearing in degrees, and distance in km on a spherical earth of radius 6371 km.
 */
function getDestinationPoint(lat, lon, distanceKm, bearingDeg = 0) {
  const R = 6371;
  const toRad = deg => (deg * Math.PI) / 180;
  const toDeg = rad => (rad * 180) / Math.PI;

  const dByR = distanceKm / R;
  const brng = toRad(bearingDeg);
  const lat1 = toRad(lat);
  const lon1 = toRad(lon);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(dByR) +
    Math.cos(lat1) * Math.sin(dByR) * Math.cos(brng)
  );

  const lon2 = lon1 + Math.atan2(
    Math.sin(brng) * Math.sin(dByR) * Math.cos(lat1),
    Math.cos(dByR) - Math.sin(lat1) * Math.sin(lat2)
  );

  return {
    latitude: Number(toDeg(lat2).toFixed(6)),
    longitude: Number(toDeg(lon2).toFixed(6))
  };
}

console.log('===========================================================');
console.log('🧪 RUNNING TESTS: DYNAMIC MINIMUM EXPERT DISTANCE FILTER');
console.log('===========================================================\n');

let allPassed = true;
function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    allPassed = false;
  }
}

// 1. Reference User: New Delhi
const userLocation = { latitude: 28.6139, longitude: 77.2090 };
console.log(`User Reference Location: Lat ${userLocation.latitude}, Lng ${userLocation.longitude}\n`);

// 2. Generate experts at target distances: 10 KM, 65 KM, 100 KM, 120 KM, 250 KM
const targets = [
  { name: 'Expert A (10 KM)', targetDist: 10 },
  { name: 'Expert B (65 KM)', targetDist: 65 },
  { name: 'Expert C (100 KM)', targetDist: 100 },
  { name: 'Expert D (120 KM)', targetDist: 120 },
  { name: 'Expert E (250 KM)', targetDist: 250 },
];

const mockExperts = targets.map((t, index) => {
  const coords = getDestinationPoint(userLocation.latitude, userLocation.longitude, t.targetDist, 45);
  const actualDist = calculateHaversineDistanceKm(
    userLocation.latitude,
    userLocation.longitude,
    coords.latitude,
    coords.longitude
  );
  return {
    _id: `expert_${index + 1}`,
    name: t.name,
    latitude: coords.latitude,
    longitude: coords.longitude,
    expectedDist: t.targetDist,
    computedDist: Number(actualDist.toFixed(2))
  };
});

console.log('--- Step 1: Distance Calculation Verification ---');
mockExperts.forEach(exp => {
  const diff = Math.abs(exp.computedDist - exp.expectedDist);
  assert(diff <= 0.05, `${exp.name} distance accurately calculated: ${exp.computedDist} KM (expected ${exp.expectedDist} KM)`);
});

console.log('\n--- Step 2: Testing with Configured Admin Minimum Distance = 100 KM ---');
const adminMinDistance100 = 100;
const results100 = filterExpertsByMinimumDistance(mockExperts, userLocation, adminMinDistance100);
const visibleIds100 = new Set(results100.map(e => e.name));

assert(!visibleIds100.has('Expert A (10 KM)'), '10 KM  → Hidden (expertDistance < 100 KM)');
assert(!visibleIds100.has('Expert B (65 KM)'), '65 KM  → Hidden (expertDistance < 100 KM)');
assert(visibleIds100.has('Expert C (100 KM)'), '100 KM → Visible (expertDistance >= 100 KM)');
assert(visibleIds100.has('Expert D (120 KM)'), '120 KM → Visible (expertDistance >= 100 KM)');
assert(visibleIds100.has('Expert E (250 KM)'), '250 KM → Visible (expertDistance >= 100 KM)');

console.log('\n--- Step 3: Testing Dynamic Admin Setting Update (100 KM → 150 KM) ---');
const adminMinDistance150 = 150;
const results150 = filterExpertsByMinimumDistance(mockExperts, userLocation, adminMinDistance150);
const visibleIds150 = new Set(results150.map(e => e.name));

assert(!visibleIds150.has('Expert A (10 KM)'), '10 KM  → Hidden at 150 KM');
assert(!visibleIds150.has('Expert B (65 KM)'), '65 KM  → Hidden at 150 KM');
assert(!visibleIds150.has('Expert C (100 KM)'), '100 KM → Hidden at 150 KM (100 < 150)');
assert(!visibleIds150.has('Expert D (120 KM)'), '120 KM → Hidden at 150 KM (120 < 150)');
assert(visibleIds150.has('Expert E (250 KM)'), '250 KM → Visible at 150 KM (250 >= 150)');

console.log('\n--- Step 4: Missing Location Handling (Requirement 5) ---');
// Expert with missing coordinates
const expertNoCoords = { _id: 'exp_no_coords', name: 'Expert Without Coords' };
const resultsWithMissing = filterExpertsByMinimumDistance([expertNoCoords, ...mockExperts], userLocation, 100);
assert(resultsWithMissing.some(e => e._id === 'exp_no_coords'), 'Expert with missing coordinates is handled safely and not arbitrarily dropped');

// User with missing coordinates
const resultsNoUserCoords = filterExpertsByMinimumDistance(mockExperts, null, 100);
assert(resultsNoUserCoords.length === mockExperts.length, 'When user coordinates are unavailable, all experts remain visible without assuming a distance');

// Admin setting = 0 (Disabled)
const resultsDisabled = filterExpertsByMinimumDistance(mockExperts, userLocation, 0);
assert(resultsDisabled.length === mockExperts.length, 'When Admin distance is 0 (disabled), all experts are visible');

console.log('\n===========================================================');
if (allPassed) {
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
} else {
  console.error('❌ SOME TESTS FAILED!');
  process.exit(1);
}
console.log('===========================================================');

