export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      account_deletion_requests: {
        Row: {
          cancelled_at: string | null;
          id: string;
          requested_at: string;
          status: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          cancelled_at?: string | null;
          id?: string;
          requested_at?: string;
          status?: string;
          user_id: string;
        };
        Update: {
          cancelled_at?: string | null;
          id?: string;
          requested_at?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "account_deletion_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_generations: {
        Row: {
          application_id: string | null;
          created_at: string;
          error_code: string | null;
          estimated_cost_usd: number | null;
          id: string;
          input_tokens: number | null;
          job_id: string;
          latency_ms: number;
          model: string;
          output_text: string | null;
          output_tokens: number | null;
          prompt_version: string;
          provider: string;
          purpose: Database["public"]["Enums"]["ai_generation_purpose"];
          requested_by: string;
          source_payload: NonNullable<Json>;
          status: Database["public"]["Enums"]["ai_generation_status"];
        };
        ComputedFields: never;
        Insert: {
          application_id?: string | null;
          created_at?: string;
          error_code?: string | null;
          estimated_cost_usd?: number | null;
          id?: string;
          input_tokens?: number | null;
          job_id: string;
          latency_ms: number;
          model: string;
          output_text?: string | null;
          output_tokens?: number | null;
          prompt_version: string;
          provider: string;
          purpose: Database["public"]["Enums"]["ai_generation_purpose"];
          requested_by: string;
          source_payload: NonNullable<Json>;
          status: Database["public"]["Enums"]["ai_generation_status"];
        };
        Update: {
          application_id?: string | null;
          created_at?: string;
          error_code?: string | null;
          estimated_cost_usd?: number | null;
          id?: string;
          input_tokens?: number | null;
          job_id?: string;
          latency_ms?: number;
          model?: string;
          output_text?: string | null;
          output_tokens?: number | null;
          prompt_version?: string;
          provider?: string;
          purpose?: Database["public"]["Enums"]["ai_generation_purpose"];
          requested_by?: string;
          source_payload?: NonNullable<Json>;
          status?: Database["public"]["Enums"]["ai_generation_status"];
        };
        Relationships: [
          {
            foreignKeyName: "ai_generations_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "application_outcome_analysis";
            referencedColumns: ["application_id"];
          },
          {
            foreignKeyName: "ai_generations_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_generations_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_generations_requested_by_fkey";
            columns: ["requested_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      application_answer_versions: {
        Row: {
          answer: string;
          application_id: string;
          approved_at: string | null;
          created_at: string;
          generation_id: string | null;
          id: string;
          source: Database["public"]["Enums"]["text_version_source"];
          source_evidence_ids: string[];
          version: number;
        };
        ComputedFields: never;
        Insert: {
          answer: string;
          application_id: string;
          approved_at?: string | null;
          created_at?: string;
          generation_id?: string | null;
          id?: string;
          source: Database["public"]["Enums"]["text_version_source"];
          source_evidence_ids?: string[];
          version: number;
        };
        Update: {
          answer?: string;
          application_id?: string;
          approved_at?: string | null;
          created_at?: string;
          generation_id?: string | null;
          id?: string;
          source?: Database["public"]["Enums"]["text_version_source"];
          source_evidence_ids?: string[];
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "application_answer_versions_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "application_outcome_analysis";
            referencedColumns: ["application_id"];
          },
          {
            foreignKeyName: "application_answer_versions_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "application_answer_versions_generation_id_fkey";
            columns: ["generation_id"];
            isOneToOne: false;
            referencedRelation: "ai_generations";
            referencedColumns: ["id"];
          },
        ];
      };
      application_drafts: {
        Row: {
          ai_generation_id: string | null;
          answer: string;
          candidate_id: string;
          created_at: string;
          current_step: number;
          id: string;
          job_id: string;
          selected_experience_ids: string[];
          selected_work_sample_ids: string[];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          ai_generation_id?: string | null;
          answer?: string;
          candidate_id: string;
          created_at?: string;
          current_step?: number;
          id?: string;
          job_id: string;
          selected_experience_ids?: string[];
          selected_work_sample_ids?: string[];
          updated_at?: string;
        };
        Update: {
          ai_generation_id?: string | null;
          answer?: string;
          candidate_id?: string;
          created_at?: string;
          current_step?: number;
          id?: string;
          job_id?: string;
          selected_experience_ids?: string[];
          selected_work_sample_ids?: string[];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "application_drafts_ai_generation_id_fkey";
            columns: ["ai_generation_id"];
            isOneToOne: false;
            referencedRelation: "ai_generations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "application_drafts_candidate_id_fkey";
            columns: ["candidate_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "application_drafts_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      application_stage_events: {
        Row: {
          actor_id: string;
          application_id: string;
          id: string;
          note: string | null;
          occurred_at: string;
          stage: Database["public"]["Enums"]["application_stage"];
        };
        ComputedFields: never;
        Insert: {
          actor_id: string;
          application_id: string;
          id?: string;
          note?: string | null;
          occurred_at?: string;
          stage: Database["public"]["Enums"]["application_stage"];
        };
        Update: {
          actor_id?: string;
          application_id?: string;
          id?: string;
          note?: string | null;
          occurred_at?: string;
          stage?: Database["public"]["Enums"]["application_stage"];
        };
        Relationships: [
          {
            foreignKeyName: "application_stage_events_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "application_stage_events_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "application_outcome_analysis";
            referencedColumns: ["application_id"];
          },
          {
            foreignKeyName: "application_stage_events_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
        ];
      };
      applications: {
        Row: {
          answer: string;
          answer_generation_id: string | null;
          candidate_id: string;
          id: string;
          job_id: string;
          organization_id: string;
          source_snapshot: NonNullable<Json>;
          status: Database["public"]["Enums"]["application_status"];
          submitted_at: string;
          updated_at: string;
          variant: Database["public"]["Enums"]["application_variant"];
        };
        ComputedFields: never;
        Insert: {
          answer: string;
          answer_generation_id?: string | null;
          candidate_id: string;
          id?: string;
          job_id: string;
          organization_id: string;
          source_snapshot: NonNullable<Json>;
          status?: Database["public"]["Enums"]["application_status"];
          submitted_at?: string;
          updated_at?: string;
          variant: Database["public"]["Enums"]["application_variant"];
        };
        Update: {
          answer?: string;
          answer_generation_id?: string | null;
          candidate_id?: string;
          id?: string;
          job_id?: string;
          organization_id?: string;
          source_snapshot?: NonNullable<Json>;
          status?: Database["public"]["Enums"]["application_status"];
          submitted_at?: string;
          updated_at?: string;
          variant?: Database["public"]["Enums"]["application_variant"];
        };
        Relationships: [
          {
            foreignKeyName: "applications_answer_generation_id_fkey";
            columns: ["answer_generation_id"];
            isOneToOne: false;
            referencedRelation: "ai_generations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_candidate_id_fkey";
            columns: ["candidate_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      candidate_documents: {
        Row: {
          file_name: string;
          mime_type: string;
          size_bytes: number;
          storage_path: string;
          uploaded_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          file_name: string;
          mime_type: string;
          size_bytes: number;
          storage_path: string;
          uploaded_at?: string;
          user_id: string;
        };
        Update: {
          file_name?: string;
          mime_type?: string;
          size_bytes?: number;
          storage_path?: string;
          uploaded_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "candidate_documents_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      candidate_experiences: {
        Row: {
          company_name: string;
          created_at: string;
          description: string;
          ended_on: string | null;
          id: string;
          measurable_outcome: string | null;
          sort_order: number;
          started_on: string | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          company_name: string;
          created_at?: string;
          description: string;
          ended_on?: string | null;
          id?: string;
          measurable_outcome?: string | null;
          sort_order?: number;
          started_on?: string | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          company_name?: string;
          created_at?: string;
          description?: string;
          ended_on?: string | null;
          id?: string;
          measurable_outcome?: string | null;
          sort_order?: number;
          started_on?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "candidate_experiences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      candidate_profiles: {
        Row: {
          bio: string | null;
          city: string | null;
          experience_years: number | null;
          headline: string | null;
          language_background: string | null;
          onboarding_completed_at: string | null;
          preferred_categories: Database["public"]["Enums"]["job_category"][];
          preferred_contracts: Database["public"]["Enums"]["contract_type"][];
          preferred_functions: Database["public"]["Enums"]["job_function"][];
          preferred_locations: string[];
          preferred_remote: Database["public"]["Enums"]["remote_status"][];
          preferred_seniority: Database["public"]["Enums"]["seniority_level"][];
          salary_expectation_currency: string | null;
          salary_expectation_min: number | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          bio?: string | null;
          city?: string | null;
          experience_years?: number | null;
          headline?: string | null;
          language_background?: string | null;
          onboarding_completed_at?: string | null;
          preferred_categories?: Database["public"]["Enums"]["job_category"][];
          preferred_contracts?: Database["public"]["Enums"]["contract_type"][];
          preferred_functions?: Database["public"]["Enums"]["job_function"][];
          preferred_locations?: string[];
          preferred_remote?: Database["public"]["Enums"]["remote_status"][];
          preferred_seniority?: Database["public"]["Enums"]["seniority_level"][];
          salary_expectation_currency?: string | null;
          salary_expectation_min?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          bio?: string | null;
          city?: string | null;
          experience_years?: number | null;
          headline?: string | null;
          language_background?: string | null;
          onboarding_completed_at?: string | null;
          preferred_categories?: Database["public"]["Enums"]["job_category"][];
          preferred_contracts?: Database["public"]["Enums"]["contract_type"][];
          preferred_functions?: Database["public"]["Enums"]["job_function"][];
          preferred_locations?: string[];
          preferred_remote?: Database["public"]["Enums"]["remote_status"][];
          preferred_seniority?: Database["public"]["Enums"]["seniority_level"][];
          salary_expectation_currency?: string | null;
          salary_expectation_min?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "candidate_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      candidate_work_samples: {
        Row: {
          context: string;
          created_at: string;
          id: string;
          outcome: string;
          sort_order: number;
          title: string;
          updated_at: string;
          url: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          context: string;
          created_at?: string;
          id?: string;
          outcome: string;
          sort_order?: number;
          title: string;
          updated_at?: string;
          url?: string | null;
          user_id: string;
        };
        Update: {
          context?: string;
          created_at?: string;
          id?: string;
          outcome?: string;
          sort_order?: number;
          title?: string;
          updated_at?: string;
          url?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "candidate_work_samples_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      case_evidence_documents: {
        Row: {
          content: NonNullable<Json>;
          created_at: string;
          id: string;
          kind: Database["public"]["Enums"]["case_evidence_kind"];
          release_key: Database["public"]["Enums"]["case_release_key"];
          source_label: string;
          title: string;
          visible_to_participants: boolean;
        };
        ComputedFields: never;
        Insert: {
          content: NonNullable<Json>;
          created_at?: string;
          id?: string;
          kind: Database["public"]["Enums"]["case_evidence_kind"];
          release_key: Database["public"]["Enums"]["case_release_key"];
          source_label: string;
          title: string;
          visible_to_participants?: boolean;
        };
        Update: {
          content?: NonNullable<Json>;
          created_at?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["case_evidence_kind"];
          release_key?: Database["public"]["Enums"]["case_release_key"];
          source_label?: string;
          title?: string;
          visible_to_participants?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "case_evidence_documents_release_key_fkey";
            columns: ["release_key"];
            isOneToOne: false;
            referencedRelation: "case_releases";
            referencedColumns: ["key"];
          },
        ];
      };
      case_releases: {
        Row: {
          created_at: string;
          key: Database["public"]["Enums"]["case_release_key"];
          participant_summary: string;
          released_at: string | null;
          sequence: number;
          title: string;
          unlocked: boolean;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          key: Database["public"]["Enums"]["case_release_key"];
          participant_summary: string;
          released_at?: string | null;
          sequence: number;
          title: string;
          unlocked?: boolean;
        };
        Update: {
          created_at?: string;
          key?: Database["public"]["Enums"]["case_release_key"];
          participant_summary?: string;
          released_at?: string | null;
          sequence?: number;
          title?: string;
          unlocked?: boolean;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          location: string;
          logo_url: string | null;
          name: string;
          size_label: string;
          slug: string;
          summary: string;
          updated_at: string;
          website_url: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description: string;
          id?: string;
          location: string;
          logo_url?: string | null;
          name: string;
          size_label: string;
          slug: string;
          summary: string;
          updated_at?: string;
          website_url: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          location?: string;
          logo_url?: string | null;
          name?: string;
          size_label?: string;
          slug?: string;
          summary?: string;
          updated_at?: string;
          website_url?: string;
        };
        Relationships: [];
      };
      employer_briefs: {
        Row: {
          company_id: string;
          created_at: string;
          decision_criteria: NonNullable<Json>;
          id: string;
          source_text: string;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          company_id: string;
          created_at?: string;
          decision_criteria?: NonNullable<Json>;
          id?: string;
          source_text: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          decision_criteria?: NonNullable<Json>;
          id?: string;
          source_text?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "employer_briefs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      experiment_assignments: {
        Row: {
          assigned_at: string;
          id: string;
          release_key: Database["public"]["Enums"]["case_release_key"];
          subject_key: string;
          surface: Database["public"]["Enums"]["experiment_surface"];
          variant: string;
        };
        ComputedFields: never;
        Insert: {
          assigned_at?: string;
          id?: string;
          release_key: Database["public"]["Enums"]["case_release_key"];
          subject_key: string;
          surface: Database["public"]["Enums"]["experiment_surface"];
          variant: string;
        };
        Update: {
          assigned_at?: string;
          id?: string;
          release_key?: Database["public"]["Enums"]["case_release_key"];
          subject_key?: string;
          surface?: Database["public"]["Enums"]["experiment_surface"];
          variant?: string;
        };
        Relationships: [
          {
            foreignKeyName: "experiment_assignments_release_key_fkey";
            columns: ["release_key"];
            isOneToOne: false;
            referencedRelation: "case_releases";
            referencedColumns: ["key"];
          },
        ];
      };
      experiment_exposures: {
        Row: {
          application_id: string | null;
          assignment_id: string;
          exposed_at: string;
          id: string;
        };
        ComputedFields: never;
        Insert: {
          application_id?: string | null;
          assignment_id: string;
          exposed_at?: string;
          id?: string;
        };
        Update: {
          application_id?: string | null;
          assignment_id?: string;
          exposed_at?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "experiment_exposures_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "application_outcome_analysis";
            referencedColumns: ["application_id"];
          },
          {
            foreignKeyName: "experiment_exposures_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "experiment_exposures_assignment_id_fkey";
            columns: ["assignment_id"];
            isOneToOne: false;
            referencedRelation: "experiment_assignments";
            referencedColumns: ["id"];
          },
        ];
      };
      fit_scores: {
        Row: {
          application_id: string;
          calculated_at: string;
          components: NonNullable<Json>;
          id: string;
          input_answer_version: number;
          input_job_text_version: number | null;
          score: number;
          version: string;
        };
        ComputedFields: never;
        Insert: {
          application_id: string;
          calculated_at?: string;
          components: NonNullable<Json>;
          id?: string;
          input_answer_version: number;
          input_job_text_version?: number | null;
          score: number;
          version: string;
        };
        Update: {
          application_id?: string;
          calculated_at?: string;
          components?: NonNullable<Json>;
          id?: string;
          input_answer_version?: number;
          input_job_text_version?: number | null;
          score?: number;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fit_scores_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "application_outcome_analysis";
            referencedColumns: ["application_id"];
          },
          {
            foreignKeyName: "fit_scores_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
        ];
      };
      interview_outcomes: {
        Row: {
          application_id: string;
          created_at: string;
          decision: Database["public"]["Enums"]["first_conversation_decision"];
          first_conversation_at: string;
          id: string;
          later_hired: boolean | null;
          notes: string | null;
          recorded_by: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          application_id: string;
          created_at?: string;
          decision: Database["public"]["Enums"]["first_conversation_decision"];
          first_conversation_at: string;
          id?: string;
          later_hired?: boolean | null;
          notes?: string | null;
          recorded_by: string;
          updated_at?: string;
        };
        Update: {
          application_id?: string;
          created_at?: string;
          decision?: Database["public"]["Enums"]["first_conversation_decision"];
          first_conversation_at?: string;
          id?: string;
          later_hired?: boolean | null;
          notes?: string | null;
          recorded_by?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "interview_outcomes_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: true;
            referencedRelation: "application_outcome_analysis";
            referencedColumns: ["application_id"];
          },
          {
            foreignKeyName: "interview_outcomes_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: true;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interview_outcomes_recorded_by_fkey";
            columns: ["recorded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      job_text_versions: {
        Row: {
          approved_at: string | null;
          created_at: string;
          description: string;
          generation_id: string | null;
          id: string;
          job_id: string;
          source: Database["public"]["Enums"]["text_version_source"];
          summary: string;
          title: string;
          version: number;
          visibility: Database["public"]["Enums"]["text_visibility"];
        };
        ComputedFields: never;
        Insert: {
          approved_at?: string | null;
          created_at?: string;
          description: string;
          generation_id?: string | null;
          id?: string;
          job_id: string;
          source: Database["public"]["Enums"]["text_version_source"];
          summary: string;
          title: string;
          version: number;
          visibility?: Database["public"]["Enums"]["text_visibility"];
        };
        Update: {
          approved_at?: string | null;
          created_at?: string;
          description?: string;
          generation_id?: string | null;
          id?: string;
          job_id?: string;
          source?: Database["public"]["Enums"]["text_version_source"];
          summary?: string;
          title?: string;
          version?: number;
          visibility?: Database["public"]["Enums"]["text_visibility"];
        };
        Relationships: [
          {
            foreignKeyName: "job_text_versions_generation_id_fkey";
            columns: ["generation_id"];
            isOneToOne: false;
            referencedRelation: "ai_generations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "job_text_versions_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      jobs: {
        Row: {
          category: Database["public"]["Enums"]["job_category"];
          company_id: string;
          contract_type: Database["public"]["Enums"]["contract_type"];
          created_at: string;
          description: string;
          employer_brief_id: string | null;
          expiry_at: string | null;
          function: Database["public"]["Enums"]["job_function"];
          id: string;
          locations: string[];
          map_latitude: number | null;
          map_longitude: number | null;
          publication_status: Database["public"]["Enums"]["publication_status"];
          published_at: string | null;
          remote_status: Database["public"]["Enums"]["remote_status"];
          salary_currency: string | null;
          salary_kind: Database["public"]["Enums"]["salary_kind"] | null;
          salary_max: number | null;
          salary_min: number | null;
          salary_period: Database["public"]["Enums"]["salary_period"] | null;
          seniority: Database["public"]["Enums"]["seniority_level"];
          slug: string;
          summary: string;
          title: string;
          updated_at: string;
          verification_status: Database["public"]["Enums"]["verification_status"];
        };
        ComputedFields: never;
        Insert: {
          category: Database["public"]["Enums"]["job_category"];
          company_id: string;
          contract_type: Database["public"]["Enums"]["contract_type"];
          created_at?: string;
          description: string;
          employer_brief_id?: string | null;
          expiry_at?: string | null;
          function: Database["public"]["Enums"]["job_function"];
          id?: string;
          locations: string[];
          map_latitude?: number | null;
          map_longitude?: number | null;
          publication_status?: Database["public"]["Enums"]["publication_status"];
          published_at?: string | null;
          remote_status: Database["public"]["Enums"]["remote_status"];
          salary_currency?: string | null;
          salary_kind?: Database["public"]["Enums"]["salary_kind"] | null;
          salary_max?: number | null;
          salary_min?: number | null;
          salary_period?: Database["public"]["Enums"]["salary_period"] | null;
          seniority: Database["public"]["Enums"]["seniority_level"];
          slug: string;
          summary: string;
          title: string;
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["verification_status"];
        };
        Update: {
          category?: Database["public"]["Enums"]["job_category"];
          company_id?: string;
          contract_type?: Database["public"]["Enums"]["contract_type"];
          created_at?: string;
          description?: string;
          employer_brief_id?: string | null;
          expiry_at?: string | null;
          function?: Database["public"]["Enums"]["job_function"];
          id?: string;
          locations?: string[];
          map_latitude?: number | null;
          map_longitude?: number | null;
          publication_status?: Database["public"]["Enums"]["publication_status"];
          published_at?: string | null;
          remote_status?: Database["public"]["Enums"]["remote_status"];
          salary_currency?: string | null;
          salary_kind?: Database["public"]["Enums"]["salary_kind"] | null;
          salary_max?: number | null;
          salary_min?: number | null;
          salary_period?: Database["public"]["Enums"]["salary_period"] | null;
          seniority?: Database["public"]["Enums"]["seniority_level"];
          slug?: string;
          summary?: string;
          title?: string;
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["verification_status"];
        };
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jobs_employer_brief_id_fkey";
            columns: ["employer_brief_id"];
            isOneToOne: false;
            referencedRelation: "employer_briefs";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_memberships: {
        Row: {
          created_at: string;
          organization_id: string;
          role: Database["public"]["Enums"]["membership_role"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          organization_id: string;
          role: Database["public"]["Enums"]["membership_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          organization_id?: string;
          role?: Database["public"]["Enums"]["membership_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          name: string;
          slug: string;
        };
        ComputedFields: never;
        Insert: {
          company_id: string;
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organizations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: true;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          first_name: string | null;
          id: string;
          last_name: string | null;
          role: Database["public"]["Enums"]["profile_role"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          display_name?: string | null;
          first_name?: string | null;
          id: string;
          last_name?: string | null;
          role?: Database["public"]["Enums"]["profile_role"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          role?: Database["public"]["Enums"]["profile_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
      saved_jobs: {
        Row: {
          candidate_id: string;
          job_id: string;
          saved_at: string;
        };
        ComputedFields: never;
        Insert: {
          candidate_id: string;
          job_id: string;
          saved_at?: string;
        };
        Update: {
          candidate_id?: string;
          job_id?: string;
          saved_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_jobs_candidate_id_fkey";
            columns: ["candidate_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_jobs_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      application_outcome_analysis: {
        Row: {
          application_id: string | null;
          first_conversation_at: string | null;
          first_conversation_decision:
            Database["public"]["Enums"]["first_conversation_decision"] | null;
          job_id: string | null;
          later_hired: boolean | null;
          organization_id: string | null;
          status: Database["public"]["Enums"]["application_status"] | null;
          submitted_at: string | null;
          text_fit_score: number | null;
          variant: Database["public"]["Enums"]["application_variant"] | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      approve_job_text_version: {
        Args: {
          approved_description: string;
          approved_summary: string;
          approved_title: string;
          target_generation_id: string;
          target_job_id: string;
        };
        Returns: number;
      };
      assign_experiment: {
        Args: { target_surface: Database["public"]["Enums"]["experiment_surface"] };
        Returns: {
          assigned_at: string;
          id: string;
          release_key: Database["public"]["Enums"]["case_release_key"];
          subject_key: string;
          surface: Database["public"]["Enums"]["experiment_surface"];
          variant: string;
        };
        SetofOptions: {
          from: "*";
          to: "experiment_assignments";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      can_use_ai: {
        Args: { target_surface: Database["public"]["Enums"]["experiment_surface"] };
        Returns: boolean;
      };
      create_employer_job: {
        Args: {
          job_category: Database["public"]["Enums"]["job_category"];
          job_contract_type: Database["public"]["Enums"]["contract_type"];
          job_description: string;
          job_expiry_at?: string;
          job_function: Database["public"]["Enums"]["job_function"];
          job_locations: string[];
          job_map_latitude?: number;
          job_map_longitude?: number;
          job_remote_status: Database["public"]["Enums"]["remote_status"];
          job_salary_currency?: string;
          job_salary_kind?: Database["public"]["Enums"]["salary_kind"];
          job_salary_max?: number;
          job_salary_min?: number;
          job_salary_period?: Database["public"]["Enums"]["salary_period"];
          job_seniority: Database["public"]["Enums"]["seniority_level"];
          job_slug: string;
          job_summary: string;
          job_title: string;
        };
        Returns: string;
      };
      create_employer_job_with_brief: {
        Args: {
          job_category: Database["public"]["Enums"]["job_category"];
          job_contract_type: Database["public"]["Enums"]["contract_type"];
          job_decision_criteria: string[];
          job_description: string;
          job_expiry_at: string;
          job_function: Database["public"]["Enums"]["job_function"];
          job_locations: string[];
          job_map_latitude: number;
          job_map_longitude: number;
          job_remote_status: Database["public"]["Enums"]["remote_status"];
          job_salary_currency: string;
          job_salary_kind: Database["public"]["Enums"]["salary_kind"];
          job_salary_max: number;
          job_salary_min: number;
          job_salary_period: Database["public"]["Enums"]["salary_period"];
          job_seniority: Database["public"]["Enums"]["seniority_level"];
          job_slug: string;
          job_source_text: string;
          job_summary: string;
          job_title: string;
        };
        Returns: string;
      };
      create_employer_organization: {
        Args: {
          organization_description: string;
          organization_location: string;
          organization_name: string;
          organization_size: string;
          organization_slug: string;
          organization_summary: string;
          organization_website: string;
        };
        Returns: string;
      };
      current_case_release: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["case_release_key"];
      };
      current_profile_role: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["profile_role"];
      };
      is_operator: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_organization_member: { Args: { target_organization_id: string }; Returns: boolean };
      move_candidate_item: {
        Args: { direction: string; item_kind: string; target_id: string };
        Returns: undefined;
      };
      record_application_stage: {
        Args: {
          event_note?: string;
          next_stage: Database["public"]["Enums"]["application_stage"];
          target_application_id: string;
        };
        Returns: undefined;
      };
      record_experiment_exposure: {
        Args: { target_application_id?: string; target_assignment_id: string };
        Returns: string;
      };
      release_case: {
        Args: { target_release: Database["public"]["Enums"]["case_release_key"] };
        Returns: undefined;
      };
      save_employer_job_brief: {
        Args: {
          brief_decision_criteria: string[];
          brief_source_text: string;
          target_job_id: string;
        };
        Returns: string;
      };
      submit_application_with_evidence: {
        Args: {
          final_answer: string;
          fit_components: Json;
          fit_score: number;
          fit_version: string;
          source_evidence_ids: string[];
          source_snapshot: Json;
          target_generation_id: string;
          target_job_id: string;
          target_variant: Database["public"]["Enums"]["application_variant"];
        };
        Returns: string;
      };
      withdraw_application: { Args: { target_application_id: string }; Returns: undefined };
    };
    Enums: {
      ai_generation_purpose: "job_draft" | "candidate_answer";
      ai_generation_status: "succeeded" | "failed";
      application_stage:
        | "submitted"
        | "reviewed"
        | "interview_invited"
        | "first_conversation_held"
        | "continued"
        | "rejected"
        | "withdrawn"
        | "hired";
      application_status:
        "submitted" | "in_review" | "interview" | "continued" | "rejected" | "withdrawn" | "hired";
      application_variant: "long_form" | "one_click";
      case_evidence_kind:
        "interview" | "support_ticket" | "sales_note" | "public_review" | "metric_snapshot";
      case_release_key:
        "baseline" | "post_one_click" | "discovery" | "post_ai" | "pilot" | "demo_day";
      contract_type: "employment" | "b2b" | "mandate";
      experiment_surface: "application_flow" | "employer_job_copy" | "candidate_answer";
      first_conversation_decision: "continue" | "reject" | "pending";
      job_category: "build" | "apply" | "lead";
      job_function: "product" | "engineering" | "data" | "design" | "marketing" | "operations";
      membership_role: "recruiter" | "hiring_manager";
      profile_role: "candidate" | "employer" | "operator";
      publication_status: "draft" | "review" | "published" | "hidden" | "expired" | "archived";
      remote_status: "onsite" | "hybrid" | "remote";
      salary_kind: "gross" | "net";
      salary_period: "month" | "year";
      seniority_level: "junior" | "mid" | "senior" | "lead";
      text_version_source: "human" | "ai_generated" | "human_edited";
      text_visibility: "private" | "public";
      verification_status: "unverified" | "editorial" | "employer_verified";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      ai_generation_purpose: ["job_draft", "candidate_answer"],
      ai_generation_status: ["succeeded", "failed"],
      application_stage: [
        "submitted",
        "reviewed",
        "interview_invited",
        "first_conversation_held",
        "continued",
        "rejected",
        "withdrawn",
        "hired",
      ],
      application_status: [
        "submitted",
        "in_review",
        "interview",
        "continued",
        "rejected",
        "withdrawn",
        "hired",
      ],
      application_variant: ["long_form", "one_click"],
      case_evidence_kind: [
        "interview",
        "support_ticket",
        "sales_note",
        "public_review",
        "metric_snapshot",
      ],
      case_release_key: ["baseline", "post_one_click", "discovery", "post_ai", "pilot", "demo_day"],
      contract_type: ["employment", "b2b", "mandate"],
      experiment_surface: ["application_flow", "employer_job_copy", "candidate_answer"],
      first_conversation_decision: ["continue", "reject", "pending"],
      job_category: ["build", "apply", "lead"],
      job_function: ["product", "engineering", "data", "design", "marketing", "operations"],
      membership_role: ["recruiter", "hiring_manager"],
      profile_role: ["candidate", "employer", "operator"],
      publication_status: ["draft", "review", "published", "hidden", "expired", "archived"],
      remote_status: ["onsite", "hybrid", "remote"],
      salary_kind: ["gross", "net"],
      salary_period: ["month", "year"],
      seniority_level: ["junior", "mid", "senior", "lead"],
      text_version_source: ["human", "ai_generated", "human_edited"],
      text_visibility: ["private", "public"],
      verification_status: ["unverified", "editorial", "employer_verified"],
    },
  },
} as const;
