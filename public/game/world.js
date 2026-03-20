import { BIOME_LEVEL_SPAN, PLAYER_BASE_X, WALK_SPEED, knightComments, randInt } from "./utils.js";

export const biomes = [
  { key: "desert", label: "Desierto" },
  { key: "forest", label: "Bosque" },
  { key: "village", label: "Villa" },
  { key: "beach", label: "Playa" },
  { key: "destroyed", label: "Campo Caído" },
  { key: "postapoc", label: "Zona Post-apoc" }
];

export function createWorldState() {
  return {
    state: "walking",
    playerX: PLAYER_BASE_X,
    scroll: 0,
    biomeKey: "forest",
    biomeLabel: "Bosque",
    enemy: null,
    loot: null,
    popups: [],
    bubbles: [],
    playerAttackClass: "",
    shakeTimer: 0,
    enemyDeathTimer: 0
  };
}

export function updateWorldScroll(state, delta) {
  state.world.scroll += delta * (state.world.state === "walking" ? WALK_SPEED : 36);
  state.world.shakeTimer = Math.max(0, state.world.shakeTimer - delta);
  for (const popup of state.world.popups) popup.ttl -= delta;
  state.world.popups = state.world.popups.filter((popup) => popup.ttl > 0);
  for (const bubble of state.world.bubbles) bubble.ttl -= delta;
  state.world.bubbles = state.world.bubbles.filter((bubble) => bubble.ttl > 0);
}

export function maybeUpdateBiome(state) {
  const biomeIndex = Math.floor((state.player.level - 1) / BIOME_LEVEL_SPAN) % biomes.length;
  const biome = biomes[biomeIndex];
  const changed = biome.key !== state.world.biomeKey;
  state.world.biomeKey = biome.key;
  state.world.biomeLabel = biome.label;
  return changed ? biome : null;
}

export function maybeSayKnightComment(state, x = PLAYER_BASE_X) {
  if (Math.random() > 0.08) return null;
  const text = knightComments[randInt(0, knightComments.length - 1)];
  const bubble = {
    id: `bubble-${Date.now()}`,
    x,
    y: 170,
    ttl: 1.9,
    text
  };
  state.world.bubbles.push(bubble);
  return bubble;
}

export function createPopup(x, y, text, type, color, crit = false) {
  return {
    id: `popup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    x,
    y,
    ttl: 0.9,
    text,
    type,
    color,
    crit
  };
}
