# BoostLink — integracje płatności, ETAP 6

## Zakres i ograniczenia

E6 odbiera i weryfikuje powiadomienia, trwale zapisuje je przed odpowiedzią HTTP i przetwarza osobnym workerem. Obsługuje płatność abonamentową, odnowienie, stan subskrypcji, wyłączenie odnowienia, refund i spór. Nie wylicza prowizji, nie zasila finansowania firmy i nie tworzy dostępnego salda ani wypłat.

Adaptery są w `src/modules/payments/adapters.ts`, wejście HTTP w `ingress.ts`, logika atomowa i kolejka w migracji `20261026225312_payment_integrations.sql`. Frontend może wymieniać prezentację komponentów bez zmiany tych kontraktów.

**Rzeczywiste testy z sandboxami Stripe i RevenueCat: blocked**, dopóki operator nie dostarczy dostępu i sekretów dostawców. Fixtures w `tests/fixtures/payments/` są jawnie syntetyczne. Przejście podpisanego fixture przez lokalny endpoint i worker sprawdza nasz pipeline, nie dowodzi zakupu u dostawcy. Generic API poświadcza deklarację backendu aplikacji, nie niezależną prawdziwość sprzedaży.

Live ma oddzielne konfiguracje, referencje sekretów i kolumnę środowiska w danych. Poprawnie uwierzytelnione eventy live są zapisywane jako `blocked`; worker ich nie przetwarza. Nie ma flagi pozwalającej po cichu włączyć rozliczenia live.

## Dokumentacja dostawców sprawdzona przed implementacją

