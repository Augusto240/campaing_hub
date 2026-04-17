export type CampaignSocketErrorCode =
  | 'CAMPAIGN_FORBIDDEN'
  | 'GM_REQUIRED'
  | 'INVALID_PAYLOAD';

export interface CampaignJoinedEvent {
  campaignId: string;
  isGM: boolean;
}

export interface CampaignSocketErrorEvent {
  campaignId?: string;
  code: CampaignSocketErrorCode;
  message: string;
}

export interface CampaignRealtimeAccessState {
  joined: boolean;
  isGM: boolean;
  lastError: CampaignSocketErrorEvent | null;
}

export const createInitialCampaignRealtimeAccessState = (): CampaignRealtimeAccessState => ({
  joined: false,
  isGM: false,
  lastError: null,
});

export const applyCampaignJoinedEvent = (
  state: CampaignRealtimeAccessState,
  campaignId: string,
  event: CampaignJoinedEvent
): CampaignRealtimeAccessState => {
  if (event.campaignId !== campaignId) {
    return state;
  }

  return {
    joined: true,
    isGM: event.isGM,
    lastError: null,
  };
};

export const applyCampaignErrorEvent = (
  state: CampaignRealtimeAccessState,
  campaignId: string,
  event: CampaignSocketErrorEvent
): CampaignRealtimeAccessState => {
  if (event.campaignId && event.campaignId !== campaignId) {
    return state;
  }

  if (event.code === 'INVALID_PAYLOAD') {
    return {
      ...state,
      lastError: event,
    };
  }

  return {
    joined: event.code === 'GM_REQUIRED' ? state.joined : false,
    isGM: false,
    lastError: event,
  };
};

export const canManageCampaignRealtime = (
  state: CampaignRealtimeAccessState
): boolean => {
  return state.joined && state.isGM;
};
