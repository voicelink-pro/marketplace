# BoostLink — marketplace poleceń aplikacji: opis produktu i prompty do Cursora

Wersja po rozmowie z założycielami • 24.10.2026

Nazwa platformy zatwierdzona przez właściciela 26.10.2026: **BoostLink**. Zakres dopracowania interfejsu etapów 1–4 i podział pracy: `docs/FRONTEND_SCOPE_STAGES_1_4.md`.

Ten plik jest samodzielnym kontekstem dla modelu programującego. Uwzględnia późniejsze odpowiedzi założycieli i zastępuje wcześniejsze propozycje wszędzie, gdzie występuje sprzeczność. Nie wymaga wcześniejszej specyfikacji ani dostępu do rozmowy w ChatGPT.

## Jak korzystać

1. Dodaj ten plik do głównego katalogu repozytorium w Cursorze.
2. W nowej rozmowie dołącz go do kontekstu przez `@MARKETPLACE_BRIEF_I_PROMPTY.md`.
3. Wklej PROMPT STARTOWY. Następnie wklej prompt ETAPU 1.
4. Kolejne prompty wklejaj pojedynczo po ukończeniu i sprawdzeniu poprzedniego etapu.
5. Przy nowej rozmowie ponownie dołącz ten plik i poleć przeczytanie `docs/IMPLEMENTATION_STATUS.md`, który model utworzy w projekcie.

Nie wklejaj wszystkich etapów jako jednego zadania. Celem jest stopniowo działający produkt, z zachowaniem wspólnego kontekstu.

## A. Co budujemy

Budujemy międzynarodowy marketplace łączący aplikacje z twórcami treści. Firmy wystawiają swoje aplikacje i oferują procent od abonamentów pozyskanych klientów. Twórcy wybierają aplikacje, publikują samodzielnie treści w social mediach i udostępniają linki lub kody polecające.

Klient rejestruje się i płaci w promowanej aplikacji. Nasza platforma przypisuje go do twórcy, odbiera informacje o jego płatnościach i nalicza prowizję za kolejne abonamenty. Firma finansuje prowizje z wpłaconych wcześniej środków. Platforma zatrzymuje ustalony procent prowizji twórcy.

Obsługujemy web, SaaS, iOS i Android. Jeden produkt może występować na kilku platformach. Nie budujemy w MVP własnej natywnej aplikacji marketplace — budujemy responsywny serwis internetowy.

### A1. Ustalone wymagania — nie zmieniaj ich samodzielnie

**Marketplace publiczny**

- Strona główna `/` to od razu katalog aplikacji z wyszukiwarką, bez osobnego marketingowego landing page przed katalogiem.
- Bez konta można przeglądać cały katalog, profile aplikacji i warunki prowizji.
- Aplikacje prezentujemy jako wizualne kafelki: duża grafika, nazwa, krótki opis i prowizja.
- Filtry: kategoria, prowizja, platforma oraz język aplikacji. Filtr ceny abonamentu nie został wybrany.
- Każda aplikacja ma osobną pełną stronę i własny adres, np. `/apps/nazwa`.
- Strona aplikacji zawiera opis, warunki prowizji, screeny i film pokazujący produkt.
- Przy różnych stawkach abonamentów karta pokazuje zakres, np. „15–25% recurring”, a szczegóły pełną tabelę. Nie przedstawiaj najwyższej stawki jako obowiązującej zawsze.

**Twórca**

- Musi podać przynajmniej jeden link do profilu społecznościowego przed rozpoczęciem promowania.
- W MVP podanie URL wystarcza; potwierdzanie własności profilu dodamy później. Nie oznaczaj takiego profilu jako zweryfikowany.
- Dołącza do aktywnego programu natychmiast, bez indywidualnej zgody firmy.
- Po dołączeniu widzi krótkie, wspólne dla platformy wprowadzenie „jak promować”, następnie link i kod.
- Może tworzyć osobne nazwane linki do tej samej aplikacji, np. „Instagram bio”, „TikTok”, „Film 1”.
- Nie musi zgłaszać filmów ani postów na marketplace. Nie budujemy obowiązkowego uploadu publikacji ani procesu ich zatwierdzania.
- Po zalogowaniu trafia na podsumowanie zarobków i wyników, skróty do swoich programów oraz propozycje podobnych aplikacji.
- Widzi kliknięcia, zarejestrowanych klientów, klientów z płatnością, aktywnych płacących subskrybentów oraz porównanie linków.
- Widzi historię każdego poleconego klienta: identyfikator typu `Customer #A821`, płatności i prowizje, bez danych osobowych klienta.
- Polecenia samym kodem są osobnym źródłem. Jeśli nie znamy konkretnego linku, nie przypisujemy ich sztucznie do jednego z linków.

