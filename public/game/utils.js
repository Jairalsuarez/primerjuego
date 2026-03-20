export const SAVE_KEY = "idle-knight-modular-save-v1";
export const INVENTORY_SIZE = 24;
export const BOSS_INTERVAL = 10;
export const AUTO_SAVE_MS = 8000;
export const MAX_OFFLINE_SECONDS = 8 * 60 * 60;
export const ATTACK_RANGE = 120;
export const PLAYER_BASE_X = 180;
export const PLAYER_RESPAWN_HP_RATIO = 0.55;
export const WALK_SPEED = 180;
export const ENEMY_APPROACH_SPEED = 24;
export const BIOME_LEVEL_SPAN = 8;

export const rarityTable = [
  { key: "Common", className: "rarity-common", multiplier: 1, dropWeight: 60, shopWeight: 58 },
  { key: "Rare", className: "rarity-rare", multiplier: 1.35, dropWeight: 26, shopWeight: 27 },
  { key: "Epic", className: "rarity-epic", multiplier: 1.85, dropWeight: 10, shopWeight: 11 },
  { key: "Legendary", className: "rarity-legendary", multiplier: 2.55, dropWeight: 4, shopWeight: 4 }
];

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function formatNumber(value) {
  return Math.round(value).toLocaleString();
}

export function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

export function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function weightedPick(table, key) {
  const total = table.reduce((sum, entry) => sum + entry[key], 0);
  let roll = Math.random() * total;
  for (const entry of table) {
    roll -= entry[key];
    if (roll <= 0) return entry;
  }
  return table[table.length - 1];
}

export function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const knightComments = [
  "Easy.",
  "Too slow!",
  "I need better gear.",
  "That one hurt..."
];
