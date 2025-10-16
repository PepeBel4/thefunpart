export const environment = {
  production: true,
  apiBaseUrl: 'https://YOUR-PROD-RAILS-HOST/api/v1',
  useCookieSession: true,
  mqtt: {
    url: 'wss://YOUR-PROD-MQTT-HOST/mqtt',
    topic: 'orders/created',
    ssl: true,
    keepAlive: 15,
  },
};
