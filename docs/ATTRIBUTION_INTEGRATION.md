# BoostLink — integracja przypisania klienta (E5, sandbox)

## Co jest dostępne

`GET /r/[token]` obsługuje publiczny link twórcy z E4. Cel pobierany jest z aktualnego zatwierdzonego wydania aplikacji, według rodzaju linku. Parametry zmieniające cel nie są obsługiwane; każde query w adresie `/r/...` jest odrzucane. Odpowiedź 302 ma `Cache-Control: no-store` i `Referrer-Policy: no-referrer`. HEAD i rozpoznany prefetch nie tworzą kliknięć.

Dla strony web przekierowanie dopisuje `bl_ref=blc_...`: losowy token konkretnego kliknięcia. Publiczny token z `/r/...` nie jest dowodem kliknięcia i nie może zastąpić `bl_ref`. Dla sklepów mobilnych przekierowanie nie dopisuje tokenu. Użytkownik wpisuje kod twórcy podczas rejestracji w aplikacji.

Kliknięcia oznaczają wykonane przekierowania, także potencjalnych botów. Nie są unikalnymi osobami ani gwarancją zainteresowania. Nie zapisujemy IP, user agentów, fingerprintów ani danych osobowych klientów.

## Jedno źródło polityk

Funkcja SQL `private.attribution_policy()` w migracji E5 jest źródłem reguł: `sandbox-v1`, ostatnie ważne kliknięcie, 30 dni od kliknięcia, świadomie wpisany kod ma pierwszeństwo przed utrwaleniem przypisania. Propozycje P-03/P-04/P-05 pozostają niezatwierdzone dla live. Obsługa E5 odmawia nowych operacji dla programów innych niż demo oraz dla oferty, której opublikowane okno różni się od obsługiwanych 30 dni. Nie zmieniamy po cichu reklamowanych warunków.

Lista `click_tokens` zawiera do 10 różnych tokenów przechowanych przez aplikację. Backend wybiera najnowsze niewygasłe kliknięcie według czasu serwera, nie kolejności tablicy ani czasu przysłanego przez klienta. Nieznany token lub token innej aplikacji jest błędem. Wygasłe tokeny są pomijane, jeśli pozostaje ważny; same wygasłe dają `expired_click_token`. Nieprawidłowy świadomie wpisany kod daje błąd, bez cichego przejścia do linku. Ważny kod ma pierwszeństwo nad listą tokenów.

## Sekret konkretnej aplikacji

Operator może nadać/obrócić sekret skryptem. Wymaga on wyłącznie na komputerze operatora konfiguracji serwerowej Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`) i `NEXT_PUBLIC_SITE_URL` z adresem BoostLink:

```bash
node --env-file=.env.local scripts/attribution-key.mjs \
  --app-id UUID_APLIKACJI \
  --out /private/tmp/boostlink-demo.env
