#!/usr/bin/env python3
"""Sauvegarde de la base, à chaud.

Pourquoi un script plutôt qu'un « cp » dans une tâche planifiée : copier un
fichier SQLite pendant qu'un processus écrit dedans produit une copie
corrompue, et on ne s'en aperçoit que le jour où on essaie de la restaurer.
L'API de sauvegarde de SQLite, elle, prend une image cohérente sans
interrompre le service.

C'est la pièce qui justifie tout le reste. Le serveur n'a été construit que
pour qu'un joueur ne perde pas sa collection ; un serveur sans sauvegarde
déplace le risque, il ne le supprime pas — il le concentre même sur un seul
disque, au lieu de le laisser réparti sur les navigateurs des joueurs.
"""
import gzip
import os
import shutil
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

SOURCE = Path(os.environ.get("SQLITE_CHEMIN", "/srv/gachamath/serveur/db.sqlite3"))
DESTINATION = Path(os.environ.get("SAUVEGARDES", "/srv/gachamath/sauvegardes"))
GARDER = int(os.environ.get("SAUVEGARDES_GARDEES", "14"))


def ouvrir_source() -> sqlite3.Connection:
    """Ouvre la base en lecture seule quand c'est possible.

    En mode WAL, une connexion en lecture seule a besoin du fichier « -shm »,
    que SQLite ne peut pas créer sans droit d'écriture. Il existe donc quand le
    service tourne, et pas forcément quand il est arrêté. Plutôt que de laisser
    la sauvegarde échouer précisément quand on vient d'arrêter le service pour
    une mise à jour, on retombe sur une ouverture normale.
    """
    try:
        return sqlite3.connect(f"file:{SOURCE}?mode=ro", uri=True)
    except sqlite3.OperationalError:
        return sqlite3.connect(SOURCE)


def sauvegarder() -> Path:
    DESTINATION.mkdir(parents=True, exist_ok=True)
    # À la seconde près : deux exécutions rapprochées — la tâche planifiée et
    # une sauvegarde manuelle avant une mise à jour — ne doivent pas produire
    # le même nom de fichier et s'écraser sans rien dire.
    horodatage = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H%M%S")
    brut = DESTINATION / f"gachamath_{horodatage}.sqlite3"

    source = ouvrir_source()
    copie = sqlite3.connect(brut)
    try:
        source.backup(copie)          # image cohérente, service non interrompu
    finally:
        copie.close()
        source.close()

    comprime = brut.with_suffix(".sqlite3.gz")
    with open(brut, "rb") as e, gzip.open(comprime, "wb", compresslevel=6) as s:
        shutil.copyfileobj(e, s)
    brut.unlink()
    return comprime


def verifier(archive: Path) -> int:
    """Relit la sauvegarde et compte les parties.

    Une sauvegarde qu'on n'a jamais relue n'est pas une sauvegarde : c'est un
    fichier dont on espère qu'il est bon. On paie donc la vérification à
    chaque fois, tant que la base tient en mémoire.
    """
    temporaire = archive.with_suffix("")
    with gzip.open(archive, "rb") as e, open(temporaire, "wb") as s:
        shutil.copyfileobj(e, s)
    try:
        con = sqlite3.connect(f"file:{temporaire}?mode=ro", uri=True)
        try:
            if con.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                raise RuntimeError("intégrité en défaut")
            return con.execute("SELECT COUNT(*) FROM parties_joueur").fetchone()[0]
        finally:
            con.close()
    finally:
        # Ouvrir une base en WAL crée deux fichiers annexes à côté d'elle. Les
        # oublier laisse des débris dans le dossier des sauvegardes, que la
        # rotation ne connaît pas et ne nettoiera jamais.
        for reste in (temporaire, Path(str(temporaire) + "-wal"),
                      Path(str(temporaire) + "-shm")):
            reste.unlink(missing_ok=True)


def elaguer() -> int:
    archives = sorted(DESTINATION.glob("gachamath_*.sqlite3.gz"))
    perimees = archives[:-GARDER] if len(archives) > GARDER else []
    for a in perimees:
        a.unlink()
    return len(perimees)


if __name__ == "__main__":
    if not SOURCE.exists():
        sys.exit(f"Base introuvable : {SOURCE}")
    archive = sauvegarder()
    joueurs = verifier(archive)
    supprimees = elaguer()
    taille = archive.stat().st_size / 1024
    print(f"{archive.name} : {joueurs} joueurs, {taille:.0f} Ko, "
          f"{supprimees} ancienne(s) supprimee(s)")
