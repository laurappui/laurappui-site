# Laur’Appui — Audit SEO technique V2 (12/10/2026)

## Garantie de continuité de l’indexation
- Les 19 URL du sitemap restent strictement identiques.
- Aucun changement de nom de page, de redirection, de canonical des 19 URL, ni du fichier sitemap.xml.
- Aucun changement aux fonctions API, aux formulaires, aux liens de paiement, au CSS ou au JavaScript.
- Les demandes d’indexation déjà envoyées à Google Search Console ne sont pas annulées par le déploiement de ce ZIP. Google peut cependant revisiter les pages à son rythme.

## Corrections incluses
1. confidentialite.html : canonical vers /politique-confidentialite et robots noindex,follow. Évite de proposer à l’index une ancienne page de confidentialité concurrente. Ne supprime pas la page.
2. mentions-legales.html : ajout d’une meta description et d’une canonical vers /mentions-legales. Ne modifie pas le contenu juridique.

## Vérifications de la version source
- Les 19 pages du sitemap disposent d’une title, meta description, canonical et d’un H1.
- Le sitemap référence les URL sans extension .html.
- robots.txt autorise l’exploration et indique le sitemap.
- La page d’accueil contient déjà Open Graph, Twitter cards et un schéma Organization JSON-LD.
- Les pages d’administration et la page de confirmation de paiement doivent rester exclues de l’index.

## Contrôles après déploiement
1. Ouvrir /, /professionnels, /particuliers, /contact, /offre-diagnostic-budget : elles doivent répondre normalement.
2. Contrôler /sitemap.xml et vérifier que les 19 URL n’ont pas changé.
3. Vérifier que les anciennes URL .html redirigent toujours vers les mêmes URL sans extension.
4. Tester les formulaires, l’espace administrateur et le parcours Stripe/Abby en environnement approprié.
5. Ne pas refaire les demandes d’indexation déjà soumises.

## Points à approfondir (non modifiés par sécurité)
- Performances mobiles/Core Web Vitals : nécessitent des mesures réelles.
- Contenu éditorial et H1 de l’accueil : optimisation à faire après validation visuelle.
- Liens internes, accessibilité et couverture réelle des pages : à contrôler sur site déployé.
- Ne pas inventer des avis, des résultats de performance ou des données structurées non vérifiées.
