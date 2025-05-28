// ==========================
// Variables globales
// ==========================
let map;
let currentRoute = null;
let currentMarkers = [];
let mapLayers = {};
let currentGpxFile = null;
let currentGpxContent = null;
let isReversedRoute = false;
let gpxMapping = {};

// ==========================
// Fonctions principales
// ==========================


// Charger le fichier JSON au démarrage
async function loadGpxMapping() {
  try {
    const response = await fetch("js/gpx-mapping.json");
    if (!response.ok) {
      throw new Error(`Erreur lors du chargement du fichier JSON : ${response.status}`);
    }
    gpxMapping = await response.json();
    console.log("Mapping GPX chargé :", gpxMapping);
  } catch (error) {
    console.error("Erreur lors du chargement du mapping GPX :", error);
    gpxMapping = {};
  }
}

// Initialisation de la carte Leaflet
function initMap() {
  map = new maplibregl.Map({
    container: 'map', // ID de l'élément HTML pour la carte
    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json', // Style de la carte
    center: [6.9, 45.5], // Longitude, Latitude
    zoom: 12, // Niveau de zoom initial
    pitch: 60, // Inclinaison initiale (vue 3D)
    bearing: 0, // Orientation initiale (vers le nord)
  });

  // Ajouter un contrôle de zoom et de rotation
  map.addControl(new maplibregl.NavigationControl(), 'top-right');

  // Ajouter un contrôle pour basculer en plein écran
  map.addControl(new maplibregl.FullscreenControl(), 'top-right');

  // Ajouter un contrôle de relief 3D
  map.addControl(
    new maplibregl.TerrainControl({
      source: 'terrain', // Source de terrain
      exaggeration: 1.5, // Exagération du relief
    }),
    'top-right'
  );
 setTimeout(() => {
  document.querySelector('.maplibregl-ctrl-zoom-in')?.setAttribute('title', 'Zoomer');
  document.querySelector('.maplibregl-ctrl-zoom-out')?.setAttribute('title', 'Dézoomer');
  document.querySelector('.maplibregl-ctrl-compass')?.setAttribute('title', 'Réinitialiser la rotation');
  document.querySelector('.maplibregl-ctrl-fullscreen')?.setAttribute('title', 'Plein écran');

  // 🎯 Traduction du bouton de terrain si présent
  const terrainBtn = document.querySelector('.maplibregl-ctrl-terrain button');
  if (terrainBtn) {
    const currentTitle = terrainBtn.getAttribute('title');
    if (currentTitle?.includes('Disable')) {
      terrainBtn.setAttribute('title', 'Désactiver le relief');
    } else {
      terrainBtn.setAttribute('title', 'Activer le relief');
    }

    // 🔁 Optionnel : mettre à jour dynamiquement au clic
    terrainBtn.addEventListener('click', () => {
      setTimeout(() => {
        const newTitle = terrainBtn.getAttribute('title');
        if (newTitle?.includes('Disable')) {
          terrainBtn.setAttribute('title', 'Désactiver le relief');
        } else {
          terrainBtn.setAttribute('title', 'Activer le relief');
        }
      }, 100);
    });
  }
}, 100);
  // Attendre que le style soit chargé avant d'ajouter des sources et des couches
  map.on('style.load', () => {
    // Ajouter une source de terrain pour le relief 3D
    map.addSource('terrain', {
      type: 'raster-dem',
      url: 'https://api.maptiler.com/tiles/terrain-rgb/tiles.json?key=F0IqjHUlscj32x8I14nx ',
      tileSize: 256,
    });

    // Configurer le terrain globalement
    map.setTerrain({ source: 'terrain', exaggeration: 1.5 });

    console.log('Effet 3D activé avec relief.');

    // Ajouter les autres couches (standard, satellite, etc.)
    addLayers();

    // Activer la couche par défaut (OpenTopoMap)
    setActiveMapLayer('opentopomap');
  });
}

// ==========================
// Gestion des itinéraires
// ==========================

// Fonction pour récupérer le fichier GPX
function getGpxFile(departName, arriveeName) {
  const key = `${departName}_${arriveeName}`;
  if (gpxMapping[key]) {
    return {
      file: `gpx/${gpxMapping[key].file}`,
      reversed: gpxMapping[key].reversed,
    };
  } else {
    console.error(`Aucun fichier GPX trouvé pour l'itinéraire ${key}`);
    return null;
  }
}
function addLayers() {
  // Ajouter la couche standard (OpenStreetMap)
  map.addSource('standard', {
    type: 'raster',
    tiles: [
      'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
    ],
    tileSize: 256,
  });

  map.addLayer({
    id: 'standard',
    type: 'raster',
    source: 'standard',
    layout: {
      visibility: 'none', // Visible par défaut
    },
  });

  // Ajouter la couche satellite (ArcGIS)
  map.addSource('satellite-arcgis', {
    type: 'raster',
    tiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    ],
    tileSize: 256,
  });

  map.addLayer({
    id: 'satellite-arcgis',
    type: 'raster',
    source: 'satellite-arcgis',
    layout: {
      visibility: 'none', // Masquée par défaut
    },
  });
