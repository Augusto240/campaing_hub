import {
  applyCampaignErrorEvent,
  applyCampaignJoinedEvent,
  createInitialCampaignRealtimeAccessState,
} from './realtime.types';

describe('realtime.types', () => {
  it('aplica join no estado da campanha correta', () => {
    const initialState = createInitialCampaignRealtimeAccessState();

    const nextState = applyCampaignJoinedEvent(initialState, 'campaign-1', {
      campaignId: 'campaign-1',
      isGM: true,
    });

    expect(nextState.joined).toBeTrue();
    expect(nextState.isGM).toBeTrue();
    expect(nextState.lastError).toBeNull();
  });

  it('preserva acesso de leitura ao receber GM_REQUIRED', () => {
    const joinedState = applyCampaignJoinedEvent(
      createInitialCampaignRealtimeAccessState(),
      'campaign-1',
      {
        campaignId: 'campaign-1',
        isGM: true,
      }
    );

    const nextState = applyCampaignErrorEvent(joinedState, 'campaign-1', {
      campaignId: 'campaign-1',
      code: 'GM_REQUIRED',
      message: 'Only the GM can mutate the tabletop state',
    });

    expect(nextState.joined).toBeTrue();
    expect(nextState.isGM).toBeFalse();
    expect(nextState.lastError?.code).toBe('GM_REQUIRED');
  });

  it('ignora eventos de outra campanha', () => {
    const initialState = createInitialCampaignRealtimeAccessState();

    const nextState = applyCampaignErrorEvent(initialState, 'campaign-1', {
      campaignId: 'campaign-2',
      code: 'CAMPAIGN_FORBIDDEN',
      message: 'Forbidden',
    });

    expect(nextState).toBe(initialState);
  });

  it('mantem o join quando recebe INVALID_PAYLOAD', () => {
    const joinedState = applyCampaignJoinedEvent(
      createInitialCampaignRealtimeAccessState(),
      'campaign-1',
      {
        campaignId: 'campaign-1',
        isGM: false,
      }
    );

    const nextState = applyCampaignErrorEvent(joinedState, 'campaign-1', {
      campaignId: 'campaign-1',
      code: 'INVALID_PAYLOAD',
      message: 'Payload invalido',
    });

    expect(nextState.joined).toBeTrue();
    expect(nextState.isGM).toBeFalse();
    expect(nextState.lastError?.code).toBe('INVALID_PAYLOAD');
  });
});