**Firma**

- W MVP zarządza jedną aplikacją; obsługa wielu aplikacji należy do kolejnej wersji.
- Baza od początku rozdziela organizację i aplikację, aby później rozszerzyć limit bez przebudowy tożsamości.
- Firma przygotowuje profil aplikacji, screeny, film, opis i warunki programu.
- Ustawia różne procenty prowizji dla różnych abonamentów swojej aplikacji.
- Oferta trafia do administratora marketplace do sprawdzenia przed publikacją. Poprawne uzupełnienie formularza nie oznacza automatycznej publikacji.
- Firma wpłaca środki z góry, ustawia próg automatycznego doładowania oraz jego kwotę.
- Jeśli automatyczne doładowanie się nie uda, wstrzymujemy nowe polecenia. Dotychczasowych klientów i należności nie usuwamy.
- Przy braku środków nadal naliczamy prowizje od odnowień istniejących klientów, ale wypłata tych kwot czeka na finansowanie firmy.
- Firma otrzymuje miesięczne zestawienie rozliczeń.

**Prowizje i wypłaty**

- Twórca zarabia przez cały czas, gdy polecony klient płaci abonament, bez ustalonego limitu liczby miesięcy.
- Platforma pobiera jeden wspólny procent od prowizji twórcy. Wysokość nie została jeszcze podana.
- Zmiana stawek dotyczy nowych poleceń. Wcześniej pozyskani klienci zachowują wcześniejsze stawki.
- Zarobki naliczają się w trakcie miesiąca i stają się dostępne po jego zamknięciu, jeśli są sfinansowane i spełniają wymagania operatora.
- Twórca sam zleca wypłatę przyciskiem w panelu.
- Nie dodajemy własnego minimum wypłaty; respektujemy ewentualne minimum operatora.
- Nie dodajemy osobnego stałego 30-dniowego holda. Zamknięcie miesiąca jest ustaloną granicą udostępniania zarobków.
- Miesięczne zestawienie firmy nie zastępuje finansowania z góry.

### A2. Nierozstrzygnięte zasady — jak kontynuować bez kolejnych ankiet

Nie zatrzymuj budowy ekranów i zwykłych funkcji z powodu tych pozycji. Oddziel reguły w konfiguracji i zapisz je w `docs/DECISIONS.md`. Nie przedstawiaj proponowanych wartości jako zatwierdzonych przez założycieli.

| Decyzja | Podejście w development / sandbox | Warunek uruchomienia live |
|---|---|---|
| Procent platformy | Przykładowo 10% tylko w oznaczonych fixtures; konfiguracja produkcyjna bez domyślnej wartości | Właściciel podaje stawkę |
| Podstawa prowizji | W fixture: zapłacona kwota po rabacie, z podatkiem; kalkulator przyjmuje jawne `commission_basis_minor` | Wybrana podstawa i poprawne mapowanie z operatora |
| Pierwszy czy ostatni link | Propozycja: ostatni ważny link przed rejestracją | Jawne warunki programu przed publikacją |
| Okno przypisania | Propozycja: 30 dni od kliknięcia do rejestracji | Jawne warunki programu przed publikacją |
| Kod kontra link | Propozycja: świadomie wpisany kod wygrywa przed utrwaleniem przypisania | Jawne warunki programu przed publikacją |
| Zwrot po wypłacie twórcy | Sandbox: stan wymagający rozpatrzenia, bez automatycznego przypisania kosztu firmie, twórcy lub platformie | Uzgodniona polityka przed realnymi wypłatami |
| Zmiana planu klienta | Propozycja: snapshot całej tabeli stawek przy przypisaniu; użyj z niego stawki kupionego planu; nieznany nowy plan → sprawdzenie | Uzgodniona polityka historycznych stawek i nowych planów |
| Waluty i kraje wypłat | Model wielowalutowy; demo EUR jako przykład, bez automatycznego FX | Lista dostępna dla wybranego operatora i podmiotu |
| Miesiąc rozliczeniowy | Propozycja: miesiąc kalendarzowy UTC; odblokowanie po wykonaniu zamknięcia i uzgodnienia | Zatwierdzona strefa i proces zamknięcia |

Nie musisz pytać o kolor przycisku, układ każdego pola ani nazwy folderów. Dobierz spójne rozwiązanie. Jeśli brakuje sekretu lub decyzji dotyczącej prawdziwych pieniędzy, zablokuj wyłącznie zależną operację live i kontynuuj pozostałe zadania.

