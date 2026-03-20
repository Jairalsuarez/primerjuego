import { BOSS_INTERVAL, createId, randInt, clamp } from "./utils.js";

export const enemyArchetypes = [
  { key: "goblin", names: ["Duende Explorador", "Duende Saqueador", "Duende Bruto"], hp: 0.88, attack: 1.08, defense: 0.78, speed: 1.22, crit: 0.06 },
  { key: "troll", names: ["Trol de Puente", "Trol del Fango", "Trol de Guerra"], hp: 1.38, attack: 1.22, defense: 1.1, speed: 0.82, crit: 0.05 },
  { key: "dragon", names: ["Dragón de Bruma", "Draco de Arena", "Dragón Carmesí"], hp: 1.16, attack: 1.34, defense: 0.96, speed: 0.92, crit: 0.11 }
];

const bossTitles = ["Colosal", "Abisal", "Anciano", "Devastador", "Ígneo"];

export function createEnemy(state, stageWidth, encounterCount) {
  const level = Math.max(1, state.player.level + randInt(-1, 2));
  const archetype = enemyArchetypes[randInt(0, enemyArchetypes.length - 1)];
  const isBoss = encounterCount > 0 && encounterCount % BOSS_INTERVAL === 0;
  const levelScale = 1 + (level - 1) * 0.16;
  const bossScale = isBoss ? 2.9 : 1;
  const maxHp = Math.round((66 + level * 34) * archetype.hp * levelScale * bossScale);

  return {
    id: createId(),
    key: archetype.key,
    name: isBoss ? `${bossTitles[randInt(0, bossTitles.length - 1)]} ${archetype.names[randInt(0, archetype.names.length - 1)]}` : archetype.names[randInt(0, archetype.names.length - 1)],
    level,
    isBoss,
    currentHp: maxHp,
    maxHp,
    attack: Math.round((8 + level * 3.9) * archetype.attack * (isBoss ? 1.5 : 1)),
    defense: Math.round((3 + level * 2.55) * archetype.defense * (isBoss ? 1.36 : 1)),
    speed: Number(((0.82 + level * 0.03) * archetype.speed * (isBoss ? 1.06 : 1)).toFixed(2)),
    critChance: clamp(archetype.crit + level * 0.002 + (isBoss ? 0.04 : 0), 0.03, 0.36),
    x: stageWidth + 180,
    state: "approaching",
    hitFlash: 0,
    attackClass: ""
  };
}
