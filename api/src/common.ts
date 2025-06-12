import communes from '@etalab/decoupage-administratif/data/communes.json'
import domaines from './data/domaines.json'

export type Adresse = {
  id: string | null
  numero: string | null
  nom_voie: string
  code_postal: string
  code_insee: string
  nom_commune: string
  lat: number | null
  lon: number | null
}

export type Commune = {
  code: string
  nom: string
  codesPostaux: string[]
}

export type Domaine = {
  label: string
  code: string
}

export const matchDomaine = (str: string): Domaine | undefined => {
  const data = domaines
  return data.find(item => item.label === str || item.code === str)
}

export const matchCommune = (query: {
  code_postal: string
  nom_commune: string
}): Commune | undefined => {
  const { code_postal, nom_commune } = query

  const data = communes as Commune[]

  return data
    .filter(item => item.codesPostaux.includes(code_postal))
    .sort((a, b) => {
      const split = (str: string) => str.toLocaleLowerCase().split('')

      return (
        split(b.nom).filter(char => split(nom_commune).includes(char)).length -
        split(a.nom).filter(char => split(nom_commune).includes(char)).length
      )
    })
    .find(() => true)
}
