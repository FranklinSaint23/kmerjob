import 'server-only'

/**
 * Adaptateur Dohone (paiement Mobile Money MTN/Orange).
 *
 * Le flux documenté est QUOTE → START → CFRMSMS → VERIFY, mais l'URL de base
 * de l'API n'est fournie qu'après inscription marchand sur my-dohone.com — la
 * deviner produirait un endpoint qui a l'air de marcher et casse en
 * production. Tant que DOHONE_API_URL / DOHONE_MERCHANT_KEY / DOHONE_HASH_CODE
 * sont vides, on tourne en mode simulation : le flux argent est absent, mais
 * tout le reste (transaction en base, activation d'abonnement, UI) est réel
 * et testable de bout en bout. isSimulated() permet à l'appelant de
 * l'annoncer honnêtement plutôt que de laisser croire à un vrai paiement.
 */

export interface InitiatePaymentInput {
  amount: number
  phone: string
  operator: 'mtn' | 'orange'
  reference: string
}

export interface InitiatePaymentResult {
  success: boolean
  dohoneRef: string
  requiresSmsConfirmation: boolean
  message: string
}

export function isDohoneConfigured(): boolean {
  return Boolean(
    process.env.DOHONE_API_URL && process.env.DOHONE_MERCHANT_KEY && process.env.DOHONE_HASH_CODE
  )
}

class DohoneClient {
  /**
   * Point d'intégration unique, volontairement non implémenté : l'URL réelle
   * de l'API Dohone n'est connue qu'après inscription marchand. Complète ce
   * corps avec le flux QUOTE → START → CFRMSMS → VERIFY documenté par Dohone
   * une fois les identifiants obtenus — le reste de l'application n'a pas à
   * changer, seul ce module est concerné.
   */
  private async call(_input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    throw new Error(
      'DohoneClient._call() non implémenté : renseigne DOHONE_API_URL une fois inscrit sur my-dohone.com.'
    )
  }

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    if (!isDohoneConfigured()) return simulate(input)
    return this.call(input)
  }
}

function simulate(input: InitiatePaymentInput): InitiatePaymentResult {
  return {
    success: true,
    dohoneRef: `SIMULE-${input.reference}`,
    requiresSmsConfirmation: false,
    message: 'Paiement simulé — Dohone non configuré. Aucun montant réel n\'a été débité.',
  }
}

export const dohone = new DohoneClient()
