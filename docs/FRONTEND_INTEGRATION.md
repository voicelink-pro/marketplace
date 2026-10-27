# Frontend Rocha i backend E1–E9

Aktualizacja 27.10.2026. Rochu pracuje lokalnie nad motywem, kolorami, logo i UI; jego gałąź ma zostać opublikowana. Nie oznaczamy tych zmian jako odebranych bez dostępu do kodu.

## Kiedy łączyć

Pierwsze połączenie należy zrobić **przed zakończeniem całego dopracowania UI**, kiedy Rochu ma stabilny punkt wspólnej powłoki, motywu i podstawowych ekranów. Nie musi „dojść do Etapu 9” — etapy opisują rozwój funkcji produktu, a nie osobny harmonogram frontendu.

Po pierwszym połączeniu pracujemy na wspólnej, sprawdzanej bazie. Dalsze poprawki wyglądu trafiają w małych PR. Końcowy odbiór E9 wymaga przejścia krytycznych ścieżek na połączonej wersji, lecz kosmetyczne poprawki mogą trwać również po tym odbiorze.

## Procedura po udostępnieniu gałęzi

1. Zapisać obecne zmiany backendu E8/E9 w commitach, zachowując oddzielnie zastane zmiany Stripe i nie dodając sekretów ani backupów.
2. Udostępnić aktualny backend w tym samym repozytorium. Utworzyć gałąź integracyjną z najnowszego backendu, nie ze starego `main`.
3. Przejrzeć różnicę gałęzi Rocha. Wprowadzić komponenty prezentacyjne, style i zasoby marki.
4. Rozwiązać wspólne pliki ręcznie. Nie stosować globalnego „keep ours/theirs”: jedna strona może wymagać jednocześnie układu Rocha i aktualnych odczytów/mutacji backendu.
5. Zachować aktualne zależności i lockfile po świadomym uzgodnieniu; nie zastępować ich starszą kopią frontendu.
6. Zastosować brakujące migracje bez resetu danych, odświeżyć typy i konfigurację własnego środowiska. `.env.local` nie jest przenoszony przez Git.
7. Uruchomić lint, typecheck, testy i `pnpm test:pilot`, następnie wizualny/klawiaturowy odbiór z `PILOT_CHECKLIST.md`.
8. Kolejne zmiany Rocha i backendu rozwijać od tej wspólnej bazy w małych PR.

Do wykonania merge potrzebna jest faktyczna nazwa opublikowanej gałęzi. Ten dokument nie oznacza, że połączenie już nastąpiło.

## Kontrakty do zachowania

- Konta i role: `getViewer`, gates, `getClaims()` i `src/proxy.ts`; RLS pozostaje w bazie. Zmiana wyglądu nie zastępuje autoryzacji.
- Katalog/oferta/programy: obecne zapytania i Server Actions modułów `catalog`, `company-app`, `programs`. Nie zmieniać samych nazw pól `FormData`, wersji warunków ani rewizji oceny.
- Atrybucja E5: `getAttributionSummary`, `listCustomerReferrals`; rejestracja klienta jest API backend–backend. Nie przenosić sekretu aplikacji do przeglądarki.
- Zakupy E6: `getPaymentIntegrations`, `getPaymentMetrics`, `getCustomerPaymentTimeline`; configured i verified są różnymi stanami. Anulowanie odnowienia nie oznacza refundu.
- Prowizje E7: `getCommissionWorkspace`; wyniki i zestawienia pochodzą z dziennika, kwoty są tekstowe per waluta.
- Finansowanie E8: `getFinanceWorkspace`, `requestFunding`, `saveAutoFunding`, `requestPayout`, `retryBankPayout`. Zachować klucze idempotencji, potwierdzenie kwoty/opłaty i oddzielenie transferu od bank payout.
- Operacje E9: `getOperationsInbox`, `getAdminOperations`, Server Actions w `src/modules/operations/actions.ts`. Zgłoszenia zachowują revision/request key. Powiadomienie należy do konkretnego konta, a admin review nie zmienia salda.
- Formularze: `FormState`, `useActionState`, `FieldGroup`/`Field`, walidacja i komunikaty serwera. Reading cookies/session wewnątrz `Suspense`; interaktywne fragmenty wydzielać do komponentów klienckich.
- Pieniądze: istniejące formattery i bigint minor units; brak float, sumowania walut i fikcyjnych statystyk.

## Ekrany poza pierwotnym zakresem E1–E4

Backend E5–E9 ma już działające widoki: Referrals, szczegóły klienta, Earnings, Integrations, Funding, Payouts, administracja finansowa/operacyjna, `/support` i `/notifications`. Trzeba objąć je wspólną stylistyką. Nie zastępować ich wcześniejszymi pustymi modułami z gałęzi opartej na E1–E4.

Pliki szczególnie narażone na konflikty: `src/app/**/page.tsx`, `layout.tsx`, `src/components/layout/account-menu.tsx`, nawigacja, komponenty formularzy, `package.json` i lockfile. Nowe moduły biznesowe, migracje, zapytania, akcje i testy pozostają źródłem działania funkcji.

## Właściciele odbioru

Karol/Codex: logika, dane, bezpieczeństwo, integracje i techniczny przepływ. Rochu: prezentacja i użyteczność. Wspólnie: działanie formularzy na docelowym UI, mobile/desktop, dostępność i odbiór całego produktu.
