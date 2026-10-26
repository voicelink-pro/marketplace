# Analiza kodu i zgodności z etapami

**Raport historyczny sprzed napraw.** Problemy opisane niżej zostały następnie naprawione; aktualny odbiór znajduje się w `docs/IMPLEMENTATION_STATUS.md`, sekcja napraw przed E5.

Data: 26.10.2026. Stan analizowany: commit `b213e72` i bieżący katalog roboczy. Analiza nie zmienia implementacji ani deklaracji statusu poprzednich etapów.

## Ocena

Projekt jest responsywnym marketplace programów poleceń aplikacji subskrypcyjnych. Ma rzeczywistą implementację kont, katalogu, przygotowania i zatwierdzania ofert oraz dołączania twórców i tworzenia ich linków. Nie ma jeszcze działającej ścieżki od polecenia klienta do wypłaty prowizji.

Zakres funkcjonalny odpowiada zasadniczo etapom 1–4. Określenie „ukończony w kodzie” wymaga jednak zastrzeżeń: potwierdzono błędy dotyczące historii warunków, dostępu do roboczych mediów, usuwania planów i spójności publikacji. Odbiór na prawdziwym Supabase pozostaje niepotwierdzony. Nie należy uznawać projektu za gotowe MVP ani podawać procentu gotowości na podstawie liczby wykonanych etapów — etapy finansowe są znacznie bardziej złożone.

## Materiały i granice analizy

Porównano kod `src/`, wszystkie cztery migracje, seed, testy, konfigurację i CI z `MARKETPLACE_BRIEF_I_PROMPTY.md`, `docs/IMPLEMENTATION_STATUS.md`, `docs/DECISIONS.md` oraz zestawem z `/Users/karolkulis/Downloads/prompty-marketplace 2/`.

Sekcja produktowa A w obu głównych dokumentach jest identyczna po normalizacji białych znaków. Treść zadań etapów 1–9 również jest identyczna; zestaw z Downloads rozdziela zbiorczy dokument na osobne pliki i dodaje instrukcje użycia. Polecenia implementacji zapisane w tych dokumentach były materiałem do porównania. Bieżące zlecenie obejmuje analizę, a nie realizację kolejnego etapu.

Nie wykonano przeglądu wyglądu w przeglądarce, pełnego testu Auth/e-mail ani testów przez działający PostgREST. Historyczne wyniki z dokumentacji nie są traktowane jako wyniki bieżącej sesji. Przegląd nie stanowi kompletnego audytu penetracyjnego.

## Co to jest i jak ma zarabiać

Firma udostępnia aplikację w katalogu i określa prowizję dla poszczególnych abonamentów. Twórca wybiera program i promuje aplikację we własnych kanałach. Klient zakłada konto i kupuje abonament w promowanej aplikacji. Docelowo jej backend przesyła identyfikator klienta i dane o płatnościach do marketplace. Platforma przypisuje klienta twórcy, nalicza prowizje również od odnowień, pobiera swoją część prowizji i udostępnia sfinansowane zarobki po zamknięciu miesiąca.

Są to dwie oddzielne ścieżki pieniędzy: klient płaci aplikacji, a firma finansuje prowizje na marketplace. Obecny kod nie realizuje jeszcze żadnej z tych integracji finansowych. Nie ma pobierania opłat, sald, dziennika finansowego, zamykania miesiąca ani wypłat.

## Obecne przepływy użytkowników

### Konto i konteksty

- Rejestracja, logowanie, wylogowanie, potwierdzenie e-mail, odzyskanie i zmiana hasła są napisane z użyciem Supabase Auth. Produkcyjna ścieżka wymaga weryfikacji z prawdziwą usługą.
- Jedno konto może mieć profil twórcy i członkostwo w firmie. To konteksty tej samej osoby. `/dashboard` wybiera ostatnio używany dostępny kontekst, następnie twórcę, firmę, administratora lub onboarding.
- Ciasteczko ostatniego kontekstu jest preferencją. Uprawnienia są odczytywane z bazy.
- Administrator wynika z tabeli `platform_admins`; zwykła rejestracja i metadane użytkownika nie nadają tej roli.

