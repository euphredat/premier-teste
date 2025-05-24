/**
 * Calcul de la distance et de la durée basé sur route2duree.js
 */

// Vitesses moyennes par mode de transport (km/h)
const AVERAGE_SPEEDS = {
  voiture: 40,
  moto: 50,
  velo: 15,
  "camping-car": 35,
}

/**
 * Calcule la distance entre deux points
 * @param {string} depart - Valeur du point de départ (km)
 * @param {string} arrivee - Valeur du point d'arrivée (km)
 * @returns {number} - Distance en km
 */
function calculateDistance(depart, arrivee) {
  return Math.abs(Number.parseInt(arrivee) - Number.parseInt(depart))
}

/**
 * Calcule la durée du trajet en fonction de la distance et du mode de transport
 * @param {number} distance - Distance en km
 * @param {string} transport - Mode de transport
 * @returns {string} - Durée formatée (ex: "2h 30min")
 */
function calculateDuration(distance, transport) {
  // Obtenir la vitesse moyenne pour le mode de transport
  const speed = AVERAGE_SPEEDS[transport] || 40 // Par défaut 40 km/h

  // Calculer la durée en minutes
  const minutes = (distance / speed) * 60

  // Convertir en heures et minutes
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.round(minutes % 60)

  // Formater la durée
  return `${hours}h ${remainingMinutes}min`
}

/**
 * Fonction principale pour calculer la distance et la durée
 * @param {string} depart - Valeur du point de départ (km)
 * @param {string} arrivee - Valeur du point d'arrivée (km)
 * @param {string} transport - Mode de transport
 */
function calculateRouteDetails(depart, arrivee, transport) {
  console.log("Départ :", depart);
  console.log("Arrivée :", arrivee);
  console.log("Transport :", transport);

  const distance = calculateDistance(depart, arrivee);
  const duration = calculateDuration(distance, transport);

  document.getElementById("distance").value = `${distance} km`;
  document.getElementById("duree").value = duration;

  return {
    distance: distance,
    duration: duration,
  };
}