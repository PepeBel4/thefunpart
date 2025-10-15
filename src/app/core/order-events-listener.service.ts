import { Injectable, OnDestroy } from '@angular/core';
import mqtt, { IClientOptions, MqttClient } from 'mqtt';
import { environment } from '../../environments/environment';

type MqttConfig = {
  host: string;
  port: number;
  topic: string;
  ssl?: boolean;
  keepAlive?: number;
  username?: string | null;
  password?: string | null;
};

@Injectable({ providedIn: 'root' })
export class OrderEventsListenerService implements OnDestroy {
  private client?: MqttClient;

  constructor() {
    this.initialiseClient();
  }

  ngOnDestroy(): void {
    this.client?.end(true);
  }

  private initialiseClient(): void {
    const config = environment.mqtt as MqttConfig | undefined;

    if (!config?.host || !config?.topic) {
      console.warn('[MQTT] Missing MQTT configuration. Skipping order event listener.');
      return;
    }

    const url = this.buildUrl(config);
    const options = this.buildOptions(config);

    try {
      this.client = mqtt.connect(url, options);
    } catch (error) {
      console.error('[MQTT] Failed to initialise client', error);
      return;
    }

    this.registerEventHandlers(config.topic);
  }

  private buildUrl(config: MqttConfig): string {
    const protocol = config.ssl ? 'wss' : 'ws';
    return `${protocol}://${config.host}:${config.port ?? 1883}`;
  }

  private buildOptions(config: MqttConfig): IClientOptions {
    const options: IClientOptions = {
      keepalive: config.keepAlive ?? 15,
    };

    if (config.username) {
      options.username = config.username;
    }

    if (config.password) {
      options.password = config.password;
    }

    return options;
  }

  private registerEventHandlers(topic: string): void {
    if (!this.client) {
      return;
    }

    this.client.on('connect', () => {
      console.info('[MQTT] Connected to broker. Subscribing to order events.');
      this.client?.subscribe(topic, (error, granted) => {
        if (error) {
          console.error(`[MQTT] Failed to subscribe to topic "${topic}"`, error);
        } else {
          console.info(`[MQTT] Listening for order events on topic "${topic}".`, granted);
        }
      });
    });

    this.client.on('message', (receivedTopic, payload) => {
      if (receivedTopic === topic) {
        const raw = payload.toString();
        try {
          const message = JSON.parse(raw);
          console.info('[MQTT] Order event received:', message);
        } catch (error) {
          console.info('[MQTT] Order event received (raw):', raw);
        }
      }
    });

    this.client.on('error', error => {
      console.error('[MQTT] Connection error', error);
    });

    this.client.on('reconnect', () => {
      console.info('[MQTT] Attempting to reconnect...');
    });

    this.client.on('close', () => {
      console.info('[MQTT] Connection closed.');
    });
  }
}