### Firma i publikacja

1. Firma tworzy organizację, następnie szkic aplikacji. Limit jednej aplikacji jest wymuszony w bazie; model organizacji i aplikacji jest rozdzielony.
2. Właściciel uzupełnia profil, adresy mediów, cele linków oraz plany. Nazwa abonamentu i identyfikator w systemie płatności są osobnymi polami.
3. Zgłasza aplikację administratorowi. Administrator zatwierdza albo odsyła ją z uzasadnieniem. Nowa ścieżka zatwierdzenia działa jako demo i odrzuca żądanie publikacji live.
4. Publikacja kopiuje profil i stawki do osobnych rekordów wydania i warunków. Publiczny katalog korzysta z zatwierdzonej kopii; robocza zmiana opisu lub stawek nie nadpisuje tej kopii.

Istotne ograniczenie: model nie utrwala osobnej niezmiennej wersji zgłoszenia do oceny. Administrator zatwierdza aktualny stan roboczy. Zmiana danych przez firmę między otwarciem karty a kliknięciem zatwierdzenia może więc oznaczać zatwierdzenie innej treści niż obejrzana.

### Twórca

1. Dodaje minimum jeden URL profilu społecznościowego. Nie ma weryfikacji własności profilu, zgodnie z MVP.
2. Czyta publiczną ofertę i akceptuje konkretną wersję warunków.
3. Dołącza natychmiast, bez osobnej akceptacji firmy. Baza tworzy członkostwo, kod i domyślny link; powtórny join nie tworzy kolejnego członkostwa.
4. Widzi wspólny przewodnik, własne programy, kod i linki. Może tworzyć nazwane linki z kanałem i celem pobranym z opublikowanej aplikacji. Rekomendacje wynikają ze wspólnych kategorii, bez AI.

Generowany adres ma postać `/r/[token]`. Nie ma jeszcze obsługującej go trasy, rejestrowania kliknięć ani API przypisującego klienta. To zaplanowany zakres etapu 5. Obecny link jest zapisanym identyfikatorem przyszłego polecenia; nie jest jeszcze działającym kanałem pozyskania klienta. Ekrany Referrals, Earnings, Payouts i Funding są stanami pustymi bez podłączonego backendu tych funkcji.

## Jak zorganizowany jest kod

- `src/app/` — strony i layouty publiczne, logowanie, onboarding, panele twórcy, firmy i administratora.
- `src/modules/auth/` — formularze i operacje konta, weryfikacja adresów powrotnych.
- `src/modules/accounts/` — aktualny użytkownik, konteksty, organizacja i profile społecznościowe.
- `src/modules/catalog/` — katalog, filtry URL, paginacja i publiczne profile aplikacji; również lokalny sandbox PGlite.
- `src/modules/company-app/` — edycja profilu i planów, zgłoszenia oraz przegląd ofert przez administratora.
- `src/modules/programs/` — członkostwa twórców, linki, kody i rekomendacje.
- `src/lib/` — konfiguracja, formularze, kwoty, logowanie błędów i klienci Supabase.
- `supabase/migrations/` — 15 tabel aplikacji w czterech migracjach, funkcje, ograniczenia i polityki dostępu.

Technicznie jest to jedna aplikacja Next.js 16.4.3, React 19.3 i TypeScript strict, ze stylami Tailwind/shadcn, walidacją Zod i backendem Supabase. Nie ma osobnego mikroserwisu. Formularz wywołuje Server Action, ta waliduje dane i sesję, a następnie wykonuje zapis przez funkcję SQL. Baza ponownie sprawdza uprawnienia i reguły. RLS ogranicza odczyty także poza ekranami aplikacji.

Najważniejsze grupy danych:

- Tożsamość: `profiles`, `platform_admins`, `creator_profiles`, `creator_social_links`.
- Firma: `organizations`, `organization_members`, robocze `apps`, `app_plans`.
- Publikacja: `app_releases`, `app_terms_versions`, `app_terms_plan_rates`, `app_review_events`, `app_media_assets`.
- Promowanie: `creator_program_memberships`, `creator_referral_links`.

