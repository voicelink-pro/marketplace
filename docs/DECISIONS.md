# Decyzje projektowe

Źródło prawdy produktowej: `MARKETPLACE_BRIEF_I_PROMPTY.md` (wersja po rozmowie z założycielami, 24.10.2026).
Przy sprzeczności ze starszymi materiałami obowiązuje brief.

Dokument ma trzy rozłączne kategorie. Nie przenoś pozycji między nimi bez jawnej zmiany statusu i daty.

| Kategoria | Kto decyduje | Czy można zmienić samodzielnie |
|---|---|---|
| **W — ustalenia właścicieli** | Założyciele (brief A1) | Nie. Zmiana tylko po decyzji właścicieli. |
| **P — propozycje do zatwierdzenia** | Propozycja zespołu, decyzja należy do właścicieli (brief A2) | Wartości działają wyłącznie w sandbox/fixtures. Live zablokowane do zatwierdzenia. |
| **T — decyzje techniczne** | Zespół implementacyjny | Tak, z wpisem w tym pliku. |

---

## W — Ustalenia właścicieli (brief A1)

Skrót dla śledzenia w kodzie i testach. Pełne brzmienie: brief, sekcja A1.

### Marka i współpraca
- **W-00 Nazwa platformy.** Właściciel zatwierdził nazwę 26.10.2026; od 27.10.2026 obowiązuje pisownia wyłącznie małymi literami: **boostlink** — w interfejsie, metadanych i dokumentacji, także na początku zdania. Wspólna konfiguracja `src/config/site.ts` zasila nazwę w interfejsie i metadanych. Nazwa repozytorium i identyfikator lokalnego stosu Supabase pozostają identyfikatorami technicznymi.

### Marketplace publiczny
- **W-01** `/` jest od razu katalogiem z wyszukiwarką; brak landing page przed katalogiem.
- **W-02** Bez konta można przeglądać cały katalog, profile aplikacji i warunki prowizji.
- **W-03** Kafelki: duża grafika, nazwa, krótki opis, prowizja.
- **W-04** Filtry: kategoria, prowizja, platforma, język aplikacji. **Bez** filtra ceny abonamentu.
- **W-05** Każda aplikacja ma pełną stronę pod własnym adresem `/apps/[slug]` (nie modal).
- **W-06** Strona aplikacji: opis, warunki prowizji, screeny, film.
- **W-07** Przy różnych stawkach karta pokazuje zakres (np. „15–25% recurring”), szczegóły pełną tabelę. Najwyższa stawka nie jest przedstawiana jako zawsze obowiązująca.

### Twórca
- **W-10** Przed promowaniem musi podać co najmniej jeden URL profilu społecznościowego.
- **W-11** W MVP URL wystarcza; profil **nie** jest oznaczany jako zweryfikowany.
- **W-12** Dołącza do aktywnego programu natychmiast, bez zgody firmy.
- **W-13** Po dołączeniu: wspólne wprowadzenie „jak promować”, potem link i kod.
- **W-14** Może tworzyć wiele nazwanych linków do tej samej aplikacji.
- **W-15** Brak obowiązkowego zgłaszania/uploadu publikacji i ich zatwierdzania.
- **W-16** Po zalogowaniu: podsumowanie zarobków i wyników, skróty do programów, propozycje podobnych aplikacji.
- **W-17** Metryki: kliknięcia, zarejestrowani klienci, klienci z płatnością, aktywni płacący subskrybenci, porównanie linków.
- **W-18** Historia poleconego klienta pod pseudonimem typu `Customer #A821`, z płatnościami i prowizjami, bez danych osobowych.
- **W-19** Polecenia samym kodem to osobne źródło; nie przypisujemy ich sztucznie do linku.

### Firma
- **W-20** W MVP jedna aplikacja na firmę; wiele aplikacji w V1.
- **W-21** Baza od początku rozdziela organizację i aplikację.
- **W-22** Firma przygotowuje profil, screeny, film, opis i warunki programu.
- **W-23** Różne procenty prowizji dla różnych abonamentów.
- **W-24** Oferta przechodzi przegląd administratora przed publikacją; poprawny formularz ≠ publikacja.
- **W-25** Firma wpłaca środki z góry, ustawia próg i kwotę automatycznego doładowania.
- **W-26** Nieudane auto-doładowanie wstrzymuje nowe polecenia; istniejących klientów i należności nie usuwamy.
- **W-27** Przy braku środków naliczamy prowizje od odnowień, ale ich wypłata czeka na finansowanie.
- **W-28** Firma dostaje miesięczne zestawienie rozliczeń; nie zastępuje ono finansowania z góry.

### Prowizje i wypłaty
- **W-30** Prowizja przez cały czas płacenia abonamentu przez poleconego klienta, bez limitu miesięcy.
- **W-31** Platforma pobiera jeden wspólny procent od prowizji twórcy (wartość nieustalona → P-01).
- **W-32** Zmiana stawek dotyczy nowych poleceń; wcześniej pozyskani klienci zachowują stawki.
- **W-33** Zarobki naliczają się w miesiącu, stają się dostępne po jego zamknięciu, jeśli są sfinansowane i spełniają wymagania operatora.
- **W-34** Twórca sam zleca wypłatę przyciskiem.
- **W-35** Brak własnego minimum wypłaty; respektujemy minimum operatora.
- **W-36** Brak osobnego 30-dniowego holda; granicą jest zamknięcie miesiąca.

### Zakres i kierunek (brief A3, D)
- **W-40** MVP to responsywny serwis web; brak własnej natywnej aplikacji marketplace.
- **W-41** Integracje MVP: link/kod + API backendu aplikacji, adapter Stripe (web/SaaS), RevenueCat (mobile). Własny SDK i atrybucja po instalacji — później.
- **W-42** Mobile w MVP wymaga kodu i mapowania konta klienta; przekierowanie do sklepu nie zachowuje polecenia.
- **W-43** V1 (po pilotażu): wiele aplikacji na firmę, potwierdzanie własności profili.

---

## P — Propozycje wymagające zatwierdzenia (brief A2)

**Zasada ogólna:** każda wartość poniżej działa tylko w sandboxie, fixtures lub danych demo. Kod live odmawia wykonania zależnej operacji (fail closed), dopóki właściciel nie zatwierdzi wartości. Wartości są w jednym module polityk/konfiguracji, nie rozproszone w kodzie.

