/* =========================================================
   VALIER — productcatalogus, prijsregels en aanvraagstatussen.
   Alles wat de configurator aanbiedt staat hier, op één plek.
   Iets toevoegen of uitzetten = alleen dit bestand aanpassen.
   ========================================================= */

/* Traptypen. `turn`: draairichting kiesbaar. `custom`: maatwerk, geen standaardmodel. */
export const STAIR_TYPES = [
  { id: 'recht', name: 'Rechte trap', turn: false },
  { id: 'kwart', name: 'Kwarttrap', turn: true },
  { id: 'halfdraai', name: 'Halve draaitrap', turn: true },
  { id: 'dubbelkwart', name: 'Dubbele kwarttrap', turn: true },
  { id: 'bordes', name: 'Trap met bordes', turn: true },
  { id: 'anders', name: 'Andere trap', turn: false, custom: true }
];

/* Leverbare profielen (VALIER): rechthoekige koker rechtop gemonteerd, of rond.
   w = breedte vanaf de muur, h = hoogte, d = diameter (mm). Vierkant: voeg hier toe zodra leverbaar. */
export const PROFILE_FORMS = [
  { id: 'rechthoekig', name: 'Rechthoekig', sizes: [
    { id: '50x30', name: '50 × 30 mm', w: 30, h: 50 },
    { id: '50x20', name: '50 × 20 mm', w: 20, h: 50 }
  ] },
  { id: 'rond', name: 'Rond', sizes: [
    { id: 'r50', name: 'Ø 50 mm', d: 50 }
  ] }
];

/* Kleuren. `ral` alleen invullen als de code bevestigd is. `custom`: kleur op aanvraag. */
export const COLORS = [
  { id: 'zwart', name: 'Mat zwart', ral: null, hex: '#161616', metalness: 0.3, roughness: 0.55 },
  { id: 'goud', name: 'Goud', ral: null, hex: '#8c7650', metalness: 0.7, roughness: 0.42, swatch: 'linear-gradient(135deg,#b8a274,#7a6642)' },
  { id: 'wit', name: 'Wit', ral: null, hex: '#eeece7', metalness: 0.05, roughness: 0.5 },
  { id: 'beige', name: 'Zandbeige', ral: null, hex: '#b9a88c', metalness: 0.1, roughness: 0.55 },
  { id: 'ral', name: 'Andere RAL-kleur', custom: true, hex: '#9a958c', metalness: 0.2, roughness: 0.5 }
];

/* Bevestiging: VALIER levert standaard de haakse wandhouder met vierkante wandplaat. */
export const MOUNTING = { id: 'wandhouder', name: 'Wandhouders, haaks met vierkante wandplaat' };

export const DELIVERY = [
  { id: 'montage', name: 'Montage door VALIER', sub: 'Wij monteren bij je thuis' },
  { id: 'bezorgen', name: 'Bezorgen', sub: 'Wij brengen de leuningen' },
  { id: 'afhalen', name: 'Afhalen', sub: 'In onze werkplaats in Ulft' }
];

/* Lengtes per leuning (mm). */
export const LIMITS = { minMm: 300, maxMm: 6000, warnDeviation: 0.35 };

/* Prijsregels. De klant ziet nooit deze bedragen, alleen een totaal (als `showToCustomer`).
   Een regel met `null` = onbekend → die configuratie krijgt "Prijs op aanvraag". */
export const PRICING = {
  showToCustomer: true,       // false = de klant ziet geen prijs, alleen jij in de aanvraag
  inclBtw: true,              // bedragen hieronder zijn inclusief btw
  btw: 0.21,
  perMeter: 85,               // leuning, per meter
  profileSurcharge: { '50x30': 0, '50x20': 0, r50: 0 },   // extra per meter
  colorSurcharge: { zwart: 0, goud: 0, wit: 0, beige: 0, ral: null },  // null = op aanvraag
  delivery: {
    afhalen: { base: 0, perKm: 0, perRail: 0 },
    bezorgen: { base: 0, perKm: 1, perRail: 0 },
    montage: { base: 0, perKm: 1, perRail: 35 }
  },
  retour: false,              // true = kilometers heen en terug
  workshop: { postcode: '7071', plaats: 'Ulft' },
  roadFactor: 1.25            // hemelsbreed × 1,25 ≈ afstand over de weg
};

