import { getUi, renderStage, renderWorld, renderHud, renderEquipment, renderInventory, renderShop, openModal, closeModal, toast } from "./ui.js";
import { createBaseState, loadGame, saveGame } from "./save.js";
import { updateCombat } from "./combat.js";
import { updateWorldVisuals, createWorldState } from "./world.js";
import { createItem, addItemToInventory, equipItem, unequipSlot, sellSelectedItem, findItemById } from "./inventory.js";
import { rerollShop, buyShopItem, buyMysteryItem, refreshShopStock } from "./shop.js";
import { getPlayerStats } from "./player.js";

let state = null;

function ensureState() {
  state = loadGame();
  if (!state) state = createBaseState();
  if (!state.shopStock?.length) rerollShop(state);
  if (!state.world) state.world = createWorldState();
  if (!state.equipped) state.equipped = { weapon: null, armor: null, talisman: null };
  if (typeof state.combatPaused !== "boolean") state.combatPaused = false;

  const maxHp = getPlayerStats(state).hp;
  state.player.currentHp = Math.max(1, Math.min(maxHp, state.player.currentHp ?? maxHp));
}

function applyModifiersAfterEquip() {
  state.player.currentHp = Math.min(getPlayerStats(state).hp, state.player.currentHp);
}

function handleLootCollected(loot) {
  if (!loot?.item) return;
  const full = !addItemToInventory(state, loot.item);
  if (full) {
    toast(document.getElementById("itemToast"), "Inventario lleno, objeto perdido.");
  } else {
    toast(document.getElementById("itemToast"), `¡Obtuviste ${loot.item.name}!`);
  }
}

function initGame() {
  ensureState();

  const ui = getUi();

  const runtime = {
    stageWidth: ui.stage.offsetWidth || 1200,
    playerAttackTimer: 0,
    enemyAttackTimer: 0
  };

  const hooks = {
    onLog(message) {
      toast(ui.itemToast, message);
      console.log("GameLog:", message);
    },
    onLootCollected: (loot) => handleLootCollected(loot),
    onLevelUp(level) {
      toast(ui.itemToast, `Subes al nivel ${level}!`);
      state.player.currentHp = getPlayerStats(state).hp;
    },
    onSound() {
      // Sonidos no implementados todavía
    }
  };

  const onRender = () => {
    ui.kitty = state;
    renderStage(ui, state);
    renderWorld(ui, state);
    renderHud(ui, state);
    renderEquipment(ui, state);
    renderInventory(ui, state);
    renderShop(ui, state);
  };

  const saveInterval = setInterval(() => saveGame(state), 6000);

  ui.inventoryBtn.addEventListener("click", () => openModal(ui.inventoryModal));
  ui.closeInventoryBtn.addEventListener("click", () => closeModal(ui.inventoryModal));
  ui.shopBtn.addEventListener("click", () => openModal(ui.shopModal));
  ui.closeShopBtn.addEventListener("click", () => closeModal(ui.shopModal));

  ui.pauseBtn.addEventListener("click", () => {
    state.combatPaused = !state.combatPaused;
    ui.pauseBtn.textContent = state.combatPaused ? "Reanudar" : "Pausa";
  });

  ui.inventoryGrid.addEventListener("click", (evt) => {
    const btn = evt.target.closest("button[data-item-id]");
    if (!btn) return;
    state.selectedItemId = btn.dataset.itemId;
    renderInventory(ui, state);
  });

  ui.equipBtn.addEventListener("click", () => {
    if (!state.selectedItemId) return;
    const res = equipItem(state, state.selectedItemId);
    if (!res.ok) {
      toast(ui.itemToast, res.reason || "No se puede equipar.");
      return;
    }
    applyModifiersAfterEquip();
    toast(ui.itemToast, `Equipado ${res.item.name}`);
    renderInventory(ui, state);
    renderEquipment(ui, state);
  });

  ui.unequipBtn.addEventListener("click", () => {
    const slot = ['weapon', 'armor', 'talisman'].find((s) => state.equipped[s]);
    if (!slot) {
      toast(ui.itemToast, "No hay equipo para quitar.");
      return;
    }
    const result = unequipSlot(state, slot);
    if (!result.ok) {
      toast(ui.itemToast, result.reason || "No se puede quitar.");
      return;
    }
    applyModifiersAfterEquip();
    toast(ui.itemToast, `Quitar ${result.item.name}`);
    renderInventory(ui, state);
    renderEquipment(ui, state);
  });

  ui.sellBtn.addEventListener("click", () => {
    const result = sellSelectedItem(state);
    if (!result.ok) {
      toast(ui.itemToast, "No hay objeto seleccionado.");
      return;
    }
    toast(ui.itemToast, `Vendiste ${result.item.name} por ${result.item.sellValue} oro`);
    renderInventory(ui, state);
    renderHud(ui, state);
  });

  ui.shopGrid.addEventListener("click", (evt) => {
    const btn = evt.target.closest("button[data-buy-id]");
    if (!btn) return;
    const itemId = btn.dataset.buyId;
    const res = buyShopItem(state, itemId);
    if (!res.ok) {
      toast(ui.itemToast, res.reason || "No se pudo comprar.");
      return;
    }
    toast(ui.itemToast, `Compraste ${res.item.name} por ${res.item.buyValue} oro`);
    renderInventory(ui, state);
    renderHud(ui, state);
    renderShop(ui, state);
  });

  ui.buyMysteryBtn.addEventListener("click", () => {
    const res = buyMysteryItem(state);
    if (!res.ok) {
      toast(ui.itemToast, res.reason);
      return;
    }
    toast(ui.itemToast, `Compraste objeto misterioso por ${res.cost} oro`);
    renderInventory(ui, state);
    renderHud(ui, state);
    renderShop(ui, state);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "m") {
      rerollShop(state);
      renderShop(ui, state);
      toast(ui.itemToast, "Mercado renovado.");
    }
  });

  function gameLoop(time) {
    const dt = Math.min(0.04, (time - (window._lastTime || time)) / 1000);
    window._lastTime = time;

    if (!state.combatPaused) {
      state.world.playerX = 180;
      updateCombat(state, dt, runtime, hooks);
    }

    updateWorldVisuals(state, dt);

    onRender();
    saveGame(state);
    requestAnimationFrame(gameLoop);
  }

  state.world.bubbles.push({ id: "intro-phrase", x: 210, y: 70, ttl: 1.8, text: "La batalla comienza: equipate, luego observa. 🎯" });

  requestAnimationFrame(gameLoop);

  return () => clearInterval(saveInterval);
}

initGame();
