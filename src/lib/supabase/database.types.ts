// Mirrors supabase/migrations. Regenerate with `pnpm db:types` once the local
// stack is running and replace this file with the generated output.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string; created_at: string; updated_at: string };
        Insert: { id: string; display_name: string; created_at?: string; updated_at?: string };
        Update: { display_name?: string };
        Relationships: [];
      };
      platform_admins: {
        Row: { user_id: string; granted_by: string; note: string | null; granted_at: string };
        Insert: { user_id: string; granted_by: string; note?: string | null; granted_at?: string };
        Update: { note?: string | null };
        Relationships: [];
      };
      creator_profiles: {
        Row: { user_id: string; created_at: string; updated_at: string };
        Insert: { user_id: string };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "creator_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      creator_social_links: {
        Row: {
          id: string;
          creator_id: string;
          platform: Database["public"]["Enums"]["social_platform"];
          url: string;
          created_at: string;
        };
        Insert: {
          creator_id: string;
          platform: Database["public"]["Enums"]["social_platform"];
          url: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "creator_social_links_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "creator_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          max_apps: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: { name?: string };
        Relationships: [];
      };
      organization_members: {
        Row: {
          organization_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["organization_role"];
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      apps: {
        Row: {
          id: string;
          organization_id: string;
          slug: string;
          name: string;
          tagline: string;
          description: string;
          categories: Database["public"]["Enums"]["app_category"][];
          platforms: Database["public"]["Enums"]["app_platform"][];
          languages: string[];
          website_url: string | null;
          ios_store_url: string | null;
          android_store_url: string | null;
          logo_url: string | null;
          cover_image_url: string | null;
          screenshots: Json;
          video_url: string | null;
          terms_text: string;
          attribution_window_days: number;
          status: Database["public"]["Enums"]["app_status"];
          publish_environment: "demo" | "live";
          submitted_at: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          rejection_reason: string | null;
          published_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "apps_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      app_plans: {
        Row: {
          id: string;
          app_id: string;
          name: string;
          external_plan_key: string;
          billing_interval: Database["public"]["Enums"]["billing_interval"];
          price_minor: number;
          currency: string;
          commission_bps: number;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "app_plans_app_id_fkey";
            columns: ["app_id"];
            isOneToOne: false;
            referencedRelation: "apps";
            referencedColumns: ["id"];
          },
        ];
      };
      app_terms_versions: {
        Row: {
          id: string;
          app_id: string;
          version_number: number;
          terms_text: string;
          attribution_window_days: number;
          min_commission_bps: number;
          max_commission_bps: number;
          created_by: string | null;
          published_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "app_terms_versions_app_id_fkey";
            columns: ["app_id"];
            isOneToOne: false;
            referencedRelation: "apps";
            referencedColumns: ["id"];
          },
        ];
      };
      app_terms_plan_rates: {
        Row: {
          id: string;
          terms_version_id: string;
          plan_id: string | null;
          plan_name: string;
          external_plan_key: string;
          billing_interval: Database["public"]["Enums"]["billing_interval"];
          price_minor: number;
          currency: string;
          commission_bps: number;
          sort_order: number;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "app_terms_plan_rates_terms_version_id_fkey";
            columns: ["terms_version_id"];
            isOneToOne: false;
            referencedRelation: "app_terms_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      app_releases: {
        Row: {
          id: string;
          app_id: string;
          organization_id: string;
          terms_version_id: string;
          release_number: number;
          is_current_published: boolean;
          slug: string;
          name: string;
          organization_name: string;
          tagline: string;
          description: string;
          categories: Database["public"]["Enums"]["app_category"][];
          platforms: Database["public"]["Enums"]["app_platform"][];
          languages: string[];
          website_url: string | null;
          ios_store_url: string | null;
          android_store_url: string | null;
          logo_url: string | null;
          cover_image_url: string | null;
          screenshots: Json;
          video_url: string | null;
          min_commission_bps: number;
          max_commission_bps: number;
          published_by: string | null;
          published_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      creator_program_memberships: {
        Row: {
          id: string;
          app_id: string;
          creator_id: string;
          accepted_terms_version_id: string;
          referral_code: string;
          joined_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "creator_program_memberships_app_id_fkey";
            columns: ["app_id"];
            isOneToOne: false;
            referencedRelation: "apps";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "creator_program_memberships_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "creator_profiles";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "creator_program_memberships_accepted_terms_version_id_fkey";
            columns: ["accepted_terms_version_id"];
            isOneToOne: false;
            referencedRelation: "app_terms_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      creator_referral_links: {
        Row: {
          id: string;
          membership_id: string;
          app_id: string;
          creator_id: string;
          label: string;
          channel: Database["public"]["Enums"]["social_platform"];
          destination_kind: Database["public"]["Enums"]["referral_destination_kind"];
          target_url: string;
          token: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "creator_referral_links_membership_id_fkey";
            columns: ["membership_id"];
            isOneToOne: false;
            referencedRelation: "creator_program_memberships";
            referencedColumns: ["id"];
          },
        ];
      };
      app_review_events: {
        Row: {
          id: string;
          app_id: string;
          organization_id: string;
          event_type: "submitted" | "approved" | "rejected";
          environment: "demo" | "live";
          note: string | null;
          actor_id: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      app_media_assets: {
        Row: {
          id: string;
          app_id: string;
          organization_id: string;
          asset_kind: "logo" | "cover" | "screenshot" | "video";
          storage_path: string;
          alt_text: string;
          mime_type: string;
          byte_size: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      catalog_listings: {
        Row: {
          app_id: string;
          slug: string;
          name: string;
          organization_name: string;
          tagline: string;
          description: string;
          categories: Database["public"]["Enums"]["app_category"][];
          platforms: Database["public"]["Enums"]["app_platform"][];
          languages: string[];
          website_url: string | null;
          ios_store_url: string | null;
          android_store_url: string | null;
          logo_url: string | null;
          cover_image_url: string | null;
          screenshots: Json;
          video_url: string | null;
          min_commission_bps: number;
          max_commission_bps: number;
          terms_version_id: string;
          terms_version_number: number;
          terms_text: string;
          attribution_window_days: number;
          published_at: string;
        };
        Relationships: [];
      };
      catalog_plan_rates: {
        Row: {
          id: string;
          app_id: string;
          app_slug: string;
          terms_version_id: string;
          plan_name: string;
          billing_interval: Database["public"]["Enums"]["billing_interval"];
          price_minor: number;
          currency: string;
          commission_bps: number;
          sort_order: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      create_organization: { Args: { p_name: string }; Returns: string };
      create_app: { Args: { p_organization_id: string; p_name: string }; Returns: string };
      creator_is_ready_to_promote: { Args: Record<PropertyKey, never>; Returns: boolean };
      admin_publish_app: { Args: { p_app_id: string }; Returns: string };
      list_catalog_apps: {
        Args: {
          p_search?: string | null;
          p_category?: Database["public"]["Enums"]["app_category"] | null;
          p_platform?: Database["public"]["Enums"]["app_platform"] | null;
          p_language?: string | null;
          p_min_commission_bps?: number | null;
          p_page?: number;
          p_page_size?: number;
        };
        Returns: {
          app_id: string;
          slug: string;
          name: string;
          organization_name: string;
          tagline: string;
          categories: Database["public"]["Enums"]["app_category"][];
          platforms: Database["public"]["Enums"]["app_platform"][];
          languages: string[];
          logo_url: string | null;
          cover_image_url: string | null;
          min_commission_bps: number;
          max_commission_bps: number;
          published_at: string;
          total_count: number;
        }[];
      };
      join_program: {
        Args: {
          p_app_id: string;
          p_accepted_terms_version_id: string;
          p_accepted_terms?: boolean;
        };
        Returns: string;
      };
      create_referral_link: {
        Args: {
          p_membership_id: string;
          p_label: string;
          p_channel: Database["public"]["Enums"]["social_platform"];
          p_destination_kind?: Database["public"]["Enums"]["referral_destination_kind"] | null;
        };
        Returns: string;
      };
      suggest_similar_apps_for_creator: {
        Args: {
          p_limit?: number;
        };
        Returns: {
          app_id: string;
          slug: string;
          name: string;
          organization_name: string;
          tagline: string;
          categories: Database["public"]["Enums"]["app_category"][];
          platforms: Database["public"]["Enums"]["app_platform"][];
          languages: string[];
          logo_url: string | null;
          cover_image_url: string | null;
          min_commission_bps: number;
          max_commission_bps: number;
          shared_categories: Database["public"]["Enums"]["app_category"][];
        }[];
      };
      save_app_draft: {
        Args: {
          p_app_id: string;
          p_name: string;
          p_slug?: string | null;
          p_tagline?: string;
          p_description?: string;
          p_categories?: Database["public"]["Enums"]["app_category"][];
          p_platforms?: Database["public"]["Enums"]["app_platform"][];
          p_languages?: string[];
          p_website_url?: string | null;
          p_ios_store_url?: string | null;
          p_android_store_url?: string | null;
          p_logo_url?: string | null;
          p_cover_image_url?: string | null;
          p_screenshots?: Json;
          p_video_url?: string | null;
          p_terms_text?: string;
          p_attribution_window_days?: number;
        };
        Returns: string;
      };
      upsert_app_plan: {
        Args: {
          p_app_id: string;
          p_name: string;
          p_external_plan_key: string;
          p_billing_interval: Database["public"]["Enums"]["billing_interval"];
          p_price_minor: number;
          p_currency: string;
          p_commission_bps: number;
          p_sort_order?: number;
          p_plan_id?: string | null;
        };
        Returns: string;
      };
      delete_app_plan: {
        Args: {
          p_plan_id: string;
        };
        Returns: undefined;
      };
      submit_app_for_review: {
        Args: {
          p_app_id: string;
        };
        Returns: string;
      };
      admin_review_app: {
        Args: {
          p_app_id: string;
          p_decision: string;
          p_reason?: string | null;
          p_environment?: string;
        };
        Returns: string;
      };
    };
    Enums: {
      app_status: "draft" | "submitted" | "published" | "rejected";
      referral_destination_kind: "website" | "ios_store" | "android_store";
      app_category:
        | "productivity"
        | "ai"
        | "fitness"
        | "education"
        | "creative"
        | "finance"
        | "developer"
        | "lifestyle";
      app_platform: "web" | "saas" | "ios" | "android";
      billing_interval: "week" | "month" | "year";
      organization_role: "owner" | "member";
      social_platform:
        | "instagram"
        | "tiktok"
        | "youtube"
        | "x"
        | "facebook"
        | "linkedin"
        | "twitch"
        | "snapchat"
        | "pinterest"
        | "threads"
        | "other";
    };
    CompositeTypes: { [_ in never]: never };
  };
};
