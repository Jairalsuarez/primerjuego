import { INVENTORY_SIZE, PLAYER_BASE_X, formatNumber } from "./utils.js";
import { getPlayerStats } from "./player.js";
import { findItemById, itemStatLines } from "./inventory.js";

export function getUi() {
  return {
    stage: document.getElementById("stage"),
    entitiesLayer: document.getElementById("entitiesLayer"),
    pickupLayer: document.getElementById("pickupLayer"),
    popupLayer: document.getElementById("popupLayer"),
    bubbleLayer: document.getElementById("bubbleLayer"),
    itemToast: document.getElementById("itemToast"),
    levelToast: document.getElementById("levelToast"),
    levelBadge: document.getElementById("levelBadge"),
    goldBadge: document.getElementById("goldBadge"),
    biomeBadge: document.getElementById("biomeBadge"),
    inventoryBtn: document.getElementById("inventoryBtn"),
    shopBtn: document.getElementById("shopBtn"),
    pauseBtn: document.getElementById("pauseBtn"),
    equipGrid: document.getElementById("equipGrid"),
    inventoryModal: document.getElementById("inventoryModal"),
    shopModal: document.getElementById("shopModal"),
    closeInventoryBtn: document.getElementById("closeInventoryBtn"),
    closeShopBtn: document.getElementById("closeShopBtn"),
    inventoryGrid: document.getElementById("inventoryGrid"),
    itemDetail: document.getElementById("itemDetail"),
    equipBtn: document.getElementById("equipBtn"),
    sellBtn: document.getElementById("sellBtn"),
    unequipBtn: document.getElementById("unequipBtn"),
    shopGrid: document.getElementById("shopGrid")
  };
}

export function toast(element, text) {
  element.textContent = text;
  element.classList.remove("show");
  void element.offsetWidth;
  element.classList.add("show");
}

export function renderStage(ui, state) {
  ui.stage.className = `stage biome-${state.world.biomeKey}${state.world.shakeTimer > 0 ? " shake" : ""}`;
  ui.stage.querySelector(".far-layer").style.transform = `translateX(${-state.world.scroll * 0.14}px)`;
  ui.stage.querySelector(".mid-layer").style.transform = `translateX(${-state.world.scroll * 0.28}px)`;
  ui.stage.querySelector(".near-layer").style.transform = `translateX(${-state.world.scroll * 0.48}px)`;
  ui.stage.querySelector(".ground-layer").style.transform = `translateX(${-state.world.scroll * 0.92}px)`;
}

function renderEntity(state, entity, isPlayer = false) {
  const stats = isPlayer ? getPlayerStats(state) : null;
  const hpRatio = isPlayer ? state.player.currentHp / stats.hp : entity.currentHp / entity.maxHp;
  const classes = [
    "entity",
    isPlayer ? "player" : "enemy",
    isPlayer ? "" : entity.key,
    isPlayer ? state.world.state === "walking" ? "walking" : state.world.playerAttackClass : entity.state === "dying" ? "dead" : entity.hitFlash > 0 ? "hit" : entity.attackClass,
    !isPlayer && entity.isBoss ? "boss" : ""
  ].filter(Boolean).join(" ");

  const extras = !isPlayer && entity.key === "troll"
    ? '<div class="horn left"></div><div class="horn right"></div>'
    : !isPlayer && entity.key === "dragon"
      ? '<div class="wing left"></div><div class="wing right"></div><div class="tail"></div>'
      : "";

  return `
    <div class="${classes}" style="left:${isPlayer ? PLAYER_BASE_X : entity.x}px">
      <div class="nameplate">
        <p>${isPlayer ? "Caballero" : entity.name}</p>
        <div class="meter"><div class="meter-fill hp" style="width:${Math.max(0, hpRatio) * 100}%"></div></div>
      </div>
      <div class="body-core">
        ${isPlayer ? '<div class="helmet"></div><div class="visor"></div>' : extras}
        <div class="part head"></div>
        <div class="part torso"></div>
        <div class="limb left-arm"></div>
        <div class="limb right-arm"></div>
        <div class="limb left-leg"></div>
        <div class="limb right-leg"></div>
        <div class="weapon-shape"></div>
      </div>
      <div class="shadow"></div>
    </div>
  `;
}

