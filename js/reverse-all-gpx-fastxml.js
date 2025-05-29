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
  format: true,
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

    // Nettoyer et ajouter namespaces à la racine <gpx>
    if (jsonObj.gpx) {
      delete jsonObj.gpx['@_schemaLocation'];
      jsonObj.gpx['@_xmlns'] = 'http://www.topografix.com/GPX/1/1';
      jsonObj.gpx['@_xmlns:xsi'] = 'http://www.w3.org/2001/XMLSchema-instance';
      jsonObj.gpx['@_xsi:schemaLocation'] = 'http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd';
      jsonObj.gpx['@_creator'] = jsonObj.gpx['@_creator'] || 'https://gpx.studio';
    }

    // Inversion des noms dans <metadata><name> et <trk><name>
    const originalName = `${villeDepart}_${villeArrivee}`;
    const reversedName = `${villeArrivee}_${villeDepart}`;

    if (jsonObj.gpx.metadata && jsonObj.gpx.metadata.name) {
      if (jsonObj.gpx.metadata.name === originalName) {
        jsonObj.gpx.metadata.name = reversedName;
      } else {
        jsonObj.gpx.metadata.name = jsonObj.gpx.metadata.name.replace(originalName, reversedName);
      }
    }

    if (jsonObj.gpx.trk && jsonObj.gpx.trk.name) {
      if (jsonObj.gpx.trk.name === originalName) {
        jsonObj.gpx.trk.name = reversedName;
      } else {
        jsonObj.gpx.trk.name = jsonObj.gpx.trk.name.replace(originalName, reversedName);
      }
    }

    // Inversion des points GPX (support multi-trk et multi-trkseg)
    let trks = jsonObj.gpx.trk;
    if (!trks) throw new Error("Pas de trk dans le fichier GPX");
    if (!Array.isArray(trks)) trks = [trks];

    trks.forEach(trk => {
      let segs = trk.trkseg;
      if (!segs) throw new Error("Pas de trkseg dans le fichier GPX");
      if (!Array.isArray(segs)) segs = [segs];

      segs.forEach(seg => {
        if (seg.trkpt) {
          let pts = Array.isArray(seg.trkpt) ? seg.trkpt : [seg.trkpt];
          seg.trkpt = pts.reverse();
        }
      });
    });

    // Remettre à jour la structure selon cas simple ou tableau
    jsonObj.gpx.trk = jsonObj.gpx.trk.length === 1 ? trks[0] : trks;

    // Construire le XML inversé
    const newXml = builder.build(jsonObj);

    // Écrire le nouveau fichier
    fs.writeFileSync(outputPath, newXml, 'utf-8');
    console.log(`✅ Fichier inversé créé : ${newFilename}`);

  } catch (e) {
    console.log(`⚠️ Erreur avec ${file} : ${e.message}`);
  }
});