Kwoty planów są przechowywane w `bigint` w najmniejszych jednostkach waluty, stawki jako całkowite punkty bazowe. Parsery nie wykonują obliczeń pieniężnych na ułamkach zmiennoprzecinkowych. Ścieżka Supabase zamienia kwotę na `Number` przy wysyłaniu RPC; obecny limit ceny 100 000 000 000 jednostek mieści się w bezpiecznym zakresie całkowitym JavaScript. Przy rozszerzaniu kwot trzeba zachować tę gwarancję.

## Zgodność z etapami

### Etap 1 — fundament i konta

Zakres obecny: konta, konteksty, organizacje, uprawnienia administratora, limit aplikacji, layouty i CI. Testy jednostkowe oraz bazowe przechodzą. Odbiór rejestracji/e-mail i izolacji przez prawdziwe API jest zablokowany środowiskowo. Dokumentacja błędnie twierdzi również, że `cacheComponents` jest włączone.

### Etap 2 — katalog

Zakres obecny: katalog na `/`, wyszukiwarka, cztery filtry w URL, paginacja, osobne `/apps/[slug]`, tabela planów, zakres prowizji, media i CTA. Projekcja katalogowa oddziela zatwierdzony profil od draftu. Potwierdzono jednak dodatkową ścieżkę odczytu roboczych mediów przez tabelę API oraz zbyt szeroki dostęp zalogowanych do wewnętrznych kluczy planów.

### Etap 3 — panel firmy i publikacja

Zakres obecny: edytor, plany, prywatny podgląd, zgłoszenie, odrzucenie z powodem, publikacja demo i historia decyzji. Do poprawy: usuwanie opublikowanych planów, druga ścieżka publikacji bez audytu, powiązanie zatwierdzenia z konkretną wersją zgłoszenia i dostęp do mediów. Media są podawane jako URL-e; nie ma kompletnego uploadu i ochrony obiektów Supabase Storage. RLS rekordów z adresem pliku nie zabezpiecza samego pliku u zewnętrznego dostawcy.

### Etap 4 — programy i linki twórców

Zakres obecny: profil społecznościowy jako wymóg join, akceptacja bieżących warunków, natychmiastowe i idempotentne członkostwo, przewodnik, nazwane linki, kopiowanie i rekomendacje. Potwierdzony błąd: ponowna publikacja oferty odbiera zwykłemu twórcy dostęp do jego poprzednich warunków i powoduje pominięcie programu w listach.

### Etapy 5–9 i V1

- E5 nie rozpoczęto: przekierowania, kliknięcia, trwałe przypisanie klienta, polityka atrybucji, statystyki i demonstrator integracji.
- E6 nie rozpoczęto: Stripe, RevenueCat, Generic API, webhooki i transakcje/subskrypcje.
- E7 nie rozpoczęto: naliczanie prowizji, historyczne stawki klienta, dziennik finansowy i zamknięcie miesiąca.
- E8 nie rozpoczęto: wpłaty firm, auto-doładowania, finansowanie zobowiązań i wypłaty twórców.
- E9 nie rozpoczęto: pełny odbiór MVP, monitoring, backup/odtwarzanie, pilotaż i warunki live.
- V1 nie rozpoczęto: wiele aplikacji firmy i weryfikacja profili. Baza ma część przygotowania do wielu aplikacji, ale panel świadomie wybiera pierwszą organizację/aplikację.

Te braki odpowiadają planowi i nie są regresjami etapów 1–4.

## Potwierdzone problemy

### F1 — wysoki priorytet: program znika po ponownej publikacji

Źródła: [polityki odczytu warunków](/Users/karolkulis/Desktop/Market%20place%20Roch/supabase/migrations/20261024214026_catalog_foundation.sql:853), [polityki odczytu stawek](/Users/karolkulis/Desktop/Market%20place%20Roch/supabase/migrations/20261024214026_catalog_foundation.sql:867), [pomijanie programu](/Users/karolkulis/Desktop/Market%20place%20Roch/src/modules/programs/queries.ts:410).