export function renderWorld(ui, state) {
  const nodes = [renderEntity(state, null, true)];
  if (state.world.enemy) nodes.push(renderEntity(state, state.world.enemy, false));
  ui.entitiesLayer.innerHTML = nodes.join("");

  ui.pickupLayer.innerHTML = state.world.loot
    ? `<div class="pickup ${state.world.loot.item.rarityClass.replace("rarity-", "")}" style="left:${state.world.loot.x}px"></div>`
    : "";

  ui.popupLayer.innerHTML = state.world.popups.map((popup) => `<div class="popup ${popup.crit ? "crit" : ""} ${popup.type || ""}" style="left:${popup.x}px;top:${popup.y}px;color:${popup.color}">${popup.text}</div>`).join("");
  ui.bubbleLayer.innerHTML = state.world.bubbles.map((bubble) => `<div class="bubble" style="left:${bubble.x}px;top:${bubble.y}px">${bubble.text}</div>`).join("");
}

export function renderHud(ui, state) {
  ui.levelBadge.textContent = `Lv ${state.player.level}`;
  ui.goldBadge.textContent = `${formatNumber(state.player.gold)} oro`;
  ui.biomeBadge.textContent = state.world.biomeLabel;
  ui.pauseBtn.textContent = state.combatPaused ? "Reanudar" : "Pausa";
}

export function renderEquipment(ui, state) {
  ui.equipGrid.innerHTML = ["weapon", "armor", "talisman"].map((slot) => {
    const item = state.equipped[slot];
    return item
      ? `<div class="slot-card"><strong>${slot.toUpperCase()}</strong><p class="${item.rarityClass}">${item.name}</p><p>${itemStatLines(item).join(" | ")}</p></div>`
      : `<div class="slot-card"><strong>${slot.toUpperCase()}</strong><p>Vacío</p></div>`;
  }).join("");
}

export function renderInventory(ui, state) {
  const items = [...state.inventory];
  while (items.length < INVENTORY_SIZE) items.push(null);
  ui.inventoryGrid.innerHTML = items.map((item) => {
    if (!item) return `<div class="item-card empty">Vacío</div>`;
    return `<button type="button" class="item-card ${item.id === state.selectedItemId ? "selected" : ""}" data-item-id="${item.id}">
      <p class="item-name ${item.rarityClass}">${item.name}</p>
      <p class="item-meta">${item.type.toUpperCase()} • Lv ${item.level}</p>
      <p class="item-meta">${itemStatLines(item).slice(0, 2).join(" • ")}</p>
    </button>`;
  }).join("");

  const selected = findItemById(state, state.selectedItemId);
  if (!selected) {
    ui.itemDetail.innerHTML = "<h3>Nada seleccionado</h3><p>Elige un objeto para equiparlo o venderlo.</p>";
    ui.equipBtn.disabled = true;
    ui.sellBtn.disabled = true;
  } else {
    ui.itemDetail.innerHTML = `<h3 class="${selected.rarityClass}">${selected.name}</h3><p>${selected.type.toUpperCase()} • Nivel ${selected.level} • Venta ${selected.sellValue} oro</p>${itemStatLines(selected).map((line) => `<p>${line}</p>`).join("")}`;
    ui.equipBtn.disabled = false;
    ui.sellBtn.disabled = false;
  }
}

export function renderShop(ui, state) {
  ui.shopGrid.innerHTML = state.shopStock.map((item) => `
    <div class="shop-card">
      <div style="display:flex;justify-content:space-between;gap:10px"><span class="${item.rarityClass}">${item.name}</span><strong>${item.buyValue} oro</strong></div>
      <p>${item.type.toUpperCase()} • Lv ${item.level}</p>
      <p>${itemStatLines(item).join(" • ")}</p>
      <div class="detail-actions" style="margin-top:10px">
        <button data-buy-id="${item.id}" ${state.player.gold < item.buyValue || state.inventory.length >= INVENTORY_SIZE ? "disabled" : ""}>Comprar</button>
      </div>
    </div>
  `).join("");
}

export function openModal(modal) {
  modal.classList.add("open");
}

export function closeModal(modal) {
  modal.classList.remove("open");
}