### A3. Kierunek techniczny i wizualny

Rekomendowany stos: React przez Next.js, TypeScript strict, Supabase Auth/Postgres/Storage, Tailwind CSS i shadcn/ui. Prostą aplikację modułową budujemy w jednym repozytorium. Nie dodawaj osobnych mikroserwisów ani rozbudowanego monorepo bez potrzeby. Przed użyciem konkretnego SDK sprawdź aktualną dokumentację, kompatybilne wersje i przypnij zależności.

Backend odpowiada za uprawnienia, atrybucję, pieniądze i reguły. Supabase RLS zabezpiecza dostęp do rekordów. Publiczny katalog ma osobną bezpieczną projekcję. Klucze uprzywilejowane i sekrety integracji nigdy nie trafiają do przeglądarki.

Integracje MVP: link/kod + API backendu aplikacji, adapter Stripe dla web/SaaS i RevenueCat dla mobile. Własny SDK, automatyczna atrybucja po instalacji i dodatkowi operatorzy należą do późniejszej wersji. Mobile w MVP wymaga kodu i mapowania konta klienta; nie udawaj, że samo przekierowanie do App Store zachowuje polecenie.

UI: jasny, czysty, nowoczesny marketplace inspirowany czytelnością Whop, bez kopiowania identyfikacji. Duże grafiki w katalogu, czytelne liczby w panelach, neutralne tło, białe karty, jeden akcent, rozsądne odstępy. Interfejs po angielsku jako propozycja startowa dla rynku międzynarodowego. Desktop i mobile od początku. Propozycja: katalog 3/2/1 kolumny, panele z sidebar na desktopie i menu mobilnym.

Podstawowa nawigacja:

| Obszar | Ekrany |
|---|---|
| Publiczny | Katalog `/`, profil `/apps/[slug]`, logowanie i rejestracja |
| Twórca | Overview, My programs, Links, Referrals, Earnings, Payouts, Settings |
| Firma | Overview, App profile, Subscription plans & commissions, Creators, Referrals, Integrations, Funding & statements, Settings |
| Administrator | Applications review, Users, Integrations, Finance, Payouts, Issues |

## B. PROMPT STARTOWY — wklej jako pierwszy

```text
Budujemy produkt opisany w @MARKETPLACE_BRIEF_I_PROMPTY.md.
Przeczytaj cały plik. To źródło prawdy po wywiadzie z założycielami.
Nie przywracaj sprzecznych założeń ze starszych dokumentów.

Najpierw sprawdź istniejące repozytorium, AGENTS.md i dostępne skille.
Wcześniej omawialiśmy: Superpowers (writing-plans, test-driven-development,
systematic-debugging, verification-before-completion, requesting-code-review),
Supabase i supabase-postgres-best-practices, Trail of Bits
(differential-review, sharp-edges), vercel-react-best-practices.
Używaj tych, które faktycznie są dostępne i pasują do zadania.
Nie deklaruj użycia skilla bez odczytania jego instrukcji.

Pracuj etapami. Wykonuj tylko etap aktualnie zlecony.
Twórz działające funkcje: ekran → API → baza → odpowiednia weryfikacja.
Nie ograniczaj się do planu ani atrap przycisków.

Wymagania jakościowe:
- TypeScript strict i spójny podział modułów.
- Walidacja wejścia i uprawnienia na serwerze, RLS oraz minimalne granty.
- Brak sekretów w kliencie i logach.
- Pieniądze w najmniejszych jednostkach waluty, bez float.
- Idempotencja zdarzeń i operacji finansowych.
- Historia finansowa i snapshoty stawek zamiast nadpisywania przeszłości.
- Stany loading, empty, error, success oraz responsive UI.
- Fixtures tylko w testach/demo; żadnych fikcyjnych wyników produkcyjnych.
- Testy krytycznych reguł, izolacji kont, duplikatów i współbieżności.

Nie zadawaj rozbudowanych ankiet produktowych. Wymagania są w pliku.
Zwykłe decyzje implementacyjne podejmuj samodzielnie i krótko dokumentuj.
Otwarte kwestie biznesowe obsłuż dokładnie zgodnie z sekcją A2.
Przy braku integracji lub klucza kontynuuj prace niezależne, używając jawnego
sandboxa. Nie udawaj połączenia z działającą usługą.

Utwórz docs/IMPLEMENTATION_STATUS.md oraz docs/DECISIONS.md.
Pierwszy przechowuje ukończone etapy, testy, blokery i następny krok.
Drugi rozróżnia ustalenia właścicieli, propozycje i decyzje techniczne.

W tej wiadomości tylko oceń stan repozytorium, przygotuj te dwa dokumenty
i krótko opisz, od czego zaczynasz. Nie implementuj jeszcze wszystkich etapów.
Następnie będę wklejać poszczególne prompty.
```

