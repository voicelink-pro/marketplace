# Status implementacji

Brief: `MARKETPLACE_BRIEF_I_PROMPTY.md` • Decyzje: `docs/DECISIONS.md`
Ostatnia aktualizacja: 2026-10-27 (odbiór backendu etapu 7)

Każda nowa rozmowa zaczyna od przeczytania briefu i tego pliku.
Wyniki testów zapisujemy wyłącznie jako `pass`, `fail` albo `blocked`, z opisem, co faktycznie uruchomiono.

## Równoległe dopracowanie UI/UX etapów 1–4

- Marka platformy: **BoostLink**, zatwierdzona 26.10.2026; konfiguracja nazwy i metadane korzystają z `src/config/site.ts`.
- Zakres dla frontend developera: [FRONTEND_SCOPE_STAGES_1_4.md](FRONTEND_SCOPE_STAGES_1_4.md), w tym pakiety E1–E4, właściciele plików i kryteria odbioru.
- Status dopracowania UI/UX: **zakres przygotowany; realizacja i odbiór poszczególnych pakietów jeszcze nie rozpoczęte**. Wcześniejsze wyniki testów funkcjonalnych pozostają historią weryfikacji backendu.
- Backend E5/E6/E7: prowadzi Karol z Codexem; aktualny odbiór opisano niżej w sekcjach E5/E6/E7. Zakres frontendu E1–E4 pozostaje niezależny.
- Weryfikacja zmiany marki i dokumentacji (26.10): **pass** — `pnpm lint`, `pnpm typecheck`, `pnpm build` (38 tras), nazwa BoostLink w wygenerowanym HTML/metadanych i brak poprzedniej nazwy w wygenerowanych plikach HTML. Testów logiki i integracji nie powtarzano w tym zadaniu: nie zmieniono backendu ani kontraktów.

## Podsumowanie etapów

| Etap | Zakres | Status |
|---|---|---|
| 0 | Ocena repozytorium, dokumenty startowe | **Ukończony** |
| 1 | Fundament, konta, konteksty, layouty | **Ukończony; poprawki i testy prawdziwego Supabase `pass` (26.10)** |
| 2 | Publiczny katalog i strony aplikacji | **Ukończony; poprawki, PGlite i prawdziwy PostgREST `pass` (26.10)** |
| 3 | Firma dodaje aplikację, admin publikuje | **Ukończony; poprawki, PGlite i prawdziwy PostgREST `pass` (26.10)** |
| 4 | Dołączenie twórcy, przewodnik, programy, linki | **Ukończony; historyczne warunki i izolacja przez prawdziwy PostgREST `pass` (26.10)** |
| 5 | Przypisanie klientów, statystyki poleceń | **Ukończony w sandboxie; testy i odbiór lokalny pass (26.10)** |
| 6 | Integracje płatności (Stripe, RevenueCat, Generic API) | **Backend i odbiór lokalnego pipeline pass; rzeczywiste zakupy u dostawców blocked** |
| 7 | Prowizje, historia stawek, zamknięcie miesiąca | **Ukończony w sandboxie; testy lokalne pass, live wyłączone** |
| 8 | Finansowanie firm, auto-doładowania, wypłaty (sandbox) | Nie rozpoczęty — **następny** |
| 9 | Domknięcie MVP, pilotaż | Nie rozpoczęty |

---

## Etap 0 — ocena repozytorium (2026-10-24)

### Stan repozytorium

- Katalog zawiera tylko: `MARKETPLACE_BRIEF_I_PROMPTY.md`, `skills-lock.json`, `.agents/skills/`, `.cursor/skills/`.
- **Brak kodu aplikacji**, `package.json`, migracji i testów. Projekt startuje od zera.
- **Brak repozytorium git** (`git status` → not a git repository).
- **Brak `AGENTS.md`** (ani `CLAUDE.md`). Propozycja: utworzyć krótki `AGENTS.md` w E1 z komendami i zasadami projektu.
- Brak starszych dokumentów specyfikacji w katalogu; nie ma sprzecznych założeń do wycofania.
- Ścieżka projektu zawiera spacje (`Market place Roch`). Skrypty muszą cytować ścieżki.

### Środowisko lokalne

| Narzędzie | Stan |
|---|---|
| Node | 25.9.0 (wydanie bez LTS, patrz T-04) |
| pnpm / npm | 10.33.4 / 11.12.1 |
| Docker | Zainstalowany 29.1.3, **daemon nie działa** |
| Supabase CLI | Brak globalnie; będzie przypiętą zależnością deweloperską (T-03) |
| gh | 2.96.0 |
| Projekt Supabase w chmurze, klucze | Brak; E1 pracuje na lokalnym Supabase |
| Stripe / RevenueCat / operator wypłat | Brak kluczy; potrzebne dopiero od E6/E8 |

### Dostępność skilli

Sprawdzono faktyczną obecność plików. „Przeczytano” = instrukcje skilla zostały odczytane w tej sesji.

| Skill | Dostępność | Przeczytano | Zastosowanie |
|---|---|---|---|
| `supabase` | Projekt `.agents/skills/` | Tak | Auth, RLS, migracje, CLI, checklista bezpieczeństwa |
| `supabase-postgres-best-practices` | Projekt `.agents/skills/` | Tak (indeks; reguły szczegółowe czytane per zadanie) | Schemat, indeksy, RLS, blokady |
| `frontend-design` | Projekt `.agents/skills/` | Tak (E1) | Kierunek wizualny (T-54) |
| `web-design-guidelines` | Projekt `.agents/skills/` | Nie (E2+) | Przegląd UI/dostępności |
| `ui-styling`, `design-system`, `ui-ux-pro-max` i inne designowe | Projekt `.cursor/skills/` | Nie | Tailwind/shadcn/tokeny, wybiórczo |
| shadcn (plugin + MCP) | Plugin Cursora | Tak (E1) | Komponenty UI, zasady formularzy/ikon |
| Superpowers: `writing-plans`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `requesting-code-review` | **Nie zainstalowane w Cursorze.** Pliki istnieją tylko w tymczasowym cache Codexa: `~/.codex/.tmp/plugins/plugins/superpowers/skills/` | `writing-plans`, `test-driven-development`, `verification-before-completion` — tak; `requesting-code-review` — nie (w E1 tylko własny przegląd kodu) | Czytane z tej lokalizacji, gdy pasują. Cache może zniknąć; zalecana stała instalacja. |
| `react-best-practices` (Vercel) | **Nie zainstalowany w Cursorze.** Pliki w `~/.codex/.tmp/plugins/plugins/vercel/skills/react-best-practices` | Nie | Jak wyżej |
| Trail of Bits: `differential-review`, `sharp-edges` | **Niedostępne** (nie znaleziono nigdzie na dysku) | — | Do czasu instalacji zastępowane przez `review-security` / `review-bugbot` Cursora oraz checklistę bezpieczeństwa skilla `supabase` |

### Testy etapu 0

Brak kodu, więc brak testów. Wykonano tylko inwentaryzację plików, narzędzi i skilli (wyniki powyżej).

---

## Etap 1 — fundament, konta, konteksty, layouty (2026-10-24)

### Co zbudowano

