const fs = require('fs');
const path = require('path');

// Répertoire contenant les fichiers GPX
const gpxDirectory = path.join(__dirname, '../gpx');

// Fonction pour extraire les informations depuis le nom du fichier GPX
function extractRouteFromFilename(filename) {
  const match = filename.match(/^(\d+_\d+)(?:_SN)?_(.+)_(.+)\.gpx$/);
  if (match) {
    const id = match[1];
    const departName = match[2].replace(/-/g, ' ');
    const arriveeName = match[3].replace(/-/g, ' ');
    const reversed = filename.includes('_SN'); // Détecter si le fichier est inversé
    return { id, departName, arriveeName, reversed, filename };
  }
  console.warn(`Nom de fichier non reconnu : ${filename}`);
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
        const { id, departName, arriveeName, reversed, filename } = route;

        if (!reversed) {
          // Ajouter l'itinéraire normal (Nord => Sud)
          const keyNormal = `${departName}_${arriveeName}`;
          mapping[keyNormal] = {
            file: filename,
            reversed: false,
          };

          // Ajouter l'itinéraire inversé (Sud => Nord)
          const keyReversed = `${arriveeName}_${departName}`;
          const reversedFilename = `${id}_SN_${arriveeName.replace(/ /g, '-')}_${departName.replace(/ /g, '-')}.gpx`;
          mapping[keyReversed] = {
            file: reversedFilename,
            reversed: true,
          };
        }
      }
    }
  });

  // Sauvegarder le mapping dans un fichier JSON
  const outputPath = path.join(__dirname, 'gpx-mapping.json');
  fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2), 'utf-8');
  console.log('Mapping GPX généré avec succès.');
}

// Exécuter la génération du mapping
generateGpxMapping();