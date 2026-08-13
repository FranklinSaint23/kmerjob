/**
 * Géographie camerounaise : villes couvertes et distance.
 *
 * Sert au Radar, qui combine pertinence CV et proximité. Coordonnées
 * approximatives au centre-ville — la précision au kilomètre n'a pas d'intérêt
 * ici, on veut distinguer « même ville » de « à 300 km ».
 */

export interface City {
  name: string
  region: string
  lat: number
  lon: number
}

export const CITIES: readonly City[] = [
  { name: 'Douala', region: 'Littoral', lat: 4.0511, lon: 9.7679 },
  { name: 'Yaoundé', region: 'Centre', lat: 3.848, lon: 11.5021 },
  { name: 'Bafoussam', region: 'Ouest', lat: 5.4781, lon: 10.4179 },
  { name: 'Bamenda', region: 'Nord-Ouest', lat: 5.9597, lon: 10.1459 },
  { name: 'Garoua', region: 'Nord', lat: 9.3017, lon: 13.3921 },
  { name: 'Maroua', region: 'Extrême-Nord', lat: 10.591, lon: 14.3159 },
  { name: 'Ngaoundéré', region: 'Adamaoua', lat: 7.3167, lon: 13.5833 },
  { name: 'Bertoua', region: 'Est', lat: 4.5774, lon: 13.6846 },
  { name: 'Buea', region: 'Sud-Ouest', lat: 4.1527, lon: 9.241 },
  { name: 'Limbe', region: 'Sud-Ouest', lat: 4.0186, lon: 9.2049 },
  { name: 'Kribi', region: 'Sud', lat: 2.9391, lon: 9.9101 },
  { name: 'Ebolowa', region: 'Sud', lat: 2.9, lon: 11.15 },
  { name: 'Edéa', region: 'Littoral', lat: 3.8, lon: 10.1333 },
  { name: 'Kumba', region: 'Sud-Ouest', lat: 4.6363, lon: 9.4469 },
  { name: 'Dschang', region: 'Ouest', lat: 5.45, lon: 10.05 },
  { name: 'Foumban', region: 'Ouest', lat: 5.7167, lon: 10.9 },
  { name: 'Nkongsamba', region: 'Littoral', lat: 4.9547, lon: 9.9404 },
  { name: 'Sangmélima', region: 'Sud', lat: 2.9333, lon: 11.9833 },
  { name: 'Bafia', region: 'Centre', lat: 4.75, lon: 11.2333 },
  { name: 'Mbalmayo', region: 'Centre', lat: 3.5167, lon: 11.5 },
] as const

export const CITY_NAMES = CITIES.map((c) => c.name)

/**
 * Normalise pour comparer sans se soucier des accents ni de la casse.
 * NFD sépare « é » en « e » + accent combinant, que la plage ̀-ͯ
 * (Combining Diacritical Marks) supprime ensuite.
 */
export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export function findCity(name: string | null | undefined): City | null {
  if (!name) return null
  const target = normalize(name)
  return (
    CITIES.find((c) => normalize(c.name) === target) ??
    CITIES.find((c) => target.includes(normalize(c.name))) ??
    null
  )
}

/** Distance orthodromique en kilomètres (formule de haversine). */
export function distanceKm(a: City, b: City): number {
  const R = 6371
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * Score de proximité sur 100.
 *
 * Palier plutôt que décroissance continue : pour qui cherche un emploi, la
 * différence entre 40 km et 80 km est réelle (trajet quotidien possible ou
 * non), alors qu'entre 600 km et 700 km elle ne l'est plus — dans les deux cas
 * il faut déménager. Une fonction linéaire écraserait cette distinction.
 */
export function proximityScore(
  userCity: string | null | undefined,
  offerLocation: string | null | undefined
): number {
  const from = findCity(userCity)
  const to = findCity(offerLocation)

  // Ville inconnue au catalogue (« Non précisé », télétravail, étranger) :
  // score neutre, pour ne pénaliser ni favoriser.
  if (!from || !to) return 50

  if (normalize(from.name) === normalize(to.name)) return 100

  const km = distanceKm(from, to)
  if (km <= 50) return 90
  if (km <= 120) return 75
  if (km <= 250) return 55
  if (km <= 450) return 35
  return 20
}