- **Fundament:** Next.js 16.4.3 (App Router, `cacheComponents`), React 19.3, TypeScript strict, Tailwind 4 + shadcn/ui, Zod 4, klient Supabase (`@supabase/ssr`, `getClaims`), `src/proxy.ts`, walidowane zmienne środowiskowe (`src/lib/env.ts`, `.env.example`), Vitest, CI (`.github/workflows/ci.yml`), `AGENTS.md`, README.
- **Baza** — migracja `supabase/migrations/20261024211734_accounts_foundation.sql`:
  - `profiles` (tworzony wyzwalaczem przy rejestracji; użytkownik zmienia tylko `display_name`);
  - `platform_admins` (zapis tylko `service_role`; skrypt `pnpm admin:grant`);
  - `creator_profiles`, `creator_social_links` (https, maks. 10, bez weryfikacji własności);
  - `organizations` (`max_apps` = 1), `organization_members` (owner/member), `apps` (status `draft`);
  - RPC `create_organization`, `create_app`, `creator_is_ready_to_promote`; pomocnicze funkcje w schemacie `private`;
  - RLS na wszystkich tabelach, granty kolumnowe, `auto_expose_new_tables = false`.
- **Auth:** rejestracja z potwierdzeniem e-mail, logowanie, wylogowanie, „zapomniałem hasła” → link → nowe hasło, zmiana hasła i nazwy w `/account`. Szablony e-maili w `supabase/templates/`.
- **Konteksty:** `/onboarding` (wybór: „Promote apps” / „List your app”), `/onboarding/creator` (pierwszy URL profilu), `/onboarding/company` (nazwa firmy). Jedno konto może mieć oba konteksty; przełącznik w topbarze. `/dashboard` kieruje do ostatnio używanego panelu.
- **Layouty:** publiczny (nagłówek + katalog z uczciwym stanem pustym), twórcy, firmy, admina — desktop: sidebar + topbar + menu konta; mobile: menu w szufladzie (Sheet). Strażnicy obszarów na serwerze; `/admin` zwraca 404 dla nie-adminów.
- **Działające funkcje paneli:** twórca — lista/dodawanie/usuwanie linków społecznościowych, alert „dodaj profil”, gdy brak linków; firma — utworzenie szkicu aplikacji (limit 1, egzekwowany w bazie), zmiana nazwy firmy (tylko owner), liczba członków; admin — lista użytkowników z kontekstami. Pozostałe moduły (programy, linki polecające, zarobki, wypłaty, plany, integracje, finansowanie, przegląd ofert itd.) pokazują stany puste bez liczb.
- **Stany UI:** ładowanie (skeletony w `Suspense`, spinner w przyciskach), puste, błąd (komunikat formularza, `error.tsx`, `not-found.tsx`), sukces (toast lub przekierowanie).

### Weryfikacja (co faktycznie uruchomiono)

| Sprawdzenie | Wynik | Szczegóły |
|---|---|---|
| `pnpm typecheck` (`next typegen && tsc --noEmit`) | **pass** | 0 błędów |
| `pnpm lint` | **pass** | 0 błędów, 0 ostrzeżeń (skrypty skilli w `.cursor/`/`.agents/` wykluczone) |
| `pnpm test` — jednostkowe (4 pliki) | **pass** | 46/46: bezpieczne przekierowania (open redirect), schematy auth, parser URL profili, wybór panelu |
| `pnpm test` — baza na PGlite (`tests/db/accounts.test.ts`) | **pass** | 34/34: profile, brak eskalacji do admina (insert, metadata), izolacja organizacji A/B, brak zmiany cudzej nazwy/`max_apps`, brak bezpośredniego insertu członkostwa/aplikacji, limit 1 aplikacji (także dla zapisu uprzywilejowanego), niezmienne `organization_id`, izolacja linków, https-only, limit 10, `anon` bez dostępu |
| Test mutacyjny RLS | **pass** | Tymczasowa polityka `using (true)` na `organizations` → test izolacji zawiódł zgodnie z oczekiwaniem; polityka przywrócona |
| `pnpm build` (zastępcze zmienne publiczne) | **pass** | 35 tras; strony paneli jako Partial Prerender. Ostrzeżenie: zapis cache Turbopacka nieudany z powodu braku miejsca na dysku (nie wpływa na wynik) |
| Smoke test `next start` bez sesji | **pass** | `/`, `/login`, `/signup`, `/forgot-password` → 200; `/creator`, `/company/app`, `/admin`, `/onboarding`, `/dashboard` → 307 na `/login?next=…`; nieznana trasa → 404 |
| UI w przeglądarce (publiczne strony) | **pass** | Rejestracja: stan wysyłania i błędy walidacji z serwera; katalog na 390 px i desktopie |
| `pnpm test:integration` (13 testów przez Data API: izolacja A/B, eskalacja admina, `anon`, rejestracja bez sesji, współbieżne `create_app` ×8, `create_organization` ×6, linki ×14) | **blocked** | Wymaga `supabase start` (B-01). Uruchomione bez zmiennych → 13 pominiętych |
| `supabase db reset` (migracja na prawdziwym Supabase) | **blocked** | B-01 |
| `pnpm db:advisors` | **blocked** | B-01 |
| Ręczny przepływ: rejestracja → e-mail → onboarding → panel | **blocked** | Wymaga działającego Auth i Mailpit (B-01) |
| Wygląd paneli po zalogowaniu (desktop/mobile) | **blocked** | Wymaga sesji (B-01) |
| CI na GitHub Actions | **blocked** | Brak zdalnego repozytorium; workflow nie był uruchomiony |

### Znane ograniczenia etapu 1

- Typy bazy napisane ręcznie (T-52) — po starcie Supabase uruchomić `pnpm db:types` i porównać.
- Zapraszanie członków do organizacji nie jest zbudowane (model ma rolę `member`).
- Zmiana adresu e-mail nie jest w UI (obsługiwana przez Auth, poza zakresem E1).
- `eslint@9.39.5` jest oznaczony przez npm jako niewspierany; zostaje, bo `eslint-config-next@16.4.3` jest z nim zgodny. Do aktualizacji osobno.

### Jak przetestować ręcznie (po usunięciu B-01)

