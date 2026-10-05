# Laur’Appui V23 — Échéances intelligentes

- Les factures Abby ayant une date d’échéance génèrent automatiquement une échéance de paiement dans le Bureau.
- Une même facture Abby ne génère qu’une ligne de suivi (liaison source/source_id).
- La ligne reprend le client, le numéro Abby, la prestation, le montant et la date d’échéance.
- Statuts visuels calculés : À venir, À traiter (7 jours), En retard, Payée/Terminée.
- Une facture Abby au statut `payee` ou `avoir` clôt automatiquement son échéance lors de la synchronisation.
- Les tâches manuelles restent disponibles via + Nouveau et peuvent être terminées/réouvertes.
- Les échéances Abby ne sont pas clôturées manuellement afin de conserver Abby comme source de vérité.
