# Laur’Appui V20 — webhook Stripe production + test

Endpoint : https://laurappui.fr/api/stripe-webhook

Secrets Cloudflare :
- STRIPE_WEBHOOK_SECRET : production
- STRIPE_WEBHOOK_SECRET_TEST : environnement de test

Le webhook accepte désormais les signatures des deux environnements sans exposer les secrets dans le code.

Événements :
- checkout.session.completed
- checkout.session.async_payment_succeeded

Après déploiement, renvoyer checkout.session.completed depuis LaurAppui-CRM-TEST.
Résultat attendu : HTTP 200.
