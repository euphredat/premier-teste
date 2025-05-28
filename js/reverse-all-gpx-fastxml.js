const fs = require('fs');
const path = require('path');
const { XMLParser, XMLBuilder } = require('fast-xml-parser');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});
const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  format: true,         // pour avoir un XML indenté lisible
  suppressEmptyNode: true
});

const inputFolder = './gpx';

fs.readdirSync(inputFolder).forEach(file => {
  if (!file.endsWith('.gpx') || file.includes('_SN_')) return;

  const match = file.match(/^(\d+_\d+)_([^-_]+(?:-[^-_]+)*)_([^-_]+(?:-[^-_]+)*)\.gpx$/);
  if (!match) {
    console.log(`❌ Nom de fichier ignoré : ${file}`);
    return;
  }

  const numero = match[1];
  const villeDepart = match[2];
  const villeArrivee = match[3];
  const newFilename = `${numero}_SN_${villeArrivee}_${villeDepart}.gpx`;
  const inputPath = path.join(inputFolder, file);
  const outputPath = path.join(inputFolder, newFilename);

  if (fs.existsSync(outputPath)) {
    console.log(`⏩ Déjà existant : ${newFilename}`);
    return;
  }

  try {
    const xmlData = fs.readFileSync(inputPath, 'utf-8');
    const jsonObj = parser.parse(xmlData);

    // Nettoyer et ajouter les namespaces nécessaires à la racine <gpx>
    if (jsonObj.gpx) {
      delete jsonObj.gpx['@_schemaLocation']; // Supprime l'attribut sans préfixe erroné
      jsonObj.gpx['@_xmlns'] = 'http://www.topografix.com/GPX/1/1';
      jsonObj.gpx['@_xmlns:xsi'] = 'http://www.w3.org/2001/XMLSchema-instance';
      jsonObj.gpx['@_xsi:schemaLocation'] = 'http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd';
      jsonObj.gpx['@_creator'] = jsonObj.gpx['@_creator'] || 'https://gpx.studio';
    }

    // Inverser les points du trajet
    const points = jsonObj.gpx.trk.trkseg.trkpt;
    if (!Array.isArray(points)) throw new Error("Pas de points GPX");
    jsonObj.gpx.trk.trkseg.trkpt = points.reverse();

    // Construire le XML
    const newXml = builder.build(jsonObj);

    // Écrire le nouveau fichier inversé
    fs.writeFileSync(outputPath, newXml, 'utf-8');
    console.log(`✅ Fichier inversé : ${newFilename}`);

  } catch (e) {
    console.log(`⚠️ Erreur avec ${file} : ${e.message}`);
  }
});


