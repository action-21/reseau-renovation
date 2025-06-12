import { Adresse } from './common'
import actes from './data/actes.json'

export interface EspaceConseil {
  id: string
  raison_sociale: string
  adresse: Adresse
  actes: Acte[]
}

export type Acte = {
  code: string
  label: string
}

export type DatasetResponse = {
  total: number
  next: string
  results: Array<{
    Id_Structure: string
    Nom_Structure: string
    Commune_Structure: string
    Adresse_Structure: string
    Code_Insee_Commune_Structure: string
    Actes_couvert_structure: string
    Code_Postal_Structure: string
  }>
}

const matchActe = (str: string): Acte | undefined => {
  const data = actes
  return data.find(item => item.codes.includes(str) || item.label === str)
}

const transformResponse = (response: DatasetResponse): EspaceConseil[] => {
  return response.results.map(row => {
    return {
      id: row.Id_Structure,
      raison_sociale: row.Nom_Structure,
      adresse: {
        id: null,
        numero: null,
        nom_voie: row.Adresse_Structure,
        nom_commune: row.Commune_Structure,
        code_postal: row.Code_Postal_Structure,
        code_insee: row.Code_Insee_Commune_Structure,
        lat: null,
        lon: null
      },
      actes: (JSON.parse(row.Actes_couvert_structure) as string[])
        .map(item => {
          const acte = matchActe(item)
          return acte ? { code: acte.code, label: acte.label } : null
        })
        .filter(item => item !== null)
    }
  })
}

export const search = async (query: {
  code_insee?: string
  actes?: string[]
}): Promise<EspaceConseil[]> => {
  const qs = []
  query.code_insee && qs.push(`code_insee: ${query.code_insee}`)
  query.actes &&
    qs.push(
      `Actes_couvert_structure: (${query.actes
        .map(item => `*${item}*`)
        .join(' OR ')})`
    )

  const response = await fetch(
    'https://data.ademe.fr/data-fair/api/v1/datasets/liste-espaces-conseil-france-renov/lines',
    {
      method: 'GET',
      body: new URLSearchParams({ qs: qs.join(' AND ') })
    }
  )

  return response.ok
    ? transformResponse(await response.json())
    : Promise.reject(
        new Error('Failed to fetch Espaces Conseil data from ADEME')
      )
}

export const find = async (query: {
  id: string
  actes?: string[]
}): Promise<EspaceConseil | null> => {
  const qs = []
  query.id && qs.push(`Id_Structure: ${query.id}`)
  query.actes &&
    qs.push(
      `Actes_couvert_structure: (${query.actes
        .map(item => `*${item}*`)
        .join(' OR ')})`
    )

  const response = await fetch(
    'https://data.ademe.fr/data-fair/api/v1/datasets/liste-espaces-conseil-france-renov/lines',
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