```

Wskazany plik musi nie istnieć; skrypt tworzy go z prawami 0600. Sekret nie jest wypisywany w terminalu. Nie commituj go, nie umieszczaj w logach, kodzie frontendowym, zmiennej `NEXT_PUBLIC_*`, pliku dołączanym do bundla ani w aplikacji mobilnej. W środowisku wdrożonym przechowuj go w menedżerze sekretów backendu aplikacji.

Sekret `blk_demo_...` dotyczy dokładnie jednej aplikacji; nie jest kluczem Supabase. W bazie przechowywany jest tylko SHA-256 sekretu. Ważność wynosi 90 dni. Rotacja natychmiast odwołuje poprzednie klucze aplikacji; zaktualizuj konfigurację integracji. Utracony sekret wymaga rotacji. RPC zarządzające pozwala na to właścicielowi aplikacji lub skryptowi operatora, nie innemu twórcy/firmie. Webowy backend BoostLink używa do E5 klienta anonimowego i wąsko ograniczonych RPC, bez serwerowego klucza Supabase.

## Web: rejestracja klienta

1. Link twórcy przenosi użytkownika do zatwierdzonej strony aplikacji z parametrem `bl_ref`.
2. Aplikacja zapisuje token we własnej sesji po swojej stronie domeny. Zachowuje do 10 kandydatów, aby wybrać ostatnie ważne kliknięcie. Po przechwyceniu usuwa parametr z adresu, aby nie przekazywać go dalej przypadkiem. Cookie BoostLink nie jest potrzebne i nie jest odczytywane w domenie aplikacji.
3. Backend aplikacji podczas utworzenia konta bierze własny, stabilny, nieosobowy identyfikator klienta. Nie przyjmuje od przeglądarki identyfikatora twórcy ani aplikacji. Nie przesyła e-maila, nazwiska, telefonu ani identyfikatora zbudowanego z tych danych.
4. Backend zapisuje zdarzenie rejestracji u siebie do ponawiania i wysyła je do BoostLink. Przekazuje identyfikator i tokeny albo kod; sekret dodaje wyłącznie na serwerze.

Endpoint: `POST /api/v1/customers`. Nagłówki: `Authorization: Bearer <sekret aplikacji>`, `Content-Type: application/json`. Przykładowe ciało:

```json
{
  "customer_id": "opaque-account-8271",
  "click_tokens": ["blc_<64 znaki hex z rzeczywistego przekierowania>"]
}
```

Dla mobile lub świadomie wpisanego kodu:

```json
{
  "customer_id": "opaque-account-8272",
  "code": "APP-ABC123"
}
```

`customer_id` dopuszcza 1–128 znaków ASCII: litery, cyfry, `_`, `-`. UUID własnego backendu jest dobrym przykładem. Kod i tokeny są opcjonalne, aby zgłaszać także rejestracje organiczne. Inne pola (np. `creator_id`, `app_id`, `registered_at`) są odrzucane. Nie przesyłaj tokenu logowania klienta. Klient końcowy nie potrzebuje konta ani sesji BoostLink.

**Ważne dla ochrony istniejących klientów:** zgłaszaj wszystkie nowe konta, także bez polecenia. Takie konto zostaje trwale `unattributed`; późniejsze podanie kodu go nie przejmie. Przed podłączeniem istniejącej aplikacji trzeba zarejestrować jej dotychczasowe konta jako organiczne. BoostLink sam nie zna klientów, których aplikacja nigdy nie zgłosiła. Aplikacja odpowiada za prawdziwość identyfikatora i momentu rejestracji; sekret nie dowodzi niezależnie, że jej deklaracja jest prawdziwa.

## Odpowiedzi i ponowienia

- `201`: nowy rekord, `{ "id": "uuid", "created": true, "source": "link|code|unattributed" }`.
- `200`: istniejący rekord z tym samym `id`, `created: false` i pierwotnym źródłem. Późniejszy kod, inne kliknięcie lub retry po wygaśnięciu nie zmieniają przypisania.
- `400`: nieprawidłowe dane, kod/token, wygasły token, niedostępny program lub nieobsługiwana polityka.
- `401`: brak, wygaśnięcie lub odwołanie sekretu.
- `403`: żądanie z nagłówkiem `Origin`; endpoint jest do komunikacji backend–backend, bez CORS.
- `413` / `415`: ciało większe niż 8 KiB / typ inny niż JSON.
- `429`: limit 120 zatwierdzonych żądań na minutę na klucz, `Retry-After: 60`. Przekierowania mają dodatkowo limit 300 kliknięć na minutę na link. To ograniczenia sandboxa, nie kompletny system ochrony przed botami.
- `503`: przejściowy brak usługi; ponów z tym samym identyfikatorem. Szczegóły bazy i sekrety nie są zwracane.

Aplikacja zapisuje zgłoszenie do swojej kolejki/outboxa wraz z rejestracją konta. Po timeout/5xx/429 ponawia **ten sam** `customer_id`, z backoffem. Błędów 4xx dotyczących danych nie ponawia bez korekty. Kluczem idempotencji jest para aplikacja + identyfikator klienta; osobny `Idempotency-Key` nie jest wymagany.

Transakcja i blokada doradcza serializują równoległe żądania. Unikalna mapa tożsamości jest dodatkową ochroną. Pierwsze zatwierdzone żądanie ustala źródło na stałe. Backend zapisuje wyłącznie skrót identyfikatora ograniczony do aplikacji; panele otrzymują osobny UUID i pseudonim `Customer #...`.

Przy przypisaniu zapisywane jest odniesienie do aktualnej niezmiennej wersji całej tabeli warunków/stawek programu, a nie automatycznie do dnia dołączenia twórcy. Kolejna publikacja oferty nie zmienia tego snapshotu. Będzie on używany przez przyszłe adaptery płatności i silnik prowizji.

## Panele i kontrakt dla frontendu

