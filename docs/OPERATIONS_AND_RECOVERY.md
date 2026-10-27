# Operacje, monitoring i odtwarzanie — E9

Stan lokalnego sandboxa, 27.10.2026. Live pozostaje wyłączone. Ten runbook nie zastępuje konfiguracji docelowego hostingu ani akceptacji operatora pieniędzy.

## Administracja i zgłoszenia

- `/admin/integrations`: konfiguracje i stan weryfikacji, czas ostatniego odebrania/przetworzenia zdarzenia, błędy i kolejka. Bez payloadów, credential refs i sekretów. Admin może ponowić kwalifikujące się zdarzenie **sandbox**, podając przyczynę. Aktywnego lease i live nie można obejść.
- `/admin/issues`: oczekujące zadania prowizji, sprawy finansowe, zgłoszenia i audyt operacyjny. Sprawa prowizji ma stan `in_review` / `awaiting_policy`; nie ma przycisku „zmień saldo” ani automatycznego przypisania kosztu refundu po wypłacie.
- `/admin/finance`, `/admin/payouts`: finansowanie, zaległości, transfery i bank payouts oraz dowody rozbieżności E8.
- `/support`: prywatne zgłoszenia użytkownika i odpowiedzi zespołu. Nowy request ma klucz idempotencji; odpowiedź wymaga bieżącej rewizji. Odpowiedź użytkownika do zamkniętej sprawy otwiera ją ponownie. Limit techniczny: 10 nowych zgłoszeń/dobę i 30 wiadomości/godzinę na autora.
- `/notifications`: powiadomienia w aplikacji o ocenach ofert, problemach integracji, błędach auto-doładowania, statusie wypłaty, sprawach prowizji i odpowiedziach wsparcia. Odczyt i mark-as-read dotyczą wyłącznie własnego konta. Wiadomości są deduplikowane po trwałym kluczu zdarzenia.

E-mail dla tych powiadomień nie jest skonfigurowany. Auth ma osobny mechanizm wiadomości; lokalny Mailpit nie dowodzi dostarczania poczty na hostingu. Obsługę zgłoszeń należy przypisać konkretnej osobie przed pilotażem.

Wszystkie nowe tabele są prywatne z RLS i bez bezpośrednich grantów frontendowych. RPC sprawdzają konto lub wpis w `platform_admins`. Audyt jest append-only i zapisuje typ zmiany, aktora/referencję oraz wymagane notatki administratora. Nie zapisuje kopii payloadów webhooków ani treści zgłoszeń. Pseudonimowe referencje audytu pozostają również po usunięciu nadrzędnych kont/aplikacji; retencję należy ustalić dla docelowego środowiska.

## Workery i monitoring

Po wdrożeniu migracji E9 zrestartować procesy, aby używały wersji z heartbeatami:

```sh
pnpm payments:worker
pnpm commissions:worker
pnpm finance:worker
pnpm ops:check
```

W środowisku hostowanym trzy procesy muszą być nadzorowane przez infrastrukturę, z automatycznym restartem. W tej sesji nie instalowano daemonów ani hostowanego monitoringu.

- Każdy worker raportuje liveness po iteracji. Udokumentowany błąd kolejki raportuje `ok=false`.
- Globalne raporty są osobne od raportów `--app` / `--integration`, aby test pojedynczej aplikacji nie oznaczał zdrowia całej kolejki.
- `unknown`: brak raportu globalnego; `stale`: ostatni raport starszy niż 2 minuty; `error`: worker zgłosił błąd; `ok`: aktualny raport poprawnej iteracji.
- Błędy/oczekiwanie w płatnościach i prowizjach, sprawy finansowe, stare pending (>5 min) oraz wygasłe lease są oddzielnymi sygnałami wymagającymi uwagi. Brak zdarzeń zakupowych sam w sobie nie oznacza awarii nieaktywnej aplikacji.
- `pnpm ops:check` zwraca wyłącznie bezpieczne statusy/liczniki: exit 0 = brak wykrytych sygnałów; exit 2 = uwaga operatora; exit 1 = kontrola nie mogła się wykonać. Otwarte zgłoszenia są liczone, ale nie oznaczają awarii workera.
- Na hostingu wywoływać check z systemu monitorowania, zachować wyniki i alarmować na zmianę do attention/error. Dobór docelowej usługi i kanału alarmów pozostaje do konfiguracji; nie deklarujemy aktywnego Sentry, maila ani monitoringu zewnętrznego.

`src/instrumentation.ts` rejestruje błędy żądań Next przez `src/lib/log.ts`, używając tylko stałego kodu rodzaju operacji i stałej wiadomości. Nie wysyła URL, nagłówków, treści błędu ani danych żądania. Framework i infrastruktura mają osobne logi, których dostęp i retencję trzeba skonfigurować.

## Incydent — kolejność działania

1. Sprawdzić worker heartbeats i kody w odpowiednim panelu; ustalić aplikację i środowisko. Nie kopiować payloadów lub sekretów do zgłoszeń.
2. Przy braku heartbeat sprawdzić proces, łączność i ważność ograniczonego tokenu. Restartować właściwy worker, nie resetować bazy.
3. Przy `waiting` naprawić mapowanie klienta/planu/transakcji u właściciela integracji. Ponowienie z przyczyną jest audytowane; nie zmieniać historii zakupów ręcznie.
4. Przy nieznanym wyniku transferu/banku uzgodnić ten sam obiekt operatora. Nie tworzyć nowego transferu ani zwalniać rezerwacji z powodu timeoutu.
5. Przy błędzie auto-doładowania sprawdzić zgodę/metodę i rzeczywistą dostępność środków. Pauza dotyczy nowych poleceń; dotychczasowe należności pozostają.
6. Refund po wypłacie lub sprzeczny terminalny efekt kierować do sprawy i decyzji polityki. Notatka review nie daje prawa do wpisania dowolnego salda.
7. Po naprawie powtórzyć kontrolę, sprawdzić pojedynczy efekt w dzienniku i zapisać wynik w sprawie.

