// Single source of truth for the hub. Add a map = add an object to a city's `maps`.
// `embed: false` = open in a new tab instead of the in-hub viewer.
// coords are [lng, lat]. `approx: true` marks a placeholder position to confirm.
// `boundary` = the project's outline, drawn with draw.html, traced when the project is opened.
window.HUB_ANIMATION = { flySeconds: 3, lineSeconds: 4 };

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
            desc: 'Interactive master plan for Zomra, New Cairo.',
            boundary: [[31.531461,30.084053],[31.526545,30.068192],[31.536027,30.061441],[31.537258,30.062433],[31.537682,30.063682],[31.538064,30.065004],[31.53921,30.066143],[31.539634,30.068603],[31.539125,30.07088],[31.538931,30.074909],[31.538623,30.079117],[31.537985,30.081755],[31.536863,30.084211]]
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
            desc: 'Interactive master plan for West Gate, Giza.',
            boundary: [[30.982737,29.903299],[30.981437,29.903921],[30.980442,29.904376],[30.979519,29.90462],[30.977929,29.904778],[30.978522,29.903046],[30.978716,29.902206],[30.978776,29.901827],[30.978869,29.901352],[30.978978,29.900523],[30.980258,29.900708],[30.980792,29.900909],[30.981342,29.901203],[30.981823,29.901623],[30.982226,29.902061]]
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
            desc: 'Interactive map for Hay Al Wafa, Oman.',
            boundary: [[58.078009,23.652588],[58.080253,23.652345],[58.083936,23.652053],[58.08899,23.65043],[58.091977,23.656984],[58.089158,23.658002],[58.086166,23.658699],[58.083166,23.658919],[58.080521,23.658599]]
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
        coords: [42.548642, 16.892992],
        zoom: 11.5,
        maps: [
          {
            id: 'factories',
            name: 'SIIVC',
            url: 'https://factoriesmap.opetstudios.com',
            logo: 'logo-siiv.png',
            desc: 'Interactive factories map for Jazan, Saudi Arabia.',
            boundary: [[42.547007,16.891528],[42.546793,16.892466],[42.546642,16.89341],[42.546571,16.894375],[42.546922,16.895314],[42.549663,16.894687],[42.55026,16.894234],[42.550644,16.89355],[42.550549,16.890962],[42.550115,16.890656],[42.549523,16.890733],[42.54829,16.891222]]
          }
        ]
      }
    ]
  }
];
