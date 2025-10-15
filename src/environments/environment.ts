export const environment = {
  production: false,
  apiBaseUrl: '/api/v1',
  // If your Rails API uses cookie sessions (Devise default), keep tokens null and rely on withCredentials
  useCookieSession: true,
  mqtt: {
    host: 'localhost',
    port: 1883,
    topic: 'orders/created',
    ssl: false,
    keepAlive: 15,
  },
};
