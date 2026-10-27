# BoostLink — przygotowanie dostępów do odbioru E6

Sprawdzone z oficjalną dokumentacją 27.10.2026. Ten playbook przygotowuje test integracji promowanej aplikacji. Finansowanie BoostLink i realne wypłaty to osobny etap 8. Etap 7 można rozwijać bez tych dostępów, na jawnych fixtures.

## Stripe — przygotuj teraz

1. Zaloguj się na https://dashboard.stripe.com/. W przełączniku konta otwórz Sandboxes i przygotuj osobne środowisko `BoostLink Integration QA`.
2. W tym środowisku: More → Product catalog → Add product. Produkt `BoostLink QA Monthly`, Flat rate, Recurring, EUR, 10 EUR, Monthly. Zapisz.
3. W szczegółach ceny zanotuj `price_...`. Nie pomyl go z `prod_...`.
4. Workbench → Webhooks → Create an event destination → Your account → Snapshot. Nasz adapter E6 używa snapshotów, nie thin events.
5. Zdarzenia: invoice.paid, invoice.payment_succeeded, customer.subscription.created/updated/deleted, refund.created/updated/failed, charge.dispute.created/updated/closed.
6. Endpoint URL uzupełnij dopiero adresem przygotowanym dla naszej konfiguracji BoostLink. Localhost nie jest osiągalny z infrastruktury Stripe. Możemy użyć Stripe CLI albo testowego HTTPS.
7. Sekret endpointu `whsec_...` przechowaj prywatnie; operator instaluje go na serwerze pod referencją z panelu Integrations. Nie publikuj kluczy w repo ani rozmowie.
8. Po podłączeniu: przypisz klienta przez E5, jawnie zmapuj Stripe customer i price do klienta/planu aplikacji, wykonaj testowy zakup, odnowienie i refund. Sam syntetyczny event nie jest dowodem prawdziwego zakupu sandboxowego.

Źródła: [sandboxy](https://docs.stripe.com/sandboxes/dashboard), [produkty i ceny](https://docs.stripe.com/products-prices/manage-prices), [webhooki](https://docs.stripe.com/webhooks), [testowanie](https://docs.stripe.com/testing).

## RevenueCat — przygotuj projekt

1. Zaloguj się na https://app.revenuecat.com/. Projects → Create new project → `BoostLink Integration QA`.
2. Jeśli masz aplikację sklepową, dodaj jej konfigurację w Apps. Apple wymaga danych aplikacji i poświadczeń zakupów; Google — danych aplikacji i poświadczeń usługi. Bez aplikacji i kont sklepowych zakończ na projekcie.
3. Test Store utworzony z projektem może służyć rozwojowi aplikacji, ale adapter E6 odmawia kwalifikowania TEST_STORE. Nie oznaczamy tego jako odbioru App Store/Play.
4. Integrations → Webhooks → Add new configuration → `BoostLink Sandbox`. Wybierz sandbox i konkretną aplikację. Zapisz właściwy HTTPS dopiero po jego przygotowaniu. Nasza aktualna konfiguracja wymaga Authorization Bearer, z sekretem przechowywanym po stronie serwera.
5. Sprawdź dostępność funkcji webhooków na planie. Dokumentacja wskazuje Pro. Jeżeli panel wymaga płatnej zmiany planu, zanotuj to; sama instrukcja nie wymaga zakupu.
6. Po integracji aplikacji z SDK/sklepem wykonamy zakup i odnowienie sandboxowe. Dashboard TEST sprawdza dostarczenie, ale sam nie daje statusu Verified ani odbioru zakupu.

Źródła: [projekty](https://www.revenuecat.com/docs/projects/overview), [połączenie aplikacji](https://www.revenuecat.com/docs/projects/connect-a-store), [webhooki](https://www.revenuecat.com/docs/integrations/webhooks).

## Co przekazać zespołowi

Wystarczy informacja: Stripe sandbox i produkt gotowe / RevenueCat projekt gotowy / mam lub nie mam aplikacji i dostępów Apple/Google. Możesz przekazać niesekretne identyfikatory ceny i aplikacji. Haseł, kluczy i sekretów nie przekazuj w czacie. Nazwa projektu RevenueCat nie jest identyfikatorem aplikacji wymaganym przez adapter.

Operator przygotowuje URL, referencje sekretów, mapowania oraz test end-to-end. Frontend kolegi nie przechowuje żadnego sekretu integracji.
