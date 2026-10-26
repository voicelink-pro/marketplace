
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
"delete_app_plan":
{ Args: { "p_plan_id": string }; Returns: undefined
                           },
"join_program":
{ Args: { "p_accepted_terms"?: boolean,"p_accepted_terms_version_id": string,"p_app_id": string }; Returns: string
                           },
"list_catalog_apps":
{ Args: { "p_category"?: Database["public"]['Enums']["app_category"],"p_language"?: string,"p_min_commission_bps"?: number,"p_page"?: number,"p_page_size"?: number,"p_platform"?: Database["public"]['Enums']["app_platform"],"p_search"?: string }; Returns: {
              "app_id": string,"categories": (Database["public"]['Enums']["app_category"])[],"cover_image_url": string,"languages": (string)[],"logo_url": string,"max_commission_bps": number,"min_commission_bps": number,"name": string,"organization_name": string,"platforms": (Database["public"]['Enums']["app_platform"])[],"published_at": string,"slug": string,"tagline": string,"total_count": number
            }[]
                           },
"save_app_draft":
{ Args: { "p_android_store_url"?: string,"p_app_id": string,"p_attribution_window_days"?: number,"p_categories"?: (Database["public"]['Enums']["app_category"])[],"p_cover_image_url"?: string,"p_description"?: string,"p_ios_store_url"?: string,"p_languages"?: (string)[],"p_logo_url"?: string,"p_name": string,"p_platforms"?: (Database["public"]['Enums']["app_platform"])[],"p_screenshots"?: Json,"p_slug"?: string,"p_tagline"?: string,"p_terms_text"?: string,"p_video_url"?: string,"p_website_url"?: string }; Returns: string
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
