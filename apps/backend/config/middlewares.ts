module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      origin: [
        'http://localhost:3000',           // Webbutik
        'http://localhost:8081',           // Expo web
        'http://192.168.1.25:8081',        // Expo Go mobil (ändra till din dators ip)
        'exp://192.168.1.25:8081',         // Expo Go (Android/iOS) ( ändra till din dators ip)
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      headers: '*',
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public', 
];

