# Laur’Appui V19 — activation Stripe → CRM

Le code du webhook est inclus. Il reste à connecter Stripe à Cloudflare une seule fois.

## Endpoint
https://laurappui.fr/api/stripe-webhook

## Événements à sélectionner dans Stripe
- checkout.session.completed
- checkout.session.async_payment_succeeded

## Secret Cloudflare
Après création de l’endpoint Stripe, copier le **Signing secret** (`whsec_...`) dans Cloudflare Pages > laurappui-site > Settings > Variables and Secrets sous le nom :

STRIPE_WEBHOOK_SECRET

Le secret doit être enregistré comme **Secret** et ne doit jamais être placé dans le dépôt GitHub.

## Résultat
Après confirmation d’un paiement : recherche du client par e-mail, création automatique s’il n’existe pas, passage en client actif, puis ajout du paiement à la fiche CRM. Les 4 montants de production (90 €, 180 €, 360 €, 1 100 €) sont reconnus automatiquement même si aucune metadata Stripe n’est définie sur le Payment Link.
