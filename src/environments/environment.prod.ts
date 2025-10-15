export const environment = {
  production: true,
  apiBaseUrl: 'https://YOUR-PROD-RAILS-HOST/api/v1',
  useCookieSession: true,
  mqtt: {
    host: 'YOUR-PROD-MQTT-HOST',
    port: 1883,
    topic: 'orders/created',
    ssl: true,
    keepAlive: 15,
  },
};
