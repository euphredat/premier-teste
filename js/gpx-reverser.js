/**
 * Fonctions pour inverser les fichiers GPX (équivalent JavaScript de reverse_gpx.py)
 */

/**
 * Inverse les points d'un fichier GPX
 * @param {string} gpxContent - Contenu du fichier GPX
 * @returns {string} - Contenu du fichier GPX inversé
 */
function reverseGpxContent(gpxContent) {
  // Créer un parser XML
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(gpxContent, "text/xml")

  // Récupérer tous les segments de trace
  const segments = xmlDoc.querySelectorAll("trkseg")

  // Pour chaque segment, inverser l'ordre des points
  segments.forEach((segment) => {
    const points = Array.from(segment.querySelectorAll("trkpt"))

    // Supprimer tous les points du segment
    while (segment.firstChild) {
      segment.removeChild(segment.firstChild)
    }

    // Ajouter les points dans l'ordre inverse
    points.reverse().forEach((point) => {
      segment.appendChild(point)
    })
  })

  // Générer le nouveau contenu XML
  const serializer = new XMLSerializer()
  return serializer.serializeToString(xmlDoc)
}

/**
 * Télécharge un fichier GPX inversé
 * @param {string} gpxContent - Contenu du fichier GPX inversé
 * @param {string} originalFilename - Nom du fichier original
 */
function downloadReversedGpx(gpxContent, originalFilename) {
  // Créer un nom pour le fichier inversé
  const reversedFilename = originalFilename.replace(".gpx", "_reverse.gpx")

  // Créer un blob avec le contenu GPX inversé
  const blob = new Blob([gpxContent], { type: "application/gpx+xml" })

  // Créer un URL pour le blob
  const url = URL.createObjectURL(blob)

  // Créer un lien de téléchargement
  const a = document.createElement("a")
  a.href = url
  a.download = reversedFilename

  // Ajouter le lien au document, cliquer dessus, puis le supprimer
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  // Libérer l'URL
  URL.revokeObjectURL(url)

  return reversedFilename
}

/**
 * Inverse un fichier GPX et retourne son contenu
 * @param {string} gpxFile - URL du fichier GPX
 * @returns {Promise<Object>} - Promesse avec le résultat de l'inversion
 */
async function reverseGpxFile(gpxFile) {
  try {
    const response = await fetch(gpxFile);
    if (!response.ok) {
      throw new Error(`Impossible de charger le fichier GPX : ${gpxFile}`);
    }

    const gpxContent = await response.text();

    // Parser le contenu GPX
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(gpxContent, "text/xml");

    // Récupérer tous les segments de trace
    const segments = xmlDoc.querySelectorAll("trkseg");

    // Inverser les points dans chaque segment
    segments.forEach((segment) => {
      const points = Array.from(segment.querySelectorAll("trkpt"));
      while (segment.firstChild) {
        segment.removeChild(segment.firstChild);
      }
      points.reverse().forEach((point) => {
        segment.appendChild(point);
      });
    });

    // Sérialiser le contenu GPX inversé
    const serializer = new XMLSerializer();
    return serializer.serializeToString(xmlDoc);
  } catch (error) {
    console.error(error.message);
    return null;
  }
}
