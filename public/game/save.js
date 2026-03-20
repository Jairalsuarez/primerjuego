import { SAVE_KEY, INVENTORY_SIZE, clamp, deepClone, MAX_OFFLINE_SECONDS } from "./utils.js";
import { createPlayerState, getPlayerStats } from "./player.js";
import { createWorldState } from "./world.js";

export function createBaseState() {
  return {
    player: createPlayerState(),
    equipped: { weapon: null, armor: null, talisman: null },
    inventory: [],
    selectedItemId: null,
    shopStock: [],
    encounterCount: 0,
    combatPaused: false,
    lastSavedAt: Date.now(),
    world: createWorldState()
  };
}

export function normalizeState(raw) {
  const base = createBaseState();
  if (!raw || typeof raw !== "object") return base;

  const normalized = deepClone(base);
  normalized.player = { ...base.player, ...raw.player, stats: { ...base.player.stats, ...(raw.player?.stats || {}) } };
  normalized.equipped = { ...base.equipped, ...(raw.equipped || {}) };
  normalized.inventory = Array.isArray(raw.inventory) ? raw.inventory.filter(Boolean).slice(0, INVENTORY_SIZE) : [];
  normalized.selectedItemId = raw.selectedItemId || null;
  normalized.shopStock = Array.isArray(raw.shopStock) ? raw.shopStock.filter(Boolean).slice(0, 4) : [];
  normalized.encounterCount = Number.isFinite(raw.encounterCount) ? raw.encounterCount : 0;
  normalized.combatPaused = Boolean(raw.combatPaused);
  normalized.lastSavedAt = Number.isFinite(raw.lastSavedAt) ? raw.lastSavedAt : Date.now();
  normalized.world = createWorldState();
  normalized.player.currentHp = clamp(normalized.player.currentHp || getPlayerStats(normalized).hp, 0, getPlayerStats(normalized).hp);
  return normalized;
}

export function loadGame() {
  try {
    return normalizeState(JSON.parse(localStorage.getItem(SAVE_KEY) || "null"));
  } catch {
    return createBaseState();
  }
}

export function saveGame(state) {
  state.lastSavedAt = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify({
    player: state.player,
    equipped: state.equipped,
    inventory: state.inventory,
    selectedItemId: state.selectedItemId,
    shopStock: state.shopStock,
    encounterCount: state.encounterCount,
    combatPaused: state.combatPaused,
    lastSavedAt: state.lastSavedAt
  }));
  return state.lastSavedAt;
}

export function getOfflineSeconds(state) {
  return clamp(Math.floor((Date.now() - state.lastSavedAt) / 1000), 0, MAX_OFFLINE_SECONDS);
}
