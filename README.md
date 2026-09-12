# Iron Signal

**Webbversion:** starta med `./web.command` och öppna http://localhost:8080. Alla fem banor finns även i webbläsaren. Se [WEB.md](WEB.md) för GitHub Pages, musik och publicering av `docs/`.

Ett fristående sidscrollande actionspel för Mac, inspirerat av 90-talets PC-spel som Duke Nukem II. Fem banor med egen pixelgrafik, skjutande, patrullerande drönare, hälsopaket och bossar. Startas från terminalen och visas i ett separat grafikfönster.

## Kampanjen

1. **Iron Docks:** den ursprungliga industribanan med lastkaj, gjuteri, kylsystem och reaktorrum.
2. **Frozen Uplink:** ett isigt laboratorium. Klättra uppför antennen, teleportera till den höga labbalkongen och ta dig ned genom kylschaktet.
3. **Magma Vault:** en lavabas. Följ avsatserna ned i valvet och klättra sedan uppför reaktortornet till slutstriden. En returteleport på bottenvåningens vänstra sida tar dig tillbaka till starten om du faller ned och missar kapslar.
4. **Neon Garden:** en övervuxen forskningsanläggning med odlingskammare, blommor och hängande rankor. Klättra till växthustaket, följ Canopy-länken och återvänd genom Roots-teleporten om du behöver leta efter missade kapslar.
5. **Orbital Citadel:** en rymdstation med observationsfönster och roterande antenner. Gå ned genom satellitdäcken, använd Airlock-länken och klättra hela vägen upp till kommandobryggan. Rescue-länken hjälper dig tillbaka till startdäcket.

Kameran följer spelaren både i sidled och höjdled. Varje bana har sex kapslar och en säkerhetskärna att besegra före utgången. Tryck **Enter** efter en klarad bana för att fortsätta. Poängen följer med och hälsan återställs. **R** startar om den aktuella banan med poängen från banans början. Efter hela kampanjen börjar R om från bana ett.

På titelskärmen kan du välja bana direkt med **1–5**, och sedan starta med Enter. Det gör att du kan prova de nya banorna direkt. Ett direkt banval börjar med noll poäng.

**Esc** öppnar pausmenyn. Tryck Esc, Enter eller P för att fortsätta, eller **T** för startmenyn. T avbryter den pågående omgången och återställer den aktuella banan till dess början. Esc från kartan öppnar pausmenyn; från resultat- och dödsskärmar går Esc till startmenyn. Avsluta programmet med **Cmd+Q** eller fönstrets stängningsknapp.

Teleporternas båda ändar är markerade med samma namn. Ställ dig i porten och tryck **E**. De fungerar åt båda hållen och har en kort återhämtningstid. Tryck **Tab** för en karta med din position, kvarvarande kapslar, teleportlänkar och utgången; spelet är pausat tills du trycker Tab igen.

## Starta

```sh
cd ~/Desktop/Duke
./play.command
```

Första starten kompilerar spelet med Apples Swift-kompilator. Xcode Command Line Tools krävs; om de saknas kan de installeras med `xcode-select --install`. Inga paket eller externa spelbibliotek behövs. Startfilen fungerar också när projektmappen flyttas.

## Commando-musik

Den lokala filen **`music/Rob Hubbard - Commando.mp3`** läses automatiskt in och spelas i loop när uppdraget startar. Inget manuellt filval behövs. Musiken pausas i menyer och fortsätter när du återupptar spelet.

Spelet söker efter filer med `commando` i namnet i `music/` och prioriterar MP3. Den befintliga FLAC-filen behöver inte konverteras eller flyttas. Du kan åsidosätta standardmusiken med en annan ljudfil:

```sh
./play.command --music "$HOME/Music/Commando.mp3"
```

Du kan också trycka **M** i spelet och välja en fil. MP3, M4A, WAV, AIFF och AAC stöds för automatisk inläsning. När filväljaren stängs, tryck **P** för att återuppta en pausad omgång, eller Tab om du öppnade den från kartan. SID-filer behöver först konverteras till ett ljudformat; de spelas inte direkt.

## Kontroller och uppdrag

| Tangent | Funktion |
| --- | --- |
| Enter | Starta uppdraget / fortsätt till nästa bana |
| 1–5 | Välj bana på titelskärmen |
| A/D eller vänster/höger | Förflytta dig |
| Mellanslag | Hoppa; släpp tidigare för ett kortare hopp |
| J eller K | Skjut, håll inne för automateld |
| W eller upp + skjut | Skjut uppåt |
| E | Använd närmaste teleport |
| Tab | Visa/stäng kartan |
| Esc / P | Pausmeny / fortsätt |
| T i pausmenyn | Till startmenyn; återställer aktuell bana |
| M | Välj musikfil |
| X | Stäng av/på ljud |
| R | Börja om aktuell bana |
| Cmd+Q | Avsluta |

Samla **sex lysande energikapslar**, besegra säkerhetskärnan i slutet av banan och nå **EXTRACT**. Sjukvårdsväskor med röda kors återställer hälsa. Du kan gå tillbaka efter missade kapslar. Spelet pausar automatiskt om fönstret tappar fokus.

Skjut två gånger på de gulbruna förrådslådorna för att öppna dem. Plocka upp vapnet som släpps för **tolv sekunders Overdrive** med snabbare eldgivning. Återstående tid visas uppe till höger.

## Kontrollera bygget

```sh
./play.command --self-test
```

Kontrollen verifierar rörelse, insamling, strid, paus, förstörbara lådor och vapenuppgraderingens tidsgräns. För banorna 2–5 simuleras hopp och fall med spelets egen uppdaterings- och kollisionskod: samtliga plattformar, kapslar och utgångar ska vara nåbara, och varje nåbar plattform ska ha en väg till utgången. Dessutom kontrolleras teleporternas säkerhet, returresa och återhämtningstid, kartpaus, höjdkamera, banövergångar, poäng vid omstart, kampanjens slut och Esc-menyn. Om en Commando-fil finns kontrolleras även att den kan avkodas och konfigureras för loopning. Kontrollen ersätter inte manuell provspelning av grafik, ljud och spelbalans.

Spellogiken finns i `Sources/main.swift`, banor och teleporter i `Sources/Levels.swift` och grafiken i `Sources/Art.swift`. För en statisk grafikförhandsvisning utan spelfönster:

```sh
./play.command --preview .build/frozen-uplink.png --level 2 --upper
./play.command --preview .build/magma-vault.png --level 3
./play.command --preview .build/neon-garden.png --level 4 --upper
./play.command --preview .build/orbital-citadel.png --level 5
```
