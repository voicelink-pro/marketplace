# BoostLink — odbiór pilotażu E9

Stan na 27.10.2026. Zakres produktu: `MARKETPLACE_BRIEF_I_PROMPTY.md`. Wynik rozróżnia techniczny sandbox, połączony frontend i realne pieniądze.

## Decyzja o gotowości

- **pass** — główna ścieżka MVP jest zaimplementowana i przetestowana na lokalnym Supabase, z testowym operatorem finansowania/wypłat.
- **pass** — kod administracji, zgłoszeń, powiadomień w aplikacji, audytu i monitorowania kolejek jest dostępny.
- **blocked** — końcowy odbiór produktu z frontendem Rocha: jego aktualny motyw, kolory i logo są w osobnej lokalnej pracy; gałąź nie została jeszcze udostępniona. Nie oceniano niewidzianego kodu ani wyglądu.
- **blocked** — uruchomienie live, rzeczywisty operator prefundingu/wypłat, końcowe decyzje finansowe i odbiór RevenueCat. Ukończenie testów nie otwiera tych bramek.

## Powtarzalny odbiór techniczny

1. Uruchomić lokalny Supabase i zastosować migracje bez resetowania danych.
2. `pnpm lint`, `pnpm typecheck`, `pnpm test`.
3. `pnpm db:types` i sprawdzenie różnicy typów; `pnpm db:advisors`.
4. `pnpm test:pilot`. Komenda buduje aplikację, uruchamia własny serwer na `127.0.0.1:3109`, używa jawnych sekretów fixtures, tworzy odrębne konta i aplikację, uruchamia pełną integrację E1–E9 i zatrzymuje serwer. Nie używa sprzedażowych sekretów użytkownika i nie włącza live.
5. Test obejmuje odtworzenie spójnego backupu z niepustymi prowizjami, wypłatami, powiadomieniami i zgłoszeniami. Pliki i losowa baza odtworzeniowa są usuwane po próbie. Szczegóły: `OPERATIONS_AND_RECOVERY.md`.

Nie uruchamiać równolegle `pnpm typecheck` i `pnpm build`: obie komendy zapisują wygenerowane typy `.next`.

## Ścieżka objęta odbiorem

- Firma zakłada organizację i aplikację, zapisuje ofertę i plany.
- Konfiguruje źródło zakupów i mapowanie planu; autoryzuje testową metodę finansowania.
- Wpłata pozostaje pending do potwierdzenia dostępności przez operatora testowego.
- Admin zatwierdza wersję demo. Próba publikacji live nadal jest odrzucana.
- Twórca z profilem społecznościowym akceptuje warunki, dołącza i tworzy nazwany link.
- HTTP redirect tworzy token, a backend aplikacji zgłasza klienta przez HTTP API.
- Podpisany webhook HTTP zgłasza zakup i odnowienie. Inbox, worker i mapowania zapisują jeden efekt mimo podwójnego dostarczenia.
- Jawna polityka sandbox i podstawa tworzą prowizje według historycznej stawki. Kwoty w minor, bez float.
- Refund przed wypłatą koryguje należność. Close wykonany równolegle daje jedno zamknięcie; finansowane prowizje stają się dostępne.
- Twórca potwierdza Withdraw. Rezerwacja, transfer i bank payout są odrębnymi stanami.
- Refund po wypłacie trafia do sprawy oczekującej na politykę; nie przypisuje kosztu automatycznie.
- Nieudane auto-doładowanie blokuje nowe polecenia. API zwraca 409 z przyczyną, dotychczasowe odnowienia nadal naliczają zobowiązania. Wystarczająca potwierdzona wpłata przywraca finansowanie.
- Użytkownik zgłasza problem, admin odpowiada z kontrolą rewizji. Powiadomienia są prywatne; działania admina zostawiają audyt.
- Test wykonuje rzeczywisty POST formularza Server Action i sprawdza SSR rodzin ekranów na osobnych sesjach oraz odmowę dostępu obcego użytkownika.

## Frontend — przed pierwszym połączeniem

