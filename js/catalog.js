// catalog.js
// Vaste objecten (heldere sterren + deep-sky objecten) met J2000-coördinaten,
// plus planeetmetadata. Posities van planeten worden live berekend in visibility.js.
// Alle RA-waarden zijn in uren, Dec in graden (J2000-epoche).
// Elk object heeft een `link` naar de Nederlandstalige Wikipedia voor meer info.

(function (global) {
  "use strict";

  const W = "https://nl.wikipedia.org/wiki/";

  // --- Vaste sterren & deep-sky objecten ----------------------------------
  const OBJECTS = [
    {
      id: "m31", name: "Andromedanevel", designation: "M31 / NGC 224",
      type: "Sterrenstelsel", constellation: "Andromeda", mag: 3.4, ra: 0.7125, dec: 41.269,
      link: W + "Andromedanevel",
      howToFind:
        "Zoek het Grote Vierkant van Pegasus. Hop vanaf Alpheratz (de NO-hoek van het vierkant) " +
        "twee sterren naar het oosten langs Andromeda naar Mirach (Beta And), en draai dan een " +
        "klein stukje naar het NW naar Mu Andromedae. M31 staat net NW van Mu als een flauw, " +
        "langwerpig lichtvlekje. Op een donkere nacht is het met het blote oog een waas; een " +
        "verrekijker toont de kern duidelijk en een kleine telescoop laat de stofbaan zien."
    },
    {
      id: "m45", name: "Zevengesternte", designation: "M45 / Pleiaden",
      type: "Open sterrenhoop", constellation: "Stier", mag: 1.6, ra: 3.791, dec: 24.105,
      link: W + "Zevengesternte",
      howToFind:
        "Zoek naar een strakke, lepelvormige knoop van zes of zeven sterren, ver ten NW van de " +
        "oranje ster Aldebaran. Makkelijk met het blote oog te zien; een verrekijker geeft het " +
        "beste beeld en toont tientallen blauwe sterren met flauwe nevels eromheen."
    },
    {
      id: "m42", name: "Orionnevel", designation: "M42 / NGC 1976",
      type: "Nevel", constellation: "Orion", mag: 4.0, ra: 5.588, dec: -5.391,
      link: W + "Orionnevel",
      howToFind:
        "Zoek de drie gordelsterren van Orion (Alnitak, Alnilam, Mintaka). Onder de gordel " +
        "hangt het zwaard van Orion - een lijn van drie flauwe objecten. Het middelste, wazige " +
        "object is M42. Met het blote oog zichtbaar in elke hemel; prachtig in een verrekijker " +
        "of telescoop, die de Trapezium-cluster in het hart tonen."
    },
    {
      id: "m1", name: "Krabnevel", designation: "M1 / NGC 1952",
      type: "Supernovarest", constellation: "Stier", mag: 8.4, ra: 5.5758, dec: 22.0147,
      link: W + "Krabnevel",
      howToFind:
        "Vind Zeta Tauri (de punt van de zuidelijke hoorn van de stier, bij de oorsprong van de " +
        "hoorns). M1 staat net iets meer dan 1 graad NW van Zeta Tauri. Heeft een donkere hemel " +
        "en minstens een kleine telescoop nodig; ziet eruit als een klein, dim, ovaal vlekje."
    },
    {
      id: "betelgeuse", name: "Betelgeuze", designation: "Alfa Orionis",
      type: "Ster", constellation: "Orion", mag: 0.42, ra: 5.9195, dec: 7.4071,
      link: W + "Betelgeuze_(ster)",
      howToFind:
        "De linkerbovenschouderster van Orion - een opvallende warme oranje-rode kleur. " +
        "Vergelijk de kleur met de blauwwitte Rigel aan de tegenovergestelde (rechtsonder) " +
        "hoek van Orion. Blote oog; een verrekijker benadrukt de kleur. Een rode superreus " +
        "die in helderheid varieert."
    },
    {
      id: "rigel", name: "Rigel", designation: "Beta Orionis",
      type: "Ster", constellation: "Orion", mag: 0.13, ra: 5.2423, dec: -8.2017,
      link: W + "Rigel_(ster)",
      howToFind:
        "De rechterondervoetster van Orion - schitterend blauwwit, de helderste ster van Orion. " +
        "Blote oog. Gebruik hem samen met Betelgeuze om de omtrek van Orion in te schatten."
    },
    {
      id: "sirius", name: "Sirius", designation: "Alfa Canis Majoris",
      type: "Ster", constellation: "Grote Hond", mag: -1.46, ra: 6.7525, dec: -16.7161,
      link: W + "Sirius_(ster)",
      howToFind:
        "De helderste ster aan de nachtelijke hemel. Volg de gordel van Orion naar beneden en " +
        "naar het oosten - je komt uit op Sirius, een verblindend wit/blauwe ster die vlak " +
        "boven de horizon levendig fonkelt. Blote oog. In de winter laag in het zuiden vanuit " +
        "Nederland."
    },
    {
      id: "procyon", name: "Procyon", designation: "Alfa Canis Minoris",
      type: "Ster", constellation: "Kleine Hond", mag: 0.34, ra: 7.6550, dec: 5.2250,
      link: W + "Procyon_(ster)",
      howToFind:
        "Ten oosten van Orion en ten noorden van Sirius is Procyon een heldere geelwitte ster " +
        "die samen met Sirius en Betelgeuze een grote driehoek vormt (de Winterdriehoek). " +
        "Blote oog."
    },
    {
      id: "aldebaran", name: "Aldebaran", designation: "Alfa Tauri",
      type: "Ster", constellation: "Stier", mag: 0.85, ra: 4.5988, dec: 16.5093,
      link: W + "Aldebaran_(ster)",
      howToFind:
        "De gloeiend oranje 'oog' van de stier, aan één punt van de V-vormige Hyaden-cluster. " +
        "Volg de gordel van Orion omhoog en naar het NW om hem te bereiken. Blote oog; een " +
        "verrekijker toont de Hyaden eromheen verspreid."
    },
    {
      id: "capella", name: "Capella", designation: "Alfa Aurigae",
      type: "Ster", constellation: "Voerman", mag: 0.08, ra: 5.2782, dec: 45.9979,
      link: W + "Capella_(ster)",
      howToFind:
        "Zeer heldere geelgouden ster, in de winter hoog aan de hemel, aan de top van de " +
        "vijfhoek van de Voerman (Auriga). De derde helderste ster aan de noorderhemel. " +
        "Blote oog."
    },
    {
      id: "castor", name: "Castor", designation: "Alfa Geminorum",
      type: "Dubbelster", constellation: "Tweeling", mag: 1.57, ra: 7.5766, dec: 31.8884,
      link: W + "Castor_(ster)",
      howToFind:
        "Een van de 'tweeling'-koppen van de Tweeling, de zwakkere, wittere (ten noorden van " +
        "Pollux). Een telescoop bij ~100x splitst hem in een prachtige dubbelster (met een " +
        "derde, flauwe begeleider)."
    },
    {
      id: "pollux", name: "Pollux", designation: "Beta Geminorum",
      type: "Ster", constellation: "Tweeling", mag: 1.14, ra: 7.7553, dec: 28.0262,
      link: W + "Pollux_(ster)",
      howToFind:
        "De helderdere, oranje 'tweeling' van de Tweeling, net ten ZO van Castor. Blote oog; " +
        "de kleur contrasteert mooi met het wit van Castor."
    },
    {
      id: "m81", name: "Bodestelsel", designation: "M81 / NGC 3031",
      type: "Sterrenstelsel", constellation: "Grote Beer", mag: 6.9, ra: 9.926, dec: 69.065,
      link: W + "Bodestelsel",
      howToFind:
        "Gebruik de steelpan van de Grote Beer: trek een diagonaal van Phecda (ZW-komster) " +
        "naar Dubhe (NW-komster) en ga ongeveer dezelfde afstand door naar het NW. Daar staat " +
        "M81, met M82 als dichte buur naar het NO. Een verrekijker toont M81 als een zacht, " +
        "rond lichtvlekje; een telescoop toont M82 als een dunne, sigaarvormige streep."
    },
    {
      id: "m82", name: "Sigaarstelsel", designation: "M82 / NGC 3034",
      type: "Sterrenstelsel", constellation: "Grote Beer", mag: 8.4, ra: 9.931, dec: 69.679,
      link: W + "Sigaarstelsel",
      howToFind:
        "Staat direct naast M81 (zie Bodestelsel). Richt je telescoop op M81 en schuif een " +
        "klein stukje naar het NO: M82 is een slank, met helderdere randen uitgerekt " +
        "stelsel, vaak makkelijker te spotten dan M81 ondanks de lagere totale helderheid."
    },
    {
      id: "mizar", name: "Mizar & Alcor", designation: "Zeta Ursae Majoris",
      type: "Dubbelster", constellation: "Grote Beer", mag: 2.27, ra: 13.3987, dec: 54.9254,
      link: W + "Mizar",
      howToFind:
        "De middelste 'ster' in de steel van de Steelpan (Grote Beer). Het blote oog splitst " +
        "hem in Mizar (helderder) en Alcor (flauwer, dichtbij). Een telescoop splitst Mizar " +
        "verder in twee - een klassieke dubbelster."
    },
    {
      id: "arcturus", name: "Arcturus", designation: "Alfa Bootis",
      type: "Ster", constellation: "Ossenhoeder", mag: -0.05, ra: 14.2610, dec: 19.1825,
      link: W + "Arcturus_(ster)",
      howToFind:
        "Volg de boog van de steel van de Steelpan weg van de kom: 'boog naar Arcturus'. Het " +
        "is een intens oranje, zeer heldere ster aan de voorjaarshemel. Blote oog."
    },
    {
      id: "spica", name: "Spica", designation: "Alfa Virginis",
      type: "Ster", constellation: "Maagd", mag: 0.98, ra: 13.4204, dec: -11.1614,
      link: W + "Spica_(ster)",
      howToFind:
        "Volg de boog van de steel verder voorbij Arcturus en 'rijd een spie' omlaag naar " +
        "Spica, een blauwwitte ster laag aan de zuidelijke voorjaars-/zomerhemel. Blote oog."
    },
    {
      id: "m13", name: "Herculesbolhoop", designation: "M13 / NGC 6205",
      type: "Bolvormige sterrenhoop", constellation: "Hercules", mag: 5.8, ra: 16.697, dec: 36.461,
      link: W + "Herculesbolhoop",
      howToFind:
        "Zoek de 'Sleutelsteen' - de viersterren-vierhoek in het midden van Hercules. M13 " +
        "ligt aan de westrand van de Sleutelsteen, ongeveer een derde van de weg van de ZW- " +
        "naar de NW-ster. Zichtbaar als een wazige ster in een verrekijker; een telescoop " +
        "lost hem op in een verblindende bol van ontelbare sterren."
    },
    {
      id: "m92", name: "Bolhoop M92", designation: "M92 / NGC 6341",
      type: "Bolvormige sterrenhoop", constellation: "Hercules", mag: 6.3, ra: 17.275, dec: 43.136,
      link: W + "Messier_92",
      howToFind:
        "Een compacte, wat over het hoofd geziene bolhoop ten NO van de Sleutelsteen, " +
        "tussen de Sleutelsteen en de ster Iota Herculis. Een verrekijker toont een kleine, " +
        "heldere bol; een telescoop begint zijn dichte kern van sterren op te lossen."
    },
    {
      id: "m57", name: "Ringnevel", designation: "M57 / NGC 6720",
      type: "Planetaire nevel", constellation: "Lier", mag: 8.8, ra: 18.892, dec: 33.033,
      link: W + "Ringnevel",
      howToFind:
        "Vind Vega, de heldere ster aan de NW-hoek van de Zomerdriehoek. Daaronder staan de " +
        "twee zwakkere sterren Sheliak en Sulafat (Beta en Gamma Lyrae); de Ring staat op een " +
        "rechte lijn ertussenin. Heeft een telescoop nodig: ziet eruit als een klein, spookachtig " +
        "grijs donutje. Een verrekijker toont slechts een dim, wazig, iets onscherp 'sterretje'."
    },
    {
      id: "vega", name: "Vega", designation: "Alfa Lyrae",
      type: "Ster", constellation: "Lier", mag: 0.03, ra: 18.6161, dec: 38.7837,
      link: W + "Vega_(ster)",
      howToFind:
        "Heldere blauwwitte ster, de NW-hoek van de Zomerdriehoek. In de zomeravonden vanuit " +
        "Nederland vrijwel overhead. Blote oog; door een verrekijker iets rustiger."
    },
    {
      id: "altair", name: "Altair", designation: "Alfa Aquilae",
      type: "Ster", constellation: "Arend", mag: 0.77, ra: 19.8464, dec: 8.8684,
      link: W + "Altair_(ster)",
      howToFind:
        "De zuidelijke hoek van de Zomerdriehoek, geflankeerd door twee zwakkere sterren " +
        "(Tarazed en Alshain) op een lijn - een kenmerkende 'balk' van drie. Blote oog."
    },
    {
      id: "deneb", name: "Deneb", designation: "Alfa Cygni",
      type: "Ster", constellation: "Zwaan", mag: 1.25, ra: 20.6905, dec: 45.2802,
      link: W + "Deneb",
      howToFind:
        "De NO-hoek van de Zomerdriehoek en de 'staart' van het Noorderkruis (de Zwaan). Een " +
        "verre, schitterende superreus; blote oog."
    },
    {
      id: "m27", name: "Halternevel", designation: "M27 / NGC 6853",
      type: "Planetaire nevel", constellation: "Vosje", mag: 7.5, ra: 19.947, dec: 22.721,
      link: W + "Halternevel",
      howToFind:
        "Net onder de Zomerdriehoek. Zoek het kleine pijltje van Sagitta (de Pijl) ten zuiden " +
        "van Albireo; hop vanaf de punt van Sagitta ongeveer 3 graden naar het zuiden. Een " +
        "verrekijker toont een kenmerkende grijze 'appeldikteplijntjes'-glow; een telescoop " +
        "toont duidelijk zijn twee-lobbige vorm."
    },
    {
      id: "albireo", name: "Albireo", designation: "Beta Cygni",
      type: "Dubbelster", constellation: "Zwaan", mag: 3.05, ra: 19.7463, dec: 27.9597,
      link: W + "Albireo",
      howToFind:
        "De 'snavel'-ster van het Noorderkruis (de Zwaan), aan het zuidelijke uiteinde van het " +
        "kruis. Een telescoop bij lage vergroting splitst hem in een prachtig goud + blauw " +
        "paar - een van de mooiste kleurcontrast-dubbelsterren aan de hemel."
    },
    {
      id: "m11", name: "Wilde Eend-cluster", designation: "M11 / NGC 6705",
      type: "Open sterrenhoop", constellation: "Schild", mag: 6.3, ra: 18.863, dec: -6.27,
      link: W + "Wilde_eendcluster",
      howToFind:
        "Onder het schild van Scutum, net ten zuiden van de staart van de Arend (Eta " +
        "Aquilae). Een verrekijker toont een compacte, rijke zwerm; een telescoop onthult een " +
        "V-vormige waaijer van sterren, lijkend op een vlucht eenden."
    },
    {
      id: "m22", name: "Bolhoop M22", designation: "M22 / NGC 6656",
      type: "Bolvormige sterrenhoop", constellation: "Boogschutter", mag: 5.1, ra: 18.591, dec: -23.905,
      link: W + "Messier_22",
      howToFind:
        "In de 'theepot'-asterism van de Boogschutter, kijk net NW van de dekselster Kaus " +
        "Borealis (de linksbovenster van de theepot). Een van de helderste bolhopen - een " +
        "verrekijker toont een lichtgevende bol, een telescoop lost zijn buitenste sterren " +
        "op. Laag in het zuiden, dus het beste bij een vrije zuidelijke horizon."
    },
    {
      id: "m8", name: "Lagunenevel", designation: "M8 / NGC 6523",
      type: "Nevel", constellation: "Boogschutter", mag: 6.0, ra: 18.096, dec: -24.387,
      link: W + "Lagunenevel",
      howToFind:
        "Boven de tuit van de 'theepot' van de Boogschutter, ongeveer 5 graden NW van de " +
        "tuitster Lambda Sagittarii. Een verrekijker onthult een kleine open sterrenhoop " +
        "verweven in een zachte gloed; een telescoop bij lage vergroting toont een donkere " +
        "baan die de nevel doormidden snijdt."
    },
    {
      id: "antares", name: "Antares", designation: "Alfa Scorpii",
      type: "Ster", constellation: "Schorpioen", mag: 1.06, ra: 16.4901, dec: -26.4320,
      link: W + "Antares_(ster)",
      howToFind:
        "Het gloeiend rode 'hart' van de Schorpioen, in de bocht van het schorpioenenlijf. " +
        "Zeer laag in het zuiden vanuit Nederland, dus een vrije zuidelijke horizon is " +
        "nodig. Blote oog; de diep rode kleur contrasteert met de omliggende sterren."
    },
    {
      id: "m51", name: "Draaikolkstelsel", designation: "M51 / NGC 5194",
      type: "Sterrenstelsel", constellation: "Jachthonden", mag: 8.4, ra: 13.496, dec: 47.195,
      link: W + "Draaikolkstelsel",
      howToFind:
        "Vind Alkaid (het uiteinde van de steel van de Steelpan). Veeg ongeveer 3,5 graden " +
        "naar het ZW richting Cor Caroli (de heldere ster in de Jachthonden). Heeft een " +
        "donkere hemel en een middelgrote telescoop nodig: twee flauwe lichtende vlekken, de " +
        "grotere met een flauwe spiraalarm naar zijn kleinere begeleider."
    },
    {
      id: "m104", name: "Sombrerostelsel", designation: "M104 / NGC 4594",
      type: "Sterrenstelsel", constellation: "Maagd", mag: 8.0, ra: 12.661, dec: -11.623,
      link: W + "Sombrerostelsel",
      howToFind:
        "Op de grens van de Maagd en de Raaf. Trek een lijn vanuit de NW-hoek van de kleine " +
        "vierhoek van de Raaf door de NO-hoek, ongeveer één Raaf-lengte verder. Heeft een " +
        "telescoop nodig: toont een heldere bolling doorsneden door een opvallende, donkere " +
        "stofbaan, als een breedgerande hoed."
    },
    {
      id: "regulus", name: "Regulus", designation: "Alfa Leonis",
      type: "Ster", constellation: "Leeuw", mag: 1.35, ra: 10.1395, dec: 11.9672,
      link: W + "Regulus_(ster)",
      howToFind:
        "Het heldere witte 'hart' van de leeuw, aan de basis van de 'sikkel' (achterwaartse " +
        "vraagteken) van de Leeuw. Blote oog; een telescoop toont een flauwere begeleiderster " +
        "dichtbij."
    },
    {
      id: "polaris", name: "Polaris", designation: "Alfa Ursae Minoris",
      type: "Ster", constellation: "Kleine Beer", mag: 1.97, ra: 2.5302, dec: 89.2641,
      link: W + "Polaris",
      howToFind:
        "De Poolster. Gebruik de twee 'wijzer'-sterren van de Steelpan (Merak en Dubhe, de " +
        "buitenrand van de kom) en volg de lijn die zij maken omhoog, ongeveer vijf keer hun " +
        "onderlinge afstand. Polaris staat vrijwel pal noord en ongeveer 52 graden boven de " +
        "horizon vanuit Alphen - hij gaat nooit onder. Blote oog; een handig oriëntatiepunt."
    },
    {
      id: "algol", name: "Algol (Demonster)", designation: "Beta Persei",
      type: "Ster", constellation: "Perseus", mag: 2.12, ra: 3.1361, dec: 40.9556,
      link: W + "Algol_(ster)",
      howToFind:
        "In Perseus, de 'knipperende' ster die elke ~2,9 dagen verbleekt. Zoek het gebogen " +
        "'blad' van het zwaard van Perseus; Algol is de helderste ster erin. Een bekende " +
        "bedekkingsvariabele die van mag 2,1 naar 3,4 daalt voor enkele uren. Blote oog."
    },
    {
      id: "m15", name: "Bolhoop M15", designation: "M15 / NGC 7078",
      type: "Bolvormige sterrenhoop", constellation: "Pegasus", mag: 6.2, ra: 21.497, dec: 12.167,
      link: W + "Messier_15",
      howToFind:
        "Aan de NE-rand van Pegasus. Vind de ster Enif (Epsilon Pegasi, de neus van het paard, " +
        "ten oosten van het Grote Vierkant). M15 staat ongeveer 4 graden NW van Enif. Een " +
        "verrekijker toont een compacte wazige bol; een telescoop lost zijn dichte, heldere " +
        "kern op."
    },
    {
      id: "m2", name: "Bolhoop M2", designation: "M2 / NGC 7089",
      type: "Bolvormige sterrenhoop", constellation: "Waterman", mag: 6.5, ra: 21.555, dec: -0.823,
      link: W + "Messier_2",
      howToFind:
        "In het noordelijke deel van de Waterman. Vind Sadalsuud en Sadalmelik (de twee sterren " +
        "boven de Waterkan) en veeg dan ongeveer 5 graden naar het noorden en een tikje naar " +
        "het oosten. Een verrekijker toont een kleine, ronde gloed; een telescoop lost hem op " +
        "in een dichte, compacte zwerm."
    },
    {
      id: "fomalhaut", name: "Fomalhaut", designation: "Alfa Piscis Austrini",
      type: "Ster", constellation: "Zuidervis", mag: 1.16, ra: 22.9608, dec: -29.6222,
      link: W + "Fomalhaut",
      howToFind:
        "De 'eenzaamste ster' - een heldere witte ster in een leeg gebied, laag aan de " +
        "zuidelijke herfsthemel. Verleng de lijn van de onderste (ZW-)zijde van het Grote " +
        "Vierkant van Pegasus ver naar het zuiden om hem te bereiken. Vrije zuidelijke horizon " +
        "nodig; blote oog."
    },
    {
      id: "m3", name: "Bolhoop M3", designation: "M3 / NGC 5272",
      type: "Bolvormige sterrenhoop", constellation: "Jachthonden", mag: 6.2, ra: 13.703, dec: 28.378,
      link: W + "Messier_3",
      howToFind:
        "Ongeveer halverwege Arcturus en Cor Caroli (de heldere ster van de Jachthonden), " +
        "iets dichter bij Cor Caroli. Een verrekijker toont een ronde, heldere gloed; een " +
        "telescoop lost een prachtige, dichte zwerm sterren op, een van de mooiste bolhopen " +
        "van het voorjaar."
    }
  ];

  // --- Planeten (posities live berekend) ----------------------------------
  // body: moet overeenkomen met een Astronomy.Body-lidnaam.
  // baseMag is een typische waarde (planeten variëren); alleen gebruikt voor
  // sorteren/uitrustingshints.
  const PLANETS = [
    {
      id: "venus", name: "Venus", body: "Venus", type: "Planeet",
      baseMag: -4.0, color: "#fff2c4", link: W + "Venus_(planeet)",
      howToFind:
        "De helderste 'ster' van allemaal - een verblindend, constant, wit licht. Als 'binnenste' " +
        "planeet dwaalt ze nooit ver van de Zon af: kijk laag in het westen na zonsondergang " +
        "(avondster) of laag in het oosten vóór zonsopgang (morgenster). Blote oog; een " +
        "verrekijker toont haar fase (een klein sikkel- of bolvormig schijfje).",
      twilight: true
    },
    {
      id: "jupiter", name: "Jupiter", body: "Jupiter", type: "Planeet",
      baseMag: -2.5, color: "#ffe2b0", link: W + "Jupiter_(planeet)",
      howToFind:
        "Een zeer helder, constant cremekleurig licht, elke ster overstralend. Zijn vier " +
        "Galileïsche manen staan in een verrekijker of telescoop op een rijtje aan weerszijden; " +
        "een kleine telescoop toont zijn equatoriale wolkenbanden.",
      gear: "Verrekijker / kleine telescoop (manen & banden)"
    },
    {
      id: "saturn", name: "Saturnus", body: "Saturn", type: "Planeet",
      baseMag: 0.5, color: "#f4e6b8", link: W + "Saturnus_(planeet)",
      howToFind:
        "Een constante, bleekgele, matig heldere 'ster' die met een vast licht schijnt " +
        "(hij fonkelt weinig). Een telescoop bij ~30x of meer onthult de iconische ringen; " +
        "een verrekijker suggereert slechts een uitgerekte vorm.",
      gear: "Kleine telescoop (ringen)"
    },
    {
      id: "mars", name: "Mars", body: "Mars", type: "Planeet",
      baseMag: -1.0, color: "#ff9a6b", link: W + "Mars_(planeet)",
      howToFind:
        "Herkenbaar aan zijn kenmerkende oranje-rode tint. Zijn helderheid en positie " +
        "veranderen veel over weken; nabij oppositie wordt hij erg helder. Blote oog; een " +
        "telescoop bij hoge vergroting toont soms zijn kleine schijf en poolkap."
    },
    {
      id: "mercury", name: "Mercurius", body: "Mercury", type: "Planeet",
      baseMag: -0.4, color: "#dcdcdc", link: W + "Mercurius_(planeet)",
      howToFind:
        "Altijd laag in de schemering, dicht bij de Zon. Kijk net boven de westelijke horizon " +
        "kort na zonsondergang (avondappositie) of boven de oostelijke horizon net voor " +
        "zonsopgang. Nooit ver van de zonneglans, dus een vrije horizon en een verrekijker " +
        "helpen. Blote oog bij goede schemering, maar lastig te vinden.",
      twilight: true
    },
    {
      id: "uranus", name: "Uranus", body: "Uranus", type: "Planeet",
      baseMag: 5.8, color: "#bde2e0", link: W + "Uranus_(planeet)",
      howToFind:
        "Een flauwe blauwgroene 'ster', op een zeer donkere nacht technisch met het blote oog " +
        "zichtbaar, maar meestal is een verrekijker nodig. Ziet er in een telescoop uit als een " +
        "klein schijfje. Gebruik zijn positie (op de kaart) om hem tussen de flauwe " +
        "achtergrondsterren te vinden.",
      gear: "Verrekijker / kleine telescoop"
    },
    {
      id: "neptune", name: "Neptunus", body: "Neptune", type: "Planeet",
      baseMag: 7.8, color: "#5b8cff", link: W + "Neptunus_(planeet)",
      howToFind:
        "Buiten bereik van het blote oog; heeft minstens een verrekijker en een telescoop " +
        "nodig om zijn kleine blauwe schijf te zien. Gebruik de positie en tijd op de kaart en " +
        "een sterrenkaart om hem te localiseren tussen de flauwe sterren van zijn huidige " +
        "sterrenbeeld.",
      gear: "Telescoop"
    }
  ];

  const TYPES = ["Alle", "Ster", "Planeet", "Sterrenstelsel", "Nevel", "Open sterrenhoop", "Bolvormige sterrenhoop", "Planetaire nevel", "Dubbelster"];

  global.Catalog = { OBJECTS: OBJECTS, PLANETS: PLANETS, TYPES: TYPES };
})(window);