## C. Prompty etapów MVP

### ETAP 1 — fundament, konta i szkielet interfejsu

```text
Przeczytaj @MARKETPLACE_BRIEF_I_PROMPTY.md oraz bieżący
docs/IMPLEMENTATION_STATUS.md. Wykonaj ETAP 1.

Przygotuj fundament Next.js + React + TypeScript strict + Supabase.
Jeśli repo już istnieje, wykorzystaj je zamiast tworzyć drugi projekt.
Skonfiguruj style, wspólne komponenty, walidację, klienta Supabase,
zmienne środowiskowe, migracje i podstawową weryfikację w CI.

Zaimplementuj rejestrację, logowanie, wylogowanie, odzyskanie dostępu
i wybór kontekstu creator/company. Jedna osoba może mieć oba konteksty.
Przygotuj profile, organizacje i ich członkostwa, z kontrolą dostępu.
Admina nie można uzyskać przez edycję profilu ani zwykłą rejestrację.

Twórca uzupełnia co najmniej jeden URL profilu społecznościowego,
zanim zacznie promowanie. Nie implementuj jeszcze potwierdzania własności.
Firma może mieć jedną aplikację w MVP; model danych ma pozwalać
w przyszłości na więcej. Limit egzekwuj serwerowo.

Zbuduj spójne layouty: publiczny, twórcy, firmy i administratora.
Desktop: sidebar, topbar, konto i nawigacja. Mobile: wygodne menu,
czytelne formularze i przyciski. Dla pustych modułów pokazuj uczciwy stan
braku danych, bez wymyślonych zarobków.

Odbiór: można założyć konto, zalogować się i wejść do właściwego panelu.
Użytkownik A nie odczyta organizacji B także przez bezpośrednie API bazy.
Sprawdź auth, role, RLS, build i TypeScript. Zaktualizuj status prac.
Nie zaczynaj ETAPU 2.
```

### ETAP 2 — publiczny katalog i pełne strony aplikacji

```text
Przeczytaj brief oraz status prac. Wykonaj ETAP 2.

Zbuduj główną stronę jako katalog aplikacji, bez poprzedzającego landing page.
Dodaj wyszukiwarkę i filtry: kategoria, prowizja, platforma, język.
Filtry zachowuj w URL, z możliwością wyczyszczenia. Wyniki pobieraj
z bazy z paginacją. Wyświetlaj tylko zatwierdzone, opublikowane oferty.

Kafelki: duża grafika, logo/nazwa, krótki opis, platformy i prowizja.
Przy różnych planach pokazuj zakres stawek. Kafelki mają wyglądać dobrze
w układzie desktop/tablet/mobile, z jednolitymi proporcjami grafik.

Kliknięcie prowadzi na /apps/[slug], a nie do modala czy bocznego panelu.
Strona zawiera opis, screeny, film oraz warunki programu i tabelę
abonamentów z ich stawkami. Dodaj wyraźne CTA do promowania.
Osoba bez konta może czytać całość; CTA prowadzi do logowania
z zachowaniem docelowej aplikacji.

Przygotuj bezpieczny model aplikacji, planów i wersji warunków.
Dane demo mogą być seedem lokalnym; produkcja bez ofert pokazuje
dobry pusty stan. Nie publikuj fikcyjnych partnerów i statystyk.

Odbiór: katalog działa bez logowania, filtry działają, każdy profil ma
własny URL, drafty są niedostępne publicznie. Sprawdź mobile i cofanie
do wyników z zachowanymi filtrami. Zaktualizuj status, zakończ etap.
```

### ETAP 3 — firma dodaje aplikację, administrator publikuje