RLS pozwala zwykłemu twórcy czytać aktualne publiczne warunki, ale nie jego historyczną zaakceptowaną wersję. Po publikacji v2 członkostwo nadal wskazuje v1, której odczyt zwraca zero rekordów. Funkcja listująca programy pomija członkostwo, jeśli nie otrzymała warunków.

Odtworzenie na PGlite: przed publikacją odczyt zaakceptowanych warunków zwrócił 1 rekord, po publikacji 0; członkostwo nadal istniało (1 rekord). Dotyczy twórcy bez dodatkowych uprawnień firmy/admina. Konta demo łączące role mogą maskować problem.

Kierunek naprawy: udostępniać twórcy bezpieczny odczyt warunków i stawek zaakceptowanych przez jego członkostwo. Dodać regresję join v1 → publikacja v2 → lista programu i odczyt v1. W E5/E7 wersję stawek nowego klienta trzeba rozpatrywać niezależnie od daty dołączenia samego twórcy.

### F2 — wysoki priorytet: niezatwierdzone media są publicznie odczytywalne

Źródła: [publiczny odczyt mediów](/Users/karolkulis/Desktop/Market%20place%20Roch/supabase/migrations/20261024224000_company_submission_and_review.sql:690), [synchronizacja mediów roboczych](/Users/karolkulis/Desktop/Market%20place%20Roch/supabase/migrations/20261024224000_company_submission_and_review.sql:140).

`app_media_assets` jest odbudowywane z roboczego profilu, ale polityka publiczna sprawdza tylko, czy aplikacja ma jakiekolwiek bieżące zatwierdzone wydanie. Po pierwszej publikacji nowy adres logo, screenu lub filmu zapisany w drafcie jest dostępny dla `anon` bez ponownej akceptacji.

Odtworzenie na PGlite: odczyt `anon` z `app_media_assets` zwrócił `https://assets.example.com/unapproved-secret-logo.svg`, podczas gdy katalog nadal zwracał zatwierdzone `/demo/logo-pulse.svg`. To ujawnienie przez API, nawet jeśli ekran katalogu wygląda poprawnie.

Kierunek naprawy: rozdzielić media robocze i zatwierdzone lub powiązać publiczny odczyt z konkretnym wydaniem. Osobno określić ochronę faktycznych obiektów plikowych.

### F3 — średni priorytet: nie można usunąć planu użytego w publikacji

Źródła: [usuwanie planu](/Users/karolkulis/Desktop/Market%20place%20Roch/supabase/migrations/20261024224000_company_submission_and_review.sql:480), [odniesienie w snapshotcie](/Users/karolkulis/Desktop/Market%20place%20Roch/supabase/migrations/20261024214026_catalog_foundation.sql:320), [blokada zmiany historii](/Users/karolkulis/Desktop/Market%20place%20Roch/supabase/migrations/20261024214026_catalog_foundation.sql:345).

RPC usuwa plan fizycznie. Klucz obcy w historycznym snapshotcie próbuje ustawić `plan_id = null`, co blokuje wyzwalacz niezmienności snapshotu. Właściciel otrzymuje błąd zamiast usunięcia planu z draftu.

Odtworzenie: wywołanie `delete_app_plan` jako właściciel planu obecnego w opublikowanej wersji zakończyło się `version_records_are_immutable`.

Kierunek naprawy: archiwizować plan przez istniejące `is_active` i zachowywać historyczne odniesienie; sprawdzić też limit liczby planów przy archiwizacji/przywróceniu.

### F4 — średni priorytet: dwie różne ścieżki publikacji

Źródła: [stare RPC publikacji](/Users/karolkulis/Desktop/Market%20place%20Roch/supabase/migrations/20261024214026_catalog_foundation.sql:689), [grant wykonania](/Users/karolkulis/Desktop/Market%20place%20Roch/supabase/migrations/20261024214026_catalog_foundation.sql:962), [nowszy proces E3](/Users/karolkulis/Desktop/Market%20place%20Roch/supabase/migrations/20261024224000_company_submission_and_review.sql:564).

