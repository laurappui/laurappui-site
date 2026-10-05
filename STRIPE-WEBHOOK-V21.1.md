# Stripe webhook V21.1

Correctif : lorsqu'un événement Stripe déjà enregistré est renvoyé, la ligne `payments` existante est mise à jour via `ON CONFLICT(stripe_session_id) DO UPDATE` au lieu d'être ignorée.

Cela permet notamment de corriger `offer_key` et `offer_label` sans créer un doublon ni effectuer un nouveau paiement. Le `receipt_token` et la date initiale du paiement sont conservés.