```text
Przeczytaj brief oraz status prac. Wykonaj ETAP 3.

Zbuduj panel firmy do przygotowania jednej aplikacji:
- nazwa, opis krótki i pełny, kategorie, platformy, języki;
- strona produktu i linki do sklepów;
- grafika kafelka, logo, screeny, film;
- abonamenty aplikacji i oddzielny procent prowizji każdego abonamentu.

Nazwy planów i ich identyfikatory w systemie płatności to osobne pola.
Dodaj zapis draftu, podgląd publicznego profilu i walidację.
Nie pytaj właścicieli o układ każdego formularza: przygotuj spójny UX.

Flow publikacji: draft → submitted → approved/published albo rejected.
Administrator widzi ofertę, checklistę i może ją zatwierdzić lub odesłać
z uzasadnieniem. Firma widzi status i może poprawić zgłoszenie.
Publikacja live wymaga działającej integracji i finansowania; dopóki
nie powstaną kolejne moduły, testuj cały flow w oznaczonym środowisku demo.

Zmiana stawek tworzy nową wersję warunków. Nie edytuje historii.
Wersjonuj także propozycje istotnych zmian opublikowanego profilu:
publiczny odbiorca nie może zobaczyć niezatwierdzonego draftu.
Dodaj kontrolę dostępu do plików i bezpieczne wyświetlanie filmu/opisu.

Odbiór: firma tworzy i zgłasza ofertę, admin odrzuca lub zatwierdza,
opublikowana wersja pojawia się w katalogu. Role i pliki nie ujawniają
danych innej firmy. Sprawdź limit jednej aplikacji także przy dwóch
równoległych żądaniach. Zaktualizuj status, zakończ etap.
```

### ETAP 4 — dołączenie twórcy, przewodnik, programy i linki

```text
Przeczytaj brief oraz status prac. Wykonaj ETAP 4.

Zaimplementuj natychmiastowe dołączenie twórcy do aktywnego programu.
Firma nie zatwierdza osobno twórców. Wymagaj zalogowania, uzupełnionego
profilu społecznościowego i akceptacji widocznych warunków programu.
Powtórne kliknięcie nie tworzy drugiego członkostwa.

Po dołączeniu pokaż krótkie wspólne wprowadzenie platformy „jak promować”,
a następnie link i kod polecający z przyciskami kopiowania.
Nie twórz edytora osobnych instrukcji firmy jako wymogu MVP.

Zbuduj My programs, szczegóły własnego programu i Links.
Twórca tworzy nazwane linki do jednej aplikacji, wybiera kanał i kopiuje URL.
Dozwolone cele przekierowań pochodzą z aplikacji, nie z dowolnego URL.
Kod jest powiązany z twórcą i aplikacją. Linki należą wyłącznie do właściciela.
Nie buduj zgłaszania lub zatwierdzania filmów/postów.

Overview twórcy: zarobki/wyniki, skróty do programów i propozycje podobnych
aplikacji. Propozycje oprzyj na kategoriach aktywnych programów, bez AI.
Statystyki, których backend jeszcze nie dostarcza, mają jawny pusty stan,
nie fikcyjne liczby. Późniejsze etapy podłączą rzeczywiste wyniki.

Odbiór: nowy twórca przechodzi od oferty do działającego członkostwa,
przewodnika i linków. Nie może tworzyć linków w cudzym członkostwie.
Sprawdź duplikaty join, kopiowanie oraz mobile. Zaktualizuj status.
```

### ETAP 5 — przypisanie klientów i statystyki poleceń

```text
Przeczytaj brief oraz status prac. Wykonaj ETAP 5.

Zaimplementuj bezpieczne przekierowania linków, rejestrowanie kliknięć
i API przypisujące konto klienta aplikacji do twórcy.
Klient końcowy nie musi mieć konta na naszym marketplace.
Backend aplikacji przesyła swój identyfikator klienta i token linku lub kod.
Sekret API aplikacji nie może znaleźć się w jej przeglądarce ani aplikacji mobilnej.

Dla web: link przekazuje token do aplikacji, a ona przekazuje go ze swojego
backendu przy rejestracji klienta. Dla mobile: kod podawany w rejestracji.
Nie zakładaj, że nasze cookie jest dostępne w domenie promowanej aplikacji.
Nie dodawaj fingerprintingu jako obejścia brakującego polecenia.

Zasady pierwszeństwa i okna przypisania wydziel w jeden moduł polityk.
Użyj propozycji sandbox z A2 i oznacz je w DECISIONS; nie uruchamiaj ankiety.
Przypisanie jest trwałe i używane przy kolejnych płatnościach.
Zabezpiecz przed dwoma równoległymi przypisaniami, przejęciem istniejącego
klienta i modyfikacją twórcy przez nieuprawniony frontend.

Podłącz rzeczywiste kliknięcia i rejestracje do dashboardów.
Referrals pokazuje identyfikator klienta bez imienia, emaila i telefonu.
Porównanie linków pokazuje ich własne wyniki. Kod bez linku ma osobne źródło.
Firma ma wgląd tylko do swoich klientów i wyników programu.

Przygotuj prostą aplikację testową/demonstracyjną integracji i instrukcję.
Odbiór: link i kod tworzą poprawne polecenie, ponowienia nie dublują klienta,
nie da się przypisać klienta innej aplikacji. Przetestuj równoległe żądania,
wygasły token, niedozwolony redirect i utrwalone przypisanie. Uzupełnij status.
```