// Source des étiquettes (labels) ArcGIS
map.addSource('labels-arcgis', {
  type: 'raster',
  tiles: [
    'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
  ],
  tileSize: 256,
});

map.addLayer({
  id: 'labels-arcgis-layer',
  type: 'raster',
  source: 'labels-arcgis',
  paint: {},
});
 

  map.addLayer({
    id: 'satellite-mapbox',
    type: 'raster',
    source: 'satellite-mapbox',
    layout: {
      visibility: 'none', // Masquée par défaut
    },
  });

  // Ajouter la couche OSM-Fr
  map.addSource('osm-fr', {
    type: 'raster',
    tiles: [
      'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'.replace('{s}', 'a'),
    ],
    tileSize: 256,
  });

  map.addLayer({
    id: 'osm-fr',
    type: 'raster',
    source: 'osm-fr',
    layout: {
      visibility: 'none', // Masquée par défaut
    },
  });

  // Ajouter la couche OSM OpenTopoMap
  map.addSource('opentopomap', {
    type: 'raster',
    tiles: [
      'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'.replace('{s}', 'a'),
    ],
    tileSize: 256,
  });

  map.addLayer({
    id: 'opentopomap',
    type: 'raster',
    source: 'opentopomap',
    layout: {
      visibility: 'visible', // Masquée par défaut
    },
  });

  // Ajouter la couche Plan IGN
  map.addSource('carto-light', {
  type: 'raster',
  tiles: [
    'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
  ],
  tileSize: 256,
  attribution: '© OpenStreetMap contributors © CARTO',
});

map.addLayer({
  id: 'carto-light',
  type: 'raster',
  source: 'carto-light',
   layout: {
      visibility: 'none', // Masquée par défaut
    },
});


  // Mettre à jour l'objet mapLayers
  mapLayers = {
    standard: 'standard',
    'satellite-arcgis': 'satellite-arcgis',
    'satellite-mapbox': 'satellite-mapbox',
    'osm-fr': 'osm-fr',
    'opentopomap': 'opentopomap',
    'carto-light': 'carto-light',
  };
}
function toggleLayer() {
  const layers = Object.keys(mapLayers); // Récupérer toutes les couches disponibles
  let currentLayerIndex = layers.findIndex((layer) => {
    return map.getLayoutProperty(layer, 'visibility') === 'visible';
  });

  // Si aucune couche n'est visible, commencer par la première
  if (currentLayerIndex === -1) {
    currentLayerIndex = 0;
  }

  // Passer à la couche suivante
  currentLayerIndex = (currentLayerIndex + 1) % layers.length;

  // Mettre à jour la visibilité des couches
  layers.forEach((layer, index) => {
    map.setLayoutProperty(layer, 'visibility', index === currentLayerIndex ? 'visible' : 'none');
  });

  // Afficher un message dans la console pour indiquer la couche active
  console.log(`Couche active : ${layers[currentLayerIndex]}`);
}
async function displayDefaultRoute() {
  const defaultRouteKey = "THONON les BAINS_MENTON"; // Clé pour l'itinéraire par défaut
  const routeData = gpxMapping[defaultRouteKey];

  if (!routeData) {
    console.error("Itinéraire par défaut introuvable dans gpx-mapping.json");
    return;
  }

  const gpxFile = `gpx/${routeData.file}`;

  try {
    // Charger le fichier GPX
    const response = await fetch(gpxFile);
    if (!response.ok) {
      throw new Error(`Erreur lors du chargement du fichier GPX : ${response.status}`);
    }
    currentGpxContent = await response.text(); // Mettre à jour le contenu global
    currentGpxFile = gpxFile; // Mettre à jour le fichier GPX actuel

    // Afficher l'itinéraire sur la carte
    displayGpxOnMap(currentGpxContent);

    // Mettre à jour les champs de sélection
    const departSelect = document.getElementById("depart");
    const arriveeSelect = document.getElementById("arrivee");
    const transportSelect = document.getElementById("transport");

    if (departSelect && arriveeSelect && transportSelect) {
      // Forcer la sélection des valeurs par défaut
      const departOption = Array.from(departSelect.options).find(option => option.text === "THONON les BAINS");
      const arriveeOption = Array.from(arriveeSelect.options).find(option => option.text === "MENTON");

      if (departOption) departSelect.value = departOption.value;
      if (arriveeOption) arriveeSelect.value = arriveeOption.value;

      transportSelect.value = "voiture"; // Mode de déplacement par défaut
    }

    // Mettre à jour les images et les noms
    updateDepartureImage();
    updateArrivalImage();

    // Calculer la distance et la durée
    calculateRouteDetails(departSelect.value, arriveeSelect.value, transportSelect.value);

    // Mettre à jour le titre de l'itinéraire
    const routeTitle = document.getElementById("route-title");
    if (routeTitle) {
      routeTitle.textContent = "Itinéraire : Thonon-les-Bains → Menton";
    }

    // Mettre à jour l'état global pour garantir que l'itinéraire par défaut est "non inversé"
    isReversedRoute = false;

    // Mettre à jour les marqueurs
    updateMarkers();

    // Mettre à jour le bouton de téléchargement
    updateDownloadLink();

    console.log("Itinéraire par défaut affiché :", defaultRouteKey);
  } catch (error) {
    console.error("Erreur lors du chargement de l'itinéraire par défaut :", error);
  }
}