1. `pnpm db:start`, skopiować `.env.example` → `.env.local` i uzupełnić z `pnpm exec supabase status -o env`, `pnpm dev`.
2. `/signup` → e-mail w Mailpit (http://127.0.0.1:54324) → link → `/onboarding`.
3. „Promote apps” → podać np. `instagram.com/twojprofil` → panel twórcy; w Settings dodać/usunąć link (link `http://` i strona główna platformy powinny zostać odrzucone).
4. Przełącznik/menu konta → „List your app” → nazwa firmy → panel firmy → App profile → utworzyć szkic; drugi szkic jest niemożliwy.
5. Drugie konto w innej przeglądarce: nie widzi firmy pierwszego (także zapytaniem REST z jego tokenem).
6. `/admin` jako zwykły użytkownik → 404. `pnpm admin:grant --email … --by "…"` → `/admin/users` pokazuje wszystkich.
7. Wylogowanie, „Forgot password” → link → nowe hasło → panel.
8. `pnpm db:reset && pnpm db:advisors && pnpm test:integration`.

---

## Etap 2 — publiczny katalog i pełne strony aplikacji (2026-10-24)

### Co zbudowano

- **Baza i bezpieczna projekcja publiczna** (`supabase/migrations/20261024214026_catalog_foundation.sql`):
  - rozszerzenie `public.apps` o pola profilu (unikalny `slug`, `tagline`, `description`, `categories`, `platforms`, `languages`, linki sklepowe/produktowe, media `logo_url`/`cover_image_url`/`screenshots`/`video_url`, `terms_text`, `attribution_window_days`, `published_at`) oraz wyzwalacz `apps_ensure_slug`;
  - tabela abonamentów roboczych `public.app_plans` (oddzielne pola `name` i `external_plan_key`, `billing_interval`, `price_minor bigint`, `currency`, `commission_bps integer`);
  - niezmienne wersje warunków i stawek: `public.app_terms_versions` oraz `public.app_terms_plan_rates` chronione wyzwalaczem `forbid_version_mutation` (brak możliwości edycji lub usunięcia historii);
  - tabela zatwierdzonych wydań publicznych `public.app_releases` (częściowe indeksy unikalne i GIN dla `is_current_published = true`) oraz funkcja `private.publish_app_release` i RPC `public.admin_publish_app`;
  - widoki `public.catalog_listings` i `public.catalog_plan_rates` (`security_invoker = true`, bez ujawniania `external_plan_key`) oraz funkcja `public.list_catalog_apps` (wyszukiwarka z bezpiecznym escapowaniem znaków wieloznacznych LIKE, filtry kategorii, platformy, języka, minimalnej prowizji i paginacja);
  - RLS i minimalne granty kolumnowe: `anon` i postronni użytkownicy nie odczytają draftów w `public.apps`, `public.app_plans`, niezatwierdzonych zmian ani wewnętrznych kluczy planów.
- **Moduł kwot i stawek (`src/lib/money.ts`):**
  - operacje wyłącznie na `bigint` (`toMinorBigInt`, `formatMinorCurrency` bez konwersji przez float) oraz punktach bazowych (`formatCommissionPercent`, `formatCommissionRange` z zakresem `15–25% recurring` przy różnych stawkach planów i `20% recurring` przy jednej stawce, zgodnie z W-07).
- **Katalog publiczny (`/`) i filtry URL (`src/modules/catalog/`):**
  - strona główna `/` od razu jako katalog z wyszukiwarką i 4 filtrami (`category`, `commission`, `platform`, `language` — bez filtra ceny abonamentu zgodnie z W-04), zachowywanymi w URL z chipami aktywnych filtrów i przyciskiem „Clear filters”;
  - responsywna siatka kafelków 3 / 2 / 1 kolumny z jednolitą proporcją grafik (`aspect-[16/10]`), logo, nazwą, firmą, krótkim opisem, platformami, językami i zakresem prowizji;
  - paginacja z podsumowaniem zakresu i zachowaniem filtrów w linkach stron;
  - uczciwe stany puste: osobny dla pustej bazy produkcyjnej („No apps are listed yet”) i osobny dla braku wyników filtrów („No apps match these filters”).
- **Pełna strona aplikacji (`/apps/[slug]`):**
  - osobny adres URL (nie modal), dostępny bez logowania;
  - nagłówek produktu (logo, firma, opis krótki, kategorie, platformy, języki, linki do strony/App Store/Google Play), grafika główna, pełny opis, galeria screenów (`aspect-[16/10]`), sekcja wideo produktu, warunki programu z numerem wersji (`Terms vN`, okno atrybucji, ochrona historycznych stawek) oraz pełna tabela abonamentów z cenami i stawkami prowizji;
  - wyraźne CTA do promowania (na desktopie w przyklejonej kolumnie bocznej, na mobile także bezpośrednio pod grafiką główną): dla niezalogowanego prowadzi do `/login?next=/apps/[slug]` (oraz `/signup?next=/apps/[slug]`) z zachowaniem docelowej aplikacji;
  - link powrotny („Back to filtered results” / „All apps”) odtwarzający bezpiecznie zwalidowane filtry i numer strony z `?from=`.
- **Dane demo (`supabase/seed.sql`, `public/demo/*.svg`):**
  - 8 opublikowanych aplikacji demo i 2 nieopublikowane (`stealth-draft-app` jako `draft`, `pending-review-app` jako `submitted`) bez fikcyjnych statystyk i liczb partnerów.

### Weryfikacja etapu 2 (co faktycznie uruchomiono)

| Sprawdzenie | Wynik | Szczegóły |
|---|---|---|
| `pnpm typecheck` (`next typegen && tsc --noEmit`) | **pass** | 0 błędów |
| `pnpm lint` | **pass** | 0 błędów, 0 ostrzeżeń |
| `pnpm test` — jednostkowe (`money.test.ts`, `filters.test.ts` + E1) | **pass** | 60/60 (w tym 14 nowych testów kwot, zakresów prowizji W-07, filtrów URL i ochrony `?from=`) |
| `pnpm test` — baza na PGlite (`tests/db/catalog.test.ts` + `accounts.test.ts`) | **pass** | 43/43 (9 nowych testów katalogu: pusty stan, blokada publikacji przez nie-admina, walidacja kompletności oferty, zakresy stawek, ukrycie draftów/submitted i `external_plan_key` przed `anon` i innymi kontami, brak wycieku niezatwierdzonych zmian opublikowanej aplikacji, niezmienność wersji warunków/stawek, filtry + escapowanie `%`/`_`, paginacja, idempotentne ładowanie `supabase/seed.sql`) |
| `pnpm build` | **pass** | `/` oraz `/apps/[slug]` budują się jako Partial Prerender (`◐`), 0 błędów |
| Weryfikacja w przeglądarce (desktop 1280×900 + mobile 390×844 na bazie PGlite z migracjami i `seed.sql`) | **pass** | Katalog bez logowania (8 opublikowanych ofert, paginacja 6+2), filtr `category=fitness` w URL i chipach, przejście na `/apps/pulse-coach?from=category%3Dfitness`, powrót „Back to filtered results” do `/?category=fitness`, CTA „Promote this app” → `/login?next=%2Fapps%2Fpulse-coach`, wejście na `/apps/stealth-draft-app` → strona „App not found” |
| `pnpm test:integration` (`tests/integration/catalog.test.ts` + `accounts.test.ts` przez PostgREST) | **blocked** | Wymaga `supabase start` (B-01) |
| `pnpm db:reset` i `pnpm db:advisors` na lokalnym kontenerze Supabase | **blocked** | B-01 |

### Jak przetestować ręcznie etap 2

- **Z lokalnym Supabase (po usunięciu B-01):**
  1. `pnpm db:start && pnpm db:reset` (ładuje migracje i `supabase/seed.sql`), następnie `pnpm dev`.
  2. Bez logowania otworzyć `http://localhost:3000/` — widoczne 6 kafelków na stronie 1 i 2 na stronie 2 (`Showing 1–6 of 8 apps`).
  3. Użyć wyszukiwarki i filtrów (Category, Commission, Platform, App language) — URL aktualizuje się, można usuwać pojedyncze filtry lub kliknąć „Clear filters”.
  4. Kliknąć kafelek (np. `Pulse Coach`) — otwiera pełną stronę `/apps/pulse-coach` z tabelą abonamentów (`15%` i `25%`), opisem, screenami, wideo i warunkami programu.
  5. Kliknąć „Back to filtered results” lub Wstecz w przeglądarce — powrót do katalogu z zachowanymi filtrami.
  6. Kliknąć „Promote this app” bez logowania — przejście na `/login?next=%2Fapps%2Fpulse-coach`.
  7. Wejść na `/apps/stealth-draft-app` lub `/apps/pending-review-app` — brak dostępu (strona nie istnieje).
- **Bez Dockera (lokalny sandbox SQL PGlite):**
  - `LOCAL_PGLITE_SANDBOX=1 pnpm dev` (z danymi z `supabase/seed.sql`) albo `LOCAL_PGLITE_SANDBOX=1 LOCAL_PGLITE_SEED=0 pnpm dev` (pusty stan katalogu).

---

## Etap 4 — dołączenie twórcy, przewodnik, programy i linki (2026-10-25)

### Co zbudowano

- **Baza, członkostwa i nazwane linki (`supabase/migrations/20261024222139_creator_programs_and_links.sql`):**
  - tabela `public.creator_program_memberships` (`app_id`, `creator_id`, `accepted_terms_version_id`, `referral_code`, `joined_at`) z unikalnością `(app_id, creator_id)` oraz `referral_code` i wyzwalaczem niezmienności `creator_program_memberships_immutable`;
  - tabela `public.creator_referral_links` (`membership_id`, `app_id`, `creator_id`, `label`, `channel`, `destination_kind`, `target_url`, `token`, `is_default`, `created_at`) z wyzwalaczem `enforce_referral_link_integrity`, który weryfikuje własność członkostwa, limit 25 linków i zgodność `target_url` z dozwolonym celem aplikacji (`website_url`, `ios_store_url`, `android_store_url`) — dowolny zewnętrzny URL jest odrzucany w bazie nawet przy zapisie uprzywilejowanym;
  - RPC `public.join_program`: wymaga zalogowania, uzupełnionego profilu społecznościowego (`creator_is_ready_to_promote()`), opublikowanej aplikacji i jawnej akceptacji bieżącej wersji warunków (`p_accepted_terms = true` + zgodny `p_accepted_terms_version_id`); powtórne i równoległe wywołania są idempotentne (`pg_advisory_xact_lock`) i zwracają istniejące członkostwo, tworząc przy pierwszym dołączeniu kod polecający oraz domyślny link (`Primary link`);
  - RPC `public.create_referral_link`: tworzenie nazwanych linków wyłącznie przez właściciela członkostwa, z wyborem kanału i dozwolonego celu aplikacji;
  - RPC `public.suggest_similar_apps_for_creator`: rekomendacje opublikowanych aplikacji na podstawie wspólnych kategorii z aktywnymi programami twórcy, z wykluczeniem już dołączonych programów i draftów, bez AI;
  - RLS i minimalne granty: twórca widzi tylko własne członkostwa i własne linki; nie może odczytać ani utworzyć linku w cudzym członkostwie.
- **Dołączenie z oferty aplikacji (`/apps/[slug]`):**
  - `PromoteCtaCard` sprawdza stan użytkownika: niezalogowany → `/login?next=/apps/[slug]`; zalogowany bez linku społecznościowego → `/onboarding/creator?next=/apps/[slug]` (po zapisaniu pierwszego profilu wraca prosto na `/apps/[slug]`); gotowy twórca → checkbox akceptacji widocznych warunków (`Terms vN`) + przycisk **Join program & get link**; twórca, który już dołączył → widzi swój kod i link z przyciskami kopiowania oraz przejście do szczegółów programu.
- **Przewodnik, My programs (`/creator/programs`), szczegóły programu (`/creator/programs/[slug]`) i Links (`/creator/links`):**
  - po dołączeniu twórca trafia na `/creator/programs/[slug]?joined=1`, gdzie widzi wspólne wprowadzenie platformy „How to promote on the marketplace” (`HowToPromoteGuide`), a pod nim swój kod polecający i główny link z przyciskami kopiowania (`CopyValueButton`), formularz tworzenia nazwanych linków, tabelę wszystkich linków programu oraz zaakceptowany snapshot warunków i stawek;
  - `/creator/programs` prezentuje wszystkie aktywne programy twórcy z kodem, głównym linkiem, stawkami i skrótem do szczegółów;
  - `/creator/links` pozwala tworzyć nazwane linki dla dowolnego aktywnego programu, filtrować tabelę po programie i kopiować URL-e jednym kliknięciem;
  - `/creator` (Overview) pokazuje uczciwy pusty stan dla zarobków i wyników (do czasu podłączenia atrybucji i płatności w E5–E7), karty aktywnych programów z kopiowaniem kodu/linku oraz sekcję **Similar apps to promote** opartą na kategoriach aktywnych programów.

### Weryfikacja etapu 4 (co faktycznie uruchomiono)

| Sprawdzenie | Wynik | Szczegóły |
|---|---|---|
| `pnpm typecheck` (`next typegen && tsc --noEmit`) | **pass** | 0 błędów |
| `pnpm lint` | **pass** | 0 błędów, 0 ostrzeżeń |
| `pnpm test` — jednostkowe (`src/modules/programs/schemas.test.ts` + E1/E2) | **pass** | 63/63 testów |
| `pnpm test` — baza na PGlite (`tests/db/programs.test.ts` + `catalog.test.ts` + `accounts.test.ts`) | **pass** | 50/50 testów (w tym 7 zestawów testów E4: blokada `anon`, wymóg profilu społecznościowego i akceptacji bieżącej wersji warunków, blokada dołączenia do draftu, idempotentne powtórne kliknięcie `join_program`, tworzenie nazwanych linków z dozwolonymi celami i blokada dowolnego URL także dla `service_role`, izolacja między twórcami A/B i zakaz tworzenia linków w cudzym członkostwie, rekomendacje podobnych aplikacji po kategoriach) |
| `pnpm build` | **pass** | Wszystkie trasy (w tym `/creator/programs/[slug]`) budują się bez błędów |
| Weryfikacja w przeglądarce (desktop + mobile `390×844`) | **pass** | Walidacja próby dołączenia bez zaznaczenia warunków → zaznaczenie warunków i kliknięcie „Join program & get link” → przekierowanie na `/creator/programs/pulse-coach?joined=1` z przewodnikiem „How to promote”, kodem i linkiem → kopiowanie kodu/linku → utworzenie nazwanego linku „Instagram bio” kierującego do App Store (iOS) → sprawdzenie `/creator` (skrót programu + 3 podobne aplikacje z kategorii Fitness/Lifestyle) oraz `/creator/links` na mobile |
| `pnpm test:integration` (`tests/integration/programs.test.ts` przez PostgREST) | **blocked** | Wymaga `supabase start` (B-01) |

### Jak przetestować ręcznie etap 4

1. Otworzyć `http://localhost:3001/login` i zalogować się kontem twórcy (np. `creator@example.com` lub `demo@example.com` albo utworzyć nowe konto na `/signup` i dodać profil społecznościowy).
2. Wejść na ofertę w katalogu, np. `http://localhost:3001/apps/pulse-coach`.
3. Spróbować kliknąć **Join program & get link** bez zaznaczenia checkboxa warunków — formularz pokaże błąd walidacji.
4. Zaznaczyć akceptację warunków (`Terms v1`) i kliknąć **Join program & get link** — nastąpi natychmiastowe dołączenie i przejście na `/creator/programs/pulse-coach?joined=1`.
5. Sprawdzić wprowadzenie „How to promote on the marketplace”, skopiować kod (`PULSE-…`) i główny link przyciskami **Copy code** / **Copy link**.
6. W sekcji **Create a named link** utworzyć nazwany link (np. `Instagram bio`, kanał `Instagram`, cel `App Store (iOS)`) i skopiować jego URL z tabeli.
7. Przejść na `/creator/programs`, `/creator/links` oraz `/creator` (Overview) — sprawdzić listę programów, filtrowanie linków, uczciwy pusty stan zarobków oraz sekcję **Similar apps to promote**.

---

## Etap 3 — firma dodaje aplikację, administrator publikuje (2026-10-25)

### Co zbudowano

- **Baza, przepływ publikacji i kontrola dostępu do plików (`supabase/migrations/20261024224000_company_submission_and_review.sql`):**
  - rozszerzenie `public.apps` o metadane przeglądu (`publish_environment`, `submitted_at`, `reviewed_at`, `reviewed_by`, `rejection_reason`);
  - niezmienny dziennik decyzji przeglądu `public.app_review_events` (`submitted`, `approved`, `rejected`) z RLS dla członków organizacji i admina;
  - tabela zasobów mediów `public.app_media_assets` (`logo`, `cover`, `screenshot`, `video`) z wyzwalaczem integralności `enforce_media_asset_integrity` i politykami RLS gwarantującymi, że pliki draftu firmy A nie są widoczne dla firmy B ani `anon`, dopóki aplikacja nie ma zatwierdzonego wydania;
  - RPC `public.save_app_draft`, `public.upsert_app_plan`, `public.delete_app_plan`, `public.submit_app_for_review` (tylko właściciel organizacji) oraz `public.admin_review_app` (tylko administrator platformy; blokuje publikację `live` do czasu weryfikacji integracji i finansowania w E6/E8, publikuje w oznaczonym środowisku `demo` lub odsyła z wymaganym uzasadnieniem `rejection_reason`);
  - polityka `private.can_org_member_read_creator` pozwalająca firmie widzieć w `/company/creators` twórców, którzy dołączyli do jej programu, wraz z ich linkami społecznościowymi i kodem polecającym.
- **Panel firmy (`/company`, `/company/app`, `/company/app/preview`, `/company/plans`, `/company/creators`):**
  - `/company/app`: karta statusu publikacji i checklisty gotowości (`AppSubmissionStatusCard` — pokazuje status `Draft`, `Submitted for review`, `Published (Demo)` lub `Changes requested` z powodem odrzucenia od admina), przycisk **Submit for admin review** oraz pełny edytor draftu (`AppDraftEditorForm`: nazwa, slug, opis krótki i pełny, kategorie, platformy, języki, linki do strony i sklepów, grafika kafelka, logo, screeny, film, warunki programu i okno atrybucji);
  - `/company/app/preview`: prywatny podgląd publicznego profilu (`/apps/[slug]`) na podstawie bieżącego roboczego draftu i roboczych planów, dostępny wyłącznie dla członków firmy i admina;
  - `/company/plans`: zarządzanie abonamentami aplikacji (`PlansManager`) z oddzielnymi polami nazwy planu i identyfikatora w systemie płatności (`external_plan_key`), ceną parsowaną bez floatów do `bigint` i osobnym procentem prowizji każdego planu, oraz tabelą opublikowanych historycznych wersji warunków (`Terms vN`);
  - `/company/creators`: lista twórców, którzy dołączyli do programu firmy, z ich profilami społecznościowymi, kodem polecającym i zaakceptowaną wersją warunków.
- **Panel administratora (`/admin`):**
  - kolejka **Submitted & waiting for review** oraz przegląd pozostałych ofert (`AdminReviewCard`): pełna checklista, tabela planów i stawek, warunki programu, przycisk **Approve & publish (Demo)** (tworzący nową wersję warunków i publikujący w katalogu demo) oraz formularz **Send back with reason** (odrzucenie z wymaganym uzasadnieniem widocznym dla firmy).

### Weryfikacja etapu 3 (co faktycznie uruchomiono)

| Sprawdzenie | Wynik | Szczegóły |
|---|---|---|
| `pnpm typecheck` (`next typegen && tsc --noEmit`) | **pass** | 0 błędów |
| `pnpm lint` | **pass** | 0 błędów, 0 ostrzeżeń |
| `pnpm test` — jednostkowe (`src/modules/company-app/schemas.test.ts` + E1/E2/E4) | **pass** | 66/66 testów (parsowanie kwot do `bigint`, procentów do `bps`, checklista gotowości) |
| `pnpm test` — baza na PGlite (`tests/db/company-review.test.ts` + pozostałe) | **pass** | 53/53 testów (limit 1 aplikacji, izolacja draftów/planów/mediów między firmą A i B oraz `anon`, pełny cykl `draft → submitted → rejected z uzasadnieniem → poprawka → approved (demo)`, blokada `live` bez integracji i finansowania, wersjonowanie zmian opublikowanego profilu i stawek bez ujawniania niezatwierdzonego draftu publicznie) |
| Weryfikacja w przeglądarce (`localhost:3001`) | **pass** | `/company`, `/company/app`, `/company/app/preview`, `/company/plans`, `/company/creators` oraz `/admin` (kolejka zgłoszeń z checklistą i akcjami zatwierdzenia/odrzucenia) |

## Naprawy i odbiór przed etapem 5 — 26.10.2026

Ten wpis aktualizuje wcześniejsze historyczne `blocked`. Etapu 5 nie implementowano.

### Wdrożone poprawki

- F1: twórca odczytuje zaakceptowane historyczne warunki i stawki po kolejnych publikacjach. Obce konta nie otrzymują tego dostępu.
- F2: `app_media_assets` jest prywatnym inwentarzem draftu. Publiczne referencje pochodzą wyłącznie z zatwierdzonego wydania. Dodano prywatny bucket `app-media`, kontrolę organizacji, niezmienne ścieżki plików, walidację sygnatur/MIME i wielkości oraz trasę `/media/apps/...` z RLS i bezpiecznymi nagłówkami. Upload w panelu firmy; administrator może obejrzeć komplet mediów. Zewnętrzne URL-e pozostają zewnętrznymi, publicznymi zasobami — aplikacja nie deklaruje ich ochrony.
- F3: usunięcie planu archiwizuje go przez `is_active=false`; historia i klucz obcy pozostają. Aktualizacja aktywnego planu przy limicie 20 działa, przywrócenie dodatkowego planu nie omija limitu.
- F4: stare `admin_publish_app` nie jest wykonywalne przez role API, także administratora. Publiczny proces przeglądu wymaga statusu `submitted` i numeru obejrzanej rewizji. Zmiana profilu, planów lub nazwy firmy unieważnia zgłoszenie; ponowna decyzja nie tworzy kolejnego wydania.
- F5: `external_plan_key` i `plan_id` historycznych stawek nie są dostępne zwykłym zalogowanym kontom. Firma korzysta z prywatnych roboczych planów; katalog pokazuje publiczną projekcję.
- Ujednolicono polityki SELECT wskazane przez advisories; minimalne granty i izolacja zachowane.
- Naprawiono kolizję niezmiennych snapshotów z referencyjnymi akcjami FK przy usuwaniu całej aplikacji i odpinaniu usuniętego autora. Treść warunków, stawek i decyzji nadal jest niezmienna.
- `listCompanyCreators` sprawdza błędy wszystkich zapytań.
- Cache Components i Partial Prefetching włączone jawnie; dynamiczne strony mają granicę Suspense, a inicjalizacja SDK jest poprzedzona `io()` zgodnie z lokalną dokumentacją Next.js 16.4. Font jest lokalny, wraz z OFL. Standardowy Tailwind PostCSS i Webpack eliminują zależność buildu od Google Fonts i problematycznego IPC Turbopacka.
- Typy bazy wygenerowane z prawdziwego lokalnego Postgresa, zapis atomowy; CI blokuje rozjazd typów. Testy integracyjne odczytują lokalną konfigurację bez wypisywania kluczy; brak środowiska kończy się błędem zamiast pozornego sukcesu z pominiętymi testami.
- Sandbox PGlite jest wyłącznie developerski, zawsze zablokowany w produkcji; nie emuluje Storage. Bieżące `.env.local` używa prawdziwego lokalnego Supabase.

### Migracje i środowisko

Dodano cztery migracje: `20261026211649_stage_1_4_hardening.sql`, `20261026211934_private_app_media.sql`, `20261026212738_review_policy_cleanup.sql`, `20261026212932_immutable_reference_cleanup.sql`. Poprzednich migracji nie zmieniono. Lokalny Supabase tego projektu działa na portach 553xx (API 55321, Postgres 55322, Mailpit 55324), aby nie kolidować z innymi projektami. Aplikacja: http://localhost:3000.

Istniejąca baza: `pnpm exec supabase db push --local --yes`, potem `pnpm db:types`, `pnpm db:advisors`, `pnpm test:integration`. Nie trzeba usuwać jej danych. `db:reset` jest przeznaczone tylko dla bazy jednorazowej.

### Weryfikacja końcowa

- **pass — `pnpm lint`:** 0 błędów i ostrzeżeń.
- **pass — `pnpm typecheck`:** typy tras i TypeScript.
- **pass — `pnpm test`:** 14 plików, 132 testy (jednostki i migracje/RLS na PGlite). Nowe regresje obejmują historię po republikacji, archiwizację planu, limit aktywnych planów, stare RPC, stale review, retry decyzji, prywatność mediów i referencje FK.
- **pass — `pnpm test:integration`:** 4 pliki, 18 testów na prawdziwym lokalnym Supabase; bez pominięć. Izolacja kont, równoległe zapisy/join, proces firmy, równoległe akceptacje, Storage przed/po publikacji, historyczne warunki i sprzątanie własnych fixture’ów.
- **pass — `pnpm build`:** 38 tras; statyczne, PPR i dynamiczne zgodnie z raportem Next.js. `next start` działa na http://localhost:3000. Granice `io()` przed SDK i klient anonimowy bez inicjalizacji Auth usuwają błędy `Date.now()` przy prerenderowaniu/prefetchu; po końcowym uruchomieniu brak tych błędów w logach.
- **pass — odtworzenie pustej lokalnej bazy:** `supabase db reset --local --yes` zastosował wszystkie osiem migracji i seed bez błędów. To wyłącznie jednorazowy stos `marketplace-roch` utworzony w tej sesji; inne projekty i chmura nie były modyfikowane. Powtórny zestaw 18 integracji przeszedł na odtworzonej bazie.
- **pass — `pnpm db:types`:** wygenerowane ponownie typy są identyczne z plikiem w projekcie (porównanie `diff -q`).
- **pass — `pnpm db:advisors`:** brak problemów (`results: []`), również po odtworzeniu bazy.
- **pass — lokalny Auth/SMTP:** rejestracja bez sesji → e-mail w Mailpit → rzeczywisty callback Next `/auth/confirm` → onboarding i cookies sesji. Osobno e-mail recovery → callback → `/reset-password` i cookies. Nie zmieniano hasła prawdziwego użytkownika.
- **pass — UI na prawdziwej sesji Supabase:** logowanie → panel firmy → odrzucenie SVG → upload PNG → zapis draftu → submit → akceptacja administratora → Published (Demo) → wylogowanie. Żądanie HTTP bez sesji dla tego samego pliku: 404 przed akceptacją, 200 po. Desktop 1280×900 i mobile 390×844: brak poziomego overflow panelu. Dowód: `docs/verification/stage-1-4-desktop.jpg`. Konto QA i plik były jednorazowe.

Historyczne tabele testów z 24–25.10 pozostają zapisem ówczesnego stanu, nie bieżącymi blockerami. Po usunięciu danych QA katalog ponownie pokazuje osiem wyłącznie lokalnych ofert seeda i nie zgłasza błędów przeglądarki. GitHub Actions nie uruchamiano zdalnie; wykonano jego komendy lokalnie. Nie jest to odbiór E9 ani uruchomienie live.

## Historyczne blokery i pozostałe ograniczenia

| ID | Opis | Wpływ | Obejście / akcja |
|---|---|---|---|
| B-01 (zamknięty 26.10) | Lokalny Docker i Supabase działają; porty 553xx. | Integracje i Auth/Storage odebrane lokalnie. | Utrzymywać uruchomiony Docker do testów bazy. |
| B-05 (zamknięty dla bieżącego odbioru) | Historyczne problemy miejsca na dysku nie blokują już buildu i lokalnej bazy. | Bieżące kontrole pass. | Nadal monitorować wolne miejsce. |
| B-02 | Brak projektu Supabase w chmurze i kluczy | Brak środowiska hostowanego | E1 działa lokalnie; projekt w chmurze potrzebny przed pilotażem |
| B-03 | Brak kluczy Stripe / RevenueCat / operatora | Testy z dostawcą w E6/E8 | Jawne fixtures i sandbox; testy z dostawcą oznaczone `blocked` |
| B-04 | Otwarte decyzje biznesowe P-01…P-09 | Blokują wyłącznie operacje live z prawdziwymi pieniędzmi | Sandbox zgodnie z `DECISIONS.md`; live wyłączone |
| R-01 | Superpowers i react-best-practices tylko w tymczasowym cache Codexa; Trail of Bits brak | Możliwa utrata dostępu do instrukcji | Zalecana stała instalacja skilli w projekcie |

## Etap 5 — bezpieczne przekierowania, przypisanie i statystyki (26.10.2026)

### Co wdrożono

- `/r/[token]`: sprawdzony cel z aktualnego zatwierdzonego wydania, brak dowolnych redirectów, niecache'owane 302, oddzielny losowy token kliknięcia przekazywany do web przez `bl_ref`. HEAD/prefetch nie tworzą kliknięć. Dla mobile kod przy rejestracji; brak obietnicy zachowania polecenia przez instalację.
- `POST /api/v1/customers`: uwierzytelnienie sekretem konkretnej aplikacji, ścisła walidacja i limity, komunikacja backend–backend. Bez konta klienta na BoostLink. Sekrety i tokeny są przechowywane w bazie jako prywatne skróty; klient aplikacji nie otrzymuje sekretu.
- `private.attribution_policy()`: jedna konfiguracja propozycji sandbox P-03/P-04/P-05. Jawny kod przed linkiem, ostatnie ważne kliknięcie, okno 30 dni, blokada trybu live i odmiennego reklamowanego okna.
- Atomowa mapa tożsamości klienta, blokada wyścigów, unikalność per aplikacja, niezmienne przypisanie i idempotentne retry. Także konto organiczne pozostaje organiczne; instrukcja wymaga zgłaszania wszystkich rejestracji i wprowadzenia starych kont przed integracją.
- Snapshot wersji całej tabeli warunków/stawek z chwili rejestracji i zachowanie odczytu historii twórcy po republikacji. Brak płatności i wyliczeń prowizji.
- Rzeczywiste kliknięcia/rejestracje w Overview twórcy i firmy, Links oraz Referrals. Osobne źródło kodu, porównanie wyników poszczególnych linków, stronicowana lista pseudonimów klientów. Dostęp ograniczony przez RLS; brak PII i źródłowego ID klienta w panelach.
- Skrypt nadania/rotacji klucza `scripts/attribution-key.mjs` i samodzielna lokalna aplikacja HTTPS `examples/attribution-demo/server.mjs`, która trzyma sekret i przechwycone tokeny na swoim backendzie.

### Migracja i uruchomienie

Nowa migracja: `supabase/migrations/20261026222235_referral_attribution.sql`. Nie zmieniono wcześniejszych migracji. Dla istniejącej lokalnej bazy: `pnpm exec supabase db push --local --yes`, następnie `pnpm db:types`, `pnpm db:advisors`, `pnpm test:integration`. BoostLink nie wymaga nowej zmiennej środowiskowej ani uprzywilejowanego klucza w serwerze web. Zewnętrzny backend aplikacji przechowuje `BOOSTLINK_API_URL` i `BOOSTLINK_APP_API_KEY`; demo ma własny szablon konfiguracji.

Instrukcja integracji, kontrakt dla frontendu i pełny scenariusz ręczny: [ATTRIBUTION_INTEGRATION.md](ATTRIBUTION_INTEGRATION.md).

### Weryfikacja

- **pass — `pnpm lint`:** 0 błędów i ostrzeżeń.
- **pass — `pnpm typecheck`:** typy tras i TypeScript, także testy integracyjne.
- **pass — `pnpm test`:** 16 plików, 147 testów. Obejmuje pełny łańcuch migracji na PGlite, granicę HTTP, wygaśnięcie, ostatnie ważne kliknięcie, pierwszeństwo kodu, retry, organiczne konto bez możliwości przejęcia, obcą aplikację, próby zapisu z frontendu, niezmienność, niedozwolony redirect, niezgodne okno i limity.
- **pass — `pnpm test:integration`:** 5 plików, 23 testy na prawdziwym lokalnym Supabase, bez pominięć. Osiem równoległych przypisań dwóch twórców daje jeden rekord i jedną odpowiedź `created`; izolacja dwóch firm i twórców, kontrakt HTTP z prawdziwym RPC, rotacja oraz snapshot stawek po dwóch republikacjach. Pozostałe testy E1–E4 również pass.
- **pass — `pnpm build`:** 39 stron w generowaniu; nowe trasy `/r/[token]` i `/api/v1/customers` są dynamiczne. Cache Components i Partial Prefetching pozostają aktywne.
- **pass — `pnpm db:advisors`:** `results: []`, brak problemów. Migracja E5 zastosowana lokalnie; podczas prac funkcje dopracowano bez resetowania bazy. Pełna finalna migracja była wykonywana od zera w testach PGlite; odbiór funkcji i uprawnień wykonano przez realny PostgREST. Nie resetowano potrzebnych danych użytkownika ani innych stosów.
- **pass — rzeczywisty HTTP Next:** 302 z tokenem `bl_ref` i no-store; próba podania redirectu daje 400, HEAD daje 405; link/kod tworzą 201, retry tego samego klienta daje 200 i ten sam rekord, brak sekretu daje 401.
- **pass — aplikacja demonstracyjna HTTPS:** przechwycenie tokenu we własnej sesji, rejestracja z backendu do Next, retry 200 i brak sekretu w HTML. Sprawdzono również brak konkretnego sekretu QA w `.next/static`. Certyfikat i konta były wyłącznie lokalne i jednorazowe.
- **pass — UI z prawdziwymi sesjami:** panele Referrals twórcy i firmy pokazują 1 rzeczywiste kliknięcie, 2 rejestracje linkiem i 1 kodem z testowego flow; kod nie zwiększa wyniku linku. Są pseudonimy i nazwa aplikacji, bez źródłowych ID/PII. Szerokości 390 i 1280 px: brak poziomego overflow całej strony, brak błędów/ostrzeżeń konsoli. Dowód: `docs/verification/stage-5-referrals.png`.
- Jednorazowe konta, aplikację i klucz QA usunięto po odbiorze; statystyk demonstracyjnych nie zapisano w seedzie. Katalog wraca do lokalnych ofert seeda. Odbiór nie oznacza uruchomienia live ani etapu 6.


### Granice etapu

Tylko sandbox/demo. P-03/P-04/P-05/P-07 nadal wymagają zatwierdzenia dla live. Liczba kliknięć nie oznacza unikalnych ludzi i może obejmować boty; nie stosujemy fingerprintingu. Dane i konta aplikacji demonstracyjnej są w pamięci, a certyfikat jest lokalny i jednodniowy. Nie uruchomiono płatności, naliczania prowizji, finansowania ani wypłat. Cloud/pilotaż nadal wymagają B-02/B-03/B-04.

## Historyczny następny krok po E5

**ETAP 6** — integracje płatności Stripe/RevenueCat/Generic API po osobnym zleceniu. E5 zapisuje stabilny identyfikator przypisania i historyczną wersję warunków potrzebne kolejnym etapom. Frontend może niezależnie dopracowywać etapy 1–4 według swojego zakresu; przy zmianie wspólnych stron uzgadnia kontrakt modułu atrybucji.

## Etap 6 — zakupy, odnowienia i integracje backendu (27.10.2026)

### Wdrożono

- Wspólny `PaymentEvent` i adaptery Stripe/RevenueCat/Generic, po sprawdzeniu aktualnej oficjalnej dokumentacji. Weryfikacja podpisów na raw body, Bearer RC, kont i środowisk, brak sekretów w przeglądarce i brak pozornego dowodu sprzedaży Generic.
- Trwały inbox przed HTTP 200, prywatne payloady i osobny worker CLI. Lease, równoległe pobieranie SKIP LOCKED, backoff, limit prób, przejęcie po awarii i ręczny retry. Cały efekt biznesowy oraz zmiana statusu atomowe. Osobne serwerowe tokeny E6 nie naruszają kluczy E5.
- Oddzielne mapowania klientów aplikacji/operatora, produktów/planów i referencji charge/payment intent do faktury. Braki trafiają do waiting, nie znikają. Wewnętrzny identyfikator kupionego planu jest utrwalony dla przyszłego E7, bez publicznego grantu odczytu.
- Deduplikacja eventów, zakupów i korekt; sprzeczny payload zachowuje oryginał. Jeden autorytatywny provider na sklep/aplikację/środowisko zapobiega lustrzanemu liczeniu Stripe i RC. Zakup nie dubluje się w timeline przy drugiej notyfikacji faktury.
- Zakupy/odnowienia, stany subskrypcji, wyłączenie odnowienia, refundy i spory. Płatność 0/trial nie kwalifikuje; refund nie wynika z samego anulowania. Zdarzenia są porządkowane czasem dostawcy; niejednoznaczny remis stanów wstrzymuje aktywność/płatną kwalifikację do nowszego autorytatywnego zdarzenia.
- Panel Integrations: konfiguracja, instrukcja, mapowania, ostatni odbiór/sukces, odróżnienie Configured/Verified, diagnoza błędów i ponowienie. Brak nowego redesignu; wydzielone kontrakty serwerowe dla kolegi.
- Płacący klienci i aktywni płacący subskrybenci w istniejących panelach, timeline konkretnego klienta bez PII. Odczyty RLS oraz jawne rozdzielenie kontekstów przy obu rolach na jednym koncie.
- Live zapisany osobno i zablokowany. Nie wdrożono prowizji, dziennika, finansowania ani wypłat.

### Migracja i środowisko

Migracja: `supabase/migrations/20261026225312_payment_integrations.sql`. Nie zmieniono wcześniejszych migracji ani nie resetowano bazy użytkownika. `pnpm exec supabase db push --local --yes`, `pnpm db:types`, `pnpm db:advisors`, `pnpm payments:setup`, restart Next; osobno `pnpm payments:worker`. Nowe zmienne serwerowe: `PAYMENT_BACKEND_TOKEN`, `PAYMENT_WEBHOOK_SECRETS_JSON`. Klucze uprzywilejowane Supabase nadal wyłącznie w skryptach/testach. Szczegółowy kontrakt i odbiór ręczny: [PAYMENT_INTEGRATIONS.md](PAYMENT_INTEGRATIONS.md).

### Weryfikacja lokalna

- **pass — `pnpm test`: 18 plików / 168 testów.** Cały łańcuch migracji na PGlite, RLS, brak podwójnego zakupu, 0/trial, refund/spór, kolejność i remisy stanów, brakujące mapowania, retry, lease, izolacja live oraz kontekst obu ról.
- **pass — `pnpm test:integration`: 6 plików / 28 testów** przez rzeczywisty lokalny Supabase Auth/PostgREST. E6 obejmuje 12 równoległych dostarczeń, dodatkowe dostarczenia podczas przetwarzania i dwóch konkurujących workerów; jeden zakup, bez utraty eventów. Nie jest to test sandboxa operatora.
- **pass — `pnpm lint`, `pnpm typecheck`, `pnpm build`.** Sprawdzono bieżący build, w tym odczyt dat PostgreSQL ze strefą czasową w timeline.
- **pass — `pnpm db:types`: brak różnic względem zapisanych typów; `pnpm db:advisors`: No issues found.** Lokalna baza użytkownika nie była resetowana.
- **pass — rzeczywisty lokalny HTTP + CLI worker na jawnych fixtures.** Stripe, RevenueCat i Generic dotarły do kolejki i zostały przetworzone; zakup i odnowienie widoczne, lustrzany event RC/Stripe pominięty. Dodatkowy odbiór po wznowieniu potwierdził HTTP 401 dla fałszywego podpisu, brak zakupu przed workerem, zapis po workerze i brak duplikatu po ponownym dostarczeniu. Brak mapowania pozostawił event w waiting z instrukcją naprawy.
- **pass — odczyt czterech widoków przez HTTP SSR** z oddzielnymi sesjami syntetycznej firmy/twórcy: Integrations, Referrals i szczegóły klienta po obu stronach. Obie role widzą poprawne płatne metryki i timeline; Configured/Verified wynika z backendu. Nie zmieniano sesji przeglądarkowej użytkownika. Osobnego odbioru wizualnego w Chrome nie wykonano — ta przeglądarka nie była dostępna w narzędziu.
- **pass — skan `.next/static`: brak rzeczywistych sekretów testowych i tokenu backendu.** Usunięto wyłącznie jednorazową aplikację QA, jej trzy syntetyczne konta i trzy sekrety; zachowano wcześniejsze konta i dane. Uruchomiono ponownie Next i osobny lokalny worker bez tych sekretów.
- Brak nierozwiązanych wyników **fail** w wykonanych końcowych kontrolach. Nie oznacza to odbioru live ani prawdziwego zakupu u dostawcy.

### Testy dostawców i granice

- **blocked — prawdziwy zakup/odnowienie Stripe sandbox:** brak skonfigurowanego dostępu i sekretów konta dostawcy. Poprawnie podpisany lokalny fixture nie jest takim zakupem.
- **blocked — prawdziwy zakup/odnowienie RevenueCat sandbox:** brak dostępu do projektu/aplikacji i transakcji sklepowej. Fixtures są opisane jawnie, a dashboard TEST sam nie daje Verified.
- Obsługiwane ograniczenia adapterów są jawne w instrukcji: Stripe snapshot, pojedyncza pozycja abonamentowa; złożone/proracyjne faktury i nieznane waluty nie są zgadywane. Niejednoznaczne stany wymagają nowszego autorytatywnego zdarzenia. To nie jest odbiór live/pilotażu.

## Historyczny następny krok po E6

**ETAP 7 — prowizje, historia stawek i zamknięcie miesiąca**, zlecony w kolejnym kroku. Równolegle operator może dostarczyć dostępy do rzeczywistego odbioru Stripe/RevenueCat, a kolega kontynuować UI/UX na kontraktach modułów E5/E6.

## Etap 7 — prowizje, dziennik i zamknięcie miesiąca (27.10.2026)

### Wdrożono

- Prowizje od zakupów i odnowień E6 z historycznej tabeli klienta E5. Oddzielne sprzedaż/basis/brutto/opłata/kwota twórcy, bigint i zgodna reguła half-up SQL/TS. Brak domyślnej stawki platformy; policy i basis są jawne. Nieznany plan/waluta tworzy sprawę; trial/0/organiczne/live nie naliczają prowizji.
- Niezmienny, bilansowany dziennik z constraintem sumy postings zero i prywatną projekcją. Korekty dopisywane, zapis i status atomowe; współbieżne zadania są serializowane per aplikacja, bez podwójnego skutku.
- Częściowe/full refundy, cofnięcia i spory. Blokada held; przywrócenie kwoty nie przekracza ponownie użytego finansowania. Refund po symulowanym payout tworzy sprawę bez automatycznego przypisania kosztu.
- Idempotentne zamknięcie ukończonego miesiąca UTC oraz niezmienne zestawienia firmy/twórcy per waluta. Późne zdarzenia mają oryginalną transakcję/okres, czas źródłowy i otwarty miesiąc księgowania. Starszy niezamknięty miesiąc nie uwalnia się przy close innego okresu.
- Kontrolowane funding fixtures dostępne wyłącznie operatorowi. Późniejsze sfinansowanie zwalnia wcześniejsze zamknięte należności bez kolejnego close. Symulacja in_payout/paid służy testom, bez realnego przelewu.
- Earnings, Overview, zestawienia w Funding & statements i szczegóły klienta podłączone do danych E7. Bez PII, sekretów i mutacji finansowych frontendu. Osobny worker, narzędzie operatora, instrukcja i playbook dostępów dla właściciela. Redesign nadal u kolegi.

### Migracja i uruchomienie

`20261027185130_commission_ledger.sql`; zastosowano lokalnie bez resetu. `pnpm db:types`, `pnpm db:advisors`; worker `pnpm commissions:worker` obok E6. Brak nowych zmiennych: używany jest serwerowy ograniczony token E6. Konfiguracja polityki/funding fixtures wymaga operatora; nic nie ustawia automatycznie stawki 10%. Kontrakt i ręczny odbiór: [COMMISSION_ACCOUNTING.md](COMMISSION_ACCOUNTING.md). Dostępy: [PROVIDER_SANDBOX_PLAYBOOK.md](PROVIDER_SANDBOX_PLAYBOOK.md).

### Weryfikacja

- **pass — `pnpm test`: 20 plików / 180 testów**, w tym 10 migracyjnych testów E7 i 2 kalkulatora. Historyczne stawki i zmiana planu/odnowienie, roczna płatność, dokładne kwoty, trial/0/live, nieznany plan, częściowe/full refundy i cofnięcia, spór, sprawa po payout, niezmienne zestawienie, brak przekroczenia ponownie użytego finansowania i ochrona własnego miesiąca zamknięcia.
- **pass — `pnpm test:integration`: 7 plików / 34 testy** na prawdziwym lokalnym Supabase, w tym 6 E7. Dwa równoległe workery, dwa równoległe close, jednoczesne powtórzone funding oraz refund dały pojedynczy skutek finansowy. Sprawdzono RLS i odmowę mutacji przez frontend/obcego użytkownika.
- **pass — rzeczywisty CLI E7 worker** z ograniczonym tokenem, bez klucza uprzywilejowanego i z filtrem własnej aplikacji testowej. Późna zadeklarowana płatność została zaksięgowana raz.
- **pass — HTTP SSR** aktualnego builda: Earnings twórcy, Funding & statements firmy i szczegóły klienta, na odrębnych sesjach jednorazowych kont QA. Widoki zawierały wyliczenia, zestawienia i korekty bez błędów serwera. Nie zmieniano cookies użytkownika. To odbiór danych/SSR, nie nowy redesign ani wizualny test w przeglądarce.
- **pass — `pnpm lint`, `pnpm typecheck`, `pnpm build`, zgodność `pnpm db:types`, `pnpm db:advisors` bez problemów.** Lokalna baza nie była resetowana; jednorazowe aplikacje, konta, tokeny i polityki testowe usunięto przez cleanup suite.
- Brak nierozwiązanych wyników **fail** w końcowych kontrolach. Brakujące rzeczywiste zakupy dostawców i live nadal **blocked**; nie są zaliczane jako pass.

### Granice

P-01/P-02/P-06/P-07/P-09/P-12…P-14 pozostają propozycjami sandbox. Realne pieniądze i live są wyłączone. Prawdziwe zakupy Stripe/RevenueCat nadal **blocked** przez brak dostępów; E7 nie zmienia tego statusu. Testy nie zastępują odbioru kont dostawców.

## Następny krok

**ETAP 8 — finansowanie firm, auto-doładowania i wypłaty w sandboxie**, wyłącznie po osobnym zleceniu. E8 musi zastąpić kontrolowane funding fixtures rzeczywistymi potwierdzeniami operatora, zachowując dziennik i idempotencję. Etapu 8 nie rozpoczęto.
