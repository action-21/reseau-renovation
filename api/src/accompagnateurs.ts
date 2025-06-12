import { Adresse } from './common'

export interface Accompagnateur {
  siren: string
  raison_sociale: string
  date_debut_agrement: Date
  date_fin_agrement: Date | null
  adresse: Adresse
}