// Fonction pour afficher le GPX sur la carte
function displayGpxOnMap(gpxData) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(gpxData, "text/xml");
  const trackPoints = xmlDoc.getElementsByTagName("trkpt");

  if (trackPoints.length === 0) {
    alert("Aucun point de trace trouvé dans le fichier GPX.");
    return;
  }

  const coordinates = [];
  for (let i = 0; i < trackPoints.length; i++) {
    const lat = parseFloat(trackPoints[i].getAttribute("lat"));
    const lon = parseFloat(trackPoints[i].getAttribute("lon"));
    if (!isNaN(lat) && !isNaN(lon)) {
      coordinates.push([lon, lat]); // MapLibre utilise [lon, lat]
    }
  }

  if (coordinates.length === 0) {
    alert("Aucune coordonnée valide trouvée dans le fichier GPX.");
    return;
  }

  // Supprimer les marqueurs existants
  currentMarkers.forEach(marker => marker.remove());
  currentMarkers = [];

  // Supprimer la source et la couche existantes si elles existent
  if (map.getSource('gpx-route')) {
    map.removeLayer('gpx-route');
    map.removeSource('gpx-route');
  }

  // Ajouter le nouvel itinéraire
  map.addSource('gpx-route', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coordinates,
      },
    },
  });

  map.addLayer({
    id: 'gpx-route',
    type: 'line',
    source: 'gpx-route',
    paint: {
      'line-color': isReversedRoute ? 'red' : 'green', // Rouge si inversé, vert sinon
      'line-width': 4,
    },
  });

  // Ajuster la vue pour inclure l'itinéraire
  const bounds = coordinates.reduce((bounds, coord) => bounds.extend(coord), new maplibregl.LngLatBounds());
  map.fitBounds(bounds, { padding: 20 });

  // Ajouter des marqueurs pour le départ et l'arrivée
  const startMarker = new maplibregl.Marker({ color: 'green' }) // Vert pour le départ
    .setLngLat(coordinates[0])
    .addTo(map);

  const endMarker = new maplibregl.Marker({ color: 'red' }) // Rouge pour l'arrivée
    .setLngLat(coordinates[coordinates.length - 1])
    .addTo(map);

  // Stocker les marqueurs pour les supprimer plus tard si nécessaire
  currentMarkers.push(startMarker, endMarker);
}