Rochu nie musi kończyć całej stylistyki. Pierwszą integrację wykonujemy po opublikowaniu stabilnego punktu: motyw, logo, wspólne komponenty i działające podstawowe ekrany. Następne poprawki mogą dochodzić w małych PR.

- [ ] Gałąź Rocha udostępniona i opisana lista zmienionych plików.
- [ ] Backend E8/E9 zapisany w commitach i dostępny jako baza integracji.
- [ ] Osobna gałąź integracyjna zawiera aktualny backend i prezentację Rocha.
- [ ] Wspólne `page.tsx`/`layout.tsx` zachowują odczyty, Server Actions, gates i Suspense.
- [ ] Wszystkie ekrany E5–E9 korzystają z danych i operacji backendu; brak atrap sald, wpłat, wypłat i zgłoszeń.
- [ ] Po połączeniu powtórzony `pnpm test:pilot`.

## Odbiór UI po połączeniu — nadal blocked

Na aktualnym kodzie przegląd techniczny i SSR nie zastępują odbioru frontendu Rocha.

- [ ] Katalog, profil, konto/onboarding, oferta firmy i ocena admina.
- [ ] Programy i nazwane linki, Referrals, Earnings, Funding i Payouts.
- [ ] Integracje/admin, sprawy, zgłoszenia i powiadomienia.
- [ ] Szerokości 390/768/1280 px oraz powiększenie tekstu 200%.
- [ ] Klawiatura, widoczny i niezasłonięty fokus, etykiety, komunikaty błędów, kontrast.
- [ ] Loading, empty, error, success, podwójne kliknięcie, cofanie i odświeżanie.
- [ ] Rzeczywista rejestracja z e-mailem, role firmy/twórcy/admina i cała ścieżka na docelowych ekranach.

## Środowisko pilotażowe — do odbioru na hostingu

- [ ] Oddzielne staging i live: baza, domeny, klucze, rejestry webhooków i konta operatorów.
- [ ] HTTPS i stały endpoint dostawców; poprawne Auth redirect URLs i SMTP.
- [ ] Trzy nadzorowane workery; po restarcie globalne heartbeats są świeże, `pnpm ops:check` jest obserwowany przez operatora/infrastrukturę.
- [ ] Retencja i dostęp do logów; brak payloadów, sekretów i danych klienta w logach aplikacji.
- [ ] Zaplanowany, szyfrowany backup poza hostem oraz właściciel i alert dla jego niepowodzeń.
- [ ] Odtworzenie również w docelowym staging: baza, Auth, Storage, sekrety, domeny i webhooki. Lokalna próba nie dowodzi odtworzenia całego hostingu.
- [ ] Osoba obsługująca zgłoszenia i sprawy finansowe; procedura pauzy, awarii i uzgodnienia operatora.

## Warunki live — wymagają jawnego potwierdzenia

- [ ] Wspólny procent platformy; brak domyślnego 10% w live.
- [ ] Podstawa prowizji, rabaty/podatki oraz zasady zaokrągleń i częściowych refundów.
- [ ] Okno i model atrybucji, priorytet kodu, obsługa zmiany planu.
- [ ] Odpowiedzialność za refund/spór po wypłacie oraz zwrot wpłaty finansującej.
- [ ] Kraje podmiotu i odbiorców, waluty i brak niejawnego FX.
- [ ] Operator potwierdza dopuszczalność przepływu finansowania firm oraz wypłat i wymagania KYC.
- [ ] Rzeczywista integracja finansowa, podpisy webhooków i uzgodnienie balance transactions; operator testowy nie wystarcza.
- [ ] Koszty operatora, dokumenty rozliczeniowe, reguły zamknięcia i finansowania zaległości.
- [ ] Rzeczywisty odbiór potrzebnych sklepów/RevenueCat i kolejnych scenariuszy Stripe, których wcześniejszy odbiór nie obejmował.

Dopóki zależne punkty nie są odebrane, live pozostaje wyłączone. Lista nie stanowi zgody na przetwarzanie realnych płatności.
