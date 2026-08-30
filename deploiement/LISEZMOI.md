# Mise en ligne de gachamath.fr

Le jeu est un site statique ; Django ne sert que `/api/` et `/admin/`, et
WhiteNoise sert le reste. Il n'y a donc **qu'un seul processus à déployer**,
et aucune configuration CORS puisque tout partage la même origine.

Ces fichiers valent pour n'importe quel VPS Debian ou Ubuntu — OVH, Hetzner,
Scaleway, Lightsail. Rien ici n'est propre à un hébergeur.

---

## 1. Avant de toucher au serveur

**Le DNS d'abord.** Deux enregistrements A vers l'adresse IP du VPS :

| Type | Nom   | Valeur          |
|------|-------|-----------------|
| A    | `@`   | l'IP du serveur |
| A    | `www` | l'IP du serveur |

Attendez que `dig +short gachamath.fr` réponde la bonne adresse **avant** de
démarrer Caddy. Let's Encrypt limite le nombre d'échecs de validation par
semaine ; démarrer trop tôt peut vous bloquer plusieurs jours.

**La redirection de courrier.** Créez `contact@gachamath.fr` chez le
registraire et faites-la suivre vers votre boîte habituelle. Cette adresse
est publiée sur la page de confidentialité et sur « À propos » : elle doit
fonctionner le jour de la demande AdSense, qui la vérifie.

---

## 2. Préparer la machine

```bash
adduser --system --group --home /srv/gachamath gacha
apt update && apt install -y python3-venv git caddy
```

## 3. Installer l'application

```bash
cd /srv
git clone https://github.com/SignamarcheixH/GachaMath.git gachamath
cd gachamath
python3 -m venv .venv
.venv/bin/pip install -r serveur/requirements.txt
```

## 4. Configurer

```bash
cp deploiement/env.exemple .env
.venv/bin/python -c "import secrets; print(secrets.token_urlsafe(64))"
```

Reportez la clé dans `.env`, puis verrouillez le fichier — il contient de
quoi forger les cookies d'identité de n'importe quel joueur :

```bash
chmod 600 .env && chown gacha:gacha .env
```

## 5. Base et fichiers

```bash
cd /srv/gachamath/serveur
set -a && . /srv/gachamath/.env && set +a
../.venv/bin/python manage.py migrate
../.venv/bin/python manage.py collectstatic --noinput
../.venv/bin/python manage.py createsuperuser
chown -R gacha:gacha /srv/gachamath
```

Le mot de passe administrateur ne doit ressembler à aucun autre que vous
utilisez : `/admin/` donne accès aux sauvegardes de tous les joueurs.

## 6. Démarrer

```bash
cp /srv/gachamath/deploiement/gachamath.service /etc/systemd/system/
cp /srv/gachamath/deploiement/gachamath-sauvegarde.* /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now gachamath gachamath-sauvegarde.timer
systemctl status gachamath
```

## 7. Ouvrir au public

```bash
cp /srv/gachamath/deploiement/Caddyfile /etc/caddy/Caddyfile
mkdir -p /var/log/caddy && chown caddy:caddy /var/log/caddy
systemctl reload caddy
```

Vérifiez ensuite depuis votre poste :

```bash
curl -sI https://gachamath.fr | head -1
curl -s https://gachamath.fr/api/moi -o /dev/null -w '%{http_code}\n'
curl -sI http://gachamath.fr | grep -i location   # doit rediriger en https
```

---

## Les sauvegardes

C'est la raison d'être du serveur. Le back-office n'a été construit que pour
qu'un joueur ne perde pas sa collection ; **un serveur sans sauvegarde ne
supprime pas ce risque, il le concentre sur un seul disque** au lieu de le
laisser réparti sur les navigateurs des joueurs.

La tâche tourne chaque nuit, garde quatorze jours, et relit chaque archive
pour vérifier son intégrité — une sauvegarde jamais relue n'est pas une
sauvegarde, c'est un fichier dont on espère qu'il est bon.

```bash
systemctl start gachamath-sauvegarde     # à la demande
systemctl list-timers gachamath-sauvegarde
journalctl -u gachamath-sauvegarde --since today
```

**Deux choses restent à faire de votre côté :**

1. **Sortir les archives de la machine.** Quatorze copies sur le disque qui
   peut brûler ne protègent de rien. Un `rsync` vers un autre hôte, ou
   l'option de sauvegarde automatique de l'hébergeur, suffit.
2. **Essayer une restauration une fois**, avant d'en avoir besoin :

```bash
systemctl stop gachamath
cd /srv/gachamath/sauvegardes
gunzip -c gachamath_AAAA-MM-JJ_HHMMSS.sqlite3.gz > /tmp/essai.sqlite3
sqlite3 /tmp/essai.sqlite3 "SELECT COUNT(*) FROM parties_joueur;"
# si le compte est bon :
cp /tmp/essai.sqlite3 /srv/gachamath/serveur/db.sqlite3
chown gacha:gacha /srv/gachamath/serveur/db.sqlite3
systemctl start gachamath
```

---

## Mettre à jour le jeu

```bash
cd /srv/gachamath && git pull
systemctl restart gachamath
```

Le jeu étant statique, un `git pull` suffit dans la plupart des cas. Pensez
à **incrémenter le numéro de version des assets** (`?v=N` dans `index.html`
et `const V` dans `outils/generer_pages.js`) : le HTML n'est jamais mis en
cache, mais le CSS et le JS le sont un an, et ne seront rechargés que si
leur adresse change.

Si les modèles ont bougé, sauvegardez d'abord, puis `manage.py migrate`.

---

## Après la mise en ligne

- [ ] **Passer HSTS à un an** — `DJANGO_HSTS=31536000` dans `.env`, une fois
      que vous avez vu le certificat se renouveler au moins une fois.
- [ ] **AdSense** — renseigner `client` et les identifiants de blocs dans
      `js/config.js`, puis vérifier la mise en page avec `?pubs`.
- [ ] **Le CMP** — obligatoire pour diffuser en Europe. Il s'active dans la
      console AdSense, rubrique « Confidentialité et messages ». Sans lui, la
      diffusion aux visiteurs européens est en infraction.
- [ ] **Search Console** — déclarer `https://gachamath.fr/sitemap.xml`.
- [ ] **Mises à jour de sécurité** — `unattended-upgrades` sur Debian, sinon
      la machine dérive silencieusement.
