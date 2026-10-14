/**
 * During development (`npm start`) the app runs on port 4200 and calls the backend on 8081.
 * When Spring Boot serves the built app (build-and-run.sh), API calls go to the same address.
 */
const devServer = typeof window !== 'undefined' && window.location.port === '4200';

export const environment = {
  apiUrl: devServer ? 'http://localhost:8081' : '',
  currency: 'EUR',
};
