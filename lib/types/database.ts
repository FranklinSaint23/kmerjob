/**
 * Types de la base — écrits à la main pour coller aux migrations SQL.
 *
 * Dès que tu as la CLI Supabase, régénère-les plutôt que de les éditer :
 *   npx supabase gen types typescript --project-id <ref> > lib/types/database.ts
 * Un type divergent du schéma réel est pire que pas de type du tout.
 */

export type TrustLevel = 'verifiee' | 'moderee' | 'suspecte'
export type ExtractedBy = 'rules' | 'groq'
export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'cancelled'
export type TransactionStatus =
  | 'pending'
  | 'awaiting_confirmation'
  | 'success'
  | 'failed'
  | 'cancelled'
export type Operator = 'mtn' | 'orange'

export type OfferRow = {
  id: string
  title: string
  company: string
  category: string
  sector: string
  location: string
  contract_type: string
  seniority: string
  description: string
  requirements: string[]
  salary: string | null
  salary_min: number | null
  salary_max: number | null
  deadline: string | null
  source: string
  source_url: string | null
  date_posted: string
  active: boolean
  trust_level: TrustLevel
  trust_score: number
  trust_reasons: string[]
  trust_analyzed_by: ExtractedBy
  content_hash: string
  embedding: number[] | null
  created_at: string
  updated_at: string
}

export type CvProfileRow = {
  id: string
  user_id: string
  file_path: string | null
  file_name: string | null
  raw_text: string
  skills: string[]
  job_titles: string[]
  languages: string[]
  experience_years: number
  education_label: string
  education_rank: number
  location: string | null
  summary: string | null
  extracted_by: ExtractedBy
  embedding: number[] | null
  created_at: string
  updated_at: string
}

export type ProfileRow = {
  id: string
  full_name: string | null
  phone: string | null
  city: string | null
  created_at: string
  updated_at: string
}

export type SubscriptionRow = {
  id: string
  user_id: string
  plan: 'premium'
  status: SubscriptionStatus
  started_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export type TransactionRow = {
  id: string
  user_id: string
  subscription_id: string | null
  amount: number
  currency: string
  operator: Operator
  phone: string
  status: TransactionStatus
  dohone_ref: string | null
  idempotency_key: string | null
  raw_payload: Record<string, unknown>
  error_message: string | null
  created_at: string
  updated_at: string
}

export type ScrapingLogRow = {
  id: string
  source_name: string
  started_at: string
  finished_at: string | null
  status: 'running' | 'success' | 'error'
  offers_found: number
  offers_created: number
  offers_duplicate: number
  error_message: string | null
}

/**
 * Ligne renvoyée par la fonction search_offers (sous-ensemble + rank).
 *
 * Alias de type et non interface, comme tous les types de lignes ci-dessus :
 * seuls les alias reçoivent une index signature implicite, condition pour
 * satisfaire `Record<string, unknown>` dans le contrat GenericTable de
 * postgrest-js. Repasser en `interface` ici casserait tout le typage du client.
 */
export type SearchOfferRow = Pick<
  OfferRow,
  | 'id' | 'title' | 'company' | 'category' | 'sector' | 'location'
  | 'contract_type' | 'seniority' | 'description' | 'requirements'
  | 'salary' | 'salary_min' | 'salary_max' | 'deadline' | 'source'
  | 'source_url' | 'date_posted' | 'trust_level' | 'trust_score' | 'trust_reasons'
> & {
  rank: number
  total_count: number
}

export type ShortlistOfferRow = Pick<
  OfferRow,
  | 'id' | 'title' | 'company' | 'sector' | 'location' | 'seniority'
  | 'description' | 'requirements' | 'salary' | 'trust_level'
  | 'trust_score' | 'date_posted'
> & {
  rank: number
}

type Insertable<T, Optional extends keyof T> = Omit<T, Optional> & Partial<Pick<T, Optional>>

/**
 * Enveloppe une table au format attendu par postgrest-js.
 *
 * `Relationships` est obligatoire dans son type GenericTable : sans ce champ,
 * le schéma entier cesse de correspondre au contrat générique et le client
 * retombe silencieusement sur `never` — d'où des erreurs déroutantes du type
 * « 'user_id' does not exist in type 'never[]' » sur un simple insert. On le
 * laisse vide : il ne sert qu'aux jointures inférées automatiquement, dont on
 * ne se sert pas ici.
 */
type Table<Row, Insert> = {
  Row: Row
  Insert: Insert
  Update: Partial<Row>
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      profiles: Table<ProfileRow, Insertable<ProfileRow, 'created_at' | 'updated_at'>>
      offers: Table<
        OfferRow,
        Insertable<
          OfferRow,
          | 'id' | 'category' | 'sector' | 'location' | 'contract_type' | 'seniority'
          | 'requirements' | 'salary' | 'salary_min' | 'salary_max' | 'deadline'
          | 'source' | 'source_url' | 'date_posted' | 'active' | 'trust_level'
          | 'trust_score' | 'trust_reasons' | 'trust_analyzed_by' | 'embedding'
          | 'created_at' | 'updated_at'
        >
      >
      cv_profiles: Table<
        CvProfileRow,
        Insertable<
          CvProfileRow,
          | 'id' | 'file_path' | 'file_name' | 'raw_text' | 'skills' | 'job_titles'
          | 'languages' | 'experience_years' | 'education_label' | 'education_rank'
          | 'location' | 'summary' | 'extracted_by' | 'embedding'
          | 'created_at' | 'updated_at'
        >
      >
      favorites: Table<
        { user_id: string; offer_id: string; created_at: string },
        { user_id: string; offer_id: string; created_at?: string }
      >
      subscriptions: Table<
        SubscriptionRow,
        Insertable<
          SubscriptionRow,
          'id' | 'plan' | 'status' | 'started_at' | 'expires_at' | 'created_at' | 'updated_at'
        >
      >
      transactions: Table<
        TransactionRow,
        Insertable<
          TransactionRow,
          | 'id' | 'subscription_id' | 'currency' | 'status' | 'dohone_ref'
          | 'idempotency_key' | 'raw_payload' | 'error_message'
          | 'created_at' | 'updated_at'
        >
      >
      scraping_logs: Table<
        ScrapingLogRow,
        Insertable<
          ScrapingLogRow,
          | 'id' | 'started_at' | 'finished_at' | 'status' | 'offers_found'
          | 'offers_created' | 'offers_duplicate' | 'error_message'
        >
      >
    }
    Views: Record<string, never>
    Functions: {
      search_offers: {
        Args: {
          p_query?: string
          p_location?: string | null
          p_sector?: string | null
          p_category?: string | null
          p_contract_type?: string | null
          p_trust_level?: string | null
          p_limit?: number
          p_offset?: number
        }
        Returns: SearchOfferRow[]
      }
      shortlist_offers_for_cv: {
        Args: { p_keywords: string[]; p_limit?: number }
        Returns: ShortlistOfferRow[]
      }
      offer_facets: {
        Args: Record<string, never>
        Returns: {
          locations: string[]
          sectors: string[]
          categories: string[]
          contract_types: string[]
          total: number
        }
      }
      has_active_subscription: {
        Args: { uid: string }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
  }
}
