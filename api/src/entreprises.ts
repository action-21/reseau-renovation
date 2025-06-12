import { Adresse, Domaine, matchCommune, matchDomaine } from './common'

export interface Entreprise {
  siren: string
  raison_sociale: string
  adresse: Adresse
  qualifications: Qualification[]
}

export type Qualification = {
  domaine: Domaine
  date_debut: Date
  date_fin: Date | null
}

export type DatasetResponse = {
  total: number
  next: string
  results: Array<{
    siret: string
    nom_entreprise: string
    adresse: string
    code_postal: string
    commune: string
    domaine: string
    meta_domaine: string
    lien_date_debut: string
    lien_date_fin: string
    latitude?: number
    longitude?: number
  }>
}

const transformResponse = (response: DatasetResponse): Entreprise[] => {
  return response.results.reduce((collection: Entreprise[], row) => {
    const siren = row.siret.slice(0, 9)
    const commune = matchCommune({
      code_postal: row.code_postal,
      nom_commune: row.commune
    })

    if (collection.find(item => item.siren === siren)) {
      return collection
    }

    collection.push({
      siren,
      raison_sociale: row.nom_entreprise,
      adresse: {
        id: null,
        numero: null,
        nom_voie: row.adresse,
        nom_commune: commune ? commune.nom : row.commune,
        code_postal: row.code_postal,
        code_insee: commune ? commune.code : 'nd',
        lat: row.latitude ?? null,
        lon: row.longitude ?? null
      },
      qualifications: response.results
        .filter(item => item.siret.startsWith(siren))
        .map(item => {
          const domaine = matchDomaine(item.domaine)

          return domaine
            ? {
                domaine,
                date_debut: new Date(item.lien_date_debut),
                date_fin: item.lien_date_fin
                  ? new Date(item.lien_date_fin)
                  : null
              }
            : null
        })
        .filter(item => item !== null)
    })

    return collection
  }, [])
}

export const search = async (query: {
  code_insee?: string
  distance?: string
  domaines?: string[]
}): Promise<Entreprise[]> => {
  const qs = []
  query.code_insee && qs.push(`code_insee: ${query.code_insee}`)
  query.domaines && qs.push(`domaine: (${query.domaines.join(' OR ')})`)
  query.distance && qs.push(`geo_distance: ${query.distance}`)

  const response = await fetch(
    'https://data.ademe.fr/datasets/liste-des-entreprises-rge-2',
    {
      method: 'GET',
      body: new URLSearchParams({ qs: qs.join(' AND ') })
    }
  )

  return response.ok
    ? transformResponse(await response.json())
    : Promise.reject(new Error('Failed to fetch RGE data from ADEME'))
}

export const find = async (query: {
  siren: string
  domaines?: string[]
  date?: Date
}): Promise<Entreprise | null> => {
  const qs = []
  query.siren && qs.push(`siret: ${query.siren}*`)
  query.domaines && qs.push(`domaine: (${query.domaines.join(' OR ')})`)

  const date = query.date?.toLocaleString('fr-FR')
  date &&
    qs.push(`lien_date_debut: {* TO ${date}} AND lien_date_fin: {${date} TO *}`)

  const response = await fetch(
    'https://data.ademe.fr/datasets/liste-des-entreprises-rge-2',
    {
      method: 'GET',
      body: new URLSearchParams({ qs: qs.join(' AND ') })
    }
  )

  if (!response.ok) {
    return null
  }

  return transformResponse(await response.json()).find(() => true) ?? null
}
