import { INVENTORY_SIZE, createId, randInt, weightedPick, rarityTable, formatNumber, formatPercent } from "./utils.js";

const itemPools = {
  weapon: { names: ["Espada Solar", "Lanza del Alba", "Acero Real", "Hoja de Cruz"], stats: ["attack", "speed", "critChance"] },
  armor: { names: ["Armadura de Guardia", "Placas de Bastión", "Coraza Santa", "Capa de Muralla"], stats: ["defense", "hp", "speed"] },
  talisman: { names: ["Sello de Acero", "Reliquia del León", "Moneda Bendita", "Foco del Alba"], stats: ["critChance", "speed", "attack", "defense", "hp"] }
};

export function createItem(level, forcedType, weightKey = "dropWeight") {
  const rarity = weightedPick(rarityTable, weightKey);
  const type = forcedType || ["weapon", "armor", "talisman"][randInt(0, 2)];
  const itemLevel = Math.max(1, level);
  const pool = itemPools[type];
  const bonuses = {};
  const choices = [...pool.stats];

  for (let index = 0; index < 2; index += 1) {
    const stat = choices.splice(randInt(0, choices.length - 1), 1)[0];
    let value = 0;
    if (stat === "attack") value = Math.round((4 + itemLevel * 1.9) * rarity.multiplier);
    if (stat === "defense") value = Math.round((3 + itemLevel * 1.5) * rarity.multiplier);
    if (stat === "hp") value = Math.round((20 + itemLevel * 8) * rarity.multiplier);
    if (stat === "speed") value = Number(((0.05 + itemLevel * 0.01) * (0.72 + rarity.multiplier * 0.38)).toFixed(2));
    if (stat === "critChance") value = Number(((0.01 + itemLevel * 0.002) * (0.72 + rarity.multiplier * 0.34)).toFixed(3));
    bonuses[stat] = (bonuses[stat] || 0) + Number(value);
  }

  if (type === "weapon" && bonuses.attack == null) bonuses.attack = Math.round((6 + itemLevel * 2.2) * rarity.multiplier);
  if (type === "armor" && bonuses.hp == null) bonuses.hp = Math.round((24 + itemLevel * 8) * rarity.multiplier);

  return {
    id: createId(),
    name: `${rarity.key} ${pool.names[randInt(0, pool.names.length - 1)]}`,
    type,
    rarity: rarity.key,
    rarityClass: rarity.className,
    level: itemLevel,
    bonuses,
    sellValue: Math.max(6, Math.round((12 + itemLevel * 5) * rarity.multiplier * (type === "weapon" ? 1.2 : type === "armor" ? 1.1 : 1.05)))
  };
}

export function itemStatLines(item) {
  return Object.entries(item.bonuses).map(([key, value]) => {
    if (key === "hp") return `HP +${formatNumber(value)}`;
    if (key === "speed") return `Velocidad +${Number(value).toFixed(2)}`;
    if (key === "critChance") return `Crit +${formatPercent(value)}`;
    return `${key[0].toUpperCase()}${key.slice(1)} +${formatNumber(value)}`;
  });
}

export function inventoryHasSpace(state) {
  return state.inventory.length < INVENTORY_SIZE;
}

export function addItemToInventory(state, item) {
  if (!inventoryHasSpace(state)) return false;
  state.inventory.push(item);
  return true;
}

export function findItemById(state, itemId) {
  return state.inventory.find((item) => item.id === itemId) || null;
}

export function removeInventoryItem(state, itemId) {
  const index = state.inventory.findIndex((item) => item.id === itemId);
  if (index >= 0) state.inventory.splice(index, 1);
  if (state.selectedItemId === itemId) state.selectedItemId = null;
}

export function equipItem(state, itemId) {
  const item = findItemById(state, itemId);
  if (!item) return { ok: false };
  const previous = state.equipped[item.type];
  if (previous) {
    if (!inventoryHasSpace(state)) return { ok: false, reason: "Inventario lleno." };
    state.inventory.push(previous);
  }
  state.equipped[item.type] = item;
  removeInventoryItem(state, item.id);
  return { ok: true, item };
}

export function unequipSlot(state, slot) {
  const item = state.equipped[slot];
  if (!item) return { ok: false };
  if (!inventoryHasSpace(state)) return { ok: false, reason: "Inventario lleno." };
  state.inventory.push(item);
  state.equipped[slot] = null;
  return { ok: true, item };
}

export function sellSelectedItem(state) {
  const item = findItemById(state, state.selectedItemId);
  if (!item) return { ok: false };
  state.player.gold += item.sellValue;
  removeInventoryItem(state, item.id);
  return { ok: true, item };
}
