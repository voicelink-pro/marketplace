-- Local development & test demo seed (`supabase/seed.sql`).
--
-- IMPORTANT (see docs/DECISIONS.md T-33):
--   * This file is loaded only by local `supabase db reset` and local test/demo
--     sandboxes. Production databases start empty and show an honest empty state.
--   * Contains zero fake partner counts, zero fake creator earnings, and zero
--     invented performance statistics.
--   * Includes 8 published apps across categories, platforms, languages, and
--     commission structures (both uniform rates and multi-plan ranges), plus
--     2 non-published apps (`draft` and `submitted`) to verify they never leak
--     into the public catalog.

do $$
declare
  v_org_id uuid;
  v_app_id uuid;
begin
  if exists (select 1 from public.apps where slug = 'pulse-coach') then
    return;
  end if;

  -- 1. Pulse Coach (Fitness & Lifestyle, iOS/Android/Web, EN/PL/DE, 15–25% recurring)
  insert into public.organizations (name) values ('Pulse Labs (Demo)') returning id into v_org_id;
  insert into public.apps (
    organization_id, slug, name, tagline, description,
    categories, platforms, languages,
    website_url, ios_store_url, android_store_url,
    logo_url, cover_image_url, screenshots, video_url,
    terms_text, attribution_window_days, published_at
  ) values (
    v_org_id,
    'pulse-coach',
    'Pulse Coach',
    'Adaptive strength & mobility training plans that adjust to your recovery.',
    E'Pulse Coach builds personalized weekly training blocks for people lifting at home or in the gym. Every session adapts to equipment on hand, recent RPE feedback, and mobility goals.\n\nSubscribers get guided video form cues, rest timers, plate calculators, and seasonal strength cycles across iOS, Android, and web.',
    array['fitness', 'lifestyle']::public.app_category[],
    array['ios', 'android', 'web']::public.app_platform[],
    array['en', 'pl', 'de'],
    'https://pulsecoach.example.com',
    'https://apps.apple.com/app/pulse-coach/id100000001',
    'https://play.google.com/store/apps/details?id=example.pulsecoach',
    '/demo/logo-pulse.svg',
    '/demo/cover-pulse.svg',
    '[{"url":"/demo/screen-pulse-1.svg","alt":"Weekly strength block overview and session load"},{"url":"/demo/screen-pulse-2.svg","alt":"Exercise form guide with tempo and rest timer"},{"url":"/demo/screen-pulse-3.svg","alt":"Mobility readiness check and progression chart"}]'::jsonb,
    'https://pulsecoach.example.com/demo/overview.mp4',
    'Creators earn recurring commission on every paid subscription renewal for as long as the referred subscriber remains active. Web referrals are tracked via your referral link; iOS and Android sign-ups use your creator code entered during account creation.',
    30,
    '2026-10-20T10:00:00Z'
  ) returning id into v_app_id;

  insert into public.app_plans (app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps, sort_order) values
    (v_app_id, 'Monthly Coaching', 'pulse_monthly_eur', 'month', 1499, 'EUR', 1500, 1),
    (v_app_id, 'Annual Coaching', 'pulse_annual_eur', 'year', 11900, 'EUR', 2500, 2);

  perform private.publish_app_release(v_app_id, null);

  -- 2. Lexi Notes (AI & Productivity, Web/SaaS, EN/ES/FR, 20% recurring)
  insert into public.organizations (name) values ('Lexi Studio (Demo)') returning id into v_org_id;
  insert into public.apps (
    organization_id, slug, name, tagline, description,
    categories, platforms, languages,
    website_url, logo_url, cover_image_url, screenshots, video_url,
    terms_text, attribution_window_days, published_at
  ) values (
    v_org_id,
    'lexi-notes',
    'Lexi Notes',
    'Structured meeting summaries, decision logs, and multilingual transcripts.',
    E'Lexi Notes turns customer calls, team stand-ups, and lectures into clean action items without joining calls as a visible bot.\n\nIt supports instant search across every conversation, vocabulary pinning for technical terms, and one-click export to your team workspace.',
    array['ai', 'productivity']::public.app_category[],
    array['web', 'saas']::public.app_platform[],
    array['en', 'es', 'fr'],
    'https://lexinotes.example.com',
    '/demo/logo-lexi.svg',
    '/demo/cover-lexi.svg',
    '[{"url":"/demo/screen-lexi-1.svg","alt":"Live transcript with speaker labels and key decisions"},{"url":"/demo/screen-lexi-2.svg","alt":"Action item extraction grouped by owner"}]'::jsonb,
    'https://lexinotes.example.com/demo/walkthrough.mp4',
    '20% recurring commission on both Pro Monthly and Pro Annual plans for every billing cycle the customer pays. 30-day attribution window from link click to sign-up.',
    30,
    '2026-10-19T14:00:00Z'
  ) returning id into v_app_id;

  insert into public.app_plans (app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps, sort_order) values
    (v_app_id, 'Pro Monthly', 'lexi_pro_monthly_eur', 'month', 1900, 'EUR', 2000, 1),
    (v_app_id, 'Pro Annual', 'lexi_pro_annual_eur', 'year', 18000, 'EUR', 2000, 2);

  perform private.publish_app_release(v_app_id, null);

  -- 3. Konto Budget (Personal Finance, iOS/Web, DE/EN/PL, 20–30% recurring)
  insert into public.organizations (name) values ('Konto GmbH (Demo)') returning id into v_org_id;
  insert into public.apps (
    organization_id, slug, name, tagline, description,
    categories, platforms, languages,
    website_url, ios_store_url,
    logo_url, cover_image_url, screenshots,
    terms_text, attribution_window_days, published_at
  ) values (
    v_org_id,
    'konto-budget',
    'Konto Budget',
    'Calm envelope budgeting and cash-flow forecasting for households.',
    E'Konto Budget helps households and freelancers plan upcoming bills, sinking funds, and savings targets without complex spreadsheets.\n\nBuilt for privacy-conscious European and international users with manual or CSV/OFX import and clear monthly runway views.',
    array['finance']::public.app_category[],
    array['ios', 'web']::public.app_platform[],
    array['de', 'en', 'pl'],
    'https://kontobudget.example.com',
    'https://apps.apple.com/app/konto-budget/id100000003',
    '/demo/logo-konto.svg',
    '/demo/cover-konto.svg',
    '[{"url":"/demo/screen-konto-1.svg","alt":"Monthly envelope allocation and safe-to-spend balance"},{"url":"/demo/screen-konto-2.svg","alt":"Upcoming recurring bills calendar"}]'::jsonb,
    'Creators receive 20% on monthly plans and 30% on annual plans for every paid period. Attribution is locked at registration via referral link or creator code.',
    30,
    '2026-10-18T09:30:00Z'
  ) returning id into v_app_id;

  insert into public.app_plans (app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps, sort_order) values
    (v_app_id, 'Plus Monthly', 'konto_plus_monthly_eur', 'month', 799, 'EUR', 2000, 1),
    (v_app_id, 'Plus Annual', 'konto_plus_annual_eur', 'year', 6900, 'EUR', 3000, 2);

  perform private.publish_app_release(v_app_id, null);

  -- 4. Framecut Studio (Creative, Web/SaaS/iOS, EN/FR, 25% recurring)
  insert into public.organizations (name) values ('Framecut Audio & Video (Demo)') returning id into v_org_id;
  insert into public.apps (
    organization_id, slug, name, tagline, description,
    categories, platforms, languages,
    website_url, ios_store_url,
    logo_url, cover_image_url, screenshots, video_url,
    terms_text, attribution_window_days, published_at
  ) values (
    v_org_id,
    'framecut-studio',
    'Framecut Studio',
    'Timeline-free short video captions, silence trimming, and aspect framing.',
    E'Framecut Studio speeds up vertical and widescreen video editing for educators, podcasters, and product teams. Edit video by editing the transcript, apply brand-consistent caption styles, and export crisp 60fps masters.',
    array['creative', 'ai']::public.app_category[],
    array['web', 'saas', 'ios']::public.app_platform[],
    array['en', 'fr'],
    'https://framecut.example.com',
    'https://apps.apple.com/app/framecut-studio/id100000004',
    '/demo/logo-framecut.svg',
    '/demo/cover-framecut.svg',
    '[{"url":"/demo/screen-framecut-1.svg","alt":"Transcript-driven video timeline and caption styling"},{"url":"/demo/screen-framecut-2.svg","alt":"Multi-ratio export preview for 9:16 and 16:9"}]'::jsonb,
    'https://framecut.example.com/demo/preview.mp4',
    '25% recurring commission across Creator and Studio plans for all paid renewals. Free trials convert to commissionable subscriptions upon the first settled payment.',
    30,
    '2026-10-17T12:00:00Z'
  ) returning id into v_app_id;

  insert into public.app_plans (app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps, sort_order) values
    (v_app_id, 'Creator Monthly', 'framecut_creator_m_eur', 'month', 2400, 'EUR', 2500, 1),
    (v_app_id, 'Studio Annual', 'framecut_studio_y_eur', 'year', 22800, 'EUR', 2500, 2);

  perform private.publish_app_release(v_app_id, null);

  -- 5. Lingua Sprint (Education, iOS/Android/Web, EN/ES/DE/PL/FR, 15–30% recurring)
  insert into public.organizations (name) values ('Lingua Sprint Press (Demo)') returning id into v_org_id;
  insert into public.apps (
    organization_id, slug, name, tagline, description,
    categories, platforms, languages,
    website_url, ios_store_url, android_store_url,
    logo_url, cover_image_url, screenshots,
    terms_text, attribution_window_days, published_at
  ) values (
    v_org_id,
    'lingua-sprint',
    'Lingua Sprint',
    'Daily audio dialogues and spaced-repetition drills for real travel and work.',
    E'Lingua Sprint focuses on speaking confidence and listening comprehension through 15-minute native dialogues, graded stories, and active recall flashcards.\n\nLearners sync progress across iOS, Android, and browser sessions.',
    array['education']::public.app_category[],
    array['ios', 'android', 'web']::public.app_platform[],
    array['en', 'es', 'de', 'pl', 'fr'],
    'https://linguasprint.example.com',
    'https://apps.apple.com/app/lingua-sprint/id100000005',
    'https://play.google.com/store/apps/details?id=example.linguasprint',
    '/demo/logo-lingua.svg',
    '/demo/cover-lingua.svg',
    '[{"url":"/demo/screen-lingua-1.svg","alt":"Interactive dialogue player with phrase breakdown"},{"url":"/demo/screen-lingua-2.svg","alt":"Spaced-repetition review queue"}]'::jsonb,
    'Earn 15% on monthly plans and 30% on annual plans for every renewal. Mobile users apply your referral code on the sign-up screen.',
    30,
    '2026-10-16T15:00:00Z'
  ) returning id into v_app_id;

  insert into public.app_plans (app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps, sort_order) values
    (v_app_id, 'Learner Monthly', 'lingua_monthly_eur', 'month', 1299, 'EUR', 1500, 1),
    (v_app_id, 'Learner Annual', 'lingua_annual_eur', 'year', 9900, 'EUR', 3000, 2);

  perform private.publish_app_release(v_app_id, null);

  -- 6. TraceBeacon (Developer & SaaS, Web/SaaS, EN, 12.5–20% recurring)
  insert into public.organizations (name) values ('TraceBeacon Cloud (Demo)') returning id into v_org_id;
  insert into public.apps (
    organization_id, slug, name, tagline, description,
    categories, platforms, languages,
    website_url, logo_url, cover_image_url, screenshots,
    terms_text, attribution_window_days, published_at
  ) values (
    v_org_id,
    'tracebeacon',
    'TraceBeacon',
    'Lightweight uptime checks, cron monitoring, and incident status pages.',
    E'TraceBeacon gives indie SaaS teams and agencies sub-minute synthetic monitoring, webhook heartbeat alerts, and clean public status pages without enterprise bloat.',
    array['developer', 'productivity']::public.app_category[],
    array['web', 'saas']::public.app_platform[],
    array['en'],
    'https://tracebeacon.example.com',
    '/demo/logo-trace.svg',
    '/demo/cover-trace.svg',
    '[{"url":"/demo/screen-trace-1.svg","alt":"Global latency checks and uptime history"},{"url":"/demo/screen-trace-2.svg","alt":"Cron heartbeat monitor alerts"}]'::jsonb,
    '12.5% recurring commission on Starter and 20% recurring commission on Team plans for as long as the workspace subscription stays active.',
    45,
    '2026-10-15T11:00:00Z'
  ) returning id into v_app_id;

  insert into public.app_plans (app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps, sort_order) values
    (v_app_id, 'Starter Monthly', 'trace_starter_m_eur', 'month', 1500, 'EUR', 1250, 1),
    (v_app_id, 'Team Monthly', 'trace_team_m_eur', 'month', 3900, 'EUR', 2000, 2);

  perform private.publish_app_release(v_app_id, null);

  -- 7. Tempo Focus (Productivity & Lifestyle, iOS/Android/Web, EN/PL, 20% recurring)
  insert into public.organizations (name) values ('Tempo Works (Demo)') returning id into v_org_id;
  insert into public.apps (
    organization_id, slug, name, tagline, description,
    categories, platforms, languages,
    website_url, ios_store_url, android_store_url,
    logo_url, cover_image_url, screenshots,
    terms_text, attribution_window_days, published_at
  ) values (
    v_org_id,
    'tempo-focus',
    'Tempo Focus',
    'Time-boxed deep work sessions, calendar blocking, and distraction shields.',
    E'Tempo Focus pairs keyboard-driven daily planning on the web with distraction shields on iOS and Android so makers finish their most important work before noon.',
    array['productivity', 'lifestyle']::public.app_category[],
    array['ios', 'android', 'web']::public.app_platform[],
    array['en', 'pl'],
    'https://tempofocus.example.com',
    'https://apps.apple.com/app/tempo-focus/id100000007',
    'https://play.google.com/store/apps/details?id=example.tempofocus',
    '/demo/logo-tempo.svg',
    '/demo/cover-tempo.svg',
    '[{"url":"/demo/screen-tempo-1.svg","alt":"Daily time-blocked schedule and focus timer"}]'::jsonb,
    '20% recurring commission on all paid renewals. 30-day attribution window.',
    30,
    '2026-10-14T08:00:00Z'
  ) returning id into v_app_id;

  insert into public.app_plans (app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps, sort_order) values
    (v_app_id, 'Focus Monthly', 'tempo_monthly_eur', 'month', 900, 'EUR', 2000, 1),
    (v_app_id, 'Focus Annual', 'tempo_annual_eur', 'year', 7900, 'EUR', 2000, 2);

  perform private.publish_app_release(v_app_id, null);

  -- 8. Palette Kit (Creative & Developer, Web/SaaS, EN/DE, 15–25% recurring)
  insert into public.organizations (name) values ('Palette Kit Ltd (Demo)') returning id into v_org_id;
  insert into public.apps (
    organization_id, slug, name, tagline, description,
    categories, platforms, languages,
    website_url, logo_url, cover_image_url, screenshots,
    terms_text, attribution_window_days, published_at
  ) values (
    v_org_id,
    'palette-kit',
    'Palette Kit',
    'Accessible OKLCH color systems, contrast checks, and design token exports.',
    E'Palette Kit helps product designers and frontend engineers build accessible color scales in OKLCH, verify APCA and WCAG contrast across themes, and sync tokens directly to CSS and Figma.',
    array['creative', 'developer']::public.app_category[],
    array['web', 'saas']::public.app_platform[],
    array['en', 'de'],
    'https://palettekit.example.com',
    '/demo/logo-palette.svg',
    '/demo/cover-palette.svg',
    '[{"url":"/demo/screen-palette-1.svg","alt":"OKLCH ramp editor and contrast matrix"}]'::jsonb,
    '15% recurring commission on Solo Monthly and 25% recurring commission on Studio Annual.',
    30,
    '2026-10-13T16:00:00Z'
  ) returning id into v_app_id;

  insert into public.app_plans (app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps, sort_order) values
    (v_app_id, 'Solo Monthly', 'palette_solo_m_eur', 'month', 1200, 'EUR', 1500, 1),
    (v_app_id, 'Studio Annual', 'palette_studio_y_eur', 'year', 14400, 'EUR', 2500, 2);

  perform private.publish_app_release(v_app_id, null);

  -- 9. UNPUBLISHED DRAFT APP (must never appear in public catalog or /apps/[slug])
  insert into public.organizations (name) values ('Stealth Draft Lab (Demo)') returning id into v_org_id;
  insert into public.apps (
    organization_id, slug, name, tagline, description,
    categories, platforms, languages, status
  ) values (
    v_org_id,
    'stealth-draft-app',
    'Stealth Draft App',
    'Private draft that has not been submitted or approved.',
    'This app is in draft status and must never be accessible publicly.',
    array['ai']::public.app_category[],
    array['saas']::public.app_platform[],
    array['en'],
    'draft'
  ) returning id into v_app_id;

  insert into public.app_plans (app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps) values
    (v_app_id, 'Internal Draft Plan', 'stealth_plan_1', 'month', 2900, 'EUR', 3000);

  -- 10. SUBMITTED UNAPPROVED APP (must also never appear in public catalog until approved)
  insert into public.organizations (name) values ('Pending Review Co (Demo)') returning id into v_org_id;
  insert into public.apps (
    organization_id, slug, name, tagline, description,
    categories, platforms, languages,
    website_url, logo_url, cover_image_url, terms_text,
    status
  ) values (
    v_org_id,
    'pending-review-app',
    'Pending Review App',
    'Submitted to admin review, not yet approved.',
    'Waiting for administrator checklist review before going live in the marketplace.',
    array['productivity']::public.app_category[],
    array['web']::public.app_platform[],
    array['en'],
    'https://pendingreview.example.com',
    '/demo/logo-tempo.svg',
    '/demo/cover-tempo.svg',
    '25% recurring commission on all paid monthly renewals.',
    'submitted'
  ) returning id into v_app_id;

  insert into public.app_plans (app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps) values
    (v_app_id, 'Submitted Plan', 'pending_plan_1', 'month', 1900, 'EUR', 2500);
end;
$$;
