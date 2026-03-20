import { clamp, formatNumber, formatPercent } from "./utils.js";

export function createPlayerState() {
  return {
    name: "Idle Knight",
    level: 1,
    xp: 0,
    gold: 0,
    kills: 0,
    bossKills: 0,
    currentHp: 130,
    stats: {
      hp: 130,
      attack: 14,
      defense: 7,
      speed: 1.12,
      critChance: 0.08
    }
  };
}

export function xpToNextLevel(level) {
  return Math.floor(40 + level * level * 18);
}

export function getPlayerStats(state) {
  const total = { ...state.player.stats };
  for (const item of Object.values(state.equipped)) {
    if (!item) continue;
    for (const [key, value] of Object.entries(item.bonuses)) {
      total[key] = (total[key] || 0) + value;
    }
  }
  total.hp = Math.round(total.hp);
  total.attack = Math.round(total.attack);
  total.defense = Math.round(total.defense);
  total.speed = Math.max(0.5, Number(total.speed.toFixed(2)));
  total.critChance = clamp(total.critChance, 0, 0.75);
  return total;
}

export function gainXp(state, amount, hooks = {}) {
  state.player.xp += amount;
  while (state.player.xp >= xpToNextLevel(state.player.level)) {
    state.player.xp -= xpToNextLevel(state.player.level);
    state.player.level += 1;
    state.player.stats.hp += 24;
    state.player.stats.attack += 4;
    state.player.stats.defense += 3;
    state.player.stats.speed = Number((state.player.stats.speed + 0.035).toFixed(2));
    state.player.stats.critChance = clamp(state.player.stats.critChance + 0.006, 0, 0.75);
    state.player.currentHp = getPlayerStats(state).hp;
    hooks.onLevelUp?.(state.player.level);
  }
}

export function applyOfflineProgress(state) {
  const cappedSeconds = clamp(Math.floor((Date.now() - state.lastSavedAt) / 1000), 0, 8 * 60 * 60);
  if (cappedSeconds < 60) return null;
  const minutes = Math.floor(cappedSeconds / 60);
  const kills = Math.max(1, Math.floor(minutes * (0.85 + state.player.level * 0.04)));
  const gold = Math.round(kills * (9 + state.player.level * 2.5));
  const xp = Math.round(kills * (10 + state.player.level * 4.2));
  state.player.gold += gold;
  state.player.kills += kills;
  return { minutes, gold, xp };
}

export function getMiniStats(state) {
  const stats = getPlayerStats(state);
  return [
    ["Ataque", formatNumber(stats.attack)],
    ["Defensa", formatNumber(stats.defense)],
    ["Velocidad", stats.speed.toFixed(2)],
    ["Crit", formatPercent(stats.critChance)],
    ["Bajas", formatNumber(state.player.kills)],
    ["Jefes", formatNumber(state.player.bossKills)]
  ];
}
