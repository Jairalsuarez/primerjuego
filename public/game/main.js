import { AUTO_SAVE_MS, INVENTORY_SIZE, clamp, formatNumber } from "./utils.js";
import { getPlayerStats, gainXp, applyOfflineProgress } from "./player.js";
import { updateCombat, spawnEnemy } from "./combat.js";
import { rerollShop, buyShopItem, buyMysteryItem, refreshShopStock } from "./shop.js";
import { findItemById, equipItem, unequipSlot, sellSelectedItem, addItemToInventory } from "./inventory.js";
import { getUi, renderStage, renderWorld, renderHud, renderEquipment, renderInventory, renderShop, toast, openModal, closeModal } from "./ui.js";
import { saveGame, loadGame, createBaseState } from "./save.js";
import { updateWorldScroll, maybeUpdateBiome } from "./world.js";

const ui = getUi();
let state = loadGame();
const runtime = {
  lastFrame: performance.now(),
  lastSave: performance.now(),
  playerAttackTimer: 0,
  enemyAttackTimer: 0,
  stageWidth: ui.stage.clientWidth || 1100
};

function pushSystemMessage(text) {
  toast(ui.itemToast, text);
}

function playTone(type) {
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return;
  if (!playTone.ctx) playTone.ctx = new Context();
  const ctx = playTone.ctx;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === "attack") {
    osc.type = "triangle";
    osc.frequency.setValueAtTime(360, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(210, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  if (type === "loot" || type === "gold") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(type === "gold" ? 440 : 540, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(type === "gold" ? 660 : 760, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.025, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  }

  if (type === "level") {
    osc.type = "square";
    osc.frequency.setValueAtTime(420, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(620, ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.025, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  }
}

function syncPlayerHp() {
  state.player.currentHp = clamp(state.player.currentHp, 0, getPlayerStats(state).hp);
}

function renderAll() {
  renderStage(ui, state);
  renderWorld(ui, state);
  renderHud(ui, state);
  renderEquipment(ui, state);
  renderInventory(ui, state);
  renderShop(ui, state);
}

function handleLevelUp(level) {
  toast(ui.levelToast, `NIVEL ${level}`);
  playTone("level");
  const biome = maybeUpdateBiome(state);
  if (biome) pushSystemMessage(`Nuevo bioma: ${biome.label}`);
}

function handleLootCollected(loot) {
  const added = addItemToInventory(state, loot.item);
  state.world.popups.push({
    id: `gold-${Date.now()}`,
    x: loot.x + 10,
    y: 220,
    ttl: 1,
    text: `+${loot.gold} oro`,
    color: "#ffc857",
    crit: false,
    type: "gold-pop"
  });

  if (added) {
    toast(ui.itemToast, `Loot: ${loot.item.name}`);
    playTone("loot");
  } else {
    const overflowGold = Math.round(loot.item.sellValue * 0.8);
    state.player.gold += overflowGold;
    toast(ui.itemToast, `+${overflowGold} oro`);
    playTone("gold");
  }
}

function resetGame() {
  state = createBaseState();
  rerollShop(state);
  spawnEnemy(state, runtime.stageWidth, true);
  renderAll();
  saveGame(state);
}

function bindEvents() {
  ui.inventoryBtn.addEventListener("click", () => openModal(ui.inventoryModal));
  ui.shopBtn.addEventListener("click", () => openModal(ui.shopModal));
  ui.closeInventoryBtn.addEventListener("click", () => closeModal(ui.inventoryModal));
  ui.closeShopBtn.addEventListener("click", () => closeModal(ui.shopModal));
  ui.inventoryModal.addEventListener("click", (event) => { if (event.target === ui.inventoryModal) closeModal(ui.inventoryModal); });
  ui.shopModal.addEventListener("click", (event) => { if (event.target === ui.shopModal) closeModal(ui.shopModal); });

  ui.inventoryGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-item-id]");
    if (!button) return;
    state.selectedItemId = button.getAttribute("data-item-id");
    renderInventory(ui, state);
  });

  ui.equipBtn.addEventListener("click", () => {
    if (!state.selectedItemId) return;
    const result = equipItem(state, state.selectedItemId);
    if (!result.ok) return pushSystemMessage(result.reason || "No se pudo equipar.");
    syncPlayerHp();
    renderAll();
  });

  ui.sellBtn.addEventListener("click", () => {
    const result = sellSelectedItem(state);
    if (!result.ok) return;
    playTone("gold");
    renderAll();
  });

  ui.unequipBtn.addEventListener("click", () => {
    const selected = findItemById(state, state.selectedItemId);
    if (selected) {
      const result = unequipSlot(state, selected.type);
      if (!result.ok) return pushSystemMessage(result.reason || "No se pudo quitar.");
    } else {
      const first = ["weapon", "armor", "talisman"].find((slot) => state.equipped[slot]);
      if (first) {
        const result = unequipSlot(state, first);
        if (!result.ok) return pushSystemMessage(result.reason || "No se pudo quitar.");
      }
    }
    syncPlayerHp();
    renderAll();
  });

  ui.shopGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-buy-id]");
    if (!button) return;
    const result = buyShopItem(state, button.getAttribute("data-buy-id"));
    if (!result.ok) return pushSystemMessage(result.reason || "No se pudo comprar.");
    renderAll();
  });

  ui.buyMysteryBtn.addEventListener("click", () => {
    const result = buyMysteryItem(state);
    if (!result.ok) return pushSystemMessage(result.reason);
    renderAll();
  });

  ui.refreshShopBtn.addEventListener("click", () => {
    const result = refreshShopStock(state);
    if (!result.ok) return pushSystemMessage(result.reason);
    renderAll();
  });

  ui.pauseBtn.addEventListener("click", () => {
    state.combatPaused = !state.combatPaused;
    renderHud(ui, state);
  });

  window.addEventListener("beforeunload", () => saveGame(state));
  window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "i") openModal(ui.inventoryModal);
    if (event.key.toLowerCase() === "o") openModal(ui.shopModal);
    if (event.key === "Escape") {
      closeModal(ui.inventoryModal);
      closeModal(ui.shopModal);
    }
  });
}

function gameLoop(now) {
  runtime.stageWidth = ui.stage.clientWidth || runtime.stageWidth;
  const delta = Math.min(0.05, (now - runtime.lastFrame) / 1000);
  runtime.lastFrame = now;

  // Bucle principal: primero actualiza desplazamiento y estados del mundo,
  // luego resuelve el combate automático y al final vuelve a dibujar todo.
  updateWorldScroll(state, delta);
  updateCombat(state, delta, runtime, {
    onLog(message, className) {
      if (className === "boss") pushSystemMessage(message);
    },
    onSound: playTone,
    onLevelUp: handleLevelUp,
    onLootCollected: handleLootCollected
  });

  if (now - runtime.lastSave >= AUTO_SAVE_MS) {
    saveGame(state);
    runtime.lastSave = now;
  }

  renderAll();
  requestAnimationFrame(gameLoop);
}

function init() {
  const offline = applyOfflineProgress(state);
  if (offline) {
    gainXp(state, offline.xp, { onLevelUp: handleLevelUp });
    pushSystemMessage(`+${offline.gold} oro offline`);
  }

  maybeUpdateBiome(state);
  if (!state.shopStock.length) rerollShop(state);
  if (!state.world.enemy) spawnEnemy(state, runtime.stageWidth, true);
  bindEvents();
  renderAll();
  requestAnimationFrame(gameLoop);
}

init();
