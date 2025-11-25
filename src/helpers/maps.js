const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_KEY;

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} - Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} - Radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Find nearest shops to user's location
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @param {number} limit - Number of shops to return (default: 3)
 * @returns {Promise<Array>} - Array of nearest shops with distance
 */
async function findNearestShops(userLat, userLon, limit = 3) {
  try {
    console.log(`📍 Finding nearest shops to location: ${userLat}, ${userLon}`);
    
    // Load shops from JSON file
    const shopsPath = path.join(__dirname, '../data/shops.json');
    const shopsData = fs.readFileSync(shopsPath, 'utf8');
    const shops = JSON.parse(shopsData);
    
    // Calculate distance for each shop
    const shopsWithDistance = shops.map(shop => {
      const distance = calculateDistance(
        userLat, 
        userLon, 
        shop.latitude, 
        shop.longitude
      );
      
      return {
        ...shop,
        distance: distance,
        distanceText: distance < 1 
          ? `${(distance * 1000).toFixed(0)} meters` 
          : `${distance.toFixed(1)} km`
      };
    });
    
    // Sort by distance and return top results
    const nearestShops = shopsWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
    
    console.log(`✅ Found ${nearestShops.length} nearest shops`);
    return nearestShops;

  } catch (error) {
    console.error('❌ Find Nearest Shops Error:', error.message);
    throw new Error('Unable to find nearby shops. Please try again.');
  }
}

/**
 * Get Google Maps link for a location
 * @param {number} latitude
 * @param {number} longitude
 * @returns {string} - Google Maps URL
 */
function getGoogleMapsLink(latitude, longitude) {
  return `https://maps.google.com/?q=${latitude},${longitude}`;
}

/**
 * Get directions from user location to shop using Google Maps API (optional)
 * @param {number} originLat - User's latitude
 * @param {number} originLon - User's longitude
 * @param {number} destLat - Shop's latitude
 * @param {number} destLon - Shop's longitude
 * @returns {Promise<Object>} - Directions data
 */
async function getDirections(originLat, originLon, destLat, destLon) {
  try {
    if (!GOOGLE_MAPS_KEY || GOOGLE_MAPS_KEY === 'your-google-maps-api-key-here') {
      console.log('⚠️ Google Maps API key not configured, skipping directions');
      return null;
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin: `${originLat},${originLon}`,
        destination: `${destLat},${destLon}`,
        key: GOOGLE_MAPS_KEY,
        mode: 'driving'
      }
    });

    if (response.data.status === 'OK' && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const leg = route.legs[0];
      
      return {
        distance: leg.distance.text,
        duration: leg.duration.text,
        steps: leg.steps.map(step => step.html_instructions)
      };
    }

    return null;

  } catch (error) {
    console.error('❌ Get Directions Error:', error.message);
    return null;
  }
}

/**
 * Format shop information for WhatsApp message
 * @param {Array} shops - Array of shop objects
 * @param {boolean} includeDistance - Whether to include distance info
 * @returns {string} - Formatted message
 */
function formatShopsMessage(shops, includeDistance = true) {
  if (!shops || shops.length === 0) {
    return '❌ No shops found nearby. Please try a different location.';
  }

  let message = `🏬 *Nearest UCF Retailers:*\n\n`;
  
  shops.forEach((shop, index) => {
    message += `*${index + 1}. ${shop.name}*\n`;
    message += `📍 ${shop.address}\n`;
    message += `📞 ${shop.phone}\n`;
    
    if (shop.owner) {
      message += `👤 ${shop.owner}\n`;
    }
    
    if (shop.timing) {
      message += `🕐 ${shop.timing}\n`;
    }
    
    if (includeDistance && shop.distanceText) {
      message += `📏 ${shop.distanceText} away\n`;
    }
    
    message += `🗺️ ${getGoogleMapsLink(shop.latitude, shop.longitude)}\n`;
    message += `\n`;
  });

  return message.trim();
}

module.exports = {
  calculateDistance,
  findNearestShops,
  getGoogleMapsLink,
  getDirections,
  formatShopsMessage
};
