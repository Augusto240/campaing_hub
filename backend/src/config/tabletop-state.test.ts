declare const describe: any;
declare const expect: any;
declare const it: any;

import {
  buildNextTabletopState,
  createInitialTabletopState,
  sanitizeFogState,
  sanitizeLights,
  sanitizeTokens,
} from './tabletop-state';

describe('tabletop-state', () => {
  it('sanitiza tokens para limites seguros', () => {
    const tokens = sanitizeTokens([
      {
        id: 'token-1',
        label: 'Token de Teste',
        x: 9000,
        y: -50,
        color: '#ffffff',
        size: 400,
      },
    ]);

    expect(tokens[0].x).toBe(5000);
    expect(tokens[0].y).toBe(0);
    expect(tokens[0].size).toBe(160);
  });

  it('sanitiza fog removendo chaves invalidas e limitando opacidade', () => {
    const fog = sanitizeFogState({
      cellSize: 999,
      opacity: 2,
      maskedCells: ['1:1', '2:2', 'x:y', '2:2'],
    });

    expect(fog.cellSize).toBe(120);
    expect(fog.opacity).toBe(0.95);
    expect(fog.maskedCells).toEqual(['1:1', '2:2']);
  });

  it('sanitiza fontes de luz respeitando faixa e limite de quantidade', () => {
    const lights = sanitizeLights([
      {
        id: 'light-1',
        x: 20,
        y: 30,
        radius: 5000,
        intensity: 5,
        color: '#fff9d0',
      },
    ]);

    expect(lights[0].radius).toBe(1200);
    expect(lights[0].intensity).toBe(1);
  });

  it('monta proximo estado mesclando patch e preservando dados anteriores', () => {
    const initial = createInitialTabletopState('user-1');
    const next = buildNextTabletopState(
      {
        ...initial,
        mapImageUrl: 'https://mapa.test/1.jpg',
      },
      {
        fog: {
          maskedCells: ['10:20'],
        },
        lights: [
          {
            id: 'l1',
            x: 100,
            y: 100,
            radius: 220,
            intensity: 0.7,
            color: '#ffefb0',
          },
        ],
      },
      'user-2'
    );

    expect(next.mapImageUrl).toBe('https://mapa.test/1.jpg');
    expect(next.fog.maskedCells).toEqual(['10:20']);
    expect(next.lights).toHaveLength(1);
    expect(next.updatedBy).toBe('user-2');
  });
});