/* Statussen van een aanvraag (voor later beheer / dashboard). */
export const STATUSES = ['concept', 'ingediend', 'technische-controle', 'aanvulling-nodig', 'offerte-verzonden', 'akkoord', 'in-productie', 'gereed', 'geleverd'];

export const QUOTE = {
  email: 'info@valier.nl',
  endpoint: 'https://formsubmit.co/info@valier.nl',   // gewoon formulier (ondersteunt foto-bijlagen)
  maxPhotos: 6,
  maxTotalBytes: 10 * 1024 * 1024,
  photoTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
};

/* Projectfoto's (voor de lichtbak "Alle projecten"). */
export const PHOTOS = [
{
"id": "leuning-diagonaal",
"alt": "Mat zwarte vierkante wandleuning langs een trap met LED-verlichting",
"cap": "Eén doorlopende lijn"
},
{
"id": "goud-boven",
"alt": "Gouden vierkante wandleuning boven een draaiende trap met eiken treden",
"cap": "Goud · van boven"
},
{
"id": "avondlicht-zwart",
"alt": "Mat zwarte leuning met haakse houders langs een trap met zwarte treden, in warm avondlicht",
"cap": "Zwart · warm licht"
},
{
"id": "hoek-segmenten",
"alt": "Leuning in drie delen die de hoek van een kwartslagtrap volgen",
"cap": "Om de hoek, in delen"
},
{
"id": "goud-led",
"alt": "Gouden wandleuning langs een trap met LED-strips onder elke trede",
"cap": "Goud · met LED"
},
{
"id": "eindkap-plaat",
"alt": "Close-up van het vierkante uiteinde van de zwarte leuning met de wandplaat erachter",
"cap": "Detail · het profiel"
},
{
"id": "glas-recht",
"alt": "Rechte trap met vierkante wandleuning en een glazen balustrade in zwart stalen kader",
"cap": "Rechte trap · met glas"
},
{
"id": "led-trap",
"alt": "Twee zwarte wandleuningen in een trappenhuis met warme LED-verlichting",
"cap": "Mat zwart · avondlicht"
},
{
"id": "schakelaar-zwart",
"alt": "Zwarte leuningdelen om de hoek, naast een zwarte lichtschakelaar",
"cap": "Zwart op zwart"
},
{
"id": "houder-closeup",
"alt": "Close-up van de vierkante wandplaat en haakse houder onder de leuning",
"cap": "Detail · de houder"
},
{
"id": "wit-avond",
"alt": "Witte vierkante wandleuning langs een kwartslagtrap met eiken treden",
"cap": "Wit · kwartslag"
},
{
"id": "zwart-led",
"alt": "Mat zwarte wandleuning langs een trap met verlichte eiken treden",
"cap": "Mat zwart · LED-treden"
},
{
"id": "draaitrap-donker",
"alt": "Zwarte leuning boven een draaiende trap met donkere houten treden",
"cap": "Draaitrap · donker hout"
},
{
"id": "hoek-lijn",
"alt": "Twee zwarte leuningdelen die in de hoek van de muur op elkaar aansluiten",
"cap": "Twee delen, één lijn"
},
{
"id": "rond-kwartslag",
"alt": "Ronde zwarte wandleuning met vierkante wandplaten langs een kwartslagtrap",
"cap": "Rond profiel"
},
{
"id": "goud-hoek",
"alt": "Gouden leuningdelen met haakse houders bij de bocht van een trap",
"cap": "Goud · om de hoek"
},
{
"id": "rechte-trap-wit",
"alt": "Lange zwarte wandleuning met haakse houders langs een witte trap",
"cap": "Rechte lijn · wit"
},
{
"id": "drie-delen",
"alt": "Drie zwarte leuningdelen rond de bocht van een witte trap, van boven gezien",
"cap": "Drie delen · van boven"
},
{
"id": "hoek-licht",
"alt": "Twee zwarte leuningdelen in de hoek van een trappenhuis met daglicht",
"cap": "Hoek · daglicht"
},
{
"id": "leuning-goud",
"alt": "Gouden wandleuning naast een trap met LED-traptreden",
"cap": "Goud"
},
{
"id": "led-twee-delen",
"alt": "Twee zwarte leuningdelen bij een trap met donkere treden en LED-verlichting",
"cap": "Twee delen · LED"
},
{
"id": "trappenhuis-boven",
"alt": "Trappenhuis van boven gezien met zwarte leuningdelen langs de muur",
"cap": "Trappenhuis · van boven"
},
{
"id": "glas-overloop",
"alt": "Overloop met glazen balustrades in zwart stalen kader en een wandleuning",
"cap": "Overloop · glas en staal"
},
{
"id": "houder-onder",
"alt": "Kort zwart leuningdeel met twee haakse houders, van onderaf gezien",
"cap": "Detail · van onderaf"
},
{
"id": "hoek-avond",
"alt": "Leuningdelen in de hoek van een trap met donkere treden, in avondlicht",
"cap": "Hoek · avondlicht"
},
{
"id": "hoek-led",
"alt": "Zwarte leuningdelen bij de bocht van een trap met LED-verlichting",
"cap": "Hoek · met LED"
},
{
"id": "wit-hoek",
"alt": "Witte leuningdelen die de hoek van een trappenhuis volgen",
"cap": "Wit · om de hoek"
},
{
"id": "trapgat-boven",
"alt": "Trapgat van boven gezien met wandleuning en glazen balustrade",
"cap": "Trapgat · leuning en glas"
},
{
"id": "leuning-perspectief",
"alt": "De mat zwarte leuning in perspectief langs een witte muur",
"cap": "Strak tot het einde"
},
{
"id": "lange-lijn",
"alt": "Lange mat zwarte leuning langs een trap met lichte houten treden",
"cap": "Eén lange lijn"
},
{
"id": "kwartslag-wit-boven",
"alt": "Witte kwartslagtrap van boven met zwarte leuningdelen langs de muur",
"cap": "Kwartslag · overzicht"
},
{
"id": "hoek-detail",
"alt": "Twee leuningdelen die elkaar in de hoek van de muur ontmoeten",
"cap": "Detail · de hoek"
},
{
"id": "recht-licht",
"alt": "Zwarte leuningdelen op twee muren van een trappenhuis, in zacht daglicht",
"cap": "Twee muren · daglicht"
},
{
"id": "kort-recht",
"alt": "Kort zwart leuningdeel op twee wandhouders",
"cap": "Kort stuk · twee houders"
},
{
"id": "glas-hal",
"alt": "Kwartslagtrap met glazen balustrade en een zwarte wandleuning in de hal",
"cap": "Hal · glas en staal"
},
{
"id": "kwartslag-boven",
"alt": "Zwarte leuningdelen langs een witte kwartslagtrap, van boven gezien",
"cap": "Kwartslag"
},
{
"id": "houder-detail",
"alt": "Detail van de vierkante wandhouders onder de leuning",
"cap": "Detail · houders"
},
{
"id": "open-trap",
"alt": "Zwarte wandleuning langs een open trap met witte treden",
"cap": "Open trap"
},
{
"id": "eindkap-detail",
"alt": "Close-up van de vlakke eindkap van de leuning bij een hoek",
"cap": "Detail · eindkap"
},
{
"id": "glas-wenteltrap",
"alt": "Wenteltrap met glazen balustrade en wandleuning langs de muur",
"cap": "Wenteltrap · met glas"
},
{
"id": "wit-kwartslag",
"alt": "Zwarte vierkante leuning langs een witte kwartslagtrap, met een losse leuning bij de onderste treden",
"cap": "Kwartslag · wit"
},
{
"id": "hoek-eiken",
"alt": "Leuningdelen in de hoek boven eiken traptreden",
"cap": "Wenteltrap · eiken"
},
{
"id": "hoek-boven-wit",
"alt": "Leuningdelen in de bocht van een witte wenteltrap, van boven gezien",
"cap": "Bocht · van boven"
},
{
"id": "leuning-detail",
"alt": "Close-up van de mat zwarte leuning met LED-treden",
"cap": "Mat zwart"
},
{
"id": "opgang-eiken",
"alt": "Trap met eiken treden en een zwarte leuning, van onderaf gezien",
"cap": "Opgang"
}
];