// ==========================
// Gestion des événements
// ==========================
function setupEventListeners() {
  // Bouton pour calculer l'itinéraire
  const calculateBtn = document.getElementById("calculate-btn");
  if (calculateBtn) {
    calculateBtn.addEventListener("click", calculateRoute);
  }

  // Bouton pour inverser l'itinéraire
  const reverseBtn = document.getElementById("reverse-btn");
  if (reverseBtn) {
    reverseBtn.addEventListener("click", handleReverseRoute);
  }

  // Sélection du point de départ
  const departSelect = document.getElementById("depart");
  if (departSelect) {
    departSelect.addEventListener("change", updateDepartureImage);
  }

  // Sélection du point d'arrivée
  const arriveeSelect = document.getElementById("arrivee");
  if (arriveeSelect) {
    arriveeSelect.addEventListener("change", updateArrivalImage);
  }

  // Icône flottante pour afficher/masquer le menu déroulant
  const layerToggleIcon = document.getElementById("layer-toggle-icon");
  // Gestion du clic sur l'icône pour afficher/masquer le menu des couches
  if (layerToggleIcon) {
    layerToggleIcon.addEventListener("click", (event) => {
      event.stopPropagation(); // Empêche la propagation de l'événement pour éviter la fermeture immédiate du menu
      const dropdown = document.getElementById("layer-dropdown");
      // Affiche ou masque le menu déroulant selon son état actuel
      dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
    });
  }

  // Gestion de la sélection d'une couche dans le menu déroulant
  const layerDropdown = document.getElementById("layer-dropdown");
  if (layerDropdown) {
    layerDropdown.addEventListener("click", (event) => {
      const layer = event.target.getAttribute("data-layer");
      if (layer) {
        setActiveMapLayer(layer); // Activer la couche sélectionnée
        layerDropdown.style.display = "none"; // Masquer le menu
      }
    });
  }

  // Fermer le menu déroulant si on clique en dehors
  document.addEventListener("click", (event) => {
    const dropdown = document.getElementById("layer-dropdown");
    const toggleIcon = document.getElementById("layer-toggle-icon");
    if (dropdown.style.display === "block" && !dropdown.contains(event.target) && !toggleIcon.contains(event.target)) {
      dropdown.style.display = "none";
    }
  });
}

// ==========================
// Gestion des images
// ==========================

function updateDepartureImage() {
  const departSelect = document.getElementById("depart");
  if (!departSelect.value) return;

  const departText = departSelect.options[departSelect.selectedIndex].text;
  const imgName = formatImageName(departText);

  document.getElementById("departure-img").src = `images/${imgName}.jpg`;
  document.getElementById("departure-img").onerror = function () {
    this.src = "images/placeholder.jpg";
  };
  document.getElementById("departure-name").textContent = departText;
}

function updateArrivalImage() {
  const arriveeSelect = document.getElementById("arrivee");
  if (!arriveeSelect.value) return;

  const arriveeText = arriveeSelect.options[arriveeSelect.selectedIndex].text;
  const imgName = formatImageName(arriveeText);

  document.getElementById("arrival-img").src = `images/${imgName}.jpg`;
  document.getElementById("arrival-img").onerror = function () {
    this.src = "images/placeholder.jpg";
  };
  document.getElementById("arrival-name").textContent = arriveeText;
}

