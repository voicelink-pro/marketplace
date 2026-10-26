# BoostLink — zakres prac frontend / UI / UX, etapy 1–4

Uzgodniony podział pracy: 26.10.2026. Odbiorca: osoba rozwijająca frontend.

## Cel i granice zadania

Dopracuj istniejący, działający interfejs etapów 1–4: od przeglądania katalogu, przez konto i przygotowanie oferty firmy, po dołączenie twórcy i zarządzanie linkami. Popraw czytelność, spójność, responsywność, dostępność i komunikację stanów. Korzystaj z istniejącego backendu i prawdziwych danych.

Karol z Codexem rozwija backend kolejnych etapów, zaczynając od E5. To zadanie frontendowe nie obejmuje implementacji E5–E9. Sam link utworzony w E4 nie oznacza jeszcze działającego śledzenia kliknięć ani przypisania klientów. Ich obsługa należy do E5; zakupy, prowizje i wypłaty do dalszych etapów.

Przed pracą przeczytaj `AGENTS.md`, `MARKETPLACE_BRIEF_I_PROMPTY.md`, bieżące `docs/IMPLEMENTATION_STATUS.md` i `docs/DECISIONS.md`. Ten dokument określa podział wykonania, a zakres produktu pozostaje w briefie. Na start pobierz aktualny `main` — zakres backendu będzie się rozwijał.

## Marka i kierunek wizualny

- Nazwa: **BoostLink**, dokładnie z taką pisownią. Źródło nazwy: `src/config/site.ts`; nagłówki i metadane korzystają ze wspólnej konfiguracji.
- Interfejs pozostaje po angielsku. Dokumentacja współpracy może być po polsku. Nie wdrażaj teraz nowego systemu tłumaczeń.
- Zachowaj kierunek T-54: jasne neutralne tło, czytelne karty, Instrument Sans, jeden spójny akcent, komponenty shadcn/ui. Dopracuj hierarchię i rytm odstępów, zamiast tworzyć osobny styl dla każdego panelu.
- Możesz dopracować znak marki i favicon w osobnym, małym PR. Obecny znak `%` jest prowizoryczny. Nie wymaga to przebudowy całego interfejsu ani zewnętrznych płatnych zasobów.
- Nie zmieniaj nazwy repo, identyfikatora lokalnego Supabase, domen, tokenów ani istniejących adresów linków przy zmianie tekstów marki.

## Odpowiedzialność i pliki

**Frontend prowadzi:** `src/components/ui/`, prezentacyjne komponenty `src/components/layout/` i `src/components/brand/`, `src/components/states/`, `src/modules/*/components/`, `src/app/globals.css` i zasoby wizualne w `public/`. Zachowaj interfejsy eksportowanych komponentów albo uzgodnij ich zmianę.

**Backend prowadzi:** `supabase/` (migracje, polityki, seed, konfiguracja, szablony Auth), `src/lib/supabase/`, `src/lib/env.ts`, `src/lib/log.ts`, `src/proxy.ts`, `src/modules/*/actions.ts`, `media-actions.ts`, `queries.ts`, `schemas.ts`, logikę domenową, trasę `/media/apps/...`, trasy integracyjne i testy bazy/integracyjne. Nie przenoś zapisów z Server Actions do przeglądarki.

**Pliki wspólne wymagają uzgodnienia przed edycją:** `src/app/**/page.tsx`, `layout.tsx`, konfiguracja nawigacji i marki, współdzielone typy, `src/lib/forms.ts`, `src/lib/money.ts`, zależności, lockfile, konfiguracja Next i CI. W stronach frontend może zmieniać JSX, ale musi zachować pobieranie danych, autoryzację i przekierowania. Nie dodawaj `use client` do całej strony serwerowej tylko po to, by dodać interakcję — wydziel mały komponent kliencki.

Przed rozpoczęciem PR wpisz w jego opisie ekrany i pliki, które zmieniasz. Jeśli backend potrzebuje tego samego pliku, uzgodnij właściciela na czas zadania. Nie rozwiązuj konfliktów przez usuwanie cudzej logiki.