Stare RPC `admin_publish_app` nadal jest wykonywalne przez zalogowanego administratora i od razu publikuje wydanie. Omija nowszy proces `admin_review_app`: brak wpisu decyzji, walidacji środowiska i wymogu celu przekierowania dodanego w E3. Nadal wymaga administratora — nie jest to eskalacja zwykłego użytkownika.

Odtworzenie: stare RPC utworzyło kolejne wydanie, a liczba `app_review_events` pozostała 1 → 1. Nie dowodzi to uruchomienia realnych płatności, których jeszcze nie ma; dowodzi obejścia nowszego procesu publikacji.

Kierunek naprawy: jedna wspólna ścieżka publikacji i audytu; stare RPC wycofać albo skierować do nowej z identycznymi ograniczeniami.

### F5 — średni priorytet: wewnętrzne klucze planów są dostępne obcym kontom

Źródła: [grant kolumn](/Users/karolkulis/Desktop/Market%20place%20Roch/supabase/migrations/20261024214026_catalog_foundation.sql:912), [polityka odczytu stawek](/Users/karolkulis/Desktop/Market%20place%20Roch/supabase/migrations/20261024214026_catalog_foundation.sql:867).

Każde zwykłe zalogowane konto może odczytać `external_plan_key` i `plan_id` aktualnych opublikowanych stawek innych aplikacji. Widok katalogowy pomija te pola, ale grant na tabeli je udostępnia.

Odtworzenie: konto bez członkostwa firmy ani programu odczytało wewnętrzny klucz planu i UUID. Klucz planu nie jest sekretem API operatora, więc nie należy przedstawiać tego jako kradzieży klucza płatniczego. Jest to niespójność z założeniem minimalnej projekcji publicznej i wewnętrzności identyfikatorów.

Kierunek naprawy: oddzielić pola wewnętrzne od publicznych stawek albo zapewnić ograniczoną ścieżkę ich odczytu dla właściciela i administratora.

## Pozostałe niespójności i ograniczenia

- **Zatwierdzenie bez wersji zgłoszenia.** `admin_review_app` przyjmuje tylko ID aplikacji i decyzję. Nie sprawdza numeru/odcisku ocenionej rewizji ani nawet wymogu `status = submitted`. Formularz administratora jest dostępny również przy innych statusach. Ryzyko opisano na podstawie kodu; nie wykonywano testu równoległych przeglądarek. Potrzebna kontrola wersji lub zamrożenie zgłoszenia, z zachowaniem osobnego draftu.
- **Cache Components.** AGENTS.md i decyzja T-43 mówią, że opcja jest włączona. `next.config.ts` nie zawiera `cacheComponents: true`. Lokalna dokumentacja zainstalowanego Next.js wymaga jawnego włączenia. To rozjazd deklaracji z konfiguracją, nie dowód wycieku sesji. Włączenie wymaga sprawdzenia również stron czytających sesję poza lokalnym Suspense.
- **Media.** Formularz obsługuje adresy URL, bez kompletnego mechanizmu uploadu, prywatnych bucketów, podpisanych adresów i potwierdzenia faktycznego MIME/rozmiaru. Metadane tabeli nie są weryfikacją zawartości pliku. Nie należy deklarować pełnej ochrony Storage na podstawie samych testów RLS tej tabeli.
- **Sandbox.** PGlite działa w pamięci procesu, z uproszczonym logowaniem i niesygnowanym identyfikatorem użytkownika w cookie. To wygodne narzędzie lokalne, nie implementacja bezpiecznego produkcyjnego Auth. Istnieje blokada produkcyjna z możliwością jawnego obejścia flagą. Testy wykonane w tym trybie nie potwierdzają działania Supabase Auth, PostgREST i Storage.
- **Obsługa błędów.** `listCompanyCreators` nie sprawdza błędów trzech dodatkowych zapytań przed składaniem danych; może pokazać zastępczą nazwę/brak linków zamiast ujawnić awarię. Niższy priorytet niż problemy dostępu i historii.
- **Dokumentacja środowiska.** Opis 220–320 MB wolnego miejsca jest historyczny; obecny odczyt pokazał około 19 GiB dostępnego. Daemon Dockera faktycznie nie działa, ale bieżąca próba nie potwierdza, że nadal przyczyną jest brak miejsca.
- **Typy i testy.** Typy Supabase są ręczne. CI ostrzega o różnicy po generowaniu zamiast blokować zmianę. Brakuje osobnego zestawu integracyjnego procesu firmy i publikacji; istnieją zestawy kont, katalogu i programów. Brak konfiguracji powoduje pominięcie wszystkich testów integracyjnych z kodem wyjścia 0.

