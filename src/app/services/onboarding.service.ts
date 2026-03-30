import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  setupReviewed = signal(false);
  checklistDismissed = signal(false);
  connectorsAdded = signal(false);
  hostedAppsConfigured = signal(false);
}