| ID | Kwestia | Propozycja / zachowanie sandbox | Warunek uruchomienia live | Status |
|---|---|---|---|---|
| P-01 | Procent platformy | `10%` wyłącznie w oznaczonych fixtures. Konfiguracja produkcyjna **bez wartości domyślnej**; brak wartości blokuje naliczanie live. | Właściciel podaje stawkę | Otwarte |
| P-02 | Podstawa prowizji | Fixture: kwota zapłacona po rabacie, z podatkiem. Kalkulator przyjmuje jawne `commission_basis_minor`, nie zgaduje go. | Wybrana podstawa + poprawne mapowanie z operatora | Otwarte |
| P-03 | Pierwszy czy ostatni link | Ostatni ważny link przed rejestracją klienta | Jawne warunki programu przed publikacją | Otwarte |
| P-04 | Okno przypisania | 30 dni od kliknięcia do rejestracji | Jawne warunki programu przed publikacją | Otwarte |
| P-05 | Kod kontra link | Świadomie wpisany kod wygrywa, dopóki przypisanie nie zostało utrwalone | Jawne warunki programu przed publikacją | Otwarte |
| P-06 | Zwrot po wypłacie twórcy | Tworzy sprawę „wymaga rozpatrzenia”; brak automatycznego przypisania kosztu firmie, twórcy ani platformie | Uzgodniona polityka przed realnymi wypłatami | Otwarte |
| P-07 | Zmiana planu klienta | Snapshot całej tabeli stawek przy przypisaniu; stawka kupionego planu z tego snapshotu; nieznany nowy plan → sprawa do sprawdzenia | Uzgodniona polityka historycznych stawek i nowych planów | Otwarte |
| P-08 | Waluty i kraje wypłat | Model wielowalutowy; demo w EUR; brak automatycznego FX; brak sumowania różnych walut | Lista krajów/walut dostępna u wybranego operatora i dla podmiotu | Otwarte |
| P-09 | Miesiąc rozliczeniowy | Miesiąc kalendarzowy UTC; odblokowanie po wykonaniu zamknięcia i uzgodnienia | Zatwierdzona strefa czasowa i proces zamknięcia | Otwarte |
| P-10 | Język interfejsu | Angielski jako propozycja startowa (brief A3) | Potwierdzenie przy pilotażu | Propozycja briefu |
| P-12 | Zaokrąglanie prowizji | Sandbox: half-up do minor dla brutto i opłaty; twórca otrzymuje resztę | Zatwierdzona reguła podziału realnych pieniędzy | Otwarte |
| P-13 | Częściowy refund | Sandbox: proporcjonalna redukcja podstawy względem zapłaconej sprzedaży, obcięta do minor; ponowne wyliczenie z pierwotnych stawek | Zatwierdzona podstawa i reguła korekt | Otwarte |
| P-14 | Alokacja finansowania | Sandbox: pełne pozycje według okresu, daty i ID, osobno per waluta | Zatwierdzona kolejność i reguły częściowego finansowania | Otwarte |
| P-11 | Układ UI | Katalog 3/2/1 kolumny; panele z sidebarem na desktopie i menu mobilnym (brief A3) | — (zwykła decyzja UI) | Propozycja briefu |

Dodatkowe propozycje, które pojawią się w trakcie prac (np. reguły zaokrągleń kwot, P-12+), dopisujemy tutaj, jeżeli wpływają na podział realnych pieniędzy.

---

## T — Decyzje techniczne

Status: **Przyjęte** = obowiązuje; **Do potwierdzenia w etapie N** = kierunek przyjęty, szczegóły po weryfikacji dokumentacji/wersji w danym etapie.

### Stos i struktura

- **T-01 Stos.** Next.js (App Router) + React + TypeScript `strict`, Supabase (Auth, Postgres, Storage), Tailwind CSS, shadcn/ui. Jedno repozytorium, jedna aplikacja modułowa, bez mikroserwisów i monorepo. *Przyjęte.*
- **T-02 Wersje.** Zależności przypinane do dokładnych wersji z lockfile. Przed instalacją sprawdzamy aktualną dokumentację i kompatybilność (npm z 24.10.2026 wskazuje `next@16.4.3`, `supabase` CLI `2.122.0`). E1: wszystkie zależności w `package.json` mają dokładne wersje (`save-exact` w `.npmrc`), m.in. `next@16.4.3`, `react@19.3.0`, `@supabase/ssr@0.12.7`, `@supabase/supabase-js@2.118.0`, `zod@4.6.7`, `vitest@5.0.5`, `typescript@5.9.3`. *Przyjęte.*
- **T-03 Menedżer pakietów.** `pnpm` (zainstalowany 10.33.4). Supabase CLI jako przypięta zależność deweloperska, uruchamiana przez `pnpm exec`, nie globalnie. *Przyjęte.*
- **T-04 Node.** Lokalnie jest Node 25.9 (wydanie nieparzyste, bez LTS). Projekt deklaruje w `engines` i CI aktywną wersję LTS zgodną z Next.js. E1: `engines.node >=24`, `.nvmrc` = 24 (CI używa Node 24). *Przyjęte.*
- **T-05 Podział modułów.** Kierunek:
  - `src/app/` — trasy: grupy `(public)`, `creator/`, `company/`, `admin/`, `api/` (webhooki, API integracji);
  - `src/modules/<domena>/` — logika domenowa (np. `accounts`, `catalog`, `programs`, `attribution`, `payments`, `commissions`, `ledger`, `funding`, `payouts`, `integrations`, `admin`); każdy moduł ma schematy walidacji, zapytania serwerowe i akcje;
  - `src/lib/` — wspólne: klienci Supabase, `env`, `money`, walidacja, błędy;
  - `src/components/` — UI współdzielone (shadcn/ui + własne);
  - `supabase/migrations/`, `supabase/seed/` (wyłącznie demo/lokalne);
  - `tests/db/` (migracje + RLS na PGlite), `tests/integration/` (prawdziwy Supabase przez Data API), testy jednostkowe obok kodu (`*.test.ts`).
  *Przyjęte (E1).*
- **T-06 Migracje.** Imperatywne migracje SQL w `supabase/migrations/`, tworzone przez `supabase migration new`. Każda migracja jest odwracalnie przemyślana i testowana lokalnie. *Przyjęte.*

### Bezpieczeństwo i dostęp

- **T-10 Walidacja.** Każde wejście na serwerze (Server Actions, Route Handlers, webhooki) walidowane schematem Zod 4 (wybrany w E1). Walidacja klienta jest tylko wygodą UX. *Przyjęte.*
- **T-11 RLS.** RLS włączone na każdej tabeli w schematach wystawionych przez Data API. Polityki łączą `TO authenticated` z warunkiem własności/członkostwa (bez samego `TO authenticated`). UPDATE ma `USING` i `WITH CHECK`. Bez `auth.role()`. *Przyjęte.*
- **T-12 Minimalne granty.** Domyślnie odbieramy uprawnienia `anon`/`authenticated` i nadajemy jawnie tylko potrzebne operacje. Tabele finansowe i dzienniki nie mają grantów zapisu dla ról klienckich; zapis wyłącznie przez backend. *Przyjęte.*
- **T-13 Funkcje uprzywilejowane.** `SECURITY DEFINER` tylko w niewystawionym schemacie (np. `private`), z `set search_path = ''`, sprawdzeniem `auth.uid()` w ciele i odebranym `EXECUTE` od `PUBLIC`. Widoki z `security_invoker = true`. *Przyjęte.*
- **T-14 Rola administratora.** Uprawnienie admina przechowywane w osobnej tabeli bez żadnych grantów zapisu dla ról klienckich (nadawane migracją/skryptem operacyjnym). Nigdy z `user_metadata`/profilu. Brak ścieżki uzyskania admina przez rejestrację lub edycję profilu. *Przyjęte.*
- **T-15 Konteksty użytkownika.** Jedna tożsamość (`auth.users`) może mieć kontekst twórcy i firmy jednocześnie. Kontekst firmy wynika z członkostwa w organizacji, nie z flagi w profilu. *Przyjęte.*
- **T-16 Sekrety.** Klucze `service_role`/secret, sekrety webhooków i operatorów tylko w zmiennych serwerowych (bez prefiksu `NEXT_PUBLIC_`). Moduł `env` waliduje zmienne przy starcie i oddziela publiczne od serwerowych. Logi nie zawierają sekretów, tokenów ani danych osobowych klientów końcowych. *Przyjęte.*
- **T-17 Publiczny katalog.** Osobna bezpieczna projekcja (widok/funkcja) zawierająca tylko zatwierdzone, opublikowane wersje ofert. Drafty i dane wewnętrzne niedostępne dla `anon`. *Przyjęte; implementacja w E2–E3.*
- **T-18 Dane klientów końcowych.** Marketplace przechowuje identyfikator klienta aplikacji i identyfikatory operatora; twórcy widzą wyłącznie pseudonim (`Customer #XXXX`). Brak imion, e-maili i telefonów w danych widocznych dla twórcy. *Przyjęte.*

### Pieniądze i finanse

