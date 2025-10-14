import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
import { authInterceptor } from './app/core/auth.interceptor';
import 'zone.js'; // Required unless you enable experimental zoneless mode

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor]))
  ]
}).catch(err => console.error(err));