## Backup lokalny

Implementacja używa narzędzi PostgreSQL z **tego samego kontenera lokalnego Supabase**, bez instalowania narzędzi systemowych i bez dostępu do chmury:

```sh
pnpm backup:local backup --local --output /private/tmp/boostlink-backup.dump
pnpm backup:local verify --local --file /private/tmp/boostlink-backup.dump
```

Komenda backup tworzy trzy pliki z uprawnieniami **0600**, nie nadpisując istniejących:

- archive PostgreSQL: schematy `public`, `private`, `auth`, `storage`, `supabase_migrations`, funkcje, dane i jawne uprawnienia;
- osobne archiwum **rzeczywistych plików Storage** z lokalnego kontenera;
- manifest: SHA-256 obu archiwów, liczby wierszy i odciski zawartości każdej tabeli, wersja i zakres.

Odciski tabel i `pg_dump` korzystają z tej samej wyeksportowanej transakcji `REPEATABLE READ`, więc współbieżne zmiany bazy nie tworzą fałszywych różnic. Snapshot jest tylko do odczytu; funkcja inwentaryzacji istnieje wyłącznie w sesji tymczasowej. Dla spójnego punktu odzyskania plików oraz bazy zatrzymać zapisy użytkowników/workerów na czas rzeczywistej operacji backupu, zwłaszcza gdy inny proces może usuwać obiekty Storage.

Backup zawiera dane Auth i prywatne informacje integracyjne. Nie umieszczać go w Git, wiadomościach ani artefaktach publicznego CI. Uprawnienia 0600 nie są szyfrowaniem. Dla hostingu trzeba skonfigurować szyfrowane przechowywanie poza hostem, retencję, alert na niepowodzenie i oddzielną ochronę kluczy. `/private/tmp` służy lokalnej próbie, nie trwałemu przechowywaniu produkcyjnej kopii.

## Co weryfikuje restore drill

- Sprawdza wersję manifestu i SHA-256 obu plików.
- Tworzy nową losową bazę `boostlink_restore_<UUID>` w lokalnym klastrze; nie pozwala wskazać docelowej bazy aplikacji.
- Przygotowuje wymagane rozszerzenia i odtwarza archiwum w jednej transakcji.
- Pomija wpisy **DEFAULT ACL zarządzanych ról Supabase**, których lokalny `postgres` nie może zmieniać. Zachowuje jawne granty obiektów i RLS aplikacji. Ta lokalna procedura nie jest obietnicą uniwersalnego restore między dowolnymi dostawcami.
- Porównuje dokładne odciski/liczby wszystkich tabel, sprawdza bilansowanie dziennika i odmowę odczytu cudzej organizacji przez rolę authenticated.
- Rozpakowuje Storage do nowego katalogu scratch, nigdy do aktualnego `/mnt`.
- Usuwa utworzoną bazę, listę restore i katalog scratch po próbie. Nie usuwa źródła ani wskazanych archiwów.

`pnpm test:pilot` wykonuje tę próbę podczas istnienia jednorazowej aplikacji z **niepustymi** prowizjami, wypłatą i zgłoszeniem. Następnie usuwa również swoje pliki backupu. Dane testowe nie są przenoszone do produktu.

Odtwarzać wyłącznie własne, zaufane archiwa. Dump może zawierać wykonywalne definicje funkcji. Suma kontrolna wykrywa uszkodzenie względem manifestu; sama nie dowodzi wiarygodności źródła.

## Odtworzenie po awarii na hostingu — wymaga próby staging

1. Zatrzymać ruch zapisujący i wszystkie workery. Zachować ostatni sprawdzony backup i historię operatora.
2. Przywrócić bazę **do oddzielnego staging**, zgodnie z procedurą dostawcy, rolami i rozszerzeniami tego środowiska. Nie uruchamiać workerów na dwóch kopiach tego samego środowiska finansowego.
3. Przywrócić osobno obiekty Storage. Backup bazy sam nie zawiera ich bajtów.
4. Przywrócić konfigurację Auth/SMTP, domeny, rejestr webhooków i sekrety z oddzielnego menedżera. Zweryfikować/obrócić tokeny i sesje według sytuacji incydentu.
5. Sprawdzić odciski danych i dziennik, RLS, prywatność Storage i publiczną projekcję ofert.
6. Uzgodnić stan operatora z finansowym dziennikiem: po snapshot mogły powstać wpłaty lub wypłaty. Wznowienie kolejki bez tego kroku mogłoby odtworzyć stare zadanie wobec nowszego stanu operatora.
7. Wykonać cały sandbox flow i test idempotencji; dopiero potem przełączyć ruch i uruchomić jeden zestaw workerów. Live nadal wymaga własnego odbioru.

RPO/RTO, harmonogram oraz retencja produkcyjna nie zostały ustalone. Odtworzenie lokalne nie potwierdza odtworzenia DNS, SMTP, operatora ani całej infrastruktury.

Źródła zweryfikowane 27.10.2026: [Supabase — backups](https://supabase.com/docs/guides/platform/backups), [Supabase — restore i ograniczenia zarządzanych schematów](https://supabase.com/docs/guides/self-hosting/restore-from-platform), [PostgreSQL — pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html), [Supabase — observability](https://supabase.com/docs/guides/observability).