- **T-20 Kwoty.** Kwoty jako liczby całkowite w najmniejszej jednostce waluty (`bigint` w Postgres, `*_minor`) z kodem waluty ISO 4217. Brak `float`/`numeric` z ułamkami dla kwot. W TypeScript dedykowany typ i funkcje modułu `money`; brak arytmetyki zmiennoprzecinkowej. *Przyjęte.*
- **T-21 Stawki.** Procenty jako liczby całkowite w punktach bazowych (1500 = 15,00%). *Przyjęte.*
- **T-22 Zaokrąglanie.** Jedna jawna funkcja zaokrąglania w module `money`. Kwota twórcy liczona jako `prowizja_brutto − opłata_platformy`, więc suma zawsze się zgadza. Kierunek zaokrąglania prowizji brutto i opłaty opisuje propozycja P-12; kalkulator i SQL E7 mają tę samą regułę half-up. *Przyjęte technicznie; live wymaga zatwierdzenia P-12.*
- **T-23 Dziennik rozliczeń.** Niezmienny, bilansowany dziennik (append-only, zapisy podwójne, suma = 0 per transakcja i waluta). Korekty to nowe zapisy. Brak edytowalnego pola salda użytkownika; salda są projekcją dziennika. *Przyjęte; implementacja w E7.*
- **T-24 Idempotencja.** Zdarzenia zewnętrzne deduplikowane po (dostawca, środowisko, id zdarzenia) **oraz** po transakcji, której dotyczą. Operacje finansowe inicjowane przez użytkownika mają klucz idempotencji z ograniczeniem unikalności w bazie. Zapis finansowy i zmiana stanu w jednej transakcji DB. *Przyjęte.*
- **T-25 Snapshoty stawek.** Warunki programu są wersjonowane (nowa wersja zamiast edycji). Przypisanie klienta przechowuje odniesienie do wersji/snapshotu tabeli stawek z chwili przypisania. *Przyjęte; implementacja w E3/E5/E7.*
- **T-26 Współbieżność.** Limity (np. jedna aplikacja na firmę, jedno członkostwo w programie, jedno przypisanie klienta) egzekwowane ograniczeniami unikalności lub blokadami w bazie, nie tylko sprawdzeniem w aplikacji. Testy obejmują równoległe żądania. *Przyjęte.*
- **T-27 Czas.** Znaczniki czasu jako `timestamptz`, przetwarzanie w UTC. Okresy rozliczeniowe zgodnie z P-09. *Przyjęte.*

### Środowiska i integracje

- **T-30 Sandbox vs live.** Rekordy integracji i finansów mają jawne pole środowiska (`sandbox`/`live`), osobne klucze i sekrety. Operacje live są wyłączone globalnym przełącznikiem serwerowym (domyślnie wyłączone) i dodatkowo blokowane, dopóki odpowiednie pozycje P nie są zatwierdzone. *Przyjęte.*
- **T-31 Adaptery.** Wspólny wewnętrzny format zdarzeń płatniczych; adaptery Stripe, RevenueCat i Generic API. Status integracji rozróżnia `configured` od `verified` (verified dopiero po rzeczywistym przejściu zdarzenia). Bez kluczy dostawcy testy na jawnych fixtures, a test z dostawcą oznaczony `blocked`. *Przyjęte; implementacja w E6.*
- **T-32 Operator wypłat.** Adapter operatora płatniczego; Stripe Connect jako kandydat, nie założenie. Bez własnego portfela i własnego KYC. *Do potwierdzenia w E8.*
- **T-33 Fixtures i demo.** Dane demo tylko w seedzie lokalnym/testowym, wyraźnie oznaczone. Produkcja bez danych pokazuje uczciwe stany puste. *Przyjęte.*

### Jakość

- **T-40 Testy.** Trzy warstwy, wszystkie w Vitest:
  - jednostkowe (`src/**/*.test.ts`) — reguły domenowe, walidacja, przekierowania;
  - bazy (`tests/db/`) — prawdziwe migracje na PGlite (Postgres w WASM) z minimalną zaślepką Supabase (role `anon`/`authenticated`/`service_role`, `auth.uid()`, `auth.jwt()`); testują RLS, granty, wyzwalacze, limity i izolację bez Dockera. PGlite ma jedno połączenie, więc nie testuje prawdziwej współbieżności ani PostgREST;
  - integracyjne (`tests/integration/`) — prawdziwy Supabase przez Data API: izolacja, eskalacja do admina, równoległe żądania. Pomijane (i raportowane jako `blocked`), gdy brak zmiennych środowiska.
  E2E (Playwright) odłożone do etapu z pełnym przepływem katalog → dołączenie. *Przyjęte.*
- **T-41 CI.** `.github/workflows/ci.yml`, dwa zadania: (1) lint, typecheck, `pnpm test` (jednostkowe + PGlite), build z zastępczymi zmiennymi publicznymi; (2) `supabase start`, `db reset`, `db advisors --fail-on warn`, porównanie typów, testy integracyjne. *Przyjęte; zadanie 2 nie było jeszcze uruchomione (brak Dockera lokalnie, brak zdalnego repo).*
- **T-42 Repozytorium.** Git zainicjowany w E1; `.gitignore` wyklucza `.env*` poza `.env.example` oraz stan CLI Supabase. *Przyjęte.*

### Etap 1 — konta, konteksty, layouty