function formatImageName(name) {
  return name.toLowerCase().replace(/ /g, "-").replace(/'/g, "");
}

// ==========================
// Gestion des couches de carte
// ==========================

function setActiveMapLayer(layerName) {
  Object.keys(mapLayers).forEach((key) => {
    if (map.getLayer(key)) {
      map.setLayoutProperty(key, 'visibility', key === layerName ? 'visible' : 'none');
    }
  });

  console.log(`Couche active : ${layerName}`);
}
// ==========================
// Gestion des itinéraires inversés
// ==========================

async function handleReverseRoute() {
  const departSelect = document.getElementById("depart");
  const arriveeSelect = document.getElementById("arrivee");

  if (!departSelect.value || !arriveeSelect.value) {
    alert("Veuillez d'abord sélectionner un itinéraire");
    return;
  }

  // Inverser les valeurs des sélections
  const tempValue = departSelect.value;
  const tempIndex = departSelect.selectedIndex;

  departSelect.value = arriveeSelect.value;
  departSelect.selectedIndex = arriveeSelect.selectedIndex;
  arriveeSelect.value = tempValue;
  arriveeSelect.selectedIndex = tempIndex;

  // Mettre à jour les images et les noms
  updateDepartureImage();
  updateArrivalImage();

  // Récupérer les noms de départ et d'arrivée
  const departName = departSelect.options[departSelect.selectedIndex].text;
  const arriveeName = arriveeSelect.options[arriveeSelect.selectedIndex].text;

  // Récupérer le fichier GPX correspondant
  const gpxData = getGpxFile(departName, arriveeName);
  if (!gpxData) {
    alert("Erreur : fichier GPX introuvable.");
    return;
  }

  // Charger et afficher le fichier GPX
  await loadGpxFile(gpxData.file, false); // Forcer l'état à "non inversé"

  // Mettre à jour l'état global
  isReversedRoute = false; // Toujours considérer comme non inversé

  // Mettre à jour le bouton inverser
  const reverseBtn = document.getElementById("reverse-btn");
  reverseBtn.textContent = "Inverser l'itinéraire";

  // Mettre à jour les marqueurs et le lien de téléchargement
  updateMarkers();
  updateDownloadLink();
}

// ==========================
// Calcul de l'itinéraire
// ==========================

async function calculateRoute() {
  const departSelect = document.getElementById("depart");
  const arriveeSelect = document.getElementById("arrivee");
  const transportSelect = document.getElementById("transport");

  // Vérifier que les sélections sont valides
  if (!departSelect.value || !arriveeSelect.value || !transportSelect.value) {
    alert("Veuillez sélectionner un point de départ, un point d'arrivée et un mode de transport.");
    return;
  }

  const departName = departSelect.options[departSelect.selectedIndex].text;
  const arriveeName = arriveeSelect.options[arriveeSelect.selectedIndex].text;
  const transportMode = transportSelect.value;

  // Mettre à jour le titre du trajet
  const routeTitle = document.getElementById("route-title");
  routeTitle.textContent = `${departName} ====> ${arriveeName}`;

  // Récupérer le fichier GPX correspondant
  const gpxData = getGpxFile(departName, arriveeName);

  if (!gpxData) {
    alert("Erreur : fichier GPX introuvable.");
    return;
  }

  // Charger et afficher le fichier GPX
  await loadGpxFile(gpxData.file, false); // Forcer l'état à "non inversé"

  // Mettre à jour les marqueurs et le lien de téléchargement
  updateMarkers();
  updateDownloadLink();

  // Calculer la distance et la durée
  calculateRouteDetails(departSelect.value, arriveeSelect.value, transportMode);
}
async function loadGpxFile(gpxFile, isReversed = false) {
  try {
    currentGpxFile = gpxFile; // Mettre à jour la variable globale
    isReversedRoute = false; // Toujours considérer comme non inversé au premier chargement

    if (!gpxFile) {
      throw new Error("Le chemin du fichier GPX est invalide ou non défini.");
    }

    console.log("Chargement du fichier GPX :", gpxFile);

    const response = await fetch(gpxFile);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    currentGpxContent = await response.text(); // Mettre à jour le contenu global
    displayGpxOnMap(currentGpxContent);

    // Mettre à jour les marqueurs et le lien de téléchargement
    updateMarkers();
    updateDownloadLink();
  } catch (error) {
    console.error("Erreur lors du chargement du fichier GPX :", error);
    alert("Impossible de charger le fichier GPX.");
  }
}
function updateMarkers() {
  // Supprimer les marqueurs existants
  currentMarkers.forEach(marker => marker.remove());
  currentMarkers = [];

  if (!currentGpxContent) return;

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(currentGpxContent, "text/xml");
  const trackPoints = xmlDoc.getElementsByTagName("trkpt");

  if (trackPoints.length === 0) return;

  const coordinates = [];
  for (let i = 0; i < trackPoints.length; i++) {
    const lat = parseFloat(trackPoints[i].getAttribute("lat"));
    const lon = parseFloat(trackPoints[i].getAttribute("lon"));
    if (!isNaN(lat) && !isNaN(lon)) {
      coordinates.push([lon, lat]);
    }
  }

  if (coordinates.length === 0) return;

  // Ajouter des marqueurs pour le départ et l'arrivée
  const startMarker = new maplibregl.Marker({ color: isReversedRoute ? 'red' : 'green' }) // Rouge si inversé, vert sinon
    .setLngLat(coordinates[0])
    .addTo(map);

  const endMarker = new maplibregl.Marker({ color: isReversedRoute ? 'green' : 'red' }) // Vert si inversé, rouge sinon
    .setLngLat(coordinates[coordinates.length - 1])
    .addTo(map);

  currentMarkers.push(startMarker, endMarker);
}
function updateDownloadLink() {
  const downloadLink = document.getElementById("download-link");

  if (!currentGpxFile) {
    // Si aucun fichier GPX n'est sélectionné
    downloadLink.href = "#";
    downloadLink.classList.add("disabled");
    downloadLink.textContent = "Aucun fichier à télécharger";
  } else {
    // Si un fichier GPX est disponible
    downloadLink.href = currentGpxFile;
    downloadLink.download = currentGpxFile.split("/").pop(); // Utiliser le nom du fichier GPX
    downloadLink.classList.remove("disabled");
    downloadLink.textContent = "Télécharger le GPX";
  }
}
// ==========================
// Appel au démarrage
// ==========================

document.addEventListener("DOMContentLoaded", async () => {
  await loadGpxMapping(); // Charger le mapping GPX
  initMap(); // Initialiser la carte
  setupEventListeners(); // Configurer les événements

  // Attendre que le style de la carte soit chargé avant d'afficher l'itinéraire par défaut
  map.on('style.load', async () => {
    await displayDefaultRoute(); // Afficher l'itinéraire par défaut
  });
});