### ETAP 6 — zakupy i odnowienia: integracje aplikacji

```text
Przeczytaj brief oraz status prac. Wykonaj ETAP 6.

Zbuduj wspólny format zdarzeń płatniczych i trzy adaptery:
Stripe dla web/SaaS, RevenueCat dla mobile oraz uwierzytelnione API backendu.
Sprawdź aktualną oficjalną dokumentację dostawców przed implementacją.
Zachowaj rozdzielenie identyfikatora klienta aplikacji i identyfikatorów
klienta/subskrypcji/transakcji operatora; wymagaj ich poprawnego mapowania.

Obsłuż pierwszą płatność, odnowienie, zmianę stanu subskrypcji,
anulowanie, refund i spór. Anulowanie odnowienia nie jest samo w sobie zwrotem.
Płatność 0 i trial nie są płatnym pozyskaniem. Nie udawaj, że podpis nadawcy
Generic API niezależnie dowodzi prawdziwości jego sprzedaży.

Weryfikuj webhooki, zapisuj je trwale i przetwarzaj asynchronicznie.
Deduplikuj zarówno event, jak i transakcję, której dotyczy.
Dwa różne eventy o jednej płatności nie tworzą dwóch zakupów.
Stripe i RevenueCat nie mogą naliczyć podwójnie tej samej transakcji.
Obsłuż zdarzenia w złej kolejności, retry i ręczne ponowienie błędnego zdarzenia.
Zdarzenie bez mapowania klienta zachowaj do późniejszego przetworzenia.
Sandbox i live mają oddzielne dane/klucze oraz zabezpieczenia finansowe.

Panel Integrations: konfiguracja, instrukcja, mapowanie abonamentów,
test połączenia, ostatni poprawny event, lista błędów i sposób naprawy.
Status Configured nie oznacza Verified. Działający test pokazuj dopiero
po rzeczywistym przejściu zdarzenia przez backend.

Podłącz liczbę płacących klientów i aktywnych płacących subskrybentów
do panelu twórcy, timeline klienta oraz wyniki firmy.

Odbiór: zakup i odnowienie z sandboxów są widoczne; wielokrotne dostarczenie
nie dubluje transakcji; fałszywy webhook jest odrzucany. Jeśli brakuje dostępu,
wykonaj testy adapterów na jawnych fixtures i oznacz test z dostawcą blocked,
nie passed. Zaktualizuj status, zakończ etap.
```

### ETAP 7 — prowizje, historia stawek i zamknięcie miesiąca

```text
Przeczytaj brief oraz status prac. Wykonaj ETAP 7.

Zbuduj silnik prowizji od kolejnych opłaconych abonamentów.
Stawka zależy od kupionego planu. Przypisany klient zachowuje historyczne
stawki; zmiana programu nie przelicza jego prowizji wstecz.
Obsługę zmiany abonamentu oprzyj na jawnej propozycji z A2.
Platforma pobiera jeden globalny procent od prowizji twórcy.
Jego wartość produkcyjna pozostaje wymagana i nie może po cichu dostać 10%.

Kwoty: najmniejsze jednostki waluty i jawne zaokrąglanie. Oddziel:
kwotę sprzedaży, podstawę prowizji, prowizję brutto, opłatę platformy
i kwotę twórcy. Kwota twórcy + opłata = prowizja brutto.
Nie sumuj różnych walut i nie twórz fikcyjnych miesięcznych prowizji
od jednorazowej rocznej opłaty abonamentowej.

Zaprojektuj niezmienny, bilansowany dziennik rozliczeń. Korekty są nowymi
zapisami, nie ręczną zmianą users.balance. Jedna płatność ma jeden efekt
finansowy także przy retry. Zapis finansowy i zmiana stanu są atomowe.

W miesiącu kwoty mają stan naliczone, niedostępne do wypłaty.
Po zamknięciu miesiąca finansowane pozycje stają się dostępne;
niesfinansowane pozostają oczekujące na środki firmy. Ten warunek będzie
zasilany rzeczywistymi wpłatami w E8, teraz przez kontrolowany sandbox.
Nie dodawaj dodatkowego 30-dniowego holda ani własnego minimum wypłaty.

Zamknięcie miesiąca jest idempotentne i tworzy zestawienie firmy i twórcy.
Późne zdarzenia i korekty mają datę źródłową oraz odniesienie do okresu;
nie nadpisują po cichu już zamkniętego zestawienia.
Refund przed wypłatą koryguje naliczenie; refund po wypłacie wymaga
nierozstrzygniętej jeszcze polityki, więc tworzy sprawę do rozpatrzenia.
Nie zakładaj bez zgody, kto ma pokryć taki koszt.

Earnings: naliczone w tym miesiącu, oczekujące na finansowanie, dostępne,
w wypłacie i wypłacone. Tabela prowizji z planem, klientem, miesiącem,
wyliczeniem i statusem. Dodaj miesięczne zestawienia po obu stronach.

Odbiór: wyliczenia, historyczne stawki, refundy i ponowne zamknięcie miesiąca
nie tworzą błędnych kwot. Testuj także dwa równoległe przetworzenia.
Wcześniejszy miesiąc sfinansowany później odblokowuje środki bez czekania
na kolejne zamknięcie. Zaktualizuj status, zakończ etap.
```

