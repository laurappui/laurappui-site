# Laur’Appui V25.2 — Purge sécurisée des fiches de test

- Ajoute **Purger test** uniquement aux clients au statut **Archivé**.
- La purge supprime du CRM : demandes du site, échanges, devis, suivis Abby, échéances/tâches et paiements Stripe associés à l’e-mail de la fiche.
- Les documents officiels dans Abby ne sont jamais supprimés par cette action.
- La suppression classique reste protégée lorsqu’un historique existe.
- Une confirmation explicite est demandée avant toute purge.
