import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { jwtInterceptor } from './app/interceptors/jwt.interceptor';
import { routes } from './app/app.routes';
import { App } from './app/app';
import { httpErrorInterceptor } from './app/interceptors/http-error.interceptor';


bootstrapApplication(App, {
  providers: [
    provideHttpClient(
      withInterceptors([jwtInterceptor, httpErrorInterceptor]) // ✅ Add the JWT interceptor here
    ),
    provideRouter(routes),
    provideAnimations(), // ✅ REQUIRED
  ]
}).catch(err => console.error(err));
