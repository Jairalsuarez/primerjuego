import { knightComments } from "./utils.js";

export function createWorldState() {
  return {
    biomeKey: "forest",
    biomeLabel: "Bosque Místico",
    state: "walking",
    scroll: 0,
    enemy: null,
    loot: null,
    popups: [],
    bubbles: [],
    shakeTimer: 0,
    playerAttackClass: ""
  };
}

export function createPopup(x, y, text, type = "", color = "#fff", crit = false) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    x,
    y,
    text,
    type,
    color,
    crit,
    ttl: 0.9
  };
}

export function maybeSayKnightComment(state) {
  if (Math.random() > 0.35) return;
  const comment = knightComments[Math.floor(Math.random() * knightComments.length)];
  state.world.bubbles.push({
    id: `bubble-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    x: Math.floor(120 + Math.random() * 260),
    y: Math.floor(70 + Math.random() * 40),
    ttl: 1.8,
    text: comment
  });
}

export function updateWorldVisuals(state, delta) {
  if (state.world.state === "walking") {
    state.world.scroll += delta * 26;
  }

  if (state.world.shakeTimer > 0) {
    state.world.shakeTimer = Math.max(0, state.world.shakeTimer - delta);
  }

  state.world.popups = state.world.popups
    .map((popup) => ({ ...popup, ttl: popup.ttl - delta }))
    .filter((popup) => popup.ttl > 0);

  state.world.bubbles = state.world.bubbles
    .map((bubble) => ({ ...bubble, ttl: bubble.ttl - delta }))
    .filter((bubble) => bubble.ttl > 0);
}
