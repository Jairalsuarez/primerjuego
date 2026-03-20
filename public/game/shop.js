import { randInt } from "./utils.js";
import { createItem, inventoryHasSpace } from "./inventory.js";

export function rerollShop(state) {
  state.shopStock = Array.from({ length: 4 }, () => {
    const item = createItem(Math.max(1, state.player.level + randInt(-1, 1)), null, "shopWeight");
    item.buyValue = Math.round(item.sellValue * 2.3);
    return item;
  });
}

export function buyShopItem(state, itemId) {
  const index = state.shopStock.findIndex((item) => item.id === itemId);
  if (index < 0) return { ok: false };
  const item = state.shopStock[index];
  if (state.player.gold < item.buyValue) return { ok: false, reason: "Oro insuficiente." };
  if (!inventoryHasSpace(state)) return { ok: false, reason: "Inventario lleno." };

  state.player.gold -= item.buyValue;
  state.inventory.push(item);
  const replacement = createItem(Math.max(1, state.player.level + randInt(-1, 1)), null, "shopWeight");
  replacement.buyValue = Math.round(replacement.sellValue * 2.3);
  state.shopStock[index] = replacement;
  return { ok: true, item };
}

export function buyMysteryItem(state) {
  const cost = Math.round(35 + state.player.level * 14);
  if (state.player.gold < cost) return { ok: false, reason: `Necesitas ${cost} de oro.` };
  if (!inventoryHasSpace(state)) return { ok: false, reason: "Inventario lleno." };
  state.player.gold -= cost;
  const item = createItem(Math.max(1, state.player.level + randInt(0, 2)), null, "shopWeight");
  state.inventory.push(item);
  return { ok: true, item, cost };
}

export function refreshShopStock(state) {
  const cost = Math.round(18 + state.player.level * 5);
  if (state.player.gold < cost) return { ok: false, reason: `Necesitas ${cost} de oro.` };
  state.player.gold -= cost;
  rerollShop(state);
  return { ok: true, cost };
}
