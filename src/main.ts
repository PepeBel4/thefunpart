import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { LOCALE_ID } from '@angular/core';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeNl from '@angular/common/locales/nl';
import localeFr from '@angular/common/locales/fr';
import localeDe from '@angular/common/locales/de';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
import { authInterceptor } from './app/core/auth.interceptor';
import { TranslationService } from './app/core/translation.service';
import 'zone.js'; // Required unless you enable experimental zoneless mode

registerLocaleData(localeNl);
registerLocaleData(localeFr);
registerLocaleData(localeDe);

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    {
      provide: LOCALE_ID,
      deps: [TranslationService],
      useFactory: (i18n: TranslationService) => i18n.currentLocale(),
    },
  ]
}).catch(err => console.error(err));