### ETAP 8 — finansowanie firm, auto-doładowania i wypłaty twórców

```text
Przeczytaj brief oraz status prac. Wykonaj ETAP 8 w sandboxie.

Oddziel dwie ścieżki: klient płaci promowanej aplikacji; firma finansuje
prowizje na naszej platformie. Webhook o zakupie klienta nie zwiększa
dostępnych pieniędzy marketplace. Połączenie konta sprzedaży aplikacji
nie oznacza automatycznie prawa do pobierania pieniędzy z jego salda.

Wydziel adapter operatora płatniczego. Stripe Connect jest kandydatem,
nie gwarantowanym rozwiązaniem dla dowolnego prefundingu i kraju.
Sprawdź zgodność przepływu z możliwościami operatora, krajem podmiotu
i odbiorców. Nie buduj samodzielnego dowolnego portfela pieniężnego.
Jeśli wymagany model nie jest dostępny, zapisz blocker dla live
i dostarcz działający adapter testowy oraz niezależną część produktu.

Panel Funding firmy: dostępne środki, środki zarezerwowane na prowizje,
zaległości, wpłata, próg auto-doładowania, kwota doładowania, historia.
Firma sama ustawia próg i kwotę; zapisuje zgodę/metodę płatności u operatora.
Wpłata zwiększa środki dopiero po potwierdzeniu ich dostępności.
Powrót na success URL nie jest dowodem finansowania.

Auto-doładowanie ma blokadę współbieżności, idempotencję i ograniczony retry.
Jedno przekroczenie progu nie może uruchomić kilku jednoczesnych obciążeń.
Po niepowodzeniu wyślij powiadomienie i wstrzymaj nowe polecenia/dołączenia.
Stare odnowienia dalej naliczają zobowiązania. Po skutecznym zasileniu
rozlicz zaległości i wznów program, o ile nie ma innej blokady.
Nie finansuj firmy A środkami firmy B.

Panel Payouts twórcy: dostępna kwota po zamknięciu miesiąca, konto wypłat,
przycisk Withdraw, potwierdzenie i historia statusów. Wykorzystaj onboarding
operatora, bez własnego gromadzenia dokumentów KYC.
Nie dodawaj własnej minimalnej kwoty. Komunikuj limity operatora i koszty.

Wypłata atomowo rezerwuje pozycje i używa klucza idempotencji.
Transfer na konto twórcy u operatora i wypłata do banku to różne operacje.
Timeout nie oznacza, że transfer nie powstał. Nieudana wypłata bankowa
nie może powodować drugiego transferu z platformy.
Dodaj uzgadnianie operatora z dziennikiem i panel wyjaśniania rozbieżności.

Odbiór: sandbox przechodzi wpłatę, próg, auto-doładowanie, błąd i wznowienie,
zamknięcie miesiąca, ręczne zlecenie wypłaty i potwierdzenie operatora.
Przetestuj podwójne kliknięcie, timeout, brak środków i zwróconą wypłatę.
Live pozostaje wyłączone do spełnienia warunków E9. Uzupełnij status.
```

### ETAP 9 — domknięcie MVP i przygotowanie pilotażu