Moduł `src/modules/attribution/queries.ts` dostarcza podsumowanie oraz stronicowaną listę klientów. Tabele `referral_clicks` i `customer_referrals` są tylko do odczytu dla uprawnionych kont. RLS ogranicza twórcę do jego danych, firmę do jej aplikacji; administrator ma dostęp administracyjny. Materiały tożsamości i skróty sekretów/tokenów są w schemacie `private` bez dostępu użytkowników.

Widoki: Overview twórcy/firmy, Links twórcy i Referrals obu stron. Porównanie linków liczy rejestracje wyłącznie przypisane do danego linku. Kod bez linku pozostaje oddzielnym źródłem. Firma widzi pseudonimy klientów i zagregowane wyniki swoich programów; nie otrzymuje prywatnych tokenów linków twórcy. Zestawienie pokazuje maksymalnie 100 linków, a lista klientów 25 rekordów na stronę. Metryki to sumy od początku zapisu danych; nie dodano fikcyjnych danych historycznych. Płatności/prowizje/subskrypcje nie są implementowane w E5.

## Aplikacja demonstracyjna

Kod: `examples/attribution-demo/server.mjs`. To lokalna aplikacja HTTPS z symulowanymi kontami, bez produkcyjnego uwierzytelniania i bez zbierania PII. Wymaga Node 24+ i `openssl`. Tworzy jednodniowy certyfikat w katalogu tymczasowym; nie zapisuje klucza TLS do repo. Chrome obsługuje lokalną domenę `demo.localhost` jako loopback.

1. Uruchom lokalny Supabase i BoostLink zgodnie z README. Zastosuj migrację E5, uruchom `pnpm db:types`.
2. W panelu firmy przygotuj aplikację z adresem strony **`https://demo.localhost:3443/`**, oknem 30 dni i co najmniej jednym planem. Zgłoś ją i zatwierdź jako demo przez osobne konto administratora.
3. Twórca z profilem społecznościowym dołącza do programu. Skopiuj jego link web i kod.
4. Nadaj sekret dla UUID tej aplikacji poleceniem wyżej. Uruchom:

```bash
node --env-file=/private/tmp/boostlink-demo.env examples/attribution-demo/server.mjs
```

5. Otwórz `https://demo.localhost:3443` w Chrome i zaakceptuj **lokalny jednodniowy certyfikat demonstracyjny**. Zamknij stronę i wejdź przez skopiowany link BoostLink. Aplikacja przechwyci token po swojej stronie i usunie go z URL.
6. W formularzu wpisz nieosobowy uchwyt konta demo, np. `demo-account-1`. Serwer wygeneruje własny UUID klienta i zgłosi rejestrację do BoostLink. Zobaczysz 201 oraz wynik `link`.
7. Powtórz ten sam uchwyt: 200 i ten sam rekord. Dla nowego uchwytu wpisz kod: wynik `code`. Dla rejestracji organicznej użyj nowej prywatnej sesji bez linku i kodu; późniejszy kod nie zmieni tego konta.
8. Sprawdź panele Referrals, Overview i Links; zaloguj drugą firmę/twórcę i zweryfikuj izolację. Po zakończeniu zatrzymaj demo (`Ctrl+C`), usuń plik sekretu i odwołaj klucz przez rotację.

Konta i sesje demo są w pamięci i znikają po restarcie; test retry używa tej samej uruchomionej instancji. Dane przypisania w BoostLink pozostają w bazie. Dane integracyjne wprowadzane ręcznie usuwa operator wyłącznie z własnej bazy testowej. Nie uruchamiaj `db:reset` na bazie zawierającej potrzebne dane.

E5 wymaga prawdziwego lokalnego Supabase. Przy `LOCAL_PGLITE_SANDBOX=1` interfejs pokazuje jawny komunikat o niedostępności śledzenia; nadal można oglądać wcześniejsze ekrany. Sandbox UI nie emuluje API, kliknięć ani klientów.

## Weryfikacja

`pnpm test` obejmuje migracje, RLS, wygaśnięcie tokenu, reguły wyboru, retry, zmianę źródła i walidację przekierowań/HTTP. `pnpm test:integration` sprawdza prawdziwy PostgREST, równoległe przypisania, izolację, odwołanie klucza i historyczne stawki. Dokładne wyniki bieżącego odbioru są w `docs/IMPLEMENTATION_STATUS.md`.
