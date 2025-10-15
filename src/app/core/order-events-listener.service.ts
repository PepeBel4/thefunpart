import { Injectable, OnDestroy } from '@angular/core';
import { connect } from 'mqtt/dist/mqtt';
import type { IClientOptions, ISubscriptionGrant, MqttClient } from 'mqtt';
import { environment } from '../../environments/environment';

type MqttConfig = {
  host?: string;
  port?: number;
  topic: string;
  ssl?: boolean;
  keepAlive?: number;
  username?: string | null;
  password?: string | null;
  url?: string;
  path?: string;
  protocol?: 'ws' | 'wss';
};

@Injectable({ providedIn: 'root' })
export class OrderEventsListenerService implements OnDestroy {
  private client?: MqttClient;
  private decoder?: TextDecoder;

  constructor() {
    if (typeof TextDecoder !== 'undefined') {
      this.decoder = new TextDecoder();
    }
    this.initialiseClient();
  }

  ngOnDestroy(): void {
    this.client?.end(true);
  }

  private initialiseClient(): void {
    const config = environment.mqtt as MqttConfig | undefined;

    if (!config?.topic || (!config.url && !config.host)) {
      console.warn('[MQTT] Missing MQTT configuration. Skipping order event listener.');
      return;
    }

    const url = this.buildUrl(config);
    const options = this.buildOptions(config);

    if (!config.url && (config.port === 1883 || (!config.port && config.host))) {
      console.warn(
        '[MQTT] The configured port is 1883, which is typically reserved for raw TCP connections. '
          + 'Browsers require the broker to expose a WebSocket listener (e.g. ws://host:9001/mqtt). '
          + 'If the connection fails, adjust the broker configuration or provide a websocket URL via environment.mqtt.url.'
      );
    }

    try {
      this.client = connect(url, options);
    } catch (error) {
      console.error('[MQTT] Failed to initialise client', error);
      return;
    }

    this.registerEventHandlers(config.topic, config);
  }

  private buildUrl(config: MqttConfig): string {
    if (config.url) {
      return config.url;
    }

    const protocol = config.protocol ?? (config.ssl ? 'wss' : 'ws');
    const host = config.host ?? 'localhost';
    const portSegment = config.port ? `:${config.port}` : '';
    const pathSegment = config.path ? `/${config.path.replace(/^\/+/, '')}` : '';

    return `${protocol}://${host}${portSegment}${pathSegment}`;
  }

  private buildOptions(config: MqttConfig): IClientOptions {
    const options: IClientOptions = {
      keepalive: config.keepAlive ?? 15,
      reconnectPeriod: 5000,
    };

    if (config.username) {
      options.username = config.username;
    }

    if (config.password) {
      options.password = config.password;
    }

    return options;
  }

  private registerEventHandlers(topic: string, config: MqttConfig): void {
    if (!this.client) {
      return;
    }

    this.client.on('connect', () => {
      console.info('[MQTT] Connected to broker. Subscribing to order events.');
      this.client?.subscribe(topic, (error: Error | null, granted: ISubscriptionGrant[] | undefined) => {
        if (error) {
          console.error(`[MQTT] Failed to subscribe to topic "${topic}"`, error);
        } else {
          console.info(`[MQTT] Listening for order events on topic "${topic}".`, granted);
        }
      });
    });

    this.client.on('message', (receivedTopic: string, payload: Uint8Array) => {
      if (receivedTopic === topic) {
        const raw = this.decodePayload(payload);
        try {
          const message = JSON.parse(raw);
          console.info('[MQTT] Order event received:', message);
        } catch (error) {
          console.info('[MQTT] Order event received (raw):', raw);
        }
      }
    });

    this.client.on('error', (error: Error) => {
      console.error('[MQTT] Connection error', error);
      if (!config.url && config.port === 1883) {
        console.info(
          '[MQTT] Tip: Port 1883 only accepts raw TCP by default. Ensure the broker exposes a WebSocket endpoint and update environment.mqtt.url if needed.'
        );
      }
    });

    this.client.on('reconnect', () => {
      console.info('[MQTT] Attempting to reconnect...');
    });

    this.client.on('close', () => {
      console.info('[MQTT] Connection closed.');
    });
  }

  private decodePayload(payload: Uint8Array): string {
    if (this.decoder) {
      try {
        return this.decoder.decode(payload);
      } catch (error) {
        console.debug('[MQTT] Failed to decode payload with TextDecoder', error);
      }
    }

    const bufferCtor = (globalThis as typeof globalThis & {
      Buffer?: { from(data: Uint8Array): { toString(): string } };
    }).Buffer;

    if (bufferCtor) {
      try {
        return bufferCtor.from(payload).toString();
      } catch (error) {
        console.debug('[MQTT] Failed to decode payload with Buffer.from()', error);
      }
    }

    return Array.from(payload)
      .map(byte => String.fromCharCode(byte))
      .join('');
  }
}
