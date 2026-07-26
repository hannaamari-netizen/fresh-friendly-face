export type PushSyncPayload = {
  deviceToken: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
  offsetMinutes: number;
  messageTemplate: string;
  title?: string;
  calcMethod?: number;
};
