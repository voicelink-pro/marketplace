# BoostLink — etap 7, prowizje i zestawienia sandbox

## Granice i kontrakt

E7 buduje niezmienny dziennik rozliczeń i projekcję należności na podstawie deduplikowanych transakcji E6. Nie uruchamia prawdziwych wpłat ani wypłat, Stripe Connect, KYC, automatycznych doładowań ani salda live. Prawdziwy odbiór Stripe/RevenueCat pozostaje blocked do zapewnienia dostępów; [playbook operatora](PROVIDER_SANDBOX_PLAYBOOK.md).

Nie ma domyślnej prowizji platformy. Operator jawnie deklaruje wersję polityki sandbox i podstawę konkretnej transakcji. Propozycja 10% działa wyłącznie w świadomie uruchomionych fixtures. Generic API nadal nie dowodzi niezależnie prawdziwości sprzedaży.

Migracja: `20261027185130_commission_ledger.sql`. Nie zmienia wcześniejszych migracji. Używa istniejącego ograniczonego `PAYMENT_BACKEND_TOKEN` dla workera/basis/close; nie wprowadza nowych zmiennych publicznych ani sekretów. `SUPABASE_SECRET_KEY` jest używany wyłącznie przez skrypt operatora/testy. Konfiguracja, pozorne finansowanie i symulacja payoutu są dostępne tylko service_role.

## Zasady pieniędzy

- Sprzedaż, podstawa prowizji, prowizja brutto, opłata platformy i kwota twórcy to odrębne wartości `bigint`. Odczyt JSON przekazuje pieniądze jako tekst. Walut nigdy nie sumujemy.
- P-12: zaokrąglenie half-up do jednostki minor, osobno brutto i opłata; twórca otrzymuje dokładną resztę, więc kwota twórcy + opłata = brutto. Mnożenie SQL używa numeric przed konwersją bigint; kalkulator TS używa bigint.
- Stawka jest pobierana po wewnętrznym ID kupionego planu z całego snapshotu warunków klienta E5. Zmiana draftu nie przelicza historii. Nowy nieznany plan/waluta tworzy sprawę do rozpatrzenia, bez zgadywania stawki. Każde odnowienie przechodzi tę samą kontrolę.
- Jedna roczna płatność daje jeden zapis prowizji. Nie produkujemy miesięcznych sprzedaży z rocznej opłaty.
- Trial, zero i klient organiczny nie tworzą prowizji; live jest ignorowane. Brak podstawy pozostaje waiting i blokuje zamknięcie zależnego okresu. Uzupełnienie basis ponawia zadanie.
- P-13: sandbox refund redukuje podstawę proporcjonalnie do skumulowanej zwróconej części sprzedaży, z obcięciem do minor; resztę prowizji liczymy z oryginalnych stawek. Korekta jest różnicą między poprzednim i nowym wynikiem, więc seria częściowych refundów nie mnoży zaokrągleń. Suma refundów/strat jest ograniczona kwotą sprzedaży. Płatność, refund i cofnięcie refundu nie nadpisują poprzednich wpisów.
- Otwarty/niejednoznaczny spór lub pending refund wstrzymuje należność w held. Rozstrzygnięcie uwalnia ją do właściwego stanu; przegrana koryguje kwotę. Cofnięcie refundu nie może spowodować przekroczenia dostępnego finansowania: po ponownym wykorzystaniu środków przywrócona należność może znów czekać na finansowanie.
- Refund dotyczący pozycji in_payout/paid tworzy sprawę wymagającą polityki. E7 nie przypisuje automatycznie kosztu żadnej stronie. Symulacja tych stanów służy wyłącznie odbiorowi sandbox; żaden przelew nie następuje.

## Dziennik i atomowość

`commission_earnings` utrwala oryginalne wyliczenie. `commission_journals` zawiera całe zestawy podpisanych postings w jednej niezmiennej wartości JSON: suma wszystkich pozycji musi wynosić zero, konta i kwoty są walidowane constraintem. Oryginalne wyliczenia, dziennik, zamknięcia, sprawy i zestawienia nie mają publicznych zapisów; triggery odmawiają zmian historii. Usunięcie wyłącznie przez uprzywilejowane usunięcie nadrzędnych danych testowych jest dopuszczone kaskadą; zwykły frontend nie może usuwać aplikacji ani dziennika.

Stan bieżący jest odtwarzalną prywatną projekcją, nie `users.balance`. Naliczenie/korekta, wpis dziennika i stan zadania są atomowe. Klucze idempotencji chronią płatność, korektę, finansowanie i zamknięcie. Blokada per aplikacja jest pobierana przed blokadą zadania; konkurencyjne workery sprawdzają ponownie, czy zadanie nadal jest pending. Przetwarzanie różnych aplikacji jest uporządkowane po app ID. Limit partii 100; błędy mają stałe kody, bez payloadów w logach.

## Miesiące i finansowanie

