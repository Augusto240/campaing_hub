import type { Server as SocketServer } from 'socket.io';

let ioInstance: SocketServer | null = null;

export const setSocketServer = (io: SocketServer): void => {
  ioInstance = io;
};

export const getSocketServer = (): SocketServer | null => {
  return ioInstance;
};

export const emitCampaignEvent = <TPayload>(campaignId: string, event: string, payload: TPayload): void => {
  ioInstance?.to(`campaign:${campaignId}`).emit(event, payload);
};
