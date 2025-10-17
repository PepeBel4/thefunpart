import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { environment } from '../../environments/environment';

interface PushPermissionState {
  permission: NotificationPermission;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class PushNotificationsService {
  private readonly storageKey = 'thefunpart:push-permission';

  constructor(private readonly swPush: SwPush, private readonly api: ApiService) {}

  async initialize(): Promise<void> {
    if (!this.canUsePush()) {
      return;
    }

    if (Notification.permission !== 'granted') {
      return;
    }

    await this.syncSubscription();
  }

  async requestSubscription(): Promise<boolean> {
    if (!this.canUsePush()) {
      return false;
    }

    if (!environment.webPushPublicKey) {
      console.warn('Push notifications are not configured. Missing VAPID public key.');
      return false;
    }

    try {
      const existing = await firstValueFrom(this.swPush.subscription);
      if (existing) {
        await this.sendSubscription(existing);
        this.persistPermission('granted');
        return true;
      }

      if (Notification.permission !== 'granted') {
        const result = await Notification.requestPermission();
        this.persistPermission(result);

        if (result !== 'granted') {
          return false;
        }
      }

      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: environment.webPushPublicKey,
      });

      await this.sendSubscription(subscription);
      this.persistPermission('granted');
      return true;
    } catch (error) {
      console.error('Unable to subscribe to push notifications', error);
      return false;
    }
  }

  private async syncSubscription(): Promise<void> {
    try {
      const existing = await firstValueFrom(this.swPush.subscription);
      if (!existing) {
        return;
      }

      await this.sendSubscription(existing);
    } catch (error) {
      console.warn('Unable to synchronise existing push subscription', error);
    }
  }

  private async sendSubscription(subscription: PushSubscription): Promise<void> {
    const payload = subscription.toJSON();
    await firstValueFrom(this.api.post('/push_subscriptions', payload));
  }

  private canUsePush(): boolean {
    return (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      this.swPush.isEnabled
    );
  }

  private persistPermission(permission: NotificationPermission): void {
    try {
      const value: PushPermissionState = {
        permission,
        timestamp: Date.now(),
      };
      window.localStorage.setItem(this.storageKey, JSON.stringify(value));
    } catch (error) {
      console.warn('Could not persist push permission state', error);
    }
  }
}
