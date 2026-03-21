import { knightComments } from "./utils.js";

export function createPlayerState() {
  return {
    name: "Caballero",
    level: 1,
    xp: 0,
    xpToNext: 120,
    gold: 32,
    kills: 0,
    bossKills: 0,
    currentHp: 100,
    stats: {
      hp: 100,
      attack: 18,
      defense: 8,
      speed: 1.04,
      critChance: 0.045
    }
  };
}

export function getPlayerStats(state) {
  const base = state.player?.stats || { hp: 100, attack: 18, defense: 8, speed: 1.05, critChance: 0.04 };
  const bonuses = { hp: 0, attack: 0, defense: 0, speed: 0, critChance: 0 };

  ['weapon', 'armor', 'talisman'].forEach((slot) => {
    const item = state.equipped?.[slot];
    if (!item) return;
    Object.entries(item.bonuses).forEach(([key, value]) => {
      if (bonuses[key] != null) bonuses[key] += Number(value);
    });
  });

  return {
    hp: Math.max(10, Math.round(base.hp + bonuses.hp)),
    attack: Math.max(1, Math.round(base.attack + bonuses.attack)),
    defense: Math.max(0, Math.round(base.defense + bonuses.defense)),
    speed: Number((base.speed + (bonuses.speed || 0)).toFixed(3)),
    critChance: Number(Math.min(0.45, base.critChance + (bonuses.critChance || 0)).toFixed(3))
  };
}

export function gainXp(state, amount, hooks = {}) {
  state.player.xp += amount;

  while (state.player.xp >= state.player.xpToNext) {
    state.player.xp -= state.player.xpToNext;
    state.player.level += 1;
    state.player.xpToNext = Math.round(state.player.xpToNext * 1.28);

    state.player.stats.hp = Math.round(state.player.stats.hp * 1.09);
    state.player.stats.attack = Math.round(state.player.stats.attack * 1.06);
    state.player.stats.defense = Math.round(state.player.stats.defense * 1.04);
    state.player.stats.speed = Number((state.player.stats.speed * 1.02).toFixed(3));
    state.player.stats.critChance = Number(Math.min(0.45, state.player.stats.critChance + 0.002).toFixed(3));

    if (typeof hooks.onLevelUp === 'function') {
      hooks.onLevelUp(state.player.level);
    }
  }

  return state.player;
}

export function getPlayerPerspective(state) {
  return `Lv ${state.player.level} ${state.player.name}`;
}

export function getExperiencePercent(state) {
  return Math.min(1, state.player.xp / state.player.xpToNext);
}