- **T-43 Next.js 16 `cacheComponents`.** Włączone jawnie w `next.config.ts`, razem z `partialPrefetching: true` (korekta 26.10; wcześniej konfiguracja nie odpowiadała opisowi). Wszystko, co czyta ciasteczka/sesję, renderuje się w `<Suspense>`; strażnicy obszarów (`CreatorGate`, `CompanyGate`, `AdminGate`) są w layoutach wewnątrz `<Suspense>`, a strony i Server Actions ponownie wywołują `requireViewer`. Statyczna powłoka (sidebar, nagłówek) jest prerenderowana. *Przyjęte.*
- **T-44 Sesja.** `src/proxy.ts` (następca `middleware.ts` w Next 16) odświeża token przez `getClaims()` i wykonuje tylko optymistyczne przekierowania. Granicą autoryzacji są strony/akcje (`getClaims`) oraz RLS. `getSession()` nie jest używane na serwerze. *Przyjęte.*
- **T-45 Potwierdzanie e-maila.** `enable_confirmations = true`. Szablony e-maili kierują na `/auth/confirm?token_hash=…&type=…` (działa na innym urządzeniu niż rejestracja, w przeciwieństwie do samego PKCE); trasa obsługuje też `code`. Parametr `next` przechodzi przez `safeRedirectPath` (tylko ścieżki w tej samej domenie). *Przyjęte.*
- **T-46 Hasła.** Minimum 10 znaków, litery i cyfry (Supabase + Zod). `secure_password_change = true`: zmiana hasła z panelu wymaga świeżego logowania. Reset hasła nie ujawnia, czy konto istnieje. *Przyjęte.*
- **T-47 Organizacje.** Tworzenie wyłącznie przez RPC `create_organization` (SECURITY DEFINER): w jednej transakcji organizacja + członkostwo `owner`. W MVP jeden użytkownik posiada jedną organizację; powtórne/równoległe wywołanie zwraca istniejącą (blokada doradcza na użytkownika). Brak grantów INSERT na `organizations` i `organization_members` dla klientów. Członkostwo `member` jest w modelu, ale zapraszanie nie jest jeszcze zbudowane. *Przyjęte.*
- **T-48 Limit aplikacji.** Kolumna `organizations.max_apps` (domyślnie 1, bez grantu UPDATE dla klientów) + wyzwalacz `enforce_app_limit` z `SELECT … FOR UPDATE` na wierszu organizacji. Limit działa też dla zapisów uprzywilejowanych. V1 podniesie limit bez zmiany schematu. Aplikacje tworzy tylko właściciel przez RPC `create_app`; `organization_id` aplikacji jest niezmienne. Status aplikacji w E1 to tylko `draft`; dalsze statusy w E3. *Przyjęte.*
- **T-49 Linki społecznościowe.** Tylko `https://` (normalizacja `http`→`https`, odrzucanie danych logowania w URL), rozpoznanie platformy po domenie (domeny podobne → `other`), dla znanych platform wymagana ścieżka profilu. Maks. 10 linków na twórcę (wyzwalacz z blokadą wiersza twórcy), unikalność (`creator_id`, `url`). Brak kolumny „zweryfikowany” (W-11). Gotowość do promowania: `creator_is_ready_to_promote()` = co najmniej jeden link; egzekwowana przy dołączaniu do programu w E4. *Przyjęte.*
- **T-50 Admin.** Tabela `platform_admins` (kto nadał, notatka, kiedy). Klient może odczytać tylko własny wiersz; zapis wyłącznie `service_role` przez `pnpm admin:grant`. Obszar `/admin` zwraca 404 dla nie-adminów (nie ujawnia istnienia). Admin widzi wszystkie profile, organizacje, członkostwa i aplikacje przez polityki RLS z `private.is_platform_admin()`. *Przyjęte.*
- **T-51 Wybór kontekstu.** `/dashboard` kieruje do ostatnio używanego kontekstu (ciasteczko `mp_last_context`, httpOnly, ustawiane w proxy), potem twórca → firma → admin → `/onboarding`. Ciasteczko to tylko preferencja; uprawnienia zawsze z bazy. Przełącznik kontekstu w topbarze pojawia się, gdy użytkownik ma oba. *Przyjęte.*
- **T-52 Typy bazy.** `src/lib/supabase/database.types.ts` napisany ręcznie zgodnie z migracją, bo generator wymaga działającej bazy. 26.10 zastąpiono typami z prawdziwego lokalnego Supabase; generator zapisuje atomowo, a CI blokuje różnicę. *Przyjęte.*
- **T-53 Formularze i stany.** Server Actions + `useActionState` z jednym typem `FormState` (idle / error z błędami pól i zachowanymi wartościami / success). Przycisk pokazuje stan wysyłania; sukces → toast lub przekierowanie; błędy → komunikat + pola. Stany puste modułów opisują, co się pojawi i kiedy, bez przykładowych liczb. Komunikaty błędów nie zdradzają szczegółów technicznych; logi zawierają tylko kod i treść błędu. *Przyjęte.*
- **T-54 Wygląd.** Kierunek: neutralne tło, białe karty, jeden akcent, font Plus Jakarta Sans (od 27.10, wcześniej Instrument Sans; nagłówki 800, tracking −0,02em), bez gradientów i etykiet wersalikami. Komponenty shadcn/ui (Radix, styl nova). Nazwa marki **boostlink** (małymi literami) w `src/config/site.ts` (zatwierdzona 26.10, W-00). Interfejs po angielsku (P-10 nadal otwarte). 26.10 właściciel zatwierdził brand board: tło `#F5F5F5`, tekst `#111111`, akcent żółty `#FFD600` (zastępuje zieleń), znak „b”, logotyp i nazwa małymi literami „boostlink” (W-00). Żółty to wyłącznie wypełnienie (przyciski, chipy prowizji); tekst akcentu używa `--primary-ink` `#7A5C00` (kontrast 6:1), a szary `#9CA3AF` tylko linii i dekoracji (jako tekst ma 2,5:1 — poniżej AA). Promienie: karty 20px, pola 12px, przyciski „pill”. Motyw: od 27.10 ciemny domyślnie w całej aplikacji (`#0B0B0B` tło, `#161616` karty, `#2A2A2A` linie, `#F5F5F5` tekst, `#9CA3AF` tekst drugorzędny, pola `#6B6B6B`), z przełącznikiem jasny/ciemny w nagłówku i menu konta (next-themes, zapamiętany wybór, bez motywu systemowego). Zastępuje wcześniejsze motywy według roli (ciemny panel twórcy, jasne panele firmy i administratora). Strona `/` ma krótki hero z kształtami „b” i ciemną sekcję dla twórców pod wynikami — katalog z wyszukiwarką pozostaje stroną główną (W-01). *Przyjęte; paleta zatwierdzona.*
- **T-55 Zmienne środowiskowe.** Publiczne: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`, walidowane leniwie przez Zod; aplikacja odmawia startu, jeśli w zmiennej publicznej jest klucz sekretny (`sb_secret_…` lub JWT `service_role`). `SUPABASE_SECRET_KEY` tylko w skryptach i testach; aplikacja webowa go w E1 nie czyta. *Przyjęte.*

### Etap 2 — publiczny katalog, plany i wersje warunków

- **T-56 Projekcja publiczna (`app_releases`, `catalog_listings`, `catalog_plan_rates`).** Wiersze robocze (`public.apps`, `public.app_plans`) pozostają prywatne dla organizacji i admina (`anon` nie ma na nich żadnych grantów). Publikacja przez `private.publish_app_release` (wywoływane przez admina w `public.admin_publish_app` lub lokalny seed) tworzy niezmienną wersję warunków (`public.app_terms_versions` + `public.app_terms_plan_rates`) oraz zatwierdzone wydanie (`public.app_releases` z `is_current_published = true` i częściowym unikalnym indeksem per `app_id` i `slug`). Późniejsze niezatwierdzone zmiany draftu w `public.apps` lub `public.app_plans` nie wpływają na to, co widzi publiczny katalog. Widoki `public.catalog_listings` i `public.catalog_plan_rates` mają `security_invoker = true`. *Przyjęte.*
- **T-57 Niezmienność wersji warunków i stawek.** Wyzwalacze `app_terms_versions_immutable` i `app_terms_plan_rates_immutable` blokują `UPDATE` i bezpośredni `DELETE` opublikowanych wersji warunków i stawek (dopuszczając jedynie kaskadowe usunięcie przy usunięciu całej aplikacji). Kolumna `external_plan_key` (identyfikator planu w systemie płatności) nie ma grantu `SELECT` dla `anon` i nie występuje w `catalog_plan_rates`. *Przyjęte.*
- **T-58 Moduł `money` i prezentacja stawek (`src/lib/money.ts`).** Kwoty w najmniejszych jednostkach waluty (`bigint`, `toMinorBigInt`, `formatMinorCurrency` przez łańcuch dziesiętny przekazywany do `Intl.NumberFormat`, bez konwersji do `number`). Stawki w punktach bazowych (`formatCommissionPercent`, `formatCommissionRange` z półpauzą `15–25% recurring` przy różnych planach i `20% recurring` przy jednolitej stawce — zgodnie z W-07). *Przyjęte.*
- **T-59 Filtry URL, paginacja i powrót do wyników (`src/modules/catalog/filters.ts`).** Parametry `q`, `category`, `commission`, `platform`, `language`, `page` w URL (`/`). Zmiana filtra resetuje `page` do 1. Linki do `/apps/[slug]` przekazują aktywne filtry w `?from=`, a `resolveBackToCatalogHref` waliduje je przez `parseCatalogFilters` i buduje wyłącznie wewnętrzny adres `/` lub `/?...` (ochrona przed open redirect / XSS przy zachowaniu filtrów po kliknięciu „Back to filtered results”). Rozmiar strony `CATALOG_PAGE_SIZE = 6` (podzielny przez 3 kolumny desktop i 2 kolumny tablet). *Przyjęte.*
- **T-60 Dane demo (`supabase/seed.sql`, `public/demo/*.svg`).** 8 opublikowanych aplikacji demo oraz 2 nieopublikowane (`draft` i `submitted`) wyłącznie w lokalnym `supabase/seed.sql` (zero fikcyjnych statystyk i liczb twórców). Produkcyjna baza bez ofert wyświetla pusty stan katalogu. Opcjonalny flagowany sandbox `LOCAL_PGLITE_SANDBOX=1` (zablokowany w produkcji bez `ALLOW_LOCAL_PGLITE_SANDBOX=1`) pozwala uruchomić dokładnie te same migracje i zapytania SQL w pamięci (PGlite), gdy lokalny Docker jest niedostępny (B-01). *Przyjęte.*

### Etap 3 — firma dodaje aplikację, administrator publikuje

- **T-64 Edycja draftu firmy, planów i wersjonowanie zmian opublikowanego profilu (`public.save_app_draft`, `public.upsert_app_plan`, `public.delete_app_plan`).** Właściciel organizacji (`private.is_app_org_owner`) edytuje roboczy profil aplikacji (`public.apps`) oraz robocze abonamenty (`public.app_plans`, z rozdzielonym `name` i `external_plan_key`). Kwoty wpisywane w formularzu są parsowane bez arytmetyki zmiennoprzecinkowej (`parseMajorMoneyToMinor` → `bigint`), a procenty prowizji do punktów bazowych (`parsePercentToBps` → `100..9000 bps`). Jeżeli aplikacja ma już opublikowane wydanie (`app_releases.is_current_published = true`), zmiany w `public.apps` i `public.app_plans` pozostają prywatnym draftem firmy aż do ponownego zgłoszenia i zatwierdzenia przez administratora — publiczny odbiorca nigdy nie widzi niezatwierdzonego draftu. *Przyjęte.*
- **T-65 Przepływ przeglądu i publikacji (`draft → submitted → published | rejected`, `public.submit_app_for_review`, `public.admin_review_app`, `public.app_review_events`).** Zgłoszenie (`submit_app_for_review`) waliduje kompletność profilu, obecność co najmniej jednego linku docelowego (`website_url`, `ios_store_url` lub `android_store_url`), warunków programu oraz co najmniej jednego aktywnego planu. Administrator (`private.is_platform_admin()`) w `public.admin_review_app` może: (a) odesłać zgłoszenie z wymaganym uzasadnieniem (`status = 'rejected'`, `rejection_reason`), które firma widzi w swoim panelu, albo (b) zatwierdzić ofertę dla środowiska `demo` (`status = 'published'`, nowy niezmienny snapshot `app_terms_versions` + `app_terms_plan_rates` + `app_releases`). Próba publikacji `live` przed weryfikacją integracji i finansowania (E6/E8) jest blokowana na serwerze (`live_publication_requires_verified_integration_and_funding`). Każde zdarzenie zapisuje niezmienny wpis w `public.app_review_events`. *Przyjęte.*
- **T-66 Kontrola dostępu do plików/mediów i bezpieczne wyświetlanie (`public.app_media_assets`).** Tabela `public.app_media_assets` przechowuje powiązane zasoby (`logo`, `cover`, `screenshot`, `video`) z polityką RLS: zasoby nieopublikowanych aplikacji są widoczne wyłącznie dla członków własnej organizacji i administratora; `anon` oraz inne firmy widzą wyłącznie zasoby aplikacji posiadających bieżące zatwierdzone wydanie (`is_current_published = true`). Opisy są renderowane jako czysty tekst (bez `dangerouslySetInnerHTML`), a URL-e wideo/obrazów są walidowane do `https://` lub `/demo/...`. *Przyjęte.*

### Etap 4 — dołączenie twórcy, przewodnik, programy i linki

- **T-61 Członkostwo w programie i idempotentne dołączenie (`creator_program_memberships`, `public.join_program`).** Twórca dołącza natychmiast (bez zatwierdzania przez firmę) przez RPC `public.join_program(p_app_id, p_accepted_terms_version_id, p_accepted_terms)` (`SECURITY DEFINER`). Funkcja wymaga zalogowanego użytkownika, co najmniej jednego linku społecznościowego (`public.creator_is_ready_to_promote()`), jawnej akceptacji warunków (`p_accepted_terms = true`) oraz zgodności `p_accepted_terms_version_id` z aktualnie opublikowanym wydaniem (`app_releases.is_current_published = true`). Powtórne lub równoległe wywołania są serializowane blokadą doradczą (`pg_advisory_xact_lock`) i chronione ograniczeniem `unique (app_id, creator_id)`: zwracają istniejące członkostwo bez duplikatów i bez nadpisywania historycznego `accepted_terms_version_id`. Przy pierwszym dołączeniu generowany jest unikalny `referral_code` powiązany z `(creator_id, app_id)` oraz domyślny link (`Primary link`). *Przyjęte.*
- **T-62 Nazwane linki i dozwolone cele przekierowań (`creator_referral_links`, `public.create_referral_link`).** Twórca tworzy nazwane linki (`label` unikalne per członkostwo, kanał `channel`, cel `destination_kind`: `'website' | 'ios_store' | 'android_store'`). Brak możliwości przekazania dowolnego URL: funkcja `private.resolve_app_destination` oraz wyzwalacz `enforce_referral_link_integrity` pobierają i weryfikują `target_url` wyłącznie z opublikowanego wydania aplikacji (`website_url`, `ios_store_url`, `android_store_url`). Limit 25 nazwanych linków na członkostwo egzekwowany w wyzwalaczu po zablokowaniu wiersza członkostwa (`FOR UPDATE`). Polityka RLS na `creator_referral_links` pozwala na odczyt wyłącznie właścicielowi (`creator_id = (select auth.uid())`) oraz adminowi. *Przyjęte.*
- **T-63 Rekomendacje podobnych aplikacji (`public.suggest_similar_apps_for_creator`).** Funkcja SQL (`security invoker`) wyznacza zbiór kategorii aktywnych programów twórcy i zwraca opublikowane aplikacje z `public.catalog_listings` współdzielące co najmniej jedną kategorię (`cl.categories && v_joined_categories`), z wykluczeniem aplikacji, do których twórca już należy, posortowane po liczbie wspólnych kategorii i stawce prowizji (bez AI). *Przyjęte.*

---

## Naprawy przed E5 — decyzje techniczne z 26.10.2026

- **T-67 Historia dostępna właścicielowi członkostwa.** Polityki RLS udostępniają zaakceptowane wersje warunków i stawek także po republikacji. Nie oznacza to przypisania przyszłych klientów do stawki z dnia dołączenia twórcy; snapshot klienta należy do E5/E7.
- **T-68 Jeden proces publikacji API.** Uprawnienia wykonania starego RPC publikacji zostały wycofane. `admin_review_app` wymaga `p_expected_revision` i `submitted`; profil, plany, nazwa firmy i ponowne zgłoszenie zmieniają rewizję. Stara karta administratora nie może zatwierdzić nowych danych. Powtórna decyzja nie tworzy drugiego efektu. Prywatny publisher zostaje dla tego procesu i kontrolowanego lokalnego seeda.
- **T-69 Plany archiwizowane.** RPC `delete_app_plan` zmienia `is_active=false`. Snapshoty zachowują odniesienia. Limit aktywnych planów jest sprawdzany również przy przywróceniu; aktualizacja już aktywnego planu przy limicie jest dozwolona.
- **T-70 Prywatne pliki.** Bucket `app-media` jest prywatny; właściciel dodaje nowe obiekty o losowych nazwach w folderze aplikacji, bez upsertu/usuwania. Odczyt: własna organizacja/admin lub dokładna referencja w bieżącym zatwierdzonym wydaniu. Serwer przyjmuje PNG/JPEG/WebP do 10 MB i MP4/WebM do 25 MB, sprawdza sygnaturę/MIME, a trasa serwująca narzuca Content-Type, nosniff, CSP i no-store. Kontrola referencji blokuje cudzy lub nieistniejący zarządzany plik. Zewnętrznych URL-i nie traktujemy jako prywatnych plików platformy. Nadpisuje wcześniejszą, zbyt szeroką deklarację T-66.
- **T-71 Publiczne stawki bez wewnętrznych kluczy.** Cofnięto grant odczytu `external_plan_key` i `plan_id` ze snapshotów dla `authenticated`. Prywatne plany organizacji nadal zawierają klucze potrzebne firmie; przyszłe przetwarzanie integracji korzysta z uprawnień serwera.
- **T-72 Powtarzalna weryfikacja.** Webpack + oficjalny Tailwind PostCSS; font Instrument Sans lokalny z OFL. Typy z prawdziwej bazy, atomowe generowanie i kontrola CI. Przed inicjalizacją klientów Supabase jawne `io()`; klient katalogu nie inicjalizuje Auth ani timerów sesji. Integracje jawnie zawodzą bez konfiguracji i obejmują Storage oraz proces firmy. Porty lokalnego projektu 553xx, bez zatrzymywania innych stosów. PGlite nie może być uruchomiony w produkcji nawet dodatkową flagą (aktualizacja T-60).
- **T-73 Niezmienność a klucze obce.** Treść snapshotów i decyzji pozostaje niezmienna. Dozwolone wyłącznie odpięcie FK usuniętego autora oraz sprzątanie odwołań podczas usunięcia całej aplikacji. Kontrole FK między elementami kaskady są odroczone do końca transakcji. Nie wdraża to procesu usuwania kont użytkowników ani zasad retencji finansowej przyszłych etapów.

---

## Współpraca frontend / backend (26.10.2026)

- **T-74 Podział pracy.** Frontend dopracowuje UI/UX istniejących etapów 1–4 według `docs/FRONTEND_SCOPE_STAGES_1_4.md`. Karol z Codexem prowadzi backend kolejnych etapów, zaczynając od E5. Pliki wspólne i zmiany kontraktów wymagają uzgodnienia; oddzielne gałęzie, małe PR i CI przed połączeniem do `main`. *Przyjęte; zakres prac zlecony przez właściciela.*

## Etap 5 — przypisanie klientów (26.10.2026)

- **T-75 Link publiczny i dowód kliknięcia.** `/r/[token]` korzysta wyłącznie z celu aktualnego zatwierdzonego wydania, bez parametru redirect. Tworzy oddzielny losowy token kliknięcia, którego skrót jest prywatny. Web otrzymuje `bl_ref`; sklepy mobilne pozostają bez tokenu, kod wpisuje się przy rejestracji. Cookie marketplace nie jest używane w domenie aplikacji. Brak fingerprintingu, IP i user agentów. Kliknięcia oznaczają wygenerowane przekierowania, nie unikalnych ludzi. *Przyjęte.*
- **T-76 Centralna polityka sandbox.** `private.attribution_policy()` w migracji E5 jest jedynym źródłem konfiguracji reguł: `sandbox-v1`, ostatnie ważne kliknięcie w ciągu 30 dni, jawny kod wygrywa przed utrwaleniem. Przy wielu tokenach czas pochodzi z serwera. Nieznane/obce tokeny oraz nieprawidłowy jawny kod są błędem. Oferta z innym opublikowanym oknem nie jest po cichu interpretowana jako 30 dni. P-03/P-04/P-05 pozostają **otwarte dla live**; E5 odmawia nowych przypisań poza demo. *Przyjęte technicznie; wartości biznesowe wyłącznie sandbox.*
- **T-77 Trwała tożsamość klienta.** `POST /api/v1/customers` jest API backend–backend. Sekret ma zakres jednej aplikacji, 90 dni ważności, rotację z natychmiastowym odwołaniem i prywatny skrót SHA-256. Nie używamy klucza Supabase w aplikacji klienta. Backend BoostLink wywołuje wąskie RPC jako anon; sekret sprawdza baza. Sekret nadaje operator skryptem zapisującym plik 0600 lub właściciel przez autoryzowane RPC. Brak CORS, odrzucenie Origin, ścisły JSON, limit ciała/listy tokenów i limity żądań. *Przyjęte.*
- **T-78 Idempotencja i brak przejęcia.** Para aplikacja + skrót nieosobowego ID klienta jest unikalna; blokada transakcyjna i atomowy zapis tworzą jedną tożsamość przy wyścigu. Retry zwraca pierwotny rekord bez zmiany twórcy, źródła i wersji warunków, także po wygaśnięciu tokenu. Rejestracja bez polecenia utrwala `unattributed`. Aplikacja musi zgłaszać wszystkie konta, a przed integracją zarejestrować stare jako organiczne; platforma nie zna wcześniej niezgłoszonych klientów. Serwer aplikacji odpowiada za wiarygodność zgłoszenia. *Przyjęte.*
- **T-79 Snapshot przy pozyskaniu.** Przypisany klient ma odniesienie do aktualnej niezmiennej wersji pełnej tabeli warunków/stawek przy rejestracji. To nie jest automatycznie wersja zaakceptowana przez twórcę w dniu join. Zmiana oferty i retry nie przeliczają historii. Twórca zachowuje odczyt właściwej historii przez RLS. Nie implementuje to naliczania prowizji z E7. *Przyjęte; P-07 nadal sandbox.*
- **T-80 Statystyki i prywatność.** Odczyty i agregaty respektują RLS; firma widzi własną aplikację, twórca własne dane, admin ma odczyt administracyjny. Rejestracje kodem nie są przypisywane żadnemu linkowi. Panele nie dostają źródłowego ID klienta ani sekretu/tokenów kliknięć, wyłącznie UUID/pseudonim, datę i źródło. Płatności, aktywni płacący i prowizje pozostają poza E5. Nowy moduł prezentacyjny dodano do istniejących ekranów; osobne dopracowanie UI/UX E1–E4 nadal prowadzi frontend. *Przyjęte.*

## Etap 6 — integracje zakupów i odnowień (27.10.2026)

- **T-81 Trwały inbox i osobny worker.** Webhook sprawdza surowy podpis/token, konto i środowisko, po czym zapisuje prywatny payload i bezpieczne metadane przed 200. Normalizacja oraz atomowy zapis efektu odbywają się w osobnym workerze, z lease, `SKIP LOCKED`, backoffem i ręcznym retry. Stała kolejność blokad integracja → event usuwa potwierdzony w testach wyścig dostarczeń. Payloady/secrets nie trafiają do logów ani paneli. *Przyjęte.*
- **T-82 Trzy adaptery i osobne tożsamości.** Stripe snapshot invoices/subscriptions/refunds/disputes, RevenueCat i Generic HMAC trafiają do `PaymentEvent`. Nie utożsamiamy ID klienta aplikacji, klienta providera, subskrypcji i zakupu. Mapowania są jawne, ograniczone do własnej aplikacji i nieprzepinane między klientami. Transakcja zapisuje także wewnętrzny ID planu (bez grantu odczytu dla klienta), potrzebny E7. *Przyjęte.*
- **T-83 Dwie deduplikacje i źródło autorytatywne.** Osobno unikalny event providera i ekonomiczna transakcja per aplikacja/środowisko/sklep. Jeden sklep ma jedno źródło; powiadomienia lustrzane Stripe/RC/Generic są zachowane jako secondary_source bez drugiego zakupu. Po zakupach zmiana źródła jest blokowana. Duplikat faktury nie tworzy dodatkowego zakupu ani wpisu zakupu w timeline. Refund/spór ma własne ID i projekcję stanu. *Przyjęte.*
- **T-84 Stan a pieniądze.** Anulowanie odnowienia nie jest refundem. Trial/0 nie są płatnym pozyskaniem. Częściowe refundy, ich odwrócenia oraz otwarte/wygrane/przegrane spory są odrębne. Stan jest porządkowany według czasu dostawcy. Sprzeczne równe timestampy nie są rozstrzygane losowym event ID: unknown/needs_review odmawia aktywnej/płatnej kwalifikacji do czasu nowszego autorytatywnego zdarzenia. Stripe faktura nie przywraca zakończonej subskrypcji. Kwoty `bigint`; konwersja RC zachowuje zapis dziesiętny i odmawia nieznanych walut/niejednoznacznych faktur. *Przyjęte; brak dziennika prowizji E7.*
- **T-85 Uwierzytelnienie i statusy.** Sekrety webhooków są w serwerowym rejestrze po unikalnych referencjach; wartości nie są współdzielone między konfiguracjami. Worker/ingress ma ograniczony 90-dniowy token E6, prywatny skrót i odwołanie; testy używają własnego tokenu i filtra integracji. Configured nie oznacza Verified. Verified sandbox pipeline wymaga poprawnego przetworzenia uwierzytelnionego, zmapowanego eventu odebranego po konfiguracji; dashboard TEST/ignorowane zdarzenia nie wystarczą. Nie stanowi to niezależnego dowodu prawdziwości Generic sprzedaży ani odbioru konta dostawcy. *Przyjęte.*
- **T-86 Oddzielenie sandbox/live i zakresu E7/E8.** Osobne konfiguracje, sekrety, źródła i dane środowisk. Uwierzytelniony live event jest trwały, ale blocked; brak przełącznika live processing. E6 nie nalicza prowizji, nie finansuje firmy i nie tworzy dostępnego salda. P-01…P-09 nadal mają status zgodny z briefem. *Przyjęte.*
- **T-87 Metryki i wspólny frontend.** Płacący klient ma dodatnią niepróbną płatność z pozostałą wartością po zwrotach, bez przegranego/niejednoznacznego sporu. Aktywny płacący dodatkowo ma ważny opłacony okres i stan active/past_due. Liczymy osoby, nie liczbę odnowień. Kontekst twórcy jest filtrowany jawnie również przy roli właściciela firmy na tym samym koncie (niezbędna korekta odczytu E5). `PaymentResults`, serwerowe queries/actions i dokument kontraktu dostarczają dane do istniejącego UI; redesign E1–E4 pozostaje u kolegi. *Przyjęte.*
- **T-88 Faktyczny odbiór dostawców.** Kod jest sprawdzany na jawnych fixtures oraz prawdziwym lokalnym Supabase/HTTP/workerze. Bez kont/sekretów Stripe i RevenueCat test zakupu u dostawcy ma status **blocked**, nigdy pass. Obsługiwane pola i ograniczenia (snapshot, pojedyncza pozycja abonamentowa, waluty) opisano w `docs/PAYMENT_INTEGRATIONS.md`. *Przyjęte.*

## Etap 7 — decyzje techniczne (27.10.2026)

- **T-89 Jawne dane finansowe.** Brak domyślnego procentu platformy i brak domyślnej podstawy. Politykę sandbox deklaruje operator, basis konkretnej transakcji jest niezmienne. 10% i podstawa po rabacie z podatkiem wyłącznie w jawnych fixtures. Live nie jest naliczane. *Przyjęte; P-01/P-02/P-12…14 otwarte.*
- **T-90 Historyczna tabela planów.** Stawka z całego snapshotu E5 po ID planu i walucie, także dla odnowienia/zmiany planu. Nieznany nowy plan to sprawa do rozpatrzenia bez automatycznej stawki. Roczna sprzedaż nie tworzy fikcyjnych miesięcznych transakcji. *Przyjęte; P-07 sandbox.*
- **T-91 Niezmienny bilansowany dziennik.** Oryginalne wyliczenie i komplet postings są atomowym zapisem. Constraint pilnuje sumy zero; historia jest append-only, a stan to prywatna projekcja. Korekty i przeniesienia mają idempotentne klucze. Uprzywilejowane usuwanie wyłącznie nadrzędnych danych testowych dopuszcza kaskadę; frontend nie usuwa dziennika. *Przyjęte.*
- **T-92 Współbieżność E7.** Worker pobiera blokadę aplikacji przed blokadą zadania i ponownie sprawdza pending. Kolejność app ID, transakcja rozliczenia i zmiana statusu atomowe. Podwójne naliczenie/close/funding jest sprawdzane przez rzeczywisty Data API i PostgreSQL. *Przyjęte.*
- **T-93 Korekty i spory.** Skumulowane refundy/straty zmieniają pozostałą podstawę, a różnica daje nowy wpis. Stan open/pending/needs_review wstrzymuje środki. Refund po in_payout/paid tworzy sprawę bez przypisania kosztu. Cofnięcie refundu respektuje finansowanie ponownie użyte na inne należności. *Przyjęte technicznie; P-06/P-13 sandbox.*
- **T-94 Zamknięcie i późne zdarzenia.** Osobny niezmienny miesiąc UTC; zamknięcie tylko ukończonego okresu po uzgodnieniu. Starszy niezamknięty miesiąc nie odblokowuje się przy close innego okresu. Późne zdarzenia trafiają do otwartego okresu, zachowując datę źródłową, transakcję i oryginalny okres. Zestawienia są niezmienne, odrębne od aktualnej dostępności środków. *Przyjęte; P-09 sandbox.*
- **T-95 Kontrolowane finansowanie.** Tylko operator tworzy jawny funding fixture i może symulować payout. Dopływ środków zwalnia wcześniej zamknięte pozycje bez kolejnego close. Brak dodatkowego 30-dniowego holda/minimum, brak realnej wpłaty/wypłaty i E8. *Przyjęte; P-14 sandbox.*
- **T-96 Kontrakt frontendu i izolacja.** `getCommissionWorkspace` / `CommissionPanel`: Earnings, Overview, zestawienia firmy, szczegóły klienta. Pieniądze tekstowe per waluta, bez PII/sekretów. Jawny kontekst twórcy i firmy, RLS, brak browserowych mutacji pieniędzy. Kolega nadal prowadzi redesign. *Przyjęte.*

## Etap 8 — finansowanie i wypłaty sandbox (27.10.2026)

- **T-97 Osobny operator finansowania.** Zdarzenia zakupów E6 nie finansują marketplace. `sandbox-test` jest trwałym adapterem testowym, bez użycia konta sprzedaży firmy i bez adaptera live. Stripe Connect pozostaje kandydatem: kraj podmiotu, kraje odbiorców, akceptacja prefundingu i zatwierdzenie operatora są niepotwierdzone. Źródła i ograniczenia: `FUNDING_AND_PAYOUTS.md`. *Przyjęte technicznie; live blocked.*
- **T-98 Potwierdzone środki i zgoda.** Firma autoryzuje testową metodę przez własną 30-minutową sesję onboardingu. Zapisujemy wersję zgody, czas i referencję testowego operatora; nie zbieramy kart, rachunków ani KYC. Tylko potwierdzenie dostępności operatora dopisuje kredyt do dziennika. Success URL nie finansuje konta. *Przyjęte.*
- **T-99 Rezerwacja finansowania przed close.** Dostępne środki firmy pomniejszają rezerwacje brutto bieżących i zamkniętych prowizji. Bieżące naliczenia, także po wygranym sporze, pozostają niedostępne do zamknięcia właściwego miesiąca. Finansowanie starego zamkniętego miesiąca zwalnia należności od razu. Kolejność pełnych pozycji pozostaje P-14 sandbox. *Przyjęte technicznie.*
- **T-100 Jedno przekroczenie progu.** Ustawienia wybiera właściciel; próg i kwota są jawne. Blokada aplikacji, jedna oczekująca wpłata i zatrzask przekroczenia wykluczają równoległe i nieograniczone następujące po sobie obciążenia. Ponowne uzbrojenie po powrocie nad próg albo świadomym zapisaniu ustawień. Definitywny błąd auto-doładowania daje trwałe powiadomienie w panelu i oddzielną blokadę nowych dołączeń/kliknięć/poleceń. Odnowienia pozostają naliczane. Skuteczna wpłata usuwa tylko blokadę finansowania, po pokryciu zaległości. E-mail nie jest deklarowany jako wdrożony. *Przyjęte.*
- **T-101 Wypłata i dwie operacje operatora.** Zlecenie twórcy atomowo rezerwuje konkretne pozycje i utrwala kwotę/opłatę/odbiorcę. Potwierdzenie dotyczy aktualnej kwoty i kosztu. Transfer do operatora oraz wypłata bankowa mają osobne trwałe klucze i historię. Bank failure/return nie ponawia transferu ani nie tworzy dostępnego salda marketplace. Zwrot bankowy dopisuje przesunięcie paid → in_payout, po czym dozwolone jest ponowienie samego banku. *Przyjęte.*
- **T-102 Lease i niewiadomy wynik.** Osobny worker, `SKIP LOCKED`, lease 60 s, backoff 5/10 s i maksymalnie trzy próby transportu. Kluczem operatora jest stały UUID zadania. Timeout pozostawia rezerwacje; po limicie powstaje sprawa, bez nowego klucza transferu. Kolejność blokad twórca → aplikacje UUID → zadanie → sprawa/scenariusz. *Przyjęte.*
- **T-103 Uzgadnianie bez ręcznych sald.** Porównujemy operatora z zakresem, kwotą/walutą, stanem i funding journal; niezgodności mają dowody w panelu admina. Przegląd wymaga notatki i śladu audytu, a zamknięcie sprawy sprawdzenia operatora przez worker. Sprzeczne terminalne efekty są wstrzymane. Refund po wypłacie nadal wymaga P-06. *Przyjęte.*
- **T-104 Możliwości operatora testowego.** EUR, minimum operatora 1 minor, opłata 0 minor, bez FX. To jawne możliwości testowe; nie są zatwierdzoną listą walut, krajów ani cennikiem live. Brak dodatkowego minimum platformy i stałego 30-dniowego holda. Dla banku maksymalnie trzy próby (pierwsza i dwa retry). *Przyjęte wyłącznie sandbox; P-08 i koszty live otwarte.*

## Etap 9 — operacje i odbiór pilota (27.10.2026)

- **T-105 Oddzielenie odbiorów.** Techniczny sandbox, połączony frontend, hosting i realne pieniądze mają odrębne wyniki pass/blocked. E9 nie może zamknąć niewidzianej gałęzi Rocha ani automatycznie aktywować live. Pierwszy merge po stabilnym punkcie motywu i wspólnych komponentów, dalszy polish małymi PR. *Przyjęte.*
- **T-106 Zgłoszenia i notyfikacje.** Prywatne rozmowy użytkownik–zespół, request keys, revision oraz techniczne limity 10 zgłoszeń/dobę i 30 wiadomości/godzinę. Powiadomienia deduplikowane w aplikacji; e-mail nie jest deklarowany. Bez danych kart/KYC i sekretów w formularzach/logach. *Przyjęte technicznie dla pilota.*
- **T-107 Audyt i rozpatrywanie.** Zdarzenia operacyjne append-only, admin retry wymaga przyczyny i dotyczy wyłącznie sandbox. Review prowizji in_review/awaiting_policy nie zmienia kwot ani nie rozstrzyga P-06. Pseudonimowe referencje audytu pozostają po usunięciu nadrzędnej encji; retencja środowiska docelowego otwarta. *Przyjęte technicznie.*
- **T-108 Liveness a kolejka.** Globalne i scoped heartbeats oddzielne, stale po 2 min; brak reportu to unknown. Backlog/błędy są osobnymi sygnałami. CLI exit 0/2/1 oznacza odpowiednio brak sygnałów, uwagę operatora, błąd kontroli. Nadzór i kanał alarmów na hostingu wymagają konfiguracji. *Przyjęte.*
- **T-109 Recovery lokalne.** Wspólny wyeksportowany snapshot dla dumpa i odcisków danych, osobny backup Storage, pliki 0600. Verify tworzy wyłącznie nową losową bazę/scratch, sprawdza dokładne dane, journal i RLS; nie resetuje źródła. DEFAULT ACL zarządzanych ról pomijane w lokalnym restore; jawne granty aplikacji zachowane. To nie uniwersalna procedura chmurowa ani szyfrowany off-site backup. *Przyjęte.*
- **T-110 Powtarzalny odbiór HTTP.** `pnpm test:pilot` buduje osobny serwer i pełny E1–E9 suite, w tym rzeczywisty formularz i recovery z niepustymi finansami. CI uruchamia tę samą ścieżkę. Żadne fixtures nie aktywują realnego operatora. *Przyjęte.*
- **T-111 Komunikacja pauzy.** API rejestracji zgłasza program_paused_funding jako 409; join wyjaśnia przyczynę. To oczekiwany stan biznesowy, nie pozorna awaria bazy. *Przyjęte.*

## Rejestr zmian

| Data | Zmiana |
|---|---|
| 2026-10-24 | Utworzenie dokumentu (etap 0: ocena repozytorium). |
| 2026-10-24 | Etap 1: potwierdzone T-02, T-04, T-05, T-10, T-40, T-41, T-42; dodane T-43…T-55. |
| 2026-10-24 | Etap 2: potwierdzone T-17, T-20, T-21; dodane T-56…T-60. |
| 2026-10-25 | Etap 4: dodane T-61…T-63 (dołączenie do programu, nazwane linki, rekomendacje kategorii). |
| 2026-10-25 | Etap 3: potwierdzone T-25, T-30; dodane T-64…T-66 (edycja draftu firmy, plany, przegląd admina, kontrola dostępu do mediów). |

| 2026-10-26 | Naprawy F1–F5, prywatny Storage, rewizje oceny, archiwizacja planów, typy, build i odbiór prawdziwego Supabase; T-67…T-73. |

| 2026-10-26 | Zatwierdzona marka BoostLink (W-00), zakres frontend/UI/UX E1–E4 i podział pracy (T-74). |

| 2026-10-26 | Brand board BoostLink: żółto-czarna paleta, znak „b”, logotyp małymi literami (zmiana T-54). |

| 2026-10-26 | Etap 5 sandbox: tokeny kliknięć, API klienta, trwałe przypisanie, snapshoty i rzeczywiste statystyki; T-75…T-80. |

| 2026-10-27 | Nazwa wyłącznie małymi literami: „boostlink” (zmiana W-00). |

| 2026-10-27 | Ciemny motyw domyślnie w całej aplikacji z przełącznikiem jasny/ciemny (zmiana T-54). |

| 2026-10-27 | Etap 6: trzy adaptery, trwały inbox/worker, mapowania, źródła, deduplikacja i metryki; T-81…T-88. |

| 2026-10-27 | Etap 7 sandbox: prowizje, dziennik, korekty, finansowanie fixtures i zamknięcia; T-89…T-96, propozycje P-12…P-14; playbook dostawców. |

| 2026-10-27 | Etap 8 sandbox: finansowanie, auto-doładowania, rezerwacje, osobne transfery i bank payouts, uzgadnianie i admin; T-97…T-104. |

| 2026-10-27 | E9 techniczny sandbox: operacje, support, inbox, audit, monitoring, HTTP pilot/recovery; T-105…T-111. Odbiór po froncie Rocha, hosting i live pozostają blocked. |