## Co działa dobrze

- Organizacja jest oddzielona od aplikacji; dane robocze od zatwierdzonych wydań.
- Reguły uprawnień i limit jednej aplikacji są egzekwowane także w bazie. Kluczowe zapisy mają blokady i transakcje.
- Rola administratora nie pochodzi z `user_metadata`; sesja serwerowa używa `getClaims()`.
- Funkcje uprzywilejowane mają pusty `search_path`, sprawdzają użytkownika/role i mają jawne granty.
- Join jest idempotentny, a linki mogą prowadzić tylko do celów aplikacji. Inny twórca nie może tworzyć linków w cudzym członkostwie.
- Stawki i opublikowany profil są kopiowane do historii zamiast nadpisywane. Problemy dotyczą m.in. dostępu do tej historii, a nie braku modelu wersjonowania.
- Katalog i panele mają uczciwe stany puste; nie znaleziono podłączonych fikcyjnych zarobków.

## Bieżąca weryfikacja

- **pass — `pnpm test`:** 12 plików, 119 testów. Obejmuje jednostki i bazę PGlite; nie zastępuje prawdziwego Supabase ani testów UI.
- **pass — `pnpm lint`:** kod wyjścia 0.
- **pass — `pnpm typecheck`:** generowanie tras i TypeScript, kod wyjścia 0.
- **pass — dodatkowe próby diagnostyczne:** pięć scenariuszy na odrębnej bazie PGlite, utworzonej z wszystkich migracji i seeda; odtworzono F1–F5. Oznacza to potwierdzenie problemów, nie poprawność funkcji.
- **blocked — `pnpm test:integration`:** uruchomiono; 3 pliki / 15 testów pominięte przy braku konfiguracji. Żaden test Data API nie został wykonany. Docker poza piaskownicą zgłasza brak działającego daemona.
- **blocked — `pnpm build`:** pierwsza próba nie pobrała Instrument Sans z Google Fonts. Powtórzenie z żądaniem szerszych uprawnień zatrzymało się na błędzie Turbopacka przy tworzeniu procesu i wiązaniu portu (`Operation not permitted`). Obie komendy zakończyły się kodem 1. Nie potwierdzono udanego buildu w tej sesji; wynik nie dowodzi błędu logiki aplikacji.
- **blocked — Auth/e-mail, mobile i pełny przebieg w przeglądarce:** niezweryfikowane w bieżącej analizie. Poprzednie raporty UI dotyczą lokalnego sandboxa.

Podczas prób diagnostycznych używano wyłącznie odrębnej bazy w pamięci. Nie modyfikowano zdalnej ani lokalnej trwałej bazy Supabase.

## Kolejność dalszych prac

1. Naprawić F1 i F2 oraz dodać regresje: twórca po republikacji i niezatwierdzone media już opublikowanej aplikacji.
2. Uporządkować archiwizację planów, jedną ścieżkę publikacji, dostęp do wewnętrznych kluczy i zatwierdzanie konkretnej rewizji.
3. Uzgodnić dokumentację konfiguracji z kodem. Uruchomić prawdziwy lokalny Supabase, migracje, advisors, generowanie typów i integracje, a także odbiór Auth/e-mail oraz build w środowisku pozwalającym działać narzędziom.
4. Dopiero potem kontynuować E5 jako osobny etap. Jego najważniejszy wynik to działająca droga link/kod → konto klienta → trwałe przypisanie, a nie samo wyświetlenie kolejnego dashboardu.

Materiały odniesienia: lokalny brief i dokumentacja etapów; dla interpretacji polityk odczytu [oficjalna dokumentacja Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security). Konfigurację Cache Components porównano z plikiem `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/cacheComponents.md` z zainstalowanej wersji.