- [Stripe: webhooki](https://docs.stripe.com/webhooks) — podpisujemy/sprawdzamy niezmienione ciało, nagłówek z czasem i HMAC; odpowiedź następuje po trwałym zapisie, a przetwarzanie poza requestem.
- [Stripe: zdarzenia subskrypcji](https://docs.stripe.com/billing/subscriptions/webhooks), [Invoice](https://docs.stripe.com/api/invoices/object), [Refund](https://docs.stripe.com/api/refunds/object) — płatność identyfikuje faktura, refund ma własny identyfikator i może odwoływać się do payment intent/charge.
- [RevenueCat: webhooki](https://www.revenuecat.com/docs/integrations/webhooks) — wymagamy skonfigurowanego Bearer authorization i oddzielenia środowisk.
- [RevenueCat: typy i pola](https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields) — `CANCELLATION` z `UNSUBSCRIBE` nie jest refundem. `CUSTOMER_SUPPORT` oznacza refund; `REFUND_REVERSED` odwrócenie refundu. Kwota w zakupionej walucie nie jest tym samym co pole ceny w USD.

## Uruchomienie lokalne bez kasowania danych

```bash
pnpm exec supabase db push --local --yes
pnpm db:types
pnpm db:advisors
pnpm payments:setup
pnpm dev
```

`payments:setup` działa tylko dla adresu lokalnego. Czyta klucz operatora ze środowiska lub z pasującego lokalnego `supabase status`, nie wypisuje go. Nadaje ograniczony token backendu płatności i zapisuje go do ignorowanego `.env.local` z prawami 0600. Nie resetuje bazy ani kluczy E5.

W drugim terminalu:

```bash
pnpm payments:worker
# pojedynczy przebieg diagnostyczny:
pnpm payments:worker --once
```

W Node 24+ uruchamiany jest ten sam TypeScript adaptera co w aplikacji. Node może wypisać ostrzeżenie o autodetekcji modułu; nie jest to błąd kolejki. Worker loguje tylko stałe kody wyników, bez payloadów, tokenów i identyfikatorów klientów. W środowisku hostowanym uruchom go jako osobny nadzorowany proces, z restartem po awarii. Sam proces Next nie zastępuje workera.

Nowe zmienne wyłącznie serwerowe:

```dotenv
PAYMENT_BACKEND_TOKEN=<ograniczony token nadany przez operatora>
PAYMENT_WEBHOOK_SECRETS_JSON='{"APP_A_STRIPE_TEST":"<sekret webhooka Stripe>","APP_A_RC_TEST":"<losowy token RevenueCat>","APP_A_GENERIC_TEST":"<losowy sekret HMAC>"}'
```

Wszystkie sekrety mają co najmniej 32 znaki; nazwy referencji są globalnie unikalne, a wartości nie mogą być współdzielone przez kilka referencji. Sandbox i live mają osobne klucze. Żaden sekret nie ma prefiksu `NEXT_PUBLIC_`. Nie umieszczaj plików środowiska w repo, zrzutach ekranu ani logach. Po zmianie rejestru sekretów zrestartuj Next. `SUPABASE_SECRET_KEY` pozostaje wyłącznie w skryptach/testach; serwer HTTP i worker korzystają z klucza publicznego Supabase oraz ograniczonego tokenu E6.

Tokeny E6 mają 90 dni ważności, mogą współistnieć (np. osobny token testu), a operator odwołuje konkretny token przez `revoke_payment_backend_token`. Nie nadpisuj tokenu działającego procesu podczas uruchamiania testów.

## Konfiguracja i mapowania

Panel `/company/integrations` pozwala właścicielowi:

1. Wybrać Stripe / RevenueCat / Generic oraz sandbox/live, podać identyfikator konta dostawcy i **nazwę referencji** sekretu. Sekret instaluje operator na serwerze; formularz nie wymaga przekazywania go przeglądarce.
2. Wybrać integrację będącą autorytatywnym źródłem dla `stripe`, `app_store`, `play_store` lub `generic`.
3. Mapować identyfikator price/product na istniejący abonament własnej aplikacji.
4. Mapować zewnętrznego klienta operatora na istniejący nieosobowy identyfikator klienta aplikacji z E5.
5. Powiązać referencję refundu (np. `pi_...` / `ch_...`) z kanoniczną fakturą/zakupem, jeżeli webhook nie daje tego powiązania bezpośrednio.
6. Odczytać ostatni otrzymany i przetworzony event, problem i instrukcję naprawy; zakolejkować ponowienie po poprawie mapowania.

ID klienta aplikacji, klienta operatora, subskrypcji i transakcji są odrębnymi identyfikatorami. Nie zgadujemy mapowania po e-mailu, metadanych użytkownika ani podobnej nazwie. Mapowania klienta i referencji nie można przepiąć na inną tożsamość. Zmiana konta dostawcy po odebraniu eventów jest blokowana. W MVP jest jedna konfiguracja danego providera na aplikację i środowisko.

**Jedno źródło na sklep:** dla Stripe sprzedaży wybierz Stripe albo RevenueCat/Generic, które ją relacjonuje. Pozostałe powiadomienia tego sklepu są zachowywane jako `ignored / secondary_source`, bez skutku zakupowego. Nie porównujemy losowo różnych identyfikatorów Stripe i RevenueCat. Źródła nie można zmienić automatycznie po pierwszym zakupie; migracja źródła wymaga osobnego uzgodnienia i uzgodnienia historii. To zabezpiecza także wtedy, gdy oba systemy nazywają tę samą sprzedaż różnymi ID.

## Endpointy i uwierzytelnienie

Webhook: `POST /api/webhooks/{provider}/{integration_uuid}`. Provider: `stripe`, `revenuecat`, `generic`. JSON do 128 KiB. Brak CORS i brak dostępu do sekretów z klienta. Payload jest prywatny, publiczny panel widzi tylko bezpieczne metadane i kody błędów.

- **Stripe:** skonfiguruj endpoint snapshot i sekret `whsec_...` w referencji danej integracji. Sprawdzany jest `Stripe-Signature` na oryginalnym ciele, HMAC SHA-256 i tolerancja 300 sekund. `livemode` musi pasować do integracji. Dla Connect sprawdzane jest także `event.account`; dla bezpośredniego konta to jego unikalny sekret endpointu poświadcza nadawcę. Sama wpisana nazwa konta nie stanowi niezależnego sprawdzenia konta u Stripe.
- **RevenueCat:** w konfiguracji webhooka ustaw dokładny nagłówek `Authorization: Bearer <sekret>`, filtr aplikacji i środowiska. Weryfikujemy stałoczasowo token oraz `event.app_id` i `event.environment`. Nie przypisujemy RevenueCat nieistniejącego podpisu HMAC.
- **Generic:** `BoostLink-Signature: t=<sekundy Unix>,v1=<hex HMAC-SHA256(sekret, t + "." + raw_body)>`; tolerancja 300 sekund. `account_id` i środowisko muszą odpowiadać konfiguracji. Podpis generuje backend aplikacji.

Odpowiedź 200 oznacza **trwałe odebranie**, nie zakończenie przetwarzania. Retry eventu o tym samym ID i identycznym ciele zwraca 200 bez duplikatu. To samo ID z innym ciałem daje 409, zwiększa licznik konfliktów i zachowuje oryginał. Brak/niepoprawny podpis: 401; niepoprawna koperta/środowisko: 400; rozmiar: 413; typ treści: 415; niedostępność zapisu: 503; limit odebranych żądań: 429. Po timeout/5xx/429 nadawca ponawia ten sam event ID i ciało, ze świeżym podpisem czasowym.

## Mapowanie klienta z backendu aplikacji

`POST /api/v1/payment-customers`, `Authorization: Bearer <klucz aplikacji E5>`, JSON:

```json
{
  "integration_id": "uuid integracji tej aplikacji",
  "provider_customer_id": "cus_opaque_8271",
  "customer_id": "opaque-account-8271"
}
```

Najpierw zarejestruj `customer_id` przez API E5, nawet jeśli jest organiczny. Klucz musi należeć do aplikacji integracji. API nie przyjmuje identyfikatora twórcy. Nie przesyłaj imienia, telefonu ani e-maila. Więcej identyfikatorów operatora może wskazywać to samo konto aplikacji (np. jawnie obsłużony alias RC), ale nie przejmują przypisania E5.

## Wspólny format zdarzenia / Generic API

Schema jest eksportowana jako `paymentEventSchema` i typ `PaymentEvent`. Przykład ciała Generic znajduje się w `tests/fixtures/payments/generic-renewal.json`. Koperta Generic dodaje `id` oraz `account_id`. Pola biznesowe:

- `environment`, `kind`, `occurred_at`, `store`;
- osobne `customer_id` operatora, `subscription_id`, `product_id`;
- `transaction_id` fizycznego zakupu, opcjonalne `aliases` (np. charge/payment intent do faktury);
- `amount_minor` jako **ciąg cyfr** najmniejszych jednostek, `currency`, `period_end`, `is_trial`;
- dla stanu subskrypcji `state`, opcjonalnie `auto_renew`;
- dla refundu/sporu osobny `adjustment_id` i `adjustment_state`, plus referencja oryginalnej transakcji.

Kwoty zapisujemy jako `bigint`, nie float. Parser zachowuje leksykalne wartości liczb JSON; RevenueCat cena w zakupionej walucie przechodzi do najmniejszych jednostek bez błędu binarnego. Obsługiwane przeliczenia RC: EUR/USD/GBP/PLN/CAD/AUD/CHF (2), JPY/KRW (0), KWD/BHD (3). Nieznana waluta albo nieprzedstawialna dokładnie kwota zatrzymuje event do obsługi, zamiast zgadywać kurs/zaokrąglenie. Stripe podaje już jednostki minor. Timeline zwraca kwoty jako tekst, aby JavaScript nie utracił precyzji.

## Adaptery i obsługiwane zdarzenia

Stripe: `invoice.paid`, `invoice.payment_succeeded`, `customer.subscription.*`, `refund.created`, `refund.updated`, `refund.failed`, `charge.dispute.*`. Faktura tworzy jeden zakup niezależnie od liczby notyfikacji. Refund nie jest utożsamiany z anulowaniem subskrypcji. Model obsługuje jedną pozycję abonamentową w fakturze; wielopozycyjne faktury, niejednoznaczne proracje i brak wymaganych pól pozostają `failed / adapter_error` do jawnej obsługi. Nie przypisujemy całej niejednoznacznej faktury losowemu planowi. Thin event wymaga pobrania danych i nie jest udawany jako pełny snapshot.

RevenueCat: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `UNCANCELLATION`, `EXPIRATION`, `SUBSCRIPTION_PAUSED`, `BILLING_ISSUE`, `PRODUCT_CHANGE`, `SUBSCRIPTION_EXTENDED`, `REFUND_REVERSED`. Sklepy: App Store, Play i Stripe. `TEST` oraz nieobsługiwane typy są ignorowane i nie weryfikują pipeline'u. Obsługujemy także identyfikatory `$RCAnonymousID:...`, ale wymagają jawnego mapowania do zarejestrowanego konta aplikacji ([identyfikacja RC](https://www.revenuecat.com/docs/customers/identifying-customers)). Nie budujemy automatycznego przejmowania klienta przy transferach/aliasach; mapowanie pozostaje jawne.

Refundy mają własną idempotentną tożsamość, mogą być częściowe i zachowują stan. Spór ma stan otwarty/wygrany/przegrany; nie jest od razu zwrotem. Stan subskrypcji uwzględnia czas zdarzenia dostawcy, a nie kolejność otrzymania. Stripe informacja o płatności nie przywraca zakończonej subskrypcji. Refund/spór nie cofa stanu terminalnego do pending/open przy tym samym czasie. Sprzeczne wyniki terminalne trafiają do `needs_review` i nie dają płatnej wartości. Sprzeczne stany subskrypcji z identycznym czasem nie są rozstrzygane po losowym ID: aktywność jest wstrzymana jako `unknown`, a panel wskazuje potrzebę nowszego autorytatywnego zdarzenia.

## Kolejka, awarie i ręczna naprawa

Worker pobiera zadania przez `FOR UPDATE SKIP LOCKED`, nadaje lease na 2 minuty i zwiększa liczbę prób. Zapis zakupu, mapowania transakcji, projekcji subskrypcji, timeline i stanu eventu jest jedną transakcją. Awaria przed commitem nie tworzy częściowego zakupu; porzucony lease może przejąć następny worker. Maksymalnie 10 prób, retry z opóźnieniem do godziny; po wyczerpaniu prób potrzebna jest ręczna naprawa i `Queue retry`.

`waiting_customer_mapping`, `waiting_plan_mapping`, `waiting_transaction`, `waiting_source` zachowują oryginalny event do czasu uzupełnienia danych. Refund otrzymany przed zakupem poczeka na zakup. Błędny adapter nie traci payloadu: po poprawie kodu operator ponawia event. Publiczne RPC workerów wymagają osobnego serwerowego tokenu, którego użytkownicy nie odczytują z bazy. Skrypty testowe mają osobny token i filtr własnej integracji; nie przejmują cudzych zadań.

Nie sumuj wartości `amount_minor` z timeline jak dziennika rozliczeń. Timeline pokazuje zdarzenia i zmiany ich stanu, a nie księgowania. E7 zbuduje niezmienny dziennik prowizji na podstawie deduplikowanych zakupów i historycznych warunków E5.

## Metryki i kontrakt dla kolegi od frontendu

- `getPaymentIntegrations(appId)` — konfiguracja bez sekretów, stan dostępności credentiala, plany, źródła, mapowania i 50 ostatnich eventów z kodami naprawy.
- `getPaymentMetrics(appId?, companyContext?)` — płacący poleceni klienci i aktywni płacący subskrybenci. Organiczne rejestracje nie zawyżają wyników programu.
- `getCustomerPaymentTimeline(customerId?, appId?, companyContext?)` — 50 ostatnich zdarzeń z pseudonimem, rodzajem, datą, stanem i dokładną kwotą, bez PII i source customer ID.
- `PaymentResults` jest podłączony przez istniejący `AttributionPanel` do Overview/Referrals/Links. Szczegóły klienta: `/creator/referrals/[id]`, `/company/referrals/[id]`. To podłączenie danych E6, nie redesign UI E1–E4.
- Formularze używają Server Actions, `FormState`, `FieldGroup`/`Field`. Zachowaj nazwy pól i kontrolę właściciela; nie przenoś sekretów lub zapisów do przeglądarki.

Płacący klient ma dodatnią płatność niebędącą trialem, z pozostałą wartością po refundach i bez przegranego sporu. Aktywny płacący subskrybent dodatkowo ma nieprzekroczony opłacony okres oraz stan active/past_due; wyłączenie auto-renew nie kończy już opłaconego okresu. Liczymy klientów, nie liczbę odnowień ani sumę subskrypcji. Zapytania odróżniają kontekst twórcy od firmy także przy obu rolach na jednym koncie; same szerokie prawa odczytu organizacji nie zawyżają panelu twórcy. Nie sumujemy walut ani nie wyliczamy prowizji.

## Ręczny odbiór

1. Firma konfiguruje sandbox, operator dodaje jej unikalny sekret; stan początkowy to Configured, bez Verified.
2. Twórca dołącza do programu, aplikacja zgłasza klienta przez E5. Zmapuj customer i product/price oraz wybierz autorytatywne źródło sklepu.
3. Stripe CLI/dostawca wysyła zakup i odnowienie do dostępnego endpointu; dla RC wykonaj zakup sandbox lub test dashboardu (sam TEST nie daje Verified). Uruchom worker.
4. Sprawdź zakończone eventy, ostatni sukces, timeline klienta i metryki obu stron. Ponów ten sam event i inną notyfikację tej samej transakcji — nie przybywa zakup.
5. Usuń mapowanie z przygotowania **nowej** tożsamości testowej (nie kasuj historii), wyślij event; powinien czekać. Uzupełnij mapowanie i kolejkuj retry. Przetestuj fałszywy podpis, refund przed zakupem, anulowanie odnowienia, refund częściowy i spór.
6. Druga firma/twórca nie widzi cudzych klientów, eventów ani zakupów. Usuń wyłącznie własne jednorazowe fixtures z lokalnej bazy.

`pnpm test` i `pnpm test:integration` sprawdzają kod i prawdziwy lokalny Supabase. Nie nazywaj fixtures odbiorem kont dostawców. Wyniki `pass / fail / blocked` zapisano w `docs/IMPLEMENTATION_STATUS.md`.