## Pakiet 1 — wspólna powłoka, konta i onboarding (E1)

Ekrany: `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/onboarding`, `/onboarding/creator`, `/onboarding/company`, `/account`, `/creator/settings`, `/company/settings`; powłoki paneli twórcy, firmy i administratora.

- Ujednolić szerokości treści, nagłówki, odstępy, karty, pola, przyciski i komunikaty.
- Dopracować publiczny nagłówek, sidebar, aktywne pozycje, menu konta, przełączanie kontekstu oraz nawigację mobilną. Na telefonie długie nazwy i menu nie mogą zasłaniać treści.
- Przeprowadzić użytkownika od rejestracji przez komunikat potwierdzenia e-maila do wyboru kontekstu. Zachować parametr powrotu do wybranej oferty po logowaniu.
- Czytelnie wyjaśnić rolę twórcy i firmy oraz możliwość korzystania z obu kontekstów na jednym koncie.
- Dopracować dodawanie/usuwanie profili społecznościowych i informację o wymaganym profilu przed dołączeniem do programu. Sam URL nie oznacza weryfikacji własności.
- Zachować komunikaty i walidację serwera. Podczas wysyłania blokować ponowny submit i pokazywać zrozumiały stan oczekiwania; po błędzie nie gubić wpisanych danych.

Odbiór: na desktopie i telefonie można przejść rejestrację/potwierdzenie, onboarding, logowanie, reset hasła, ustawienia i przełączenie kontekstu; formularze są obsługiwalne klawiaturą. Przekierowania i ograniczenia ról pozostają skuteczne.

## Pakiet 2 — katalog i profil aplikacji (E2)

Ekrany: `/`, `/apps/[slug]`. Główne pliki: `src/modules/catalog/components/` i odpowiadające strony publiczne.

- Dopracować karty z grafiką, logo, nazwą, krótkim opisem, platformami i czytelną prowizją; spójne proporcje, długie nazwy i brakujące media.
- Katalog responsywny: 3/2/1 kolumny zależnie od szerokości. Strona główna pozostaje katalogiem, bez dodatkowego landing page przed nim.
- Poprawić wyszukiwanie, cztery filtry, widoczność aktywnych filtrów, ich kasowanie i paginację. Filtry pozostają w URL. Nie dodawać filtra ceny abonamentu.
- Uporządkować profil: opis, media, platformy, języki, linki sklepowe, warunki, tabela abonamentów i CTA. Na telefonie CTA ma być łatwe do znalezienia, bez zasłaniania zawartości.
- Zachować pełną stronę `/apps/[slug]` oraz powrót do przefiltrowanych wyników. CTA niezalogowanego prowadzi do logowania z powrotem do tej aplikacji.
- Rozróżniać pusty katalog i brak wyników wyszukiwania. Pokazywać zakres prowizji przy różnych stawkach, korzystając z istniejących formatterów.

Odbiór: katalog i warunki są dostępne bez konta; filtrowanie, paginacja i cofanie zachowują stan; media i tabele mieszczą się na telefonie. Dane robocze firmy nie pojawiają się w publicznym profilu.

## Pakiet 3 — edycja oferty firmy i ocena administratora (E3)

Ekrany: `/company`, `/company/app`, `/company/app/preview`, `/company/plans`, `/company/creators`, `/admin`, `/admin/users`.

