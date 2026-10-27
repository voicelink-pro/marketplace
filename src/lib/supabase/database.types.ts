
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {

  "public": {
          Tables: {
            "app_media_assets": {
                  Row: {
                    "alt_text": string,"app_id": string,"asset_kind": string,"byte_size": number,"created_at": string,"created_by": string | null,"id": string,"mime_type": string,"organization_id": string,"storage_path": string
                  }
                  ComputedFields: never
                  Insert: {
                    "alt_text"?: string,"app_id": string,"asset_kind": string,"byte_size"?: number,"created_at"?: string,"created_by"?: string | null,"id"?: string,"mime_type"?: string,"organization_id": string,"storage_path": string
                  }
                  Update: {
                    "alt_text"?: string,"app_id"?: string,"asset_kind"?: string,"byte_size"?: number,"created_at"?: string,"created_by"?: string | null,"id"?: string,"mime_type"?: string,"organization_id"?: string,"storage_path"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "app_media_assets_app_id_fkey"
      columns: ["app_id"]
isOneToOne: false
      referencedRelation: "apps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "app_media_assets_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "app_media_assets_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"app_plans": {
                  Row: {
                    "app_id": string,"billing_interval": Database["public"]['Enums']["billing_interval"],"commission_bps": number,"created_at": string,"currency": string,"external_plan_key": string,"id": string,"is_active": boolean,"name": string,"price_minor": number,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_id": string,"billing_interval": Database["public"]['Enums']["billing_interval"],"commission_bps": number,"created_at"?: string,"currency": string,"external_plan_key": string,"id"?: string,"is_active"?: boolean,"name": string,"price_minor": number,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "app_id"?: string,"billing_interval"?: Database["public"]['Enums']["billing_interval"],"commission_bps"?: number,"created_at"?: string,"currency"?: string,"external_plan_key"?: string,"id"?: string,"is_active"?: boolean,"name"?: string,"price_minor"?: number,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "app_plans_app_id_fkey"
      columns: ["app_id"]
isOneToOne: false
      referencedRelation: "apps"
      referencedColumns: ["id"]
    }
                  ]
                },"app_releases": {
                  Row: {
                    "android_store_url": string | null,"app_id": string,"categories": (Database["public"]['Enums']["app_category"])[],"cover_image_url": string | null,"description": string,"id": string,"ios_store_url": string | null,"is_current_published": boolean,"languages": (string)[],"logo_url": string | null,"max_commission_bps": number,"min_commission_bps": number,"name": string,"organization_id": string,"organization_name": string,"platforms": (Database["public"]['Enums']["app_platform"])[],"published_at": string,"published_by": string | null,"release_number": number,"screenshots": NonNullable<Json>,"slug": string,"tagline": string,"terms_version_id": string,"video_url": string | null,"website_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "android_store_url"?: string | null,"app_id": string,"categories": (Database["public"]['Enums']["app_category"])[],"cover_image_url"?: string | null,"description": string,"id"?: string,"ios_store_url"?: string | null,"is_current_published"?: boolean,"languages": (string)[],"logo_url"?: string | null,"max_commission_bps": number,"min_commission_bps": number,"name": string,"organization_id": string,"organization_name": string,"platforms": (Database["public"]['Enums']["app_platform"])[],"published_at"?: string,"published_by"?: string | null,"release_number": number,"screenshots"?: NonNullable<Json>,"slug": string,"tagline": string,"terms_version_id": string,"video_url"?: string | null,"website_url"?: string | null
                  }
                  Update: {
                    "android_store_url"?: string | null,"app_id"?: string,"categories"?: (Database["public"]['Enums']["app_category"])[],"cover_image_url"?: string | null,"description"?: string,"id"?: string,"ios_store_url"?: string | null,"is_current_published"?: boolean,"languages"?: (string)[],"logo_url"?: string | null,"max_commission_bps"?: number,"min_commission_bps"?: number,"name"?: string,"organization_id"?: string,"organization_name"?: string,"platforms"?: (Database["public"]['Enums']["app_platform"])[],"published_at"?: string,"published_by"?: string | null,"release_number"?: number,"screenshots"?: NonNullable<Json>,"slug"?: string,"tagline"?: string,"terms_version_id"?: string,"video_url"?: string | null,"website_url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "app_releases_app_id_fkey"
      columns: ["app_id"]
isOneToOne: false
      referencedRelation: "apps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "app_releases_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "app_releases_published_by_fkey"
      columns: ["published_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "app_releases_terms_version_id_fkey"
      columns: ["terms_version_id"]
isOneToOne: false
      referencedRelation: "app_terms_versions"
      referencedColumns: ["id"]
    }
                  ]
                },"app_review_events": {
                  Row: {
                    "actor_id": string | null,"app_id": string,"created_at": string,"environment": string,"event_type": string,"id": string,"note": string | null,"organization_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"app_id": string,"created_at"?: string,"environment"?: string,"event_type": string,"id"?: string,"note"?: string | null,"organization_id": string
                  }
                  Update: {
                    "actor_id"?: string | null,"app_id"?: string,"created_at"?: string,"environment"?: string,"event_type"?: string,"id"?: string,"note"?: string | null,"organization_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "app_review_events_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "app_review_events_app_id_fkey"
      columns: ["app_id"]
isOneToOne: false
      referencedRelation: "apps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "app_review_events_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"app_terms_plan_rates": {
                  Row: {
                    "billing_interval": Database["public"]['Enums']["billing_interval"],"commission_bps": number,"currency": string,"external_plan_key": string,"id": string,"plan_id": string | null,"plan_name": string,"price_minor": number,"sort_order": number,"terms_version_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "billing_interval": Database["public"]['Enums']["billing_interval"],"commission_bps": number,"currency": string,"external_plan_key": string,"id"?: string,"plan_id"?: string | null,"plan_name": string,"price_minor": number,"sort_order"?: number,"terms_version_id": string
                  }
                  Update: {
                    "billing_interval"?: Database["public"]['Enums']["billing_interval"],"commission_bps"?: number,"currency"?: string,"external_plan_key"?: string,"id"?: string,"plan_id"?: string | null,"plan_name"?: string,"price_minor"?: number,"sort_order"?: number,"terms_version_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "app_terms_plan_rates_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "app_plans"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "app_terms_plan_rates_terms_version_id_fkey"
      columns: ["terms_version_id"]
isOneToOne: false
      referencedRelation: "app_terms_versions"
      referencedColumns: ["id"]
    }
                  ]
                },"app_terms_versions": {
                  Row: {
                    "app_id": string,"attribution_window_days": number,"created_by": string | null,"id": string,"max_commission_bps": number,"min_commission_bps": number,"published_at": string,"terms_text": string,"version_number": number
                  }
                  ComputedFields: never
                  Insert: {
                    "app_id": string,"attribution_window_days"?: number,"created_by"?: string | null,"id"?: string,"max_commission_bps": number,"min_commission_bps": number,"published_at"?: string,"terms_text": string,"version_number": number
                  }
                  Update: {
                    "app_id"?: string,"attribution_window_days"?: number,"created_by"?: string | null,"id"?: string,"max_commission_bps"?: number,"min_commission_bps"?: number,"published_at"?: string,"terms_text"?: string,"version_number"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "app_terms_versions_app_id_fkey"
      columns: ["app_id"]
isOneToOne: false
      referencedRelation: "apps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "app_terms_versions_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"apps": {
                  Row: {
                    "android_store_url": string | null,"attribution_window_days": number,"categories": (Database["public"]['Enums']["app_category"])[],"cover_image_url": string | null,"created_at": string,"created_by": string | null,"description": string,"id": string,"ios_store_url": string | null,"languages": (string)[],"logo_url": string | null,"name": string,"organization_id": string,"platforms": (Database["public"]['Enums']["app_platform"])[],"publish_environment": string,"published_at": string | null,"rejection_reason": string | null,"review_revision": number,"reviewed_at": string | null,"reviewed_by": string | null,"screenshots": NonNullable<Json>,"slug": string,"status": Database["public"]['Enums']["app_status"],"submitted_at": string | null,"tagline": string,"terms_text": string,"updated_at": string,"video_url": string | null,"website_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "android_store_url"?: string | null,"attribution_window_days"?: number,"categories"?: (Database["public"]['Enums']["app_category"])[],"cover_image_url"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string,"id"?: string,"ios_store_url"?: string | null,"languages"?: (string)[],"logo_url"?: string | null,"name": string,"organization_id": string,"platforms"?: (Database["public"]['Enums']["app_platform"])[],"publish_environment"?: string,"published_at"?: string | null,"rejection_reason"?: string | null,"review_revision"?: number,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"screenshots"?: NonNullable<Json>,"slug": string,"status"?: Database["public"]['Enums']["app_status"],"submitted_at"?: string | null,"tagline"?: string,"terms_text"?: string,"updated_at"?: string,"video_url"?: string | null,"website_url"?: string | null
                  }
                  Update: {
                    "android_store_url"?: string | null,"attribution_window_days"?: number,"categories"?: (Database["public"]['Enums']["app_category"])[],"cover_image_url"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string,"id"?: string,"ios_store_url"?: string | null,"languages"?: (string)[],"logo_url"?: string | null,"name"?: string,"organization_id"?: string,"platforms"?: (Database["public"]['Enums']["app_platform"])[],"publish_environment"?: string,"published_at"?: string | null,"rejection_reason"?: string | null,"review_revision"?: number,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"screenshots"?: NonNullable<Json>,"slug"?: string,"status"?: Database["public"]['Enums']["app_status"],"submitted_at"?: string | null,"tagline"?: string,"terms_text"?: string,"updated_at"?: string,"video_url"?: string | null,"website_url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "apps_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "apps_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "apps_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"commission_earnings": {
                  Row: {
                    "app_id": string,"billing_interval": string,"commission_basis_minor": number,"commission_bps": number,"created_at": string,"creator_id": string,"creator_minor": number,"currency": string,"gross_minor": number,"id": string,"occurred_at": string,"plan_name": string,"platform_fee_bps": number,"platform_fee_minor": number,"policy_id": string,"referral_id": string,"sale_minor": number,"terms_version_id": string,"transaction_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_id": string,"billing_interval": string,"commission_basis_minor": number,"commission_bps": number,"created_at"?: string,"creator_id": string,"creator_minor": number,"currency": string,"gross_minor": number,"id"?: string,"occurred_at": string,"plan_name": string,"platform_fee_bps": number,"platform_fee_minor": number,"policy_id": string,"referral_id": string,"sale_minor": number,"terms_version_id": string,"transaction_id": string
                  }
                  Update: {
                    "app_id"?: string,"billing_interval"?: string,"commission_basis_minor"?: number,"commission_bps"?: number,"created_at"?: string,"creator_id"?: string,"creator_minor"?: number,"currency"?: string,"gross_minor"?: number,"id"?: string,"occurred_at"?: string,"plan_name"?: string,"platform_fee_bps"?: number,"platform_fee_minor"?: number,"policy_id"?: string,"referral_id"?: string,"sale_minor"?: number,"terms_version_id"?: string,"transaction_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "commission_earnings_app_id_fkey"
      columns: ["app_id"]
isOneToOne: false
      referencedRelation: "apps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "commission_earnings_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "creator_profiles"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "commission_earnings_referral_id_fkey"
      columns: ["referral_id"]
isOneToOne: false
      referencedRelation: "customer_referrals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "commission_earnings_terms_version_id_fkey"
      columns: ["terms_version_id"]
isOneToOne: false
      referencedRelation: "app_terms_versions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "commission_earnings_transaction_id_fkey"
      columns: ["transaction_id"]
isOneToOne: true
      referencedRelation: "payment_transactions"
      referencedColumns: ["id"]
    }
                  ]
                },"commission_journals": {
                  Row: {
                    "app_id": string,"basis_delta": number,"created_at": string,"creator_delta": number,"creator_id": string | null,"currency": string,"effective_month": string,"entries": NonNullable<Json>,"fee_delta": number,"funding_credit": number,"funding_used": number,"gross_delta": number,"id": string,"idempotency_key": string,"kind": string,"sale_delta": number,"source_at": string,"source_month": string,"transaction_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "app_id": string,"basis_delta"?: number,"created_at"?: string,"creator_delta"?: number,"creator_id"?: string | null,"currency": string,"effective_month": string,"entries": NonNullable<Json>,"fee_delta"?: number,"funding_credit"?: number,"funding_used"?: number,"gross_delta"?: number,"id"?: string,"idempotency_key": string,"kind": string,"sale_delta"?: number,"source_at": string,"source_month": string,"transaction_id"?: string | null
                  }
                  Update: {
                    "app_id"?: string,"basis_delta"?: number,"created_at"?: string,"creator_delta"?: number,"creator_id"?: string | null,"currency"?: string,"effective_month"?: string,"entries"?: NonNullable<Json>,"fee_delta"?: number,"funding_credit"?: number,"funding_used"?: number,"gross_delta"?: number,"id"?: string,"idempotency_key"?: string,"kind"?: string,"sale_delta"?: number,"source_at"?: string,"source_month"?: string,"transaction_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "commission_journals_app_id_fkey"
      columns: ["app_id"]
isOneToOne: false
      referencedRelation: "apps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "commission_journals_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "creator_profiles"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "commission_journals_transaction_id_fkey"
      columns: ["transaction_id"]
isOneToOne: false
      referencedRelation: "payment_transactions"
      referencedColumns: ["id"]
    }
                  ]
                },"commission_month_closures": {
                  Row: {
                    "app_id": string,"closed_at": string,"month": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_id": string,"closed_at"?: string,"month": string
                  }
                  Update: {
                    "app_id"?: string,"closed_at"?: string,"month"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "commission_month_closures_app_id_fkey"
      columns: ["app_id"]
isOneToOne: false
      referencedRelation: "apps"
      referencedColumns: ["id"]
    }
                  ]
                },"commission_review_cases": {
                  Row: {
                    "app_id": string,"code": string,"created_at": string,"creator_id": string | null,"id": string,"source_digest": string,"transaction_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_id": string,"code": string,"created_at"?: string,"creator_id"?: string | null,"id"?: string,"source_digest": string,"transaction_id": string
                  }
                  Update: {
                    "app_id"?: string,"code"?: string,"created_at"?: string,"creator_id"?: string | null,"id"?: string,"source_digest"?: string,"transaction_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "commission_review_cases_app_id_fkey"
      columns: ["app_id"]
isOneToOne: false
      referencedRelation: "apps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "commission_review_cases_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "creator_profiles"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "commission_review_cases_transaction_id_fkey"
      columns: ["transaction_id"]
isOneToOne: false
      referencedRelation: "payment_transactions"
      referencedColumns: ["id"]
    }
                  ]
                },"commission_statements": {
                  Row: {
                    "app_id": string,"basis_minor": number,"created_at": string,"creator_id": string,"creator_minor": number,"currency": string,"fee_minor": number,"gross_minor": number,"id": string,"month": string,"sale_minor": number
                  }
                  ComputedFields: never
                  Insert: {
                    "app_id": string,"basis_minor": number,"created_at"?: string,"creator_id": string,"creator_minor": number,"currency": string,"fee_minor": number,"gross_minor": number,"id"?: string,"month": string,"sale_minor": number
                  }
                  Update: {
                    "app_id"?: string,"basis_minor"?: number,"created_at"?: string,"creator_id"?: string,"creator_minor"?: number,"currency"?: string,"fee_minor"?: number,"gross_minor"?: number,"id"?: string,"month"?: string,"sale_minor"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "commission_statements_app_id_fkey"
      columns: ["app_id"]
isOneToOne: false
      referencedRelation: "apps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "commission_statements_app_id_month_fkey"
      columns: ["app_id","month"]
isOneToOne: false
      referencedRelation: "commission_month_closures"
      referencedColumns: ["app_id","month"]
    },{
      foreignKeyName: "commission_statements_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "creator_profiles"
      referencedColumns: ["user_id"]
    }
                  ]
                },"creator_profiles": {
                  Row: {
                    "created_at": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "creator_profiles_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"creator_program_memberships": {
                  Row: {
                    "accepted_terms_version_id": string,"app_id": string,"creator_id": string,"id": string,"joined_at": string,"referral_code": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_terms_version_id": string,"app_id": string,"creator_id": string,"id"?: string,"joined_at"?: string,"referral_code": string
                  }
                  Update: {
                    "accepted_terms_version_id"?: string,"app_id"?: string,"creator_id"?: string,"id"?: string,"joined_at"?: string,"referral_code"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "creator_program_memberships_accepted_terms_version_id_fkey"
      columns: ["accepted_terms_version_id"]
isOneToOne: false
      referencedRelation: "app_terms_versions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "creator_program_memberships_app_id_fkey"
      columns: ["app_id"]
isOneToOne: false
      referencedRelation: "apps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "creator_program_memberships_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "creator_profiles"
      referencedColumns: ["user_id"]
    }
                  ]
                },"creator_referral_links": {
                  Row: {
                    "app_id": string,"channel": Database["public"]['Enums']["social_platform"],"created_at": string,"creator_id": string,"destination_kind": Database["public"]['Enums']["referral_destination_kind"],"id": string,"is_default": boolean,"label": string,"membership_id": string,"target_url": string,"token": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_id": string,"channel"?: Database["public"]['Enums']["social_platform"],"created_at"?: string,"creator_id": string,"destination_kind"?: Database["public"]['Enums']["referral_destination_kind"],"id"?: string,"is_default"?: boolean,"label": string,"membership_id": string,"target_url": string,"token": string
                  }
                  Update: {
                    "app_id"?: string,"channel"?: Database["public"]['Enums']["social_platform"],"created_at"?: string,"creator_id"?: string,"destination_kind"?: Database["public"]['Enums']["referral_destination_kind"],"id"?: string,"is_default"?: boolean,"label"?: string,"membership_id"?: string,"target_url"?: string,"token"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "creator_referral_links_app_id_fkey"
      columns: ["app_id"]
isOneToOne: false
      referencedRelation: "apps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "creator_referral_links_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "creator_profiles"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "creator_referral_links_membership_id_fkey"
      columns: ["membership_id"]
isOneToOne: false
      referencedRelation: "creator_program_memberships"
      referencedColumns: ["id"]
    }
                  ]
                },"creator_social_links": {
                  Row: {
                    "created_at": string,"creator_id": string,"id": string,"platform": Database["public"]['Enums']["social_platform"],"url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"creator_id": string,"id"?: string,"platform": Database["public"]['Enums']["social_platform"],"url": string
                  }
                  Update: {
                    "created_at"?: string,"creator_id"?: string,"id"?: string,"platform"?: Database["public"]['Enums']["social_platform"],"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "creator_social_links_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "creator_profiles"
      referencedColumns: ["user_id"]
    }
                  ]
                },"customer_payment_timeline": {
                  Row: {
                    "amount_minor": number | null,"app_id": string,"currency": string | null,"environment": string,"event_id": string,"kind": string,"occurred_at": string,"referral_id": string,"state": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_minor"?: number | null,"app_id": string,"currency"?: string | null,"environment": string,"event_id": string,"kind": string,"occurred_at": string,"referral_id": string,"state"?: string | null
                  }
                  Update: {
                    "amount_minor"?: number | null,"app_id"?: string,"currency"?: string | null,"environment"?: string,"event_id"?: string,"kind"?: string,"occurred_at"?: string,"referral_id"?: string,"state"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "customer_payment_timeline_app_id_fkey"
      columns: ["app_id"]
isOneToOne: false
      referencedRelation: "apps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "customer_payment_timeline_event_id_fkey"
      columns: ["event_id"]
isOneToOne: true
      referencedRelation: "payment_events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "customer_payment_timeline_referral_id_fkey"
      columns: ["referral_id"]
isOneToOne: false
      referencedRelation: "customer_referrals"
      referencedColumns: ["id"]
    }
                  ]
                },"customer_referrals": {
                  Row: {
                    "app_id": string,"click_id": string | null,"creator_id": string | null,"id": string,"link_id": string | null,"membership_id": string | null,"policy_version": string,"registered_at": string,"source": string,"terms_version_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "app_id": string,"click_id"?: string | null,"creator_id"?: string | null,"id"?: string,"link_id"?: string | null,"membership_id"?: string | null,"policy_version": string,"registered_at"?: string,"source": string,"terms_version_id"?: string | null
                  }
                  Update: {
                    "app_id"?: string,"click_id"?: string | null,"creator_id"?: string | null,"id"?: string,"link_id"?: string | null,"membership_id"?: string | null,"policy_version"?: string,"registered_at"?: string,"source"?: string,"terms_version_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "customer_referrals_app_id_fkey"
      columns: ["app_id"]
isOneToOne: false
      referencedRelation: "apps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "customer_referrals_click_id_fkey"
      columns: ["click_id"]
isOneToOne: false
      referencedRelation: "referral_clicks"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "customer_referrals_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "creator_profiles"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "customer_referrals_link_id_fkey"
      columns: ["link_id"]
isOneToOne: false
      referencedRelation: "creator_referral_links"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "customer_referrals_membership_id_fkey"
      columns: ["membership_id"]
isOneToOne: false
      referencedRelation: "creator_program_memberships"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "customer_referrals_terms_version_id_fkey"
      columns: ["terms_version_id"]
isOneToOne: false
      referencedRelation: "app_terms_versions"
      referencedColumns: ["id"]
    }
                  ]
                },"organization_members": {
                  Row: {
                    "created_at": string,"organization_id": string,"role": Database["public"]['Enums']["organization_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"organization_id": string,"role": Database["public"]['Enums']["organization_role"],"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"organization_id"?: string,"role"?: Database["public"]['Enums']["organization_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "organization_members_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "organization_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"organizations": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"max_apps": number,"name": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"max_apps"?: number,"name": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"max_apps"?: number,"name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "organizations_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"payment_adjustments": {
                  Row: {
                    "amount_minor": number,"app_id": string,"environment": string,"event_ref": string,"id": string,"kind": string,"occurred_at": string,"referral_id": string,"state": string,"transaction_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_minor": number,"app_id": string,"environment": string,"event_ref": string,"id"?: string,"kind": string,"occurred_at": string,"referral_id": string,"state": string,"transaction_id": string
                  }
                  Update: {
                    "amount_minor"?: number,"app_id"?: string,"environment"?: string,"event_ref"?: string,"id"?: string,"kind"?: string,"occurred_at"?: string,"referral_id"?: string,"state"?: string,"transaction_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payment_adjustments_app_id_fkey"
      columns: ["app_id"]
isOneToOne: false
      referencedRelation: "apps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payment_adjustments_referral_id_fkey"
      columns: ["referral_id"]
isOneToOne: false
      referencedRelation: "customer_referrals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payment_adjustments_transaction_id_fkey"
      columns: ["transaction_id"]
isOneToOne: false
      referencedRelation: "payment_transactions"
      referencedColumns: ["id"]
    }
                  ]
                },"payment_events": {
                  Row: {
                    "app_id": string,"attempts": number,"conflicting_deliveries": number,"digest": string,"environment": string,"error_code": string | null,"event_ref": string,"id": string,"integration_id": string,"kind": string | null,"lease": string | null,"lease_until": string | null,"next_attempt_at": string,"processed_at": string | null,"received_at": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_id": string,"attempts"?: number,"conflicting_deliveries"?: number,"digest": string,"environment": string,"error_code"?: string | null,"event_ref": string,"id"?: string,"integration_id": string,"kind"?: string | null,"lease"?: string | null,"lease_until"?: string | null,"next_attempt_at"?: string,"processed_at"?: string | null,"received_at"?: string,"status"?: string
                  }
                  Update: {
                    "app_id"?: string,"attempts"?: number,"conflicting_deliveries"?: number,"digest"?: string,"environment"?: string,"error_code"?: string | null,"event_ref"?: string,"id"?: string,"integration_id"?: string,"kind"?: string | null,"lease"?: string | null,"lease_until"?: string | null,"next_attempt_at"?: string,"processed_at"?: string | null,"received_at"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payment_events_app_id_fkey"
      columns: ["app_id"]
isOneToOne: false
      referencedRelation: "apps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payment_events_integration_id_fkey"
      columns: ["integration_id"]
isOneToOne: false
      referencedRelation: "payment_integrations"
      referencedColumns: ["id"]
    }
                  ]
                },"payment_integrations": {
                  Row: {
                    "app_id": string,"configured_at": string,"credential_ref": string,"environment": string,"id": string,"last_processed_at": string | null,"last_received_at": string | null,"provider": string,"provider_account_id": string,"verified_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "app_id": string,"configured_at"?: string,"credential_ref": string,"environment": string,"id"?: string,"last_processed_at"?: string | null,"last_received_at"?: string | null,"provider": string,"provider_account_id": string,"verified_at"?: string | null
                  }
                  Update: {
                    "app_id"?: string,"configured_at"?: string,"credential_ref"?: string,"environment"?: string,"id"?: string,"last_processed_at"?: string | null,"last_received_at"?: string | null,"provider"?: string,"provider_account_id"?: string,"verified_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "payment_integrations_app_id_fkey"
      columns: ["app_id"]
isOneToOne: false
      referencedRelation: "apps"
      referencedColumns: ["id"]
    }
                  ]
                },"payment_plan_mappings": {
                  Row: {
                    "app_id": string,"external_plan_id": string,"integration_id": string,"plan_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_id": string,"external_plan_id": string,"integration_id": string,"plan_id": string
                  }
                  Update: {
                    "app_id"?: string,"external_plan_id"?: string,"integration_id"?: string,"plan_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payment_plan_mappings_app_id_fkey"
      columns: ["app_id"]
isOneToOne: false
      referencedRelation: "apps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payment_plan_mappings_integration_id_fkey"
      columns: ["integration_id"]
isOneToOne: false
      referencedRelation: "payment_integrations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payment_plan_mappings_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "app_plans"
      referencedColumns: ["id"]
    }
                  ]
                },"payment_sources": {
                  Row: {
                    "app_id": string,"environment": string,"integration_id": string,"store": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_id": string,"environment": string,"integration_id": string,"store": string
                  }
                  Update: {
                    "app_id"?: string,"environment"?: string,"integration_id"?: string,"store"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payment_sources_app_id_fkey"
      columns: ["app_id"]
isOneToOne: false
      referencedRelation: "apps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payment_sources_integration_id_fkey"
      columns: ["integration_id"]
isOneToOne: false
      referencedRelation: "payment_integrations"
      referencedColumns: ["id"]
    }
                  ]
                },"payment_subscriptions": {
                  Row: {
                    "app_id": string,"auto_renew": boolean | null,"environment": string,"id": string,"integration_id": string,"paid_until": string | null,"referral_id": string,"state": string,"state_at": string,"state_event": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_id": string,"auto_renew"?: boolean | null,"environment": string,"id"?: string,"integration_id": string,"paid_until"?: string | null,"referral_id": string,"state"?: string,"state_at"?: string,"state_event"?: string
                  }
                  Update: {
                    "app_id"?: string,"auto_renew"?: boolean | null,"environment"?: string,"id"?: string,"integration_id"?: string,"paid_until"?: string | null,"referral_id"?: string,"state"?: string,"state_at"?: string,"state_event"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payment_subscriptions_app_id_fkey"
      columns: ["app_id"]
isOneToOne: false
      referencedRelation: "apps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payment_subscriptions_integration_id_fkey"
      columns: ["integration_id"]
isOneToOne: false
      referencedRelation: "payment_integrations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payment_subscriptions_referral_id_fkey"
      columns: ["referral_id"]
isOneToOne: false
      referencedRelation: "customer_referrals"
      referencedColumns: ["id"]
    }
                  ]
                },"payment_transactions": {
                  Row: {
                    "amount_minor": number,"app_id": string,"currency": string,"environment": string,"id": string,"is_trial": boolean,"kind": string,"occurred_at": string,"period_end": string,"plan_id": string,"plan_name": string,"referral_id": string,"subscription_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_minor": number,"app_id": string,"currency": string,"environment": string,"id"?: string,"is_trial": boolean,"kind": string,"occurred_at": string,"period_end": string,"plan_id": string,"plan_name": string,"referral_id": string,"subscription_id": string
                  }
                  Update: {
                    "amount_minor"?: number,"app_id"?: string,"currency"?: string,"environment"?: string,"id"?: string,"is_trial"?: boolean,"kind"?: string,"occurred_at"?: string,"period_end"?: string,"plan_id"?: string,"plan_name"?: string,"referral_id"?: string,"subscription_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payment_transactions_app_id_fkey"
      columns: ["app_id"]
isOneToOne: false
      referencedRelation: "apps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payment_transactions_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "app_plans"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payment_transactions_referral_id_fkey"
      columns: ["referral_id"]
isOneToOne: false
      referencedRelation: "customer_referrals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payment_transactions_subscription_id_fkey"
      columns: ["subscription_id"]
isOneToOne: false
      referencedRelation: "payment_subscriptions"
      referencedColumns: ["id"]
    }
                  ]
                },"platform_admins": {
                  Row: {
                    "granted_at": string,"granted_by": string,"note": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "granted_at"?: string,"granted_by": string,"note"?: string | null,"user_id": string
                  }
                  Update: {
                    "granted_at"?: string,"granted_by"?: string,"note"?: string | null,"user_id"?: string
                  }
                  Relationships: [

                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"display_name": string,"id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_name": string,"id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string,"id"?: string,"updated_at"?: string
                  }
                  Relationships: [

                  ]
                },"referral_clicks": {
                  Row: {
                    "app_id": string,"clicked_at": string,"creator_id": string,"expires_at": string,"id": string,"link_id": string,"membership_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_id": string,"clicked_at"?: string,"creator_id": string,"expires_at": string,"id"?: string,"link_id": string,"membership_id": string
                  }
                  Update: {
                    "app_id"?: string,"clicked_at"?: string,"creator_id"?: string,"expires_at"?: string,"id"?: string,"link_id"?: string,"membership_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "referral_clicks_app_id_fkey"
      columns: ["app_id"]
isOneToOne: false
      referencedRelation: "apps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "referral_clicks_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "creator_profiles"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "referral_clicks_link_id_fkey"
      columns: ["link_id"]
isOneToOne: false
      referencedRelation: "creator_referral_links"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "referral_clicks_membership_id_fkey"
      columns: ["membership_id"]
isOneToOne: false
      referencedRelation: "creator_program_memberships"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "catalog_listings": {
                  Row: {
                    "android_store_url": string | null,"app_id": string,"attribution_window_days": number,"categories": (Database["public"]['Enums']["app_category"])[],"cover_image_url": string | null,"description": string,"ios_store_url": string | null,"languages": (string)[],"logo_url": string | null,"max_commission_bps": number,"min_commission_bps": number,"name": string,"organization_name": string,"platforms": (Database["public"]['Enums']["app_platform"])[],"published_at": string,"screenshots": NonNullable<Json>,"slug": string,"tagline": string,"terms_text": string,"terms_version_id": string,"terms_version_number": number,"video_url": string | null,"website_url": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "app_releases_app_id_fkey"
      columns: ["app_id"]
isOneToOne: false
      referencedRelation: "apps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "app_releases_terms_version_id_fkey"
      columns: ["terms_version_id"]
isOneToOne: false
      referencedRelation: "app_terms_versions"
      referencedColumns: ["id"]
    }
                  ]
                },"catalog_plan_rates": {
                  Row: {
                    "app_id": string,"app_slug": string,"billing_interval": Database["public"]['Enums']["billing_interval"],"commission_bps": number,"currency": string,"id": string,"plan_name": string,"price_minor": number,"sort_order": number,"terms_version_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "app_releases_app_id_fkey"
      columns: ["app_id"]
isOneToOne: false
      referencedRelation: "apps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "app_terms_plan_rates_terms_version_id_fkey"
      columns: ["terms_version_id"]
isOneToOne: false
      referencedRelation: "app_terms_versions"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "admin_publish_app":
{ Args: { "p_app_id": string }; Returns: string
                           },
"admin_review_app":
{ Args: { "p_app_id": string,"p_decision": string,"p_environment"?: string,"p_expected_revision"?: number,"p_reason"?: string }; Returns: string
                           },
"apply_payment_event":
{ Args: { "p_backend": string,"p_event": string,"p_failure"?: string,"p_lease": string,"p_normalized"?: Json }; Returns: string
                           },
"attribution_summary":
{ Args: { "p_app_id"?: string,"p_creator_id"?: string }; Returns: Json
                           },
"claim_payment_events":
{ Args: { "p_backend": string,"p_integration"?: string,"p_limit"?: number }; Returns: Json
                           },
"close_commission_month":
{ Args: { "p_app_id": string,"p_backend": string,"p_month": string }; Returns: string
                           },
"commission_sandbox_inputs":
{ Args: { "p_app_id": string,"p_backend": string }; Returns: Json
                           },
"commission_workspace":
{ Args: { "p_app_id"?: string,"p_creator_id"?: string,"p_referral_id"?: string }; Returns: Json
                           },
"configure_commission_sandbox":
{ Args: { "p_effective_at": string,"p_fee_bps": number }; Returns: string
                           },
"configure_payment_integration":
{ Args: { "p_account": string,"p_app_id": string,"p_credential_ref": string,"p_environment": string,"p_provider": string }; Returns: string
                           },
"create_app":
{ Args: { "p_name": string,"p_organization_id": string }; Returns: string
                           },
"create_organization":
{ Args: { "p_name": string }; Returns: string
                           },
"create_referral_link":
{ Args: { "p_channel": Database["public"]['Enums']["social_platform"],"p_destination_kind"?: Database["public"]['Enums']["referral_destination_kind"],"p_label": string,"p_membership_id": string }; Returns: string
                           },
"creator_is_ready_to_promote":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"declare_commission_basis":
{ Args: { "p_backend": string,"p_basis_minor": string,"p_transaction": string }; Returns: undefined
                           },
"delete_app_plan":
{ Args: { "p_plan_id": string }; Returns: undefined
                           },
"finance_claim":
{ Args: { "p_app_id"?: string,"p_backend": string }; Returns: Json
                           },
"finance_complete_onboarding":
{ Args: { "p_consent": boolean,"p_session": string }; Returns: undefined
                           },
"finance_defer":
{ Args: { "p_backend": string,"p_job": string,"p_lease": string }; Returns: undefined
                           },
"finance_onboarding_session":
{ Args: { "p_session": string }; Returns: Json
                           },
"finance_reconcile":
{ Args: { "p_app_id"?: string,"p_backend": string }; Returns: number
                           },
"finance_request_funding":
{ Args: { "p_amount": string,"p_app_id": string,"p_request_key": string }; Returns: string
                           },
"finance_request_payout":
{ Args: { "p_currency"?: string,"p_expected_fee": string,"p_expected_minor": string,"p_request_key": string }; Returns: string
                           },
"finance_retry_bank":
{ Args: { "p_payout": string }; Returns: undefined
                           },
"finance_review_case":
{ Args: { "p_job": string,"p_note": string }; Returns: undefined
                           },
"finance_sandbox_exchange":
{ Args: { "p_backend": string,"p_job": string,"p_lease": string }; Returns: Json
                           },
"finance_save_auto":
{ Args: { "p_amount": string,"p_app_id": string,"p_enabled": boolean,"p_threshold": string }; Returns: undefined
                           },
"finance_schedule_auto":
{ Args: { "p_app_id"?: string,"p_backend": string }; Returns: number
                           },
"finance_settle":
{ Args: { "p_backend": string,"p_job": string,"p_lease": string }; Returns: string
                           },
"finance_start_onboarding":
{ Args: { "p_app_id"?: string,"p_kind": string }; Returns: string
                           },
"finance_test_resolve":
{ Args: { "p_job": string,"p_state": string }; Returns: undefined
                           },
"finance_test_return":
{ Args: { "p_payout": string }; Returns: undefined
                           },
"finance_test_scenario":
{ Args: { "p_job": string,"p_scenario": string }; Returns: undefined
                           },
"finance_workspace":
{ Args: { "p_admin"?: boolean,"p_app_id"?: string }; Returns: Json
                           },
"fund_commission_sandbox":
{ Args: { "p_amount_minor": string,"p_app_id": string,"p_currency": string,"p_reference": string }; Returns: undefined
                           },
"ingest_payment_event":
{ Args: { "p_backend": string,"p_environment": string,"p_event_ref": string,"p_integration": string,"p_raw": string }; Returns: Json
                           },
"join_program":
{ Args: { "p_accepted_terms"?: boolean,"p_accepted_terms_version_id": string,"p_app_id": string }; Returns: string
                           },
"list_catalog_apps":
{ Args: { "p_category"?: Database["public"]['Enums']["app_category"],"p_language"?: string,"p_min_commission_bps"?: number,"p_page"?: number,"p_page_size"?: number,"p_platform"?: Database["public"]['Enums']["app_platform"],"p_search"?: string }; Returns: {
              "app_id": string,"categories": (Database["public"]['Enums']["app_category"])[],"cover_image_url": string,"languages": (string)[],"logo_url": string,"max_commission_bps": number,"min_commission_bps": number,"name": string,"organization_name": string,"platforms": (Database["public"]['Enums']["app_platform"])[],"published_at": string,"slug": string,"tagline": string,"total_count": number
            }[]
                           },
"map_payment_customer":
{ Args: { "p_app_api_key"?: string,"p_customer_id": string,"p_integration": string,"p_provider_customer": string }; Returns: undefined
                           },
"map_payment_plan":
{ Args: { "p_external_id": string,"p_integration": string,"p_plan_id": string }; Returns: undefined
                           },
"map_payment_transaction_reference":
{ Args: { "p_integration": string,"p_reference": string,"p_transaction": string }; Returns: undefined
                           },
"ops_admin_retry_event":
{ Args: { "p_event": string,"p_reason": string }; Returns: undefined
                           },
"ops_admin_workspace":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"ops_create_ticket":
{ Args: { "p_app_id"?: string,"p_body": string,"p_category": string,"p_request_key": string,"p_subject": string }; Returns: string
                           },
"ops_health":
{ Args: { "p_backend": string }; Returns: Json
                           },
"ops_inbox":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"ops_mark_notification":
{ Args: { "p_id": string }; Returns: undefined
                           },
"ops_reply_ticket":
{ Args: { "p_body": string,"p_expected_revision": number,"p_request_key": string,"p_status"?: string,"p_ticket": string }; Returns: undefined
                           },
"ops_review_commission":
{ Args: { "p_case": string,"p_note": string,"p_state": string }; Returns: undefined
                           },
"ops_worker_heartbeat":
{ Args: { "p_backend": string,"p_ok"?: boolean,"p_scope"?: string,"p_worker": string }; Returns: undefined
                           },
"payment_customer_timeline":
{ Args: { "p_app_id"?: string,"p_creator_id"?: string,"p_referral"?: string }; Returns: Json
                           },
"payment_integration_for_ingest":
{ Args: { "p_backend": string,"p_integration": string }; Returns: Json
                           },
"payment_metrics":
{ Args: { "p_app_id"?: string,"p_creator_id"?: string }; Returns: Json
                           },
"process_commission_jobs":
{ Args: { "p_app_id"?: string,"p_backend": string,"p_limit"?: number }; Returns: Json
                           },
"record_referral_click":
{ Args: { "p_link_token": string }; Returns: Json
                           },
"register_referred_customer":
{ Args: { "p_api_key": string,"p_click_tokens"?: (string)[],"p_code"?: string,"p_customer_id": string }; Returns: Json
                           },
"retry_payment_event":
{ Args: { "p_event": string }; Returns: undefined
                           },
"revoke_payment_backend_token":
{ Args: { "p_token": string }; Returns: undefined
                           },
"rotate_attribution_api_key":
{ Args: { "p_app_id": string }; Returns: string
                           },
"save_app_draft":
{ Args: { "p_android_store_url"?: string,"p_app_id": string,"p_attribution_window_days"?: number,"p_categories"?: (Database["public"]['Enums']["app_category"])[],"p_cover_image_url"?: string,"p_description"?: string,"p_ios_store_url"?: string,"p_languages"?: (string)[],"p_logo_url"?: string,"p_name": string,"p_platforms"?: (Database["public"]['Enums']["app_platform"])[],"p_screenshots"?: Json,"p_slug"?: string,"p_tagline"?: string,"p_terms_text"?: string,"p_video_url"?: string,"p_website_url"?: string }; Returns: string
                           },
"set_payment_backend_token":
{ Args: { "p_token": string }; Returns: undefined
                           },
"set_payment_source":
{ Args: { "p_integration": string,"p_store": string }; Returns: undefined
                           },
"simulate_commission_payout":
{ Args: { "p_earning": string,"p_paid"?: boolean }; Returns: undefined
                           },
"submit_app_for_review":
{ Args: { "p_app_id": string }; Returns: string
                           },
"suggest_similar_apps_for_creator":
{ Args: { "p_limit"?: number }; Returns: {
              "app_id": string,"categories": (Database["public"]['Enums']["app_category"])[],"cover_image_url": string,"languages": (string)[],"logo_url": string,"max_commission_bps": number,"min_commission_bps": number,"name": string,"organization_name": string,"platforms": (Database["public"]['Enums']["app_platform"])[],"shared_categories": (Database["public"]['Enums']["app_category"])[],"slug": string,"tagline": string
            }[]
                           },
"upsert_app_plan":
{ Args: { "p_app_id": string,"p_billing_interval": Database["public"]['Enums']["billing_interval"],"p_commission_bps": number,"p_currency": string,"p_external_plan_key": string,"p_name": string,"p_plan_id"?: string,"p_price_minor": number,"p_sort_order"?: number }; Returns: string
                           }
          }
          Enums: {
            "app_category": "productivity"|"ai"|"fitness"|"education"|"creative"|"finance"|"developer"|"lifestyle","app_platform": "web"|"saas"|"ios"|"android","app_status": "draft"|"submitted"|"published"|"rejected","billing_interval": "week"|"month"|"year","organization_role": "owner"|"member","referral_destination_kind": "website"|"ios_store"|"android_store","social_platform": "instagram"|"tiktok"|"youtube"|"x"|"facebook"|"linkedin"|"twitch"|"snapchat"|"pinterest"|"threads"|"other"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "app_category": ["productivity", "ai", "fitness", "education", "creative", "finance", "developer", "lifestyle"],"app_platform": ["web", "saas", "ios", "android"],"app_status": ["draft", "submitted", "published", "rejected"],"billing_interval": ["week", "month", "year"],"organization_role": ["owner", "member"],"referral_destination_kind": ["website", "ios_store", "android_store"],"social_platform": ["instagram", "tiktok", "youtube", "x", "facebook", "linkedin", "twitch", "snapchat", "pinterest", "threads", "other"]
          }
        }
} as const
