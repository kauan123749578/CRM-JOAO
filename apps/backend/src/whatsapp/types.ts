export type InstanceStatus =
  | 'idle'
  | 'connecting'
  | 'qr'
  | 'authenticated'
  | 'ready'
  | 'disconnected'
  | 'error';

export type StatusPayload = {
  instanceId: string;
  status: InstanceStatus;
  message?: string;
};