Miesiąc kalendarzowy UTC jest propozycją P-09. Operator zamyka wyłącznie ukończony miesiąc po uzgodnieniu zadań. Pozycja pozostaje accrued, dopóki jej własny miesiąc nie zostanie zamknięty. Zamknięcie innego okresu nie uwalnia jej przypadkiem. Po zamknięciu: unfunded albo available, zależnie od kontrolowanego finansowania sandbox. Nie ma dodatkowego holda 30 dni ani własnego minimum wypłaty.

P-14: sandbox alokuje pełne pozycje, kolejno według okresu, daty i ID, w osobnej walucie. Późniejszy dopływ finansowania uwalnia wcześniejszą należność bez ponownego zamykania miesiąca. Częściowe finansowanie jednej pozycji nie jest udawane jako pełne.

`commission_statements` to niezmienny wynik aktywności w okresie, osobno dla firmy/twórcy i waluty. Nie jest aktualnym saldem payoutu. Późny zakup/korekta zamkniętego miesiąca trafia do aktualnego otwartego okresu. Zachowuje czas źródłowy, pierwotną transakcję i jej okres; UI pokazuje także miesiąc księgowania. Nie nadpisuje już zamkniętego zestawienia. Sprawy nieznanego planu/po wypłacie są ujawnione osobno i nie stają się zgadywanym obciążeniem.

## Uruchomienie bez resetu

```bash
pnpm exec supabase db push --local --yes
pnpm db:types
pnpm db:advisors
# Jeśli nie ma jeszcze tokenu E6:
pnpm payments:setup
pnpm commissions:worker
```

Worker E6 nadal działa osobno: `pnpm payments:worker`. E6 dodaje transakcje i korekty do kolejki E7 triggerem; E7 worker przetwarza je, gdy mają jawną podstawę. `pnpm commissions:worker --once` to pojedynczy przebieg. Produkcyjny nadzór procesu i restart po awarii pozostają obowiązkiem hostingu; strona Next nie zastępuje workerów.

Operator jawnie uruchamia przykładową politykę i podstawę fixtures:

```bash
pnpm commissions:operator policy --fixture --fee-bps 1000 --effective-at 2020-01-01T00:00:00Z
pnpm commissions:operator basis --fixture --transaction <UUID> --amount-minor 1499
# Alternatywnie jawne przyjęcie P-02 dla wszystkich kwalifikujących się sandboxowych zakupów jednej aplikacji:
pnpm commissions:operator basis-all --fixture --paid-including-tax --app <APP_UUID>
pnpm commissions:worker --once
pnpm commissions:operator close --fixture --app <APP_UUID> --month 2026-09-01
pnpm commissions:operator fund --fixture --app <APP_UUID> --currency EUR --amount-minor 10000 --reference fixture_001
```

To świadome dane sandboxowe, nie automatyczna konfiguracja live. Ponowienie tej samej referencji finansowania z inną kwotą/walutą jest konfliktem. Wersja polityki nie może zmienić wybranej już polityki istniejących deklaracji podstawy. Każda podstawa jest nieprzepinana. Symulacja wypłaty dla testera: `simulate-payout --fixture --earning <UUID>`, a następnie ten sam command z `--paid`; wyłącznie uprawnienia operatora, brak płatności.

## Odczyty dla frontendu

`getCommissionWorkspace({appId?, company?, customer?})` → totals per currency, latest 100 earnings/statements/corrections/cases/jobs. Tylko serwer. `CommissionPanel` jest podłączony do Earnings, Overview, Funding & statements i obu widoków klienta. RLS i RPC jawnie rozdzielają kontekst firmy i twórcy, także przy obu rolach na jednym koncie. Sekrety i provider customer IDs nie są zwracane. Dopracowanie wyglądu pozostaje w zakresie kolegi; kontrakty liczb, statusów i uprawnień powinny zostać zachowane.

## Odbiór

1. Przetwórz E6 purchase/renewal, zadeklaruj basis i uruchom E7 worker. W Earnings porównaj sprzedaż, podstawę, historyczną stawkę i podział brutto.
2. Powtórz event i uruchom dwa workery — nadal jeden zapis naliczenia. Zmień ofertę i kup znany historyczny plan; wcześniejsza stawka obowiązuje.
3. W fixture zakończonego miesiąca wykonaj close dwa razy/równolegle. Jest jedno zestawienie. Bez finansowania kwota czeka. Dodaj jawne funding fixture — uwalnia się bez kolejnego close.
4. Sprawdź częściowy/full refund, cofnięcie i spór. Zamknięte zestawienie zostaje, korekta ma osobny wpis. Po symulowanej wypłacie powstaje sprawa, bez automatycznego przerzucenia kosztu.
5. Obca firma/twórca nie widzi tych danych i nie może wywołać mutacji operatora.

Testy: `pnpm test`, `pnpm test:integration`. Suite integracyjny E7 wymaga lokalnego Dockera (seeduje wyłącznie własne fixtures SQL), a skutki biznesowe sprawdza przez prawdziwe RPC Data API, także równolegle. Usuwa własną aplikację/konta/politykę i nie resetuje bazy. Opcjonalny odbiór SSR: `E7_HTTP_BASE_URL=http://localhost:3000 pnpm test:integration tests/integration/commissions.test.ts` przy działającym aktualnym buildzie. Nie zmienia cookies przeglądarki użytkownika.
