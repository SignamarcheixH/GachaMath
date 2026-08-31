"""
Configuration Django — Gacha des Nombres.

Le jeu reste un site statique. Django ne sert que /api/ et /admin/ ;
WhiteNoise sert le jeu lui-même depuis la racine du dépôt. Front et API
partagent donc la même origine : aucun CORS à configurer, un seul déploiement.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent   # serveur/
RACINE_JEU = BASE_DIR.parent                        # racine du dépôt, où vit le jeu

# ---------------------------------------------------------------- sécurité
# En développement une clé de repli suffit ; en production la variable
# d'environnement est obligatoire et le démarrage échoue sans elle.
DEBUG = os.environ.get("DJANGO_DEBUG", "1") == "1"

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "")
if not SECRET_KEY:
    if not DEBUG:
        raise RuntimeError("DJANGO_SECRET_KEY est obligatoire hors développement.")
    SECRET_KEY = "cle-de-developpement-a-ne-jamais-utiliser-en-production"

ALLOWED_HOSTS = [h for h in os.environ.get("DJANGO_HOSTS", "").split(",") if h] or (
    ["*"] if DEBUG else []
)
CSRF_TRUSTED_ORIGINS = [
    o for o in os.environ.get("DJANGO_ORIGINES", "").split(",") if o
]

# ---------------------------------------------------------------- cookies
# Le cookie d'identité est posé par le serveur, jamais par le JavaScript :
# c'est ce qui lui permet de survivre à la purge de Safari, qui ne vise que
# le stockage écrit côté client (localStorage et document.cookie).
COOKIE_JOUEUR = "gn_joueur"
COOKIE_DUREE = 60 * 60 * 24 * 730          # deux ans

SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_HTTPONLY = False                # le client doit pouvoir le lire
CSRF_COOKIE_SAMESITE = "Lax"
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https") if not DEBUG else None

# ---------------------------------------------------------------- en-têtes
# Hors développement, tout passe en HTTPS. L'hébergeur termine le TLS et nous
# transmet le protocole d'origine via l'en-tête déclaré ci-dessus ; sans lui,
# la redirection tournerait en boucle.
SECURE_SSL_REDIRECT = not DEBUG

# HSTS : la durée est volontairement courte au départ. Ce réglage est
# difficile à annuler — un navigateur qui l'a mémorisé refusera le HTTP
# pendant toute la durée annoncée, même si le certificat tombe. On monte à
# 31536000 (un an) une fois le domaine stable, pas avant.
SECURE_HSTS_SECONDS = int(os.environ.get("DJANGO_HSTS", "0" if DEBUG else "3600"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = False      # à n'activer qu'en connaissance de cause
SECURE_HSTS_PRELOAD = False

# Le jeu n'a aucune raison d'être affiché dans le cadre d'un autre site. Les
# annonces AdSense ne sont pas concernées : ce sont elles qui sont dans des
# cadres à l'intérieur de notre page, l'inverse de ce que cet en-tête bloque.
X_FRAME_OPTIONS = "DENY"
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

# ---------------------------------------------------------------- application
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "parties",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "gacha.urls"
WSGI_APPLICATION = "gacha.wsgi.application"

TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [],
    "APP_DIRS": True,
    "OPTIONS": {"context_processors": [
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
    ]},
}]

# ---------------------------------------------------------------- base
# SQLite en développement ; DATABASE_URL (PostgreSQL) en production.
if os.environ.get("DATABASE_URL"):
    import dj_database_url
    DATABASES = {"default": dj_database_url.parse(os.environ["DATABASE_URL"], conn_max_age=600)}
else:
    # SQLite convient très bien ici : une ligne par joueur, une écriture
    # toutes les quelques minutes. Mais plusieurs processus gunicorn écrivent
    # en parallèle, et par défaut SQLite rend « database is locked » dès que
    # deux écritures se croisent.
    #
    # WAL laisse les lectures se poursuivre pendant une écriture, et le délai
    # d'attente remplace l'erreur immédiate par une attente. Sans les deux, un
    # joueur perdrait sa sauvegarde exactement quand le jeu est fréquenté.
    DATABASES = {"default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": os.environ.get("SQLITE_CHEMIN") or BASE_DIR / "db.sqlite3",
        "OPTIONS": {
            "timeout": 20,
            "init_command": "PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;",
        },
    }}

# Lire requete.body déclenche cette vérification : elle doit donc être plus
# haute que la limite applicative de parties/views.py, sinon Django coupe le
# premier et le joueur reçoit une erreur générique au lieu du message clair.
DATA_UPLOAD_MAX_MEMORY_SIZE = 12 * 1024 * 1024

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------------------------------------------------------- fichiers
STATIC_URL = "/statique/"
STATIC_ROOT = BASE_DIR / "statique"

# WhiteNoise sert le jeu depuis la racine du dépôt : index.html à /,
# et css/ et js/ à leurs chemins relatifs, exactement comme en local.
# WhiteNoise ne sert le dépôt QUE en développement, où il n'y a pas de nginx
# devant. En production c'est nginx qui sert le jeu, à partir d'une liste
# explicite de chemins.
#
# La distinction n'est pas une optimisation, c'est une correction de faille.
# WHITENOISE_ROOT pointait sur la racine du dépôt en permanence, et WhiteNoise
# ne distingue pas ce qui est public de ce qui ne l'est pas : /.env et
# /serveur/db.sqlite3 étaient téléchargeables par tout le monde — la clé de
# signature et l'intégralité des parties des joueurs.
#
# Servir des fichiers depuis un dossier qui contient aussi des secrets ne peut
# pas être sécurisé par une liste d'exclusions : il y aura toujours un fichier
# qu'on a oublié d'exclure. C'est l'inverse qu'il faut faire — énumérer ce qui
# est public, et refuser le reste par défaut.
if DEBUG:
    WHITENOISE_ROOT = RACINE_JEU
    WHITENOISE_INDEX_FILE = True
WHITENOISE_AUTOREFRESH = DEBUG


def entetes_fichiers(headers, path, url):
    """Deux régimes de cache, et c'est la combinaison qui compte.

    Le HTML n'est jamais gardé : il porte les numéros de version des assets,
    donc s'il est périmé, tout l'est. C'est exactement ce qui s'est produit —
    un index.html en cache continuait à demander l'ancien JavaScript et à ne
    pas contenir les nouveaux emplacements. Il revalide désormais à chaque
    fois, ce qui ne coûte qu'un 304 grâce à l'ETag.

    Le CSS et le JS, eux, sont demandés avec « ?v=N ». Une URL versionnée
    désigne un contenu qui ne changera plus : on peut la garder un an. C'est
    ce qui rend le versionnement utile — sans ça, on revalidait chaque fichier
    à chaque visite et le « ?v=N » ne servait à rien.

    Contrepartie assumée : oublier d'incrémenter la version sert du code
    périmé. Le générateur de pages et index.html partagent ce numéro, ce qui
    limite l'oubli à un seul endroit.
    """
    if path.endswith((".html", ".htm")) or url.endswith("/"):
        headers["Cache-Control"] = "no-cache"
        # WhiteNoise répond avant les middlewares : sans cette ligne, les pages
        # du jeu seraient les seules à ne pas porter l'en-tête anti-cadrage.
        headers["X-Frame-Options"] = "DENY"
    elif path.endswith((".js", ".css")):
        headers["Cache-Control"] = "public, max-age=31536000"
    elif path.endswith((".txt", ".xml")):        # robots.txt, sitemap.xml
        headers["Cache-Control"] = "public, max-age=3600"


WHITENOISE_ADD_HEADERS_FUNCTION = entetes_fichiers

LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Europe/Paris"
USE_I18N = True
USE_TZ = True
