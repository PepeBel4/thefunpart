# Thefunpart

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

### Testing service worker and push locally

Service workers (and therefore web push notifications) are only enabled for production builds. To exercise push flows locally you can run the development server in production mode:

```bash
ng serve --configuration production
```

Angular will still serve the app on `http://localhost:4200/`, but the build uses production optimisations and registers the service worker so that the push APIs become available.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Web push configuration

1. Generate a pair of VAPID keys (public/private). You can do this with the [web-push](https://github.com/web-push-libs/web-push) CLI:

   ```bash
   npx web-push generate-vapid-keys
   ```

2. Store the public key in both `src/environments/environment.ts` and `src/environments/environment.prod.ts` under the `webPushPublicKey` property. The private key must be configured on the Rails API so that it can sign outbound notifications.

3. Implement a `POST /push_subscriptions` endpoint in the Rails API that persists the subscription JSON sent by the frontend. Your backend can then trigger web push messages using the saved subscription and private VAPID key.

4. After starting the Angular app (with the service worker enabled), accept the cookie banner to trigger a permission prompt for notifications. Once granted you can send a test notification by calling your Rails endpoint that pushes a payload to the stored subscription.
