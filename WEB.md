# Iron Signal på webben

Webbversionen finns i **`docs/`**. Den innehåller alla fem banor, pixelgrafik, bossar, förstörbara lådor, Overdrive, teleporter, höjdkamera, karta, pausmenyer och musikval. Det är vanlig HTML, CSS och JavaScript med Canvas och Web Audio; inget byggsteg, npm-paket eller backend behövs på webbhotellet.

## Spela lokalt på Mac

```sh
cd ~/Desktop/Duke
./web.command
```

Öppna **http://localhost:8080**. Ctrl+C i terminalen stoppar servern. Använd `./web.command --port 8085` om porten är upptagen. Python 3 krävs bara för den lokala servern, inte för GitHub Pages.

Standardmusiken är `music/game_music.mp3`, som kopieras till `docs/music/game_music.mp3` när webbpaketet byggs. Musiken börjar efter att du klickat på Starta eller tryckt Enter. Webbläsaren tillåter inte att vi startar ljud innan du interagerat med sidan.

## Publicera via GitHub Pages

1. Skapa eller öppna ett GitHub-repository.
2. Lägg in hela **`docs/`**, inklusive `data.mjs`, och pusha till `main`. Du kan antingen använda detta projekt eller packa upp `.build/iron-signal-web.zip` i repositoryt.
3. Välj **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
4. Välj grenen **main**, mappen **/docs**, och klicka **Save**.
5. När GitHub har publicerat visas adressen på samma inställningssida, vanligtvis `https://DITT-NAMN.github.io/REPOSITORY/`.

Alla resurser använder relativa adresser, så spelet fungerar även under repositoryts undermapp. `docs/.nojekyll` gör att filerna serveras som statiska filer. Ingen hemlig nyckel, installation av Swift eller egen server krävs.

[GitHubs instruktioner för publiceringskälla](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## Musik på den publika sidan

Webbversionen använder **`docs/music/game_music.mp3`** automatiskt, både lokalt och på GitHub Pages. Musiken börjar efter Starta/Enter, loopas under spelet och pausas i menyer.

Källfilen är `music/game_music.mp3`. Kör `python3 scripts/package_web.py` efter att du bytt den; kommandot uppdaterar webbkopian och ZIP-paketet. Publicera hela `docs/`, inklusive `docs/music/`. Adressen i `docs/config.mjs` är relativ och fungerar under repositoryts undermapp.

Besökare kan fortfarande välja en egen lokal ljudfil med **Välj musik / M** eller stänga av ljudet med **X**. Det lokala filvalet laddas inte upp och gäller tills sidan laddas om.

## Kontroller

| Tangent | Funktion |
| --- | --- |
| 1–5 på startmenyn | Välj bana |
| Enter | Starta, fortsätt eller nästa bana |
| A/D eller pilar | Flytta |
| Mellanslag | Hoppa; släpp för kortare hopp |
| J/K | Skjut |
| W/upp | Sikta uppåt |
| E | Teleport |
| Tab när spelytan har fokus | Visa/stäng karta |
| Esc/P | Pausmeny / fortsätt |
| T i pausmenyn | Startmeny; återställer aktuell bana |
| R | Försök igen |
| M | Välj lokal musikfil |
| X | Stäng av/på ljud |

Det finns också klickbara menyknappar och pekkontroller. Tangentbord rekommenderas för de svårare hoppen. Spelet pausas när fönstret tappar fokus eller fliken döljs. Använd Helskärm-knappen för större spelyta.

## Tester och underhåll

```sh
node tests/web.mjs
```

Simuleringstesterna kontrollerar strid, rörelse, menyer och samtliga nya banors nåbarhet med samma fysikkod som webbläsaren använder. `tests/browser.cjs` kör webbläsartester med Node 18+ och Playwright om det finns installerat. Servern ska vara igång. `TEST_URL` kan ange en annan adress, även en undermapp. Tester och verktyg behöver inte publiceras.

Banor och grafik har exporterats från Mac-versionen. Efter ändringar i Swift-källorna kan du förnya webbdata med:

```sh
./play.command --export-web docs/data.mjs
node tests/web.mjs
python3 scripts/package_web.py
```

Spellogiken för webben ligger i `docs/engine.mjs`, renderingen i `docs/render.mjs` och kontroller, menyer och ljud i `docs/app.mjs`. Ändringar i Mac-versionens spellogik måste också föras över till webbkoden. Första banan har de befintliga klyftorna; övriga fyra verifieras även för returvägar efter fall.
