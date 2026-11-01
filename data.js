// Single source of truth for the hub. Add a map = add an object to a city's `maps`.
// `embed: false` = open in a new tab instead of the in-hub viewer.
// coords are [lng, lat]. `approx: true` marks a placeholder position to confirm.
window.HUB_DATA = [
  {
    id: 'egypt',
    name: 'Egypt',
    flag: 'flags/eg.svg',
    coords: [30.8, 27.8], // a bit north of centre: leaves room above Cairo for the stacked pins
    zoom: 5.0,
    cities: [
      {
        id: 'new-cairo',
        name: 'New Cairo',
        coords: [31.535375763827087, 30.07050340878381],
        zoom: 11.5,
        maps: [
          {
            id: 'zomra',
            name: 'Zomra',
            url: 'https://zomra.opetstudios.com',
            logo: 'logo-zomra.png', // pin icon; omit to use the default square pin
            desc: 'Interactive master plan for Zomra, New Cairo.'
          }
        ]
      },
      {
        id: 'giza',
        name: 'Giza',
        coords: [30.980482696788137, 29.904109387670417],
        zoom: 11.5,
        maps: [
          {
            id: 'west-gate',
            name: 'West Gate',
            url: 'https://west-gate-map.vercel.app',
            logo: 'logo-westgate.png', // site's frame-ancestors allows the hub's two addresses (West_Gate_Map vercel.json)
            desc: 'Interactive master plan for West Gate, Giza.'
          }
        ]
      }
    ]
  },
  {
    id: 'oman',
    name: 'Oman',
    flag: 'flags/om.svg',
    coords: [56.0, 21.5],
    zoom: 5.2,
    cities: [
      {
        id: 'muscat',
        name: 'Muscat',
        coords: [58.08712975962861, 23.65533624589275],
        zoom: 11.5,
        maps: [
          {
            id: 'hay-wafa',
            name: 'Hay Al Wafa',
            url: 'https://hay.wafa.opetstudios.com',
            logo: 'logo-hay-wafa.png',
            desc: 'Interactive map for Hay Al Wafa, Oman.'
          }
        ]
      }
    ]
  },
  {
    id: 'saudi-arabia',
    name: 'Saudi Arabia',
    flag: 'flags/sa.svg',
    coords: [44.0, 21.0],
    zoom: 4.4,
    cities: [
      {
        id: 'jazan',
        name: 'Jazan',
        coords: [42.571116733954085, 16.88780007443737],
        zoom: 11.5,
        maps: [
          {
            id: 'factories',
            name: 'SIIVC',
            url: 'https://factoriesmap.opetstudios.com',
            logo: 'logo-siiv.png',
            desc: 'Interactive factories map for Jazan, Saudi Arabia.'
          }
        ]
      }
    ]
  }
];
