# Laur’Appui — automatisation paiements / justificatifs (préparation)

Cette version prépare l’automatisation sans l’activer. Aucun secret Stripe ni SIRET n’est inclus dans le dépôt.

## Ce qui est déjà prêt
- `functions/api/stripe-webhook.js` : vérifie la signature Stripe puis enregistre un paiement confirmé dans D1.
- `functions/api/recu.js` : génère un justificatif HTML imprimable / enregistrable en PDF.
- `schema.sql` : table D1 `payments`.
- `payment-links.js` : conserve les emplacements des Payment Links.

## À faire après validation du SIRET et ouverture du compte de paiement
1. Compléter les informations légales Laur’Appui dans les documents et le site.
2. Créer une base Cloudflare D1 et exécuter `schema.sql`.
3. Lier la base au projet Pages sous le nom `DB`.
4. Créer le webhook Stripe vers `https://laurappui.fr/api/stripe-webhook`.
5. Ajouter `STRIPE_WEBHOOK_SECRET` dans les secrets Cloudflare (jamais dans GitHub).
6. Créer les Payment Links et renseigner leurs URL dans `payment-links.js`.
7. Pour chaque paiement, transmettre les métadonnées `offer_key` et `offer_label` si le mode de création du paiement le permet.
8. Tester en environnement Stripe Test avant activation réelle.

## E-mail automatique
La génération du justificatif est préparée, mais l’envoi automatique par e-mail n’est volontairement pas activé : il faut choisir/configurer le service d’envoi et son domaine. Le secret de ce service devra être stocké dans Cloudflare, jamais dans le code public.

## Important
Le justificatif de paiement ne remplace pas automatiquement toutes les obligations d’une facture. La version définitive sera ajustée avec SIREN/SIRET, adresse, régime de TVA et autres mentions applicables avant mise en production.

## V5.48 — Tableau de bord privé Laura
- Page : `/admin-paiements.html`
- Connexion par mot de passe avec cookie de session HttpOnly/Secure (8 h).
- Liste des paiements D1, recherche client/e-mail/prestation, total encaissé, ouverture du justificatif et export CSV.
- Secrets Cloudflare supplémentaires à créer :
  - `ADMIN_PASSWORD` : mot de passe privé choisi par Laura (ne jamais l'écrire dans GitHub).
  - `ADMIN_SESSION_SECRET` : longue chaîne aléatoire servant à signer les sessions.
- Le tableau est marqué `noindex,nofollow` et n'est ajouté ni au menu public ni au sitemap.
- Avant activation réelle, compléter les mentions légales/SIRET et tester Stripe en mode Test.


## Préparation sans compte Stripe — V3
- Le Bureau affiche désormais un état `En attente de configuration` tant que `STRIPE_WEBHOOK_SECRET` n’existe pas.
- Aucun faux secret ou lien Stripe n’est inclus.
- Les quatre offres prévues sont affichées dans le Bureau avec leurs montants.
- L’état passera automatiquement à `Stripe connecté` lorsque le secret webhook sera configuré.
- Endpoint privé ajouté : `/api/stripe-status` (ne révèle jamais la valeur des secrets).


## Préparation V4 — échéanciers Stripe
- Diagnostic Budget 90 € : comptant / 3 × 30 € / 4 × 22,50 €.
- Sérénité Budget 180 € : comptant / 3 × 60 € / 4 × 45 €.
- VIP Trimestriel 360 € : comptant / 3 × 120 € / 4 × 90 €.
- VIP Annuel 1 100 € : comptant / 3 fois / 4 × 275 € / 12 fois.
- 12 fois annuel : 11 × 91,67 € puis 1 × 91,63 € = 1 100,00 €.
- Les clés/liens Stripe restent volontairement vides tant que le compte n’est pas activé.
- Le 12× est préparé comme échéancier récurrent à durée déterminée, pas comme un crédit garanti au client.
