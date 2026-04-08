// Auto-generated from supabase/migrations/001_initial_schema.sql
// Regenerate with: npx supabase gen types typescript --project-id <ref>

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'inspector' | 'company_admin' | 'company_inspector'
          company_id: string | null
          company_name: string | null
          license_number: string | null
          poiib_number: string | null
          phone: string | null
          logo_url: string | null
          signature_url: string | null
          cert_urls: string[]
          subscription_plan: 'free' | 'pro' | 'company'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          reports_used_this_month: number
          reports_reset_at: string | null
          onboarding_complete: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string
          role?: 'inspector' | 'company_admin' | 'company_inspector'
          company_id?: string | null
          company_name?: string | null
          license_number?: string | null
          poiib_number?: string | null
          phone?: string | null
          logo_url?: string | null
          signature_url?: string | null
          cert_urls?: string[]
          subscription_plan?: 'free' | 'pro' | 'company'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          reports_used_this_month?: number
          reports_reset_at?: string | null
          onboarding_complete?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }

      companies: {
        Row: {
          id: string
          name: string
          nip: string | null
          admin_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          nip?: string | null
          admin_id?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['companies']['Insert']>
      }

      clients: {
        Row: {
          id: string
          user_id: string
          full_name: string
          email: string | null
          phone: string | null
          address: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }

      inspections: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          type: 'roczny' | 'piecioletni' | 'polroczny' | 'plac_zabaw' | 'odbior_mieszkania' | 'ogolna'
          status: 'draft' | 'in_progress' | 'completed' | 'sent'
          reference_number: string | null
          title: string
          address: string
          building_type: string | null
          construction_type: string | null
          owner_name: string | null
          owner_address: string | null
          owner_phone: string | null
          owner_email: string | null
          manager_name: string | null
          investor_name: string | null
          contractor_name: string | null
          inspection_date: string | null
          next_inspection_date: string | null
          previous_protocol_notes: string | null
          completed_works: string | null
          tenant_complaints: string | null
          incomplete_works: string | null
          building_docs_status: 'complete' | 'incomplete' | 'missing' | null
          usage_docs_status: 'complete' | 'incomplete' | 'missing' | null
          building_log_status: 'maintained' | 'incomplete' | 'missing' | null
          notes: string | null
          powierzchnia_uzytkowa: number | null
          powierzchnia_zabudowy: number | null
          kubatura: number | null
          kondygnacje_podziemne: number | null
          kondygnacje_nadziemne: number | null
          cover_photo_path: string | null
          wnioski_uwagi_zalecenia: string | null
          pilnosc_1: string | null
          pilnosc_2: string | null
          pilnosc_3: string | null
          ocena_stanu_tekst: string | null
          ocena_nadaje_sie: boolean | null
          ocena_stwierdzono_uszkodzenia: boolean | null
          pg_nazwa: string | null
          pg_liczba_urzadzen: string | null
          pg_rodzaje_urzadzen: string | null
          pg_material_urzadzen: string | null
          pg_nawierzchnia: string | null
          pg_nawierzchnia_pod_urzadzeniami: string | null
          pg_mocowanie_urzadzen: string | null
          pg_ogrodzenie: string | null
          pg_naslonecznienie: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          type: 'roczny' | 'piecioletni' | 'polroczny' | 'plac_zabaw' | 'odbior_mieszkania' | 'ogolna'
          status?: 'draft' | 'in_progress' | 'completed' | 'sent'
          reference_number?: string | null
          title: string
          address?: string
          building_type?: string | null
          construction_type?: string | null
          owner_name?: string | null
          owner_address?: string | null
          owner_phone?: string | null
          owner_email?: string | null
          manager_name?: string | null
          investor_name?: string | null
          contractor_name?: string | null
          inspection_date?: string | null
          next_inspection_date?: string | null
          previous_protocol_notes?: string | null
          completed_works?: string | null
          tenant_complaints?: string | null
          incomplete_works?: string | null
          building_docs_status?: 'complete' | 'incomplete' | 'missing' | null
          usage_docs_status?: 'complete' | 'incomplete' | 'missing' | null
          building_log_status?: 'maintained' | 'incomplete' | 'missing' | null
          notes?: string | null
          powierzchnia_uzytkowa?: number | null
          powierzchnia_zabudowy?: number | null
          kubatura?: number | null
          kondygnacje_podziemne?: number | null
          kondygnacje_nadziemne?: number | null
          cover_photo_path?: string | null
          wnioski_uwagi_zalecenia?: string | null
          pilnosc_1?: string | null
          pilnosc_2?: string | null
          pilnosc_3?: string | null
          ocena_stanu_tekst?: string | null
          ocena_nadaje_sie?: boolean | null
          ocena_stwierdzono_uszkodzenia?: boolean | null
          pg_nazwa?: string | null
          pg_liczba_urzadzen?: string | null
          pg_rodzaje_urzadzen?: string | null
          pg_material_urzadzen?: string | null
          pg_nawierzchnia?: string | null
          pg_nawierzchnia_pod_urzadzeniami?: string | null
          pg_mocowanie_urzadzen?: string | null
          pg_ogrodzenie?: string | null
          pg_naslonecznienie?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['inspections']['Insert']>
      }

      defects: {
        Row: {
          id: string
          inspection_id: string
          number: number
          title: string
          description: string | null
          type: 'usterka' | 'uwaga' | 'zalecenie'
          severity: 'critical' | 'serious' | 'minor'
          category: string | null
          status: 'open' | 'in_progress' | 'closed'
          contractor: string | null
          responsible_person: string | null
          reporter_name: string | null
          deadline: string | null
          location_label: string | null
          floor_plan_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          inspection_id: string
          number: number
          title: string
          description?: string | null
          type?: 'usterka' | 'uwaga' | 'zalecenie'
          severity?: 'critical' | 'serious' | 'minor'
          category?: string | null
          status?: 'open' | 'in_progress' | 'closed'
          contractor?: string | null
          responsible_person?: string | null
          reporter_name?: string | null
          deadline?: string | null
          location_label?: string | null
          floor_plan_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['defects']['Insert']>
      }

      photos: {
        Row: {
          id: string
          inspection_id: string
          defect_id: string | null
          checklist_item_id: string | null
          original_path: string
          annotated_path: string | null
          thumbnail_path: string | null
          caption: string | null
          photo_number: number
          ai_analysis: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          inspection_id: string
          defect_id?: string | null
          checklist_item_id?: string | null
          original_path: string
          annotated_path?: string | null
          thumbnail_path?: string | null
          caption?: string | null
          photo_number: number
          ai_analysis?: Json | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['photos']['Insert']>
      }

      floor_plans: {
        Row: {
          id: string
          inspection_id: string
          label: string
          storage_path: string
          file_type: 'image' | 'pdf'
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          inspection_id: string
          label: string
          storage_path: string
          file_type?: 'image' | 'pdf'
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['floor_plans']['Insert']>
      }

      pins: {
        Row: {
          id: string
          floor_plan_id: string
          defect_id: string | null
          x_percent: number
          y_percent: number
          label_number: number
          created_at: string
        }
        Insert: {
          id?: string
          floor_plan_id: string
          defect_id?: string | null
          x_percent: number
          y_percent: number
          label_number: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['pins']['Insert']>
      }

      checklist_templates: {
        Row: {
          id: string
          inspection_type: 'roczny' | 'piecioletni' | 'polroczny' | 'plac_zabaw' | 'odbior_mieszkania' | 'ogolna'
          section: string
          element_name: string
          legal_basis: string | null
          sort_order: number
          field_type: 'text_photos' | 'yesno_desc_photos' | 'yesno'
        }
        Insert: {
          id?: string
          inspection_type: 'roczny' | 'piecioletni' | 'polroczny' | 'plac_zabaw' | 'odbior_mieszkania' | 'ogolna'
          section: string
          element_name: string
          legal_basis?: string | null
          sort_order?: number
          field_type?: 'text_photos' | 'yesno_desc_photos' | 'yesno'
        }
        Update: Partial<Database['public']['Tables']['checklist_templates']['Insert']>
      }

      checklist_items: {
        Row: {
          id: string
          inspection_id: string
          template_id: string | null
          section: string
          element_name: string
          status: 'ok' | 'nok' | 'nie_dotyczy' | null
          state: 'dobry' | 'sredni' | 'dostateczny' | 'nie_dotyczy' | null
          state_description: string | null
          notes: string | null
          photo_refs: string[]
          sort_order: number
          yesno_value: boolean | null
          field_type: 'text_photos' | 'yesno_desc_photos' | 'yesno'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          inspection_id: string
          template_id?: string | null
          section: string
          element_name: string
          status?: 'ok' | 'nok' | 'nie_dotyczy' | null
          state?: 'dobry' | 'sredni' | 'dostateczny' | 'nie_dotyczy' | null
          state_description?: string | null
          notes?: string | null
          photo_refs?: string[]
          sort_order?: number
          yesno_value?: boolean | null
          field_type?: 'text_photos' | 'yesno_desc_photos' | 'yesno'
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['checklist_items']['Insert']>
      }

      voice_notes: {
        Row: {
          id: string
          inspection_id: string
          defect_id: string | null
          storage_path: string
          duration_seconds: number | null
          transcription_raw: string | null
          transcription_professional: string | null
          created_at: string
        }
        Insert: {
          id?: string
          inspection_id: string
          defect_id?: string | null
          storage_path: string
          duration_seconds?: number | null
          transcription_raw?: string | null
          transcription_professional?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['voice_notes']['Insert']>
      }

      reports: {
        Row: {
          id: string
          inspection_id: string
          report_number: string
          report_type: 'techniczny' | 'zadania' | 'protokol'
          pdf_path: string | null
          inspector_signature_url: string | null
          client_signature_url: string | null
          client_signed_at: string | null
          version: number
          sent_at: string | null
          recipient_email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          inspection_id: string
          report_number: string
          report_type: 'techniczny' | 'zadania' | 'protokol'
          pdf_path?: string | null
          inspector_signature_url?: string | null
          client_signature_url?: string | null
          client_signed_at?: string | null
          version?: number
          sent_at?: string | null
          recipient_email?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['reports']['Insert']>
      }

      subscription_plans: {
        Row: {
          id: string
          name: string
          label: string
          price_pln: number
          report_limit: number | null
          inspector_limit: number | null
          stripe_price_id: string | null
          features: string[]
        }
        Insert: {
          id?: string
          name: string
          label: string
          price_pln?: number
          report_limit?: number | null
          inspector_limit?: number | null
          stripe_price_id?: string | null
          features?: string[]
        }
        Update: Partial<Database['public']['Tables']['subscription_plans']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Convenience row types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Company = Database['public']['Tables']['companies']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Inspection = Database['public']['Tables']['inspections']['Row']
export type Defect = Database['public']['Tables']['defects']['Row']
export type Photo = Database['public']['Tables']['photos']['Row']
export type FloorPlan = Database['public']['Tables']['floor_plans']['Row']
export type Pin = Database['public']['Tables']['pins']['Row']
export type ChecklistTemplate = Database['public']['Tables']['checklist_templates']['Row']
export type ChecklistItem = Database['public']['Tables']['checklist_items']['Row']
export type VoiceNote = Database['public']['Tables']['voice_notes']['Row']
export type Report = Database['public']['Tables']['reports']['Row']
export type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row']

// Insert types
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type InspectionInsert = Database['public']['Tables']['inspections']['Insert']
export type DefectInsert = Database['public']['Tables']['defects']['Insert']
export type PhotoInsert = Database['public']['Tables']['photos']['Insert']
export type FloorPlanInsert = Database['public']['Tables']['floor_plans']['Insert']
export type PinInsert = Database['public']['Tables']['pins']['Insert']
export type ChecklistItemInsert = Database['public']['Tables']['checklist_items']['Insert']

// Update types
export type ClientUpdate = Database['public']['Tables']['clients']['Update']
export type InspectionUpdate = Database['public']['Tables']['inspections']['Update']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type DefectUpdate = Database['public']['Tables']['defects']['Update']
export type PhotoUpdate = Database['public']['Tables']['photos']['Update']
export type FloorPlanUpdate = Database['public']['Tables']['floor_plans']['Update']
export type PinUpdate = Database['public']['Tables']['pins']['Update']
export type ChecklistItemUpdate = Database['public']['Tables']['checklist_items']['Update']
