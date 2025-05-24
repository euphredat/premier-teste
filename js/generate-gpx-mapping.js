const fs = require('fs');
const path = require('path');

// Répertoire contenant les fichiers GPX
const gpxDirectory = path.join(__dirname, '../gpx');

// Fonction pour extraire les informations depuis le nom du fichier GPX
function extractRouteFromFilename(filename) {
  const match = filename.match(/^(\d+)_(\d+)_([^_]+)_([^_]+)\.gpx$/);
  if (match) {
    const departName = match[3].replace(/-/g, ' ');
    const arriveeName = match[4].replace(/-/g, ' ');
    return { departName, arriveeName, filename };
  }
  return null;
}

// Générer le mapping
function generateGpxMapping() {
  const mapping = {};

  // Lire tous les fichiers dans le répertoire GPX
  const files = fs.readdirSync(gpxDirectory);

  files.forEach((file) => {
    if (file.endsWith('.gpx')) {
      const route = extractRouteFromFilename(file);
      if (route) {
        const key = `${route.departName}_${route.arriveeName}`;
        mapping[key] = {
          file: file,
          reversed: false, // Itinéraire direct
        };

        // Ajouter l'itinéraire inverse
        const inverseKey = `${route.arriveeName}_${route.departName}`;
        if (!mapping[inverseKey]) {
          mapping[inverseKey] = {
            file: file,
            reversed: true, // Itinéraire inversé
          };
        }
      }
    }
  });

  return mapping;
}

// Exécuter le script
const gpxMapping = generateGpxMapping();

// Sauvegarder le mapping dans un fichier JSON
const outputFilePath = path.join(__dirname, '../js/gpx-mapping.json');
fs.writeFileSync(outputFilePath, JSON.stringify(gpxMapping, null, 2), 'utf-8');

console.log(`Mapping GPX généré et sauvegardé dans ${outputFilePath}`);