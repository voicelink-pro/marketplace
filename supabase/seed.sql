-- Local development & test demo seed (`supabase/seed.sql`).
--
-- IMPORTANT (see docs/DECISIONS.md T-33):
--   * This file is loaded only by local `supabase db reset` and local test/demo
--     sandboxes. Production databases start empty and show an honest empty state.
--   * Contains zero fake partner counts, zero fake creator earnings, and zero
--     invented performance statistics.
--   * Includes 10 published apps across categories, platforms, languages, and
--     commission structures (both uniform rates and multi-plan ranges), plus
--     2 non-published apps (`draft` and `submitted`) to verify they never leak
--     into the public catalog. Their logos, covers, and screenshots are the
--     dashboard presets in `public/demo/presets/` (logos cropped by
--     `scripts/crop-preset-logos.mjs`).

do $$
declare
  v_org_id uuid;
  v_app_id uuid;
begin
  if exists (select 1 from public.apps where slug = 'boxora') then
    return;
  end if;

  -- 1. Boxora (Productivity, Web/SaaS, EN/DE/PL, 10–12% recurring)
  insert into public.organizations (name) values ('Boxora (Demo)') returning id into v_org_id;
  insert into public.apps (
    organization_id, slug, name, tagline, description,
    categories, platforms, languages,
    website_url,
    logo_url, cover_image_url, screenshots,
    terms_text, attribution_window_days, published_at
  ) values (
    v_org_id,
    'boxora',
    'Boxora',
    'Every parcel, connected',
    E'Boxora tracks every parcel a small shop sends, from label to doorstep, across the carriers it already uses.\n\nShop owners see delayed shipments before customers ask, share live tracking pages, and get a weekly view of delivery times by carrier.',
    array['productivity']::public.app_category[],
    array['web', 'saas']::public.app_platform[],
    array['en', 'de', 'pl'],
    'https://boxora.example.com',
    '/demo/presets/logo-boxora.png',
    '/demo/presets/boxora.png',
    '[{"url":"/demo/presets/boxora.png","alt":"Boxora dashboard overview"}]'::jsonb,
    '10% recurring commission on Shop Monthly and 12% on Shop Annual for every paid period. 30-day attribution window from link click to sign-up.',
    30,
    '2026-10-22T10:00:00Z'
  ) returning id into v_app_id;

  insert into public.app_plans (app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps, sort_order) values
    (v_app_id, 'Shop Monthly', 'boxora_shop_monthly_eur', 'month', 1900, 'EUR', 1000, 1),
    (v_app_id, 'Shop Annual', 'boxora_shop_annual_eur', 'year', 19000, 'EUR', 1200, 2);

  perform private.publish_app_release(v_app_id, null);

  -- 2. Crewpass (Creative & Lifestyle, iOS/Android/Web, EN/ES/FR, 30% recurring)
  insert into public.organizations (name) values ('Crewpass (Demo)') returning id into v_org_id;
  insert into public.apps (
    organization_id, slug, name, tagline, description,
    categories, platforms, languages,
    website_url, ios_store_url, android_store_url,
    logo_url, cover_image_url, screenshots,
    terms_text, attribution_window_days, published_at
  ) values (
    v_org_id,
    'crewpass',
    'Crewpass',
    'Build your community',
    E'Crewpass gives creators one home for a paid community and the digital products they sell to it: courses, templates, and downloads.\n\nMembers join on the web or in the iOS and Android apps, and creators see revenue, members, and product sales in one dashboard.',
    array['creative', 'lifestyle']::public.app_category[],
    array['web', 'ios', 'android']::public.app_platform[],
    array['en', 'es', 'fr'],
    'https://crewpass.example.com',
    'https://apps.apple.com/app/crewpass/id100000012',
    'https://play.google.com/store/apps/details?id=example.crewpass',
    '/demo/presets/logo-crewpass.png',
    '/demo/presets/crewpass.png',
    '[{"url":"/demo/presets/crewpass.png","alt":"Crewpass dashboard overview"}]'::jsonb,
    '30% recurring commission on Creator Monthly and Creator Annual for as long as the referred creator keeps a paid plan. 60-day attribution window.',
    60,
    '2026-10-21T14:00:00Z'
  ) returning id into v_app_id;

  insert into public.app_plans (app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps, sort_order) values
    (v_app_id, 'Creator Monthly', 'crewpass_creator_monthly_eur', 'month', 2900, 'EUR', 3000, 1),
    (v_app_id, 'Creator Annual', 'crewpass_creator_annual_eur', 'year', 29000, 'EUR', 3000, 2);

  perform private.publish_app_release(v_app_id, null);

  -- 3. Draftly (AI & Productivity, Web/SaaS, EN/ES/FR, 20% recurring)
  insert into public.organizations (name) values ('Draftly (Demo)') returning id into v_org_id;
  insert into public.apps (
    organization_id, slug, name, tagline, description,
    categories, platforms, languages,
    website_url,
    logo_url, cover_image_url, screenshots,
    terms_text, attribution_window_days, published_at
  ) values (
    v_org_id,
    'draftly',
    'Draftly',
    'From idea to publish',
    E'Draftly is an AI writing assistant for social posts, newsletters, and product copy. Start from a template or a one-line idea, keep your brand voice, and edit the draft before it goes out.\n\nUsage credits reset every month and documents stay organized by project.',
    array['ai', 'productivity']::public.app_category[],
    array['web', 'saas']::public.app_platform[],
    array['en', 'es', 'fr'],
    'https://draftly.example.com',
    '/demo/presets/logo-draftly.png',
    '/demo/presets/draftly.png',
    '[{"url":"/demo/presets/draftly.png","alt":"Draftly dashboard overview"}]'::jsonb,
    '20% recurring commission on both Pro Monthly and Pro Annual plans for every billing cycle the customer pays. 30-day attribution window from link click to sign-up.',
    30,
    '2026-10-20T09:30:00Z'
  ) returning id into v_app_id;

  insert into public.app_plans (app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps, sort_order) values
    (v_app_id, 'Pro Monthly', 'draftly_pro_monthly_eur', 'month', 1900, 'EUR', 2000, 1),
    (v_app_id, 'Pro Annual', 'draftly_pro_annual_eur', 'year', 18000, 'EUR', 2000, 2);

  perform private.publish_app_release(v_app_id, null);

  -- 4. Lumio (Productivity, Web/SaaS, EN/DE, 26% recurring)
  insert into public.organizations (name) values ('Lumio (Demo)') returning id into v_org_id;
  insert into public.apps (
    organization_id, slug, name, tagline, description,
    categories, platforms, languages,
    website_url,
    logo_url, cover_image_url, screenshots,
    terms_text, attribution_window_days, published_at
  ) values (
    v_org_id,
    'lumio',
    'Lumio',
    'Marketing analytics',
    E'Lumio brings revenue, visitors, and conversion rates from every marketing channel into one overview. Teams compare campaigns side by side and see which channels pay back.\n\nIt connects to the ad and analytics tools small marketing teams already use.',
    array['productivity']::public.app_category[],
    array['web', 'saas']::public.app_platform[],
    array['en', 'de'],
    'https://lumio.example.com',
    '/demo/presets/logo-lumio.png',
    '/demo/presets/lumio.png',
    '[{"url":"/demo/presets/lumio.png","alt":"Lumio dashboard overview"}]'::jsonb,
    '26% recurring commission on Growth Monthly and Growth Annual for every paid renewal. 45-day attribution window.',
    45,
    '2026-10-19T12:00:00Z'
  ) returning id into v_app_id;

  insert into public.app_plans (app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps, sort_order) values
    (v_app_id, 'Growth Monthly', 'lumio_growth_monthly_eur', 'month', 4900, 'EUR', 2600, 1),
    (v_app_id, 'Growth Annual', 'lumio_growth_annual_eur', 'year', 49000, 'EUR', 2600, 2);

  perform private.publish_app_release(v_app_id, null);

  -- 5. Mellow (Productivity & Lifestyle, iOS/Android/Web, EN/PL, 18% recurring)
  insert into public.organizations (name) values ('Mellow (Demo)') returning id into v_org_id;
  insert into public.apps (
    organization_id, slug, name, tagline, description,
    categories, platforms, languages,
    website_url, ios_store_url, android_store_url,
    logo_url, cover_image_url, screenshots,
    terms_text, attribution_window_days, published_at
  ) values (
    v_org_id,
    'mellow',
    'Mellow',
    'Make room for good work',
    E'Mellow is a friendly task board for small teams: plan the week, move cards from To do to Done, and see what is on track at a glance.\n\nIt works on the web and on iOS and Android, with calm reminders instead of noisy notifications.',
    array['productivity', 'lifestyle']::public.app_category[],
    array['web', 'ios', 'android']::public.app_platform[],
    array['en', 'pl'],
    'https://mellow.example.com',
    'https://apps.apple.com/app/mellow/id100000015',
    'https://play.google.com/store/apps/details?id=example.mellow',
    '/demo/presets/logo-mellow.png',
    '/demo/presets/mellow.png',
    '[{"url":"/demo/presets/mellow.png","alt":"Mellow dashboard overview"}]'::jsonb,
    '18% recurring commission on all paid renewals of Team Monthly and Team Annual. 30-day attribution window.',
    30,
    '2026-10-18T15:00:00Z'
  ) returning id into v_app_id;

  insert into public.app_plans (app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps, sort_order) values
    (v_app_id, 'Team Monthly', 'mellow_team_monthly_eur', 'month', 800, 'EUR', 1800, 1),
    (v_app_id, 'Team Annual', 'mellow_team_annual_eur', 'year', 7900, 'EUR', 1800, 2);

  perform private.publish_app_release(v_app_id, null);

  -- 6. Monetra (Finance & Lifestyle, iOS/Android/Web, EN/PL/DE, 15–25% recurring)
  insert into public.organizations (name) values ('Monetra (Demo)') returning id into v_org_id;
  insert into public.apps (
    organization_id, slug, name, tagline, description,
    categories, platforms, languages,
    website_url, ios_store_url, android_store_url,
    logo_url, cover_image_url, screenshots,
    terms_text, attribution_window_days, published_at
  ) values (
    v_org_id,
    'monetra',
    'Monetra',
    'Your money, in focus',
    E'Monetra helps people see where their money goes: balances, subscriptions, and spending by category in one calm overview.\n\nSet monthly budgets and savings goals, and track recurring payments across iOS, Android, and the web.',
    array['finance', 'lifestyle']::public.app_category[],
    array['ios', 'android', 'web']::public.app_platform[],
    array['en', 'pl', 'de'],
    'https://monetra.example.com',
    'https://apps.apple.com/app/monetra/id100000016',
    'https://play.google.com/store/apps/details?id=example.monetra',
    '/demo/presets/logo-monetra.png',
    '/demo/presets/monetra.png',
    '[{"url":"/demo/presets/monetra.png","alt":"Monetra dashboard overview"}]'::jsonb,
    'Creators earn recurring commission on every paid subscription renewal for as long as the referred subscriber remains active: 15% on Plus Monthly and 25% on Plus Annual. Web referrals are tracked via your referral link; iOS and Android sign-ups use your creator code entered during account creation.',
    30,
    '2026-10-17T11:00:00Z'
  ) returning id into v_app_id;

  insert into public.app_plans (app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps, sort_order) values
    (v_app_id, 'Plus Monthly', 'monetra_plus_monthly_eur', 'month', 1499, 'EUR', 1500, 1),
    (v_app_id, 'Plus Annual', 'monetra_plus_annual_eur', 'year', 11900, 'EUR', 2500, 2);

  perform private.publish_app_release(v_app_id, null);

  -- 7. Orbitly (AI & Developer, Web/SaaS, EN, 20–28% recurring)
  insert into public.organizations (name) values ('Orbitly (Demo)') returning id into v_org_id;
  insert into public.apps (
    organization_id, slug, name, tagline, description,
    categories, platforms, languages,
    website_url,
    logo_url, cover_image_url, screenshots,
    terms_text, attribution_window_days, published_at
  ) values (
    v_org_id,
    'orbitly',
    'Orbitly',
    'AI workflows',
    E'Orbitly turns repetitive work into AI workflows: a trigger, an AI step that drafts or classifies, and an action in the tools you already use.\n\nTeams build flows on a visual canvas and see every run with its status and duration.',
    array['ai', 'developer']::public.app_category[],
    array['web', 'saas']::public.app_platform[],
    array['en'],
    'https://orbitly.example.com',
    '/demo/presets/logo-orbitly.png',
    '/demo/presets/orbitly.png',
    '[{"url":"/demo/presets/orbitly.png","alt":"Orbitly dashboard overview"}]'::jsonb,
    '20% recurring commission on Starter Monthly and 28% recurring commission on Scale Annual for as long as the workspace subscription stays active.',
    30,
    '2026-10-16T08:00:00Z'
  ) returning id into v_app_id;

  insert into public.app_plans (app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps, sort_order) values
    (v_app_id, 'Starter Monthly', 'orbitly_starter_monthly_eur', 'month', 2900, 'EUR', 2000, 1),
    (v_app_id, 'Scale Annual', 'orbitly_scale_annual_eur', 'year', 34800, 'EUR', 2800, 2);

  perform private.publish_app_release(v_app_id, null);

  -- 8. Payvio (Finance & Developer, Web/SaaS, EN/DE/FR, 15% recurring)
  insert into public.organizations (name) values ('Payvio (Demo)') returning id into v_org_id;
  insert into public.apps (
    organization_id, slug, name, tagline, description,
    categories, platforms, languages,
    website_url,
    logo_url, cover_image_url, screenshots,
    terms_text, attribution_window_days, published_at
  ) values (
    v_org_id,
    'payvio',
    'Payvio',
    'Payments, simplified',
    E'Payvio lets small businesses accept online payments, send invoices, and see revenue in real time without a finance team.\n\nPayouts, customers, and payment methods live in one dashboard, with a simple API for developers.',
    array['finance', 'developer']::public.app_category[],
    array['web', 'saas']::public.app_platform[],
    array['en', 'de', 'fr'],
    'https://payvio.example.com',
    '/demo/presets/logo-payvio.png',
    '/demo/presets/payvio.png',
    '[{"url":"/demo/presets/payvio.png","alt":"Payvio dashboard overview"}]'::jsonb,
    '15% recurring commission on Business Monthly and Business Annual for every paid period. 30-day attribution window.',
    30,
    '2026-10-15T16:00:00Z'
  ) returning id into v_app_id;

  insert into public.app_plans (app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps, sort_order) values
    (v_app_id, 'Business Monthly', 'payvio_business_monthly_eur', 'month', 2500, 'EUR', 1500, 1),
    (v_app_id, 'Business Annual', 'payvio_business_annual_eur', 'year', 25000, 'EUR', 1500, 2);

  perform private.publish_app_release(v_app_id, null);

  -- 9. Pipely (Productivity, Web/SaaS/iOS, EN/ES, 22% recurring)
  insert into public.organizations (name) values ('Pipely (Demo)') returning id into v_org_id;
  insert into public.apps (
    organization_id, slug, name, tagline, description,
    categories, platforms, languages,
    website_url, ios_store_url,
    logo_url, cover_image_url, screenshots,
    terms_text, attribution_window_days, published_at
  ) values (
    v_org_id,
    'pipely',
    'Pipely',
    'Turn conversations into growth',
    E'Pipely is a simple CRM for small sales teams. Every deal moves through a clear pipeline, from first conversation to closed, with the next step always visible.\n\nReps log calls and meetings on the web or in the iOS app and track progress against the monthly goal.',
    array['productivity']::public.app_category[],
    array['web', 'saas', 'ios']::public.app_platform[],
    array['en', 'es'],
    'https://pipely.example.com',
    'https://apps.apple.com/app/pipely/id100000019',
    '/demo/presets/logo-pipely.png',
    '/demo/presets/pipely.png',
    '[{"url":"/demo/presets/pipely.png","alt":"Pipely dashboard overview"}]'::jsonb,
    '22% recurring commission on Sales Monthly and Sales Annual for every paid renewal. 45-day attribution window.',
    45,
    '2026-10-14T10:30:00Z'
  ) returning id into v_app_id;

  insert into public.app_plans (app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps, sort_order) values
    (v_app_id, 'Sales Monthly', 'pipely_sales_monthly_eur', 'month', 3500, 'EUR', 2200, 1),
    (v_app_id, 'Sales Annual', 'pipely_sales_annual_eur', 'year', 33600, 'EUR', 2200, 2);

  perform private.publish_app_release(v_app_id, null);

  -- 10. Stacklane (Developer, Web/SaaS, EN, 12–16% recurring)
  insert into public.organizations (name) values ('Stacklane (Demo)') returning id into v_org_id;
  insert into public.apps (
    organization_id, slug, name, tagline, description,
    categories, platforms, languages,
    website_url,
    logo_url, cover_image_url, screenshots,
    terms_text, attribution_window_days, published_at
  ) values (
    v_org_id,
    'stacklane',
    'Stacklane',
    'Ship with confidence',
    E'Stacklane gives small teams one place to deploy and watch their projects: production and preview environments, deploy history, and uptime.\n\nEvery deploy is logged with who shipped it, so rolling back takes one click.',
    array['developer']::public.app_category[],
    array['web', 'saas']::public.app_platform[],
    array['en'],
    'https://stacklane.example.com',
    '/demo/presets/logo-stacklane.png',
    '/demo/presets/stacklane.png',
    '[{"url":"/demo/presets/stacklane.png","alt":"Stacklane dashboard overview"}]'::jsonb,
    '12% recurring commission on Team Monthly and 16% recurring commission on Team Annual for as long as the workspace subscription stays active.',
    30,
    '2026-10-13T13:00:00Z'
  ) returning id into v_app_id;

  insert into public.app_plans (app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps, sort_order) values
    (v_app_id, 'Team Monthly', 'stacklane_team_monthly_eur', 'month', 3900, 'EUR', 1200, 1),
    (v_app_id, 'Team Annual', 'stacklane_team_annual_eur', 'year', 39000, 'EUR', 1600, 2);

  perform private.publish_app_release(v_app_id, null);

  -- 11. UNPUBLISHED DRAFT APP (must never appear in public catalog or /apps/[slug])
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

  -- 12. SUBMITTED UNAPPROVED APP (must also never appear in public catalog until approved)
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
    '/demo/presets/logo-mellow.png',
    '/demo/presets/mellow.png',
    '25% recurring commission on all paid monthly renewals.',
    'submitted'
  ) returning id into v_app_id;

  insert into public.app_plans (app_id, name, external_plan_key, billing_interval, price_minor, currency, commission_bps) values
    (v_app_id, 'Submitted Plan', 'pending_plan_1', 'month', 1900, 'EUR', 2500);

  -- Plan writes invalidate review. The fixture is submitted only after all
  -- profile/plan edits, just like the real company flow.
  update public.apps set status='submitted', submitted_at=now(), review_revision=review_revision+1
    where id=v_app_id;
  insert into public.app_review_events(app_id, organization_id, event_type, environment)
    values(v_app_id, v_org_id, 'submitted', 'demo');
end;
$$;