- Podzielić długi edytor na czytelne sekcje: podstawy, opis, platformy/języki, linki, media, warunki. Wyraźnie odróżnić zapis szkicu, podgląd i zgłoszenie do oceny.
- Pokazywać status oferty i powód odrzucenia. Wyjaśnić, że zmiany szkicu nie zastępują od razu publicznej, zatwierdzonej wersji.
- Uporządkować plany: nazwa i klucz z systemu płatności to osobne pola; cena, waluta, okres i prowizja mają czytelne jednostki. Zachować obecną logikę archiwizacji i limity.
- Dopracować upload i podgląd mediów: informacja o PNG/JPEG/WebP do 10 MB i MP4/WebM do 25 MB, oczekiwanie, błędy formatu/rozmiaru i skopiowanie ścieżki z uploadu do właściwego pola profilu. Nie sugerować automatycznego przypięcia pliku, jeśli formularz go jeszcze nie zapisuje.
- Dopracować kartę oceny administratora: treść zgłoszenia, media, plany, uzasadnienie odrzucenia, komunikaty sukcesu i nieaktualnego zgłoszenia. Zachować `reviewRevision` / oczekiwaną rewizję oraz serwerowy wymóg statusu `submitted`.
- Publikacja nadal jest oznaczona jako demo. UI nie może obiecywać aktywnego trybu live, integracji ani finansowania.
- Poprawić prezentację rzeczywistej listy twórców firmy i listy kont administratora; nie dodawać nieistniejących akcji zarządzania.

Odbiór: firma zapisuje i podgląda szkic, dodaje plany/media i zgłasza ofertę; admin odsyła z powodem lub publikuje demo. Firma widzi wynik. Nowe niezatwierdzone media nie stają się publiczne, a nieaktualna karta admina nie zatwierdza innej rewizji.

## Pakiet 4 — programy twórcy, przewodnik i linki (E4)

Ekrany: `/creator`, `/creator/programs`, `/creator/programs/[slug]`, `/creator/links` oraz CTA dołączenia na publicznym profilu.

- Jasna ścieżka: oferta → wymagany profil społecznościowy → widoczne warunki i świadoma akceptacja → dołączenie → wspólny przewodnik → link i kod.
- Dopracować listę programów i szczegóły członkostwa, datę dołączenia oraz dostęp do zaakceptowanej wersji warunków także po zmianie aktualnej oferty.
- Ułatwić kopiowanie linku i kodu: czytelne rozróżnienie, pełna wartość możliwa do odczytania, potwierdzenie sukcesu i komunikat błędu schowka.
- Dopracować formularz nazwanych linków, kanał i wybór celu z dostępnych celów aplikacji. Nie dodawać dowolnego docelowego URL ani akceptacji twórcy przez firmę.
- Uporządkować Overview: rzeczywiste programy, skróty, rekomendacje z istniejących zapytań. Wyniki bez backendu mają uczciwe stany informacyjne, bez fikcyjnych zer, wykresów i obietnicy działającego śledzenia.
- Wspólny przewodnik pozostaje jeden dla platformy. Nie dodawać obowiązkowego uploadu postów/filmów ani ich zatwierdzania.

Odbiór: nowy twórca dołącza do programu i otrzymuje swój link/kod; kolejne kliknięcie nie dubluje członkostwa. Nazwany link jest widoczny i kopiowalny na telefonie. Nie pokazujemy cudzych prywatnych linków.

## Moduły przyszłych etapów

`/creator/referrals`, `/company/referrals`, `/creator/earnings`, `/creator/payouts`, `/company/integrations`, `/company/funding` i przyszłe moduły administratora można objąć wspólną stylistyką pustych stanów. Nie buduj tam jeszcze dashboardów, płatności, metryk ani formularzy konfiguracji bez kontraktu backendu. Rozróżniaj „jeszcze brak danych” i „funkcja jeszcze niedostępna”.

Zanim backend rozpocznie prace nad stronami E5, uzgodnij z Karolem ich właściciela. Rozwój nowych ekranów E5 będzie osobnym zadaniem po ustaleniu kontraktu.

## Kontrakty i ograniczenia techniczne

