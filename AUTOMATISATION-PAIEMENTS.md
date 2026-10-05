# Automatisation paiements — V19

La synchronisation Stripe → CRM est implémentée dans `functions/api/stripe-webhook.js`.
Voir `STRIPE-WEBHOOK-V19.md` pour l’activation dans Stripe et Cloudflare.

La facturation officielle reste gérée dans Abby : le webhook enregistre l’encaissement dans le Bureau Laur’Appui mais ne génère pas de facture Stripe.