```text
Przeczytaj brief oraz status prac. Wykonaj ETAP 9.

Sprawdź cały produkt zgodnie z zaakceptowanymi wymaganiami.
Domknij panel administratora: zgłoszenia aplikacji, integracje, błędy,
zaległości firm, wypłaty i sprawy wymagające rozpatrzenia.
Dodaj podstawowe powiadomienia, obsługę zgłoszeń i audyt istotnych zmian.
Admin nie może ustawić dowolnego salda; korekta musi mieć przyczynę i zapis.

Sprawdź każdy ekran: desktop/mobile, klawiatura, loading, empty, error,
uprawnienia, waluty i daty. Usuń martwe przyciski i nieprawdziwe statystyki.
Publiczny katalog ma pokazywać tylko zatwierdzone wersje ofert.
Panele muszą korzystać z faktycznych danych oraz poprawnych definicji metryk.

Przejdź end-to-end:
firma → oferta i stawki planów → integracja → finansowanie → akceptacja admina
→ twórca z profilem społecznościowym → join → wspólny przewodnik
→ nazwany link/kod → klient → pierwsza płatność → odnowienie
→ miesięczne zamknięcie → dostępne zarobki → ręczne zlecenie wypłaty.
Osobno przejdź refund, brak finansowania i nieudane auto-doładowanie.

Wykonaj testy izolacji firm i twórców, RLS, webhooków, duplikatów,
wyścigów wypłat, historycznych stawek i powtórnego zamknięcia miesiąca.
Dodaj monitoring błędów i kolejki, bezpieczne logi, backup oraz instrukcję
odzyskiwania po awarii. Zweryfikuj odtworzenie w środowisku testowym.

Przygotuj docs/PILOT_CHECKLIST.md oraz instrukcję integracji firmy.
Wymień konkretne warunki live: procent platformy, podstawa prowizji,
zatwierdzona polityka atrybucji, zwroty po wypłacie, kraje/waluty,
działający operator, uzgodnione zasady kosztów i dokumentów rozliczeniowych.
Nie wymyślaj odpowiedzi za właścicieli, nie rób z tego nowej szerokiej ankiety.
Nie uruchamiaj realnych płatności bez spełnienia zależnych warunków.

Odbiór: raport pass/fail/blocked, dowody przejścia flow, lista realnych
ograniczeń i gotowe środowisko pilotażowe. Nie nazywaj produktu gotowym
do produkcji wyłącznie dlatego, że build przechodzi. Zakończ etap.
```

## D. V1 — po MVP, nie w pierwszej implementacji

Do V1 przenosimy przede wszystkim obsługę wielu aplikacji przez jedną firmę oraz potwierdzanie własności profili społecznościowych. Dalej: sprawniejsze integracje, ułatwienia mobile i rozwój na podstawie pilotażu. Rozszerzanie krajów oraz walut zależy od faktycznej obsługi operatora.

### PROMPT V1 — uruchom dopiero po pilotażu

```text
Przeczytaj brief, IMPLEMENTATION_STATUS oraz wyniki pilotażu.
Przygotuj krótki plan V1, a następnie wykonaj tylko pierwszy podetap:
obsługę wielu aplikacji przez jedną organizację.

Dodaj listę aplikacji i przełącznik aplikacji w panelu firmy.
Rozdziel dane, plany, stawki, integracje i wyniki per aplikacja.
Zachowaj kompatybilność istniejących linków, prowizji, klientów i zestawień.
Przygotuj migrację oraz test izolacji między aplikacjami tej samej firmy
i między różnymi firmami. Nie przenoś finansowania między aplikacjami
bez jawnej, opisanej reguły alokacji.

Kolejne podetapy jedynie zapisz w backlogu:
- potwierdzanie własności profilu społecznościowego;
- łatwiejszy onboarding integracji i SDK oparte na istniejącym API;
- lepsze linki mobile z jawnym fallbackiem do kodu;
- kolejne kraje, waluty i raporty według potrzeb pilotażu.
Nie implementuj wszystkiego jednocześnie. Uzupełnij status i wyniki testów.
```

## E. Wspólny format zakończenia każdego etapu

Model powinien na końcu krótko podać:

1. Co wdrożył i jak użytkownik z tego korzysta.
2. Jakie migracje i zmienne środowiskowe są potrzebne, bez ujawniania sekretów.
3. Co rzeczywiście sprawdził oraz wyniki: pass / fail / blocked.
4. Jak ręcznie przetestować nowy przepływ.
5. Co zostało do następnego etapu.

Skille i model wspierają pracę, ale jakość oceniamy po działaniu, testach i przeglądzie kodu. Dokument jest instrukcją budowy; nie deklaruje, że aplikacja lub wymienione testy już istnieją.
