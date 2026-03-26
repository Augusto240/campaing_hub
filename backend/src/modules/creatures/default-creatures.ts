type CreatureSeed = {
  name: string;
  creatureType: string;
  stats: Record<string, unknown>;
  abilities: Record<string, unknown>;
  loot?: Record<string, unknown>;
  xpReward?: number;
  description: string;
};

export const DEFAULT_CREATURES: Record<string, CreatureSeed[]> = {
  dnd5e: [
    {
      name: 'Goblin',
      creatureType: 'Humanoid',
      stats: { armorClass: 15, hp: 7, speed: '30 ft', attributes: { STR: 8, DEX: 14, CON: 10 } },
      abilities: { traits: ['Nimble Escape'], attacks: ['Scimitar', 'Shortbow'] },
      loot: { items: ['Scimitar', 'Shortbow'], gold: '1d6 gp' },
      xpReward: 50,
      description: 'Batedor oportunista e fragil, ideal para encontros de baixo nivel.',
    },
    {
      name: 'Orc',
      creatureType: 'Humanoid',
      stats: { armorClass: 13, hp: 15, speed: '30 ft', attributes: { STR: 16, DEX: 12, CON: 16 } },
      abilities: { traits: ['Aggressive'], attacks: ['Greataxe', 'Javelin'] },
      loot: { items: ['Greataxe', 'Javelins'], gold: '2d8 sp' },
      xpReward: 100,
      description: 'Tropa de choque brutal para encontros em estradas, cavernas ou ruinas.',
    },
    {
      name: 'Young Red Dragon',
      creatureType: 'Dragon',
      stats: { armorClass: 18, hp: 178, speed: '40 ft, fly 80 ft', attributes: { STR: 23, DEX: 10, CON: 21 } },
      abilities: { traits: ['Fire Breath', 'Legendary Presence'], attacks: ['Bite', 'Claw'] },
      loot: { hoard: true, gems: '4d10', gold: '6d100 gp' },
      xpReward: 5900,
      description: 'Predador apex para confrontos de grande escala e culminacao de arco.',
    },
    {
      name: 'Lich',
      creatureType: 'Undead',
      stats: { armorClass: 17, hp: 135, speed: '30 ft', attributes: { STR: 11, INT: 20, WIS: 14 } },
      abilities: { traits: ['Legendary Resistance', 'Paralyzing Touch'], spells: ['Finger of Death', 'Disintegrate'] },
      loot: { artifacts: ['Phylactery clues'], tomes: ['Necromancy grimoire'] },
      xpReward: 33000,
      description: 'Arqui-vilao necromante para finais de campanha.',
    },
  ],
  coc7e: [
    {
      name: 'Deep One',
      creatureType: 'Mythos Entity',
      stats: { hp: 13, movement: '8', attributes: { STR: 80, CON: 70, DEX: 50, POW: 60 } },
      abilities: { attacks: ['Claws 35%', 'Bite 25%'], sanityLoss: '0/1d6' },
      loot: { clues: ['marine relics', 'cult symbols'] },
      xpReward: 150,
      description: 'Hibrido anfibio ligado a cultos costeiros e horrores submersos.',
    },
    {
      name: 'Mi-Go',
      creatureType: 'Mythos Entity',
      stats: { hp: 10, movement: '9 / fly 12', attributes: { STR: 60, CON: 50, DEX: 70, POW: 65 } },
      abilities: { attacks: ['Claw 45%'], sanityLoss: '1/1d8', traits: ['Fungoid science'] },
      xpReward: 220,
      description: 'Cientistas alienigenas fungoides com tecnologia perturbadora.',
    },
    {
      name: 'Byakhee',
      creatureType: 'Mythos Entity',
      stats: { hp: 14, movement: '7 / fly 20', attributes: { STR: 90, CON: 75, DEX: 80, POW: 50 } },
      abilities: { attacks: ['Talons 40%', 'Bite 35%'], sanityLoss: '1d6/1d20' },
      xpReward: 300,
      description: 'Montaria estelar grotesca, veloz e extremamente ameaçadora.',
    },
    {
      name: 'Shoggoth',
      creatureType: 'Mythos Entity',
      stats: { hp: 35, movement: '8', attributes: { STR: 160, CON: 200, DEX: 40, POW: 50 } },
      abilities: { attacks: ['Pseudopod crush'], sanityLoss: '1d6/1d20', traits: ['Amorphous horror'] },
      xpReward: 1200,
      description: 'Massa protoplasmatica colossal usada para encontros fatais.',
    },
  ],
  tormenta20: [
    {
      name: 'Grifo',
      creatureType: 'Arton Native',
      stats: { armorClass: 17, hp: 42, movement: '12m, voo 18m', attributes: { FOR: 18, DES: 14, CON: 16 } },
      abilities: { attacks: ['Bico', 'Garras'], traits: ['Investida aerea'] },
      xpReward: 180,
      description: 'Predador majestoso e territorial, comum em fronteiras selvagens.',
    },
    {
      name: 'Troll de Duas Cabeças',
      creatureType: 'Monstro',
      stats: { armorClass: 16, hp: 78, movement: '9m', attributes: { FOR: 20, DES: 10, CON: 22 } },
      abilities: { attacks: ['Clava brutal'], traits: ['Regeneracao', 'Duas iniciativas'] },
      xpReward: 400,
      description: 'Brutamontes regenerativo ideal para pressionar a linha de frente.',
    },
    {
      name: 'Serviçal de Megalokk',
      creatureType: 'Cultista',
      stats: { armorClass: 15, hp: 55, movement: '9m', attributes: { FOR: 16, DES: 12, CON: 18 } },
      abilities: { attacks: ['Machado ritual'], traits: ['Furia divina'] },
      xpReward: 220,
      description: 'Fanatico violento vinculado ao deus da selvageria.',
    },
  ],
  pf2e: [
    {
      name: 'Goblin Pyro',
      creatureType: 'Humanoid',
      stats: { armorClass: 17, hp: 20, perception: 5, attributes: { STR: 10, DEX: 16, CON: 12 } },
      abilities: { actions: ['Torch Toss', 'Scuttle'], traits: ['Goblin', 'Humanoid'] },
      xpReward: 40,
      description: 'Atacante caotico de baixo nivel focado em fogo e mobilidade.',
    },
    {
      name: 'Ogre Warrior',
      creatureType: 'Giant',
      stats: { armorClass: 17, hp: 45, perception: 6, attributes: { STR: 20, DEX: 8, CON: 16 } },
      abilities: { actions: ['Greatclub', 'Sweeping swing'], traits: ['Giant'] },
      xpReward: 80,
      description: 'Bruto de impacto alto para encontros de dificuldade media.',
    },
  ],
};
