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

// Variables auteur personnalisée
const monAuteur = {
  name: "Mon titre perso",
  link: {
    "@_href": "https://mon-site-exemple.com"
  }
};

fs.readdirSync(inputFolder).forEach(file => {
  if (!file.endsWith('.gpx')) return; // On traite tous les fichiers .gpx

  const filePath = path.join(inputFolder, file);

  try {
    const xmlData = fs.readFileSync(filePath, 'utf-8');
    const jsonObj = parser.parse(xmlData);

    if (jsonObj.gpx) {
      // Modifier systématiquement <author> DANS metadata (création ou remplacement)
      if (!jsonObj.gpx.metadata) {
        jsonObj.gpx.metadata = {};
      }
      jsonObj.gpx.metadata.author = {
        name: monAuteur.name,
        link: {
          "@_href": monAuteur.link["@_href"]
        }
      };

      // Construire le XML final
      const newXml = builder.build(jsonObj);

      // Écrire dans le même fichier (modification in place)
      fs.writeFileSync(filePath, newXml, 'utf-8');

      console.log(`✅ Auteur modifié dans : ${file}`);

    } else {
      console.log(`⚠️ Fichier sans balise <gpx> : ${file}`);
    }

  } catch (e) {
    console.log(`⚠️ Erreur avec ${file} : ${e.message}`);
  }
});



