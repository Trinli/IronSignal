# Iron Signal

Ett retrodoftande actionplattformsspel för webbläsare, med fem banor, pixelgrafik och `music/game_music.mp3` som standardmusik. Spelet använder HTML Canvas och JavaScript och kan publiceras direkt via GitHub Pages. Musik startar när du trycker på Starta uppdraget.

Den tidigare Swift-versionen och dess terminalstartare har tagits bort. Spelet utvecklas nu enbart för webbläsaren.

## Spela

Öppna den publicerade webbplatsen och välj **Starta uppdraget**. Du kan också välja en bana direkt i startmenyn. GitHub Pages använder mappen `docs/`; publiceringsanvisningar finns i [WEB.md](WEB.md).

| Tangent | Funktion |
| --- | --- |
| A/D eller vänster/höger | Gå |
| Mellanslag | Hoppa; släpp tidigt för kortare hopp |
| J | Skjut |
| W eller upp | Sikta uppåt |
| E | Öppna port med rätt nyckelkort / använd teleport |
| Tab | Karta |
| Esc | Pausmeny / fortsätt |

På mobil finns motsvarande knappar under spelet. Pausmenyn har alternativ för att fortsätta, försöka igen och återvända till startmenyn.

## Kampanjen

Samla alla energiceller och slå ut banans säkerhetskärna för att öppna utgången. På de två sista banorna måste också nyckelportarna öppnas.

1. **Iron Docks** – hamnens introduktionsbana.
2. **Frozen Uplink** – isiga höjdskillnader och teleporter.
3. **Magma Vault** – lavakomplexet.
4. **Neon Garden** – ett arboretum, ett förseglat laboratorium och en kärnkammare. Hitta bärnstensfärgat och blått nyckelkort. En sprucken vägg döljer extra utrustning.
5. **Orbital Citadel** – tre sektioner med växlande klättring åt båda håll, violett och blått nyckelkort, en underhållsteleport och ett hemligt vapenförråd.

De första tre banornas layout och bakgrundsgrafik är bevarade. Utrustning och fiendetålighet utvecklas genom kampanjen:

- **Pulse → Plasma → Rail:** 1, 2 respektive 4 skada per träff. Rail kan träffa två fiender med samma skott. Plasma är standard från bana 3 och Rail från bana 5. En hemlig uppgradering kan ge Rail tidigare och följer med till nästa bana.
- **Rustning:** absorberar träffar före hälsan. Senare banor börjar med mer rustning; blå sköldar fyller på tre steg, upp till sex.
- **Fiender:** får mer hälsa efter hand. Senare banor innehåller även bepansrade drönare och stationära kanontorn. Skadade vanliga fiender visar en hälsomätare.
- **Nyckelkort:** öppnar portar i motsvarande färg med E. Nycklar förbrukas inte. Kartan visar kort och stängda portar.
- **Hemliga rum:** skjut spruckna väggpaneler. Rummen ger bonuspoäng och extra utrustning, men behövs inte för att klara banan.
- **Explosiva tunnor och hoppplattor:** tunnor kan skada flera fiender och kedjereagera; stå på avstånd. Hoppplattor skjuter dig extra högt.
- **Förrådslådor:** skjut sönder dem för tillfällig Overdrive med snabbare eldgivning.

## Lokal utveckling

Python 3 kan förhandsvisa webbplatsen:

```sh
python3 scripts/serve_web.py
```

Öppna sedan `http://localhost:8080` i webbläsaren. Servern visar endast `docs/`.

```sh
node tests/web.mjs
python3 scripts/package_web.py
```

Testerna kontrollerar rörelse, strid, portarnas nyckelordning, nåbara mål och återvägar med spelets riktiga hoppfysik. Paketkommandot kopierar `music/game_music.mp3` till webbplatsen och skapar `.build/iron-signal-web.zip`.

`tests/browser.cjs --public` testar webbplatsen under en undermapp, musik, kontroller, portar, hemliga rum och mobilformat med Node 18+, Playwright och Chromium. Sätt `PLAYWRIGHT_MODULE` och vid behov `CHROMIUM_EXECUTABLE` om installationerna ligger utanför projektet.

## Filer

- `docs/campaign.mjs`: de nya banorna och deras dekor.
- `docs/data.mjs`: grundgrafik och de första tre banorna.
- `docs/engine.mjs`: spelregler och fysik.
- `docs/render.mjs`: grafik, karta och HUD.
- `docs/app.mjs`: menyer, kontroller och ljud.
- `docs/config.mjs`: standardmusikens relativa adress.
