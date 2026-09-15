# Publicera Iron Signal med GitHub Pages

Spelet är en statisk webbplats. Hela webbversionen finns i `docs/`; ingen kompilering eller spelserver behövs på GitHub Pages.

1. Lägg projektet i ditt GitHub-repository och pusha ändringarna.
2. Öppna repositoryts **Settings → Pages**.
3. Välj **Deploy from a branch**, din publiceringsgren och mappen **/docs**. Spara.
4. Öppna adressen som GitHub Pages visar när publiceringen är klar.

Alla resurser använder relativa adresser så att spelet fungerar under exempelvis `/iron-signal/`.

## Musik

Standardmusiken är `docs/music/game_music.mp3`, med källfilen `music/game_music.mp3`. Inställningen ligger i `docs/config.mjs`. Musiken startar efter första klicket eller tangenttryckningen och fortsätter även i menyer och under paus. X eller Ljud-knappen stänger av ljudet. Spelaren kan också välja en egen lokal ljudfil i ljudpanelen.

Efter byte av källfilen, kör:

```sh
python3 scripts/package_web.py
```

Det uppdaterar musikfilen i `docs/` och skapar `.build/iron-signal-web.zip`. Arkivet innehåller `docs/`, README och denna guide och kan packas upp i repositoryts rot.

## Förhandsvisning och ändringar

```sh
python3 scripts/serve_web.py
```

Öppna `http://localhost:8080` i webbläsaren. Använd en HTTP-server för modulbaserad JavaScript, även lokalt.

Redigera senare banor i `docs/campaign.mjs` och de första tre i `docs/data.mjs`. Kör `node tests/web.mjs` efter ändringar av fysik eller banlayout. Mer om kontroller och spelmekanik finns i [README.md](README.md) i projektet.
