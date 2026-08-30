# Serveur — Gacha des Nombres

Django ne sert que `/api/` et `/admin/`. Le jeu reste statique : WhiteNoise le
sert depuis la racine du dépôt, donc front et API partagent la même origine —
aucun CORS, un seul déploiement.

## Démarrer en local

```bash
pip install -r serveur/requirements.txt
cd serveur
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8778
```

Le jeu est alors sur <http://127.0.0.1:8778/> et le back office sur `/admin/`.

## Régénérer la table des raretés

Le classement lit la rareté des nombres dans une table générée depuis le moteur
du jeu. **À relancer après toute modification des traits :**

```bash
node serveur/outils/generer_raretes.js
```

## L'API

| Route | Rôle |
|---|---|
| `GET /api/moi` | Identité courante, et pose le jeton CSRF |
| `POST /api/inscription` | `{pseudo}` → crée le joueur, renvoie son code, pose le cookie |
| `POST /api/reprise` | `{code}` → rattache cet appareil et renvoie la sauvegarde |
| `GET /api/partie` | Lit la sauvegarde |
| `PUT /api/partie` | Enregistre, recalcule les métriques, contrôle la cohérence |
| `GET /api/classement?tri=` | `completion`, `mythiques`, `theoremes`, `examen`, `forges` |
| `POST /api/deconnexion` | Efface le cookie |

## Pourquoi un cookie serveur

Safari efface `localStorage` après **sept jours** sans visite. Le plafond ne
vise que le stockage écrit côté client — un cookie posé par l'en-tête
`Set-Cookie` y échappe. L'identité du joueur passe donc par un cookie
`HttpOnly` de deux ans, et `localStorage` ne garde qu'une copie de travail
dont la perte est sans conséquence.

## Variables d'environnement (production)

| Variable | Rôle |
|---|---|
| `DJANGO_SECRET_KEY` | **Obligatoire.** Le démarrage échoue sans elle. |
| `DJANGO_DEBUG` | `0` en production |
| `DJANGO_HOSTS` | Domaines autorisés, séparés par des virgules |
| `DJANGO_ORIGINES` | Origines de confiance CSRF, ex. `https://exemple.fr` |
| `DATABASE_URL` | PostgreSQL ; SQLite par défaut sans elle |
