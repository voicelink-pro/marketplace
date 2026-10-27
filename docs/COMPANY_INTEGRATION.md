# Integracja firmy z BoostLink — pilot sandbox

Ta instrukcja zbiera E3–E9. Rzeczywiste pieniądze są wyłączone. Sprzedaż w aplikacji firmy i finansowanie prowizji w BoostLink są odrębnymi ścieżkami.

## 1. Oferta i plany

Utwórz firmę i jedną aplikację. Uzupełnij opis, link produktu/sklepów, media i warunki. Dodaj plany z oddzielnymi nazwami i kluczami operatora, ceną/walutą/okresem oraz prowizją. Zgłoś ofertę administratorowi. Publiczny katalog pokazuje wyłącznie zatwierdzoną wersję demo; zmiana szkicu jej nie nadpisuje.

## 2. Rejestracja wszystkich klientów aplikacji

Backend aplikacji otrzymuje osobny klucz API BoostLink o zakresie tej aplikacji. Nie umieszczaj go w kodzie przeglądarki ani aplikacji mobilnej. Używaj nieosobowego, trwałego identyfikatora klienta.

- Link web przenosi token `bl_ref`; backend aplikacji zachowuje go do rejestracji konta i usuwa z widocznego URL.
- Przy rejestracji zgłoś klienta przez `POST /api/v1/customers`, wraz z tokenem lub świadomie wpisanym kodem.
- Zgłaszaj także rejestracje organiczne i zarejestruj istniejącą bazę klientów jako organiczną przed integracją. Platforma nie zna wcześniej niezgłoszonych kont.
- Retry tej samej tożsamości nie przepisuje twórcy ani historycznej wersji warunków.
- Polecenie mobilne wymaga kodu i mapowania konta. Samo przejście do App Store nie zachowuje automatycznie atrybucji.
- HTTP 409 `program_paused_funding` oznacza wstrzymanie nowych poleceń po błędzie finansowania. Nie traktuj go jako błędu podpisu lub awarii operatora; dotychczasowe konta i retry ich rejestracji pozostają zachowane.

Pełny kontrakt, rotacja klucza, limity i przykład: [ATTRIBUTION_INTEGRATION.md](ATTRIBUTION_INTEGRATION.md).

## 3. Zakupy, klienci i mapowania operatora

W Integrations wybierz Stripe, RevenueCat lub Generic i środowisko sandbox. Operator skonfiguruje oddzielny sekret podpisu webhooków na serwerze BoostLink. `credential_ref` jest referencją konfiguracji, nie sekretem.

- Wybierz jedno autorytatywne źródło dla danego sklepu.
- Zmapuj klucze planów operatora na plany aplikacji.
- Zmapuj klienta operatora na wcześniej zarejestrowanego klienta aplikacji przez backend–backend `POST /api/v1/payment-customers`.
- Skieruj podpisane webhooki na stały endpoint `/api/webhooks/[provider]/[integrationId]`. Lokalny Stripe CLI służy lokalnemu sandboxowi; nie zastępuje stałego hostowanego endpointu pilota.
- Inbox potwierdza odbiór po trwałym zapisie; worker wykonuje normalizację i zapis efektu. Ponowienia i lustrzane notyfikacje nie mogą tworzyć drugiego zakupu.
- Configured nie oznacza verified. Odbiór wymaga prawidłowo uwierzytelnionego i zmapowanego zdarzenia. Generic potwierdza podpis nadawcy, nie niezależną prawdziwość sprzedaży.
- Gdy zdarzenie oczekuje na mapowanie, popraw konfigurację i ponów je z panelu; nie zmieniaj ręcznie danych klienta ani dziennika.

Kontrakty/ograniczenia adapterów: [PAYMENT_INTEGRATIONS.md](PAYMENT_INTEGRATIONS.md). Rzeczywisty odbiór Stripe opisuje status projektu; RevenueCat wymaga oddzielnego zakupu testowego.

## 4. Finansowanie prowizji

W Funding uruchom osobny onboarding operatora testowego, autoryzuj metodę i wpłać środki testowe EUR. Saldo zwiększa się dopiero po potwierdzonej dostępności, nie po powrocie na success URL. Ustaw własny próg i kwotę auto-doładowania.

Po niepowodzeniu automatycznego zasilenia nowe polecenia są wstrzymane, ale odnowienia istniejących klientów nadal naliczają zobowiązania. Skuteczna wpłata pokrywa zaległości; wznowienie wymaga wystarczającego finansowania. Środki innej firmy nie finansują Twoich prowizji.

Zakupy Stripe w Twojej aplikacji nie zasilają automatycznie tego konta. Dostęp do sprzedażowej integracji nie upoważnia BoostLink do obciążania salda firmy. Szczegóły: [FUNDING_AND_PAYOUTS.md](FUNDING_AND_PAYOUTS.md).

## 5. Rozliczenia i wypłaty

Operator BoostLink deklaruje jawne założenia sandbox dla procentu platformy i podstawy prowizji; nie zakłada się domyślnie 10% w live. Stawka klienta pochodzi z jego historycznych warunków. Zestawienie miesięczne nie zastępuje wpłaty firmy.

Po zamknięciu właściwego miesiąca finansowane i uzgodnione zarobki stają się dostępne. Twórca sam potwierdza Withdraw i przechodzi onboarding operatora odbiorcy. Transfer do operatora i wypłata do banku mają osobne statusy. Refund po wypłacie wymaga rozpatrzenia i uzgodnionej polityki.

Szczegóły: [COMMISSION_ACCOUNTING.md](COMMISSION_ACCOUNTING.md).

## 6. Odbiór i wsparcie

Przed pilotażem wykonaj: rejestrację przez link i kod, organiczną rejestrację, zakup i odnowienie, duplikat webhooka, refund, anulowanie, brak finansowania i jego przywrócenie. Sprawdź identyfikatory operatora względem historii BoostLink i zestawień.

W `/support` zgłoś problem z datą, ekranem i bezpiecznym kodem błędu. Nie przesyłaj kluczy, payloadów zawierających dane klienta, numerów rachunków ani dokumentów KYC. Odpowiedź pojawi się w rozmowie i `/notifications`. Admin widzi kolejki i audyt, ale nie może wpisać dowolnego salda.

Przed live obowiązuje [PILOT_CHECKLIST.md](PILOT_CHECKLIST.md). Odbiór sandboxa nie zatwierdza automatycznie realnego operatora, kraju, waluty, kosztów ani polityki refundów.