- Źródłem danych są obecne `queries.ts`, a zapisów Server Actions i `FormState` z `src/lib/forms.ts`. Zachowaj nazwy pól `FormData`, ukryte identyfikatory, wersje warunków, rewizje i format błędów.
- Nowe pole lub nowa operacja wymagają krótkiego uzgodnienia: wejście, wynik, błędy, uprawnienia i właściciel implementacji. Zapisz uzgodnienie w PR; zgłoś brak backendu zamiast zastępować go localStorage lub sztucznym sukcesem.
- Formularze: `FieldGroup` / `Field`, `useActionState`; komponenty z `src/components/ui`. Kwoty i prowizje formatuj istniejącymi helperami, bez przeliczania pieniędzy przez float.
- Next 16: przed zmianą kodu przeczytaj odpowiednie lokalne przewodniki `node_modules/next/dist/docs/`. Czytanie sesji i cookies pozostaje wewnątrz `Suspense`; zachowaj gates i serwerowe sprawdzanie sesji przez `getClaims()`.
- Ukrycie przycisku jest tylko UX. Nie usuwaj kontroli dostępu na serwerze ani RLS, nie używaj kluczy uprzywilejowanych w kliencie i nie upubliczniaj bucketa mediów.
- Gdy potrzebujesz kont testowych, twórz je wyłącznie w swoim lokalnym środowisku. Nie dodawaj haseł ani `.env.local` do repo. Instrukcja uruchomienia i lokalnej roli admina jest w README.

## Kolejność PR i współpraca

1. Wspólna powłoka i formularze E1.
2. Katalog i profil aplikacji E2.
3. Firma i ocena admina E3.
4. Programy i linki E4.

Każdy pakiet może mieć kilka małych PR. Twórz gałęzie od aktualnego `main`, np. `frontend/e2-catalog-polish`; prace backendu mają oddzielne gałęzie. Nie pushuj bezpośrednio na `main` podczas równoległego rozwoju. Łącz przez PR po sprawdzeniu CI i przeglądzie drugiej strony. Zmiany wspólnych komponentów opisuj wraz z listą dotkniętych ekranów.

## Kryteria odbioru każdego PR

- Dołącz opis zmian, zmienione trasy, screeny przed/po dla desktopu i telefonu, wykonane scenariusze oraz znane ograniczenia. Brakujący backend oznacz jako `blocked`, nie jako działającą funkcję.
- Sprawdź szerokości 390, 768 i 1280 px: brak poziomego przewijania całej strony, czytelne tabele, długie nazwy, menu, formularze i media. Dodatkowo sprawdź powiększenie tekstu do 200%.
- Sprawdź obsługę klawiaturą, widoczny fokus, etykiety pól, komunikaty błędów, kontrast i nazwy przycisków ikonowych. Informacja o stanie nie może zależeć wyłącznie od koloru.
- Sprawdź loading, empty, error, success i podwójne kliknięcie. Brak martwych CTA i błędów konsoli. Wszystkie prezentowane dane pochodzą z backendu; seed demo służy tylko lokalnej weryfikacji.
- Uruchom `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. Jeśli zmiana dotyka integracji formularza z serwerem, uruchom również właściwy flow na lokalnym Supabase. Gdy zmieniany jest kontrakt lub backend, uzgodnij i uruchom `pnpm test:integration`.
- Zaktualizuj status UI/UX w `docs/IMPLEMENTATION_STATUS.md`, opisując faktyczny wynik `pass` / `fail` / `blocked`. Nie nadpisuj historii testów backendu. Odbiór wyglądu nie oznacza wdrożenia E5–E9.

## Prompt startowy do przekazania koledze

> Pracujesz nad frontendem i UI/UX platformy BoostLink. Przeczytaj AGENTS.md, brief, status, decyzje oraz docs/FRONTEND_SCOPE_STAGES_1_4.md. Dopracuj istniejące etapy 1–4, zaczynając od pakietu 1. Backend rozwija równolegle Karol z Codexem. Zachowaj kontrakty Server Actions, zapytań i uprawnień. Przed zmianą plików wspólnych uzgodnij ich zakres. Przygotuj mały PR z weryfikacją desktop/mobile i listą rzeczywistych testów. Nie implementuj kolejnych etapów ani fikcyjnych danych.
