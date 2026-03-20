import {
  ATTACK_RANGE,
  WALK_SPEED,
  ENEMY_APPROACH_SPEED,
  PLAYER_RESPAWN_HP_RATIO,
  randInt
} from "./utils.js";
import { createEnemy } from "./enemy.js";
import { createItem } from "./inventory.js";
import { getPlayerStats, gainXp } from "./player.js";
import { createWorldState, createPopup, maybeSayKnightComment } from "./world.js";

const knightAttackClasses = ["attack-slash-h", "attack-slash-v", "attack-thrust"];
const enemyAttackClasses = {
  goblin: "attack-thrust",
  troll: "attack-slash-v",
  dragon: "attack-slash-h"
};

export { createWorldState };

export function spawnEnemy(state, stageWidth, initial = false) {
  state.encounterCount += 1;
  state.world.enemy = createEnemy(state, stageWidth, state.encounterCount);
  state.world.state = "walking";
  state.world.enemyDeathTimer = 0;
  state.world.playerAttackClass = "";
  if (!initial) {
    const prefix = state.world.enemy.isBoss ? "Jefe aparece" : "Nuevo enemigo";
    return { message: `${prefix}: ${state.world.enemy.name}.`, className: state.world.enemy.isBoss ? "boss" : "" };
  }
  return null;
}

function rewardEnemy(state, enemy, hooks) {
  const gold = Math.round((10 + enemy.level * 5) * (enemy.isBoss ? 2.8 : 1));
  const xp = Math.round((18 + enemy.level * 10) * (enemy.isBoss ? 2.25 : 1));
  state.player.gold += gold;
  state.player.kills += 1;
  if (enemy.isBoss) state.player.bossKills += 1;
  gainXp(state, xp, { onLevelUp: hooks.onLevelUp });
  hooks.onLog(`Derrotaste a ${enemy.name}: +${gold} oro, +${xp} XP.`, enemy.isBoss ? "boss" : "");
  state.world.loot = {
    item: createItem(enemy.level),
    gold,
    x: enemy.x,
    collectTimer: 0.28
  };
  maybeSayKnightComment(state);
}

function defeatPlayer(state, hooks, stageWidth) {
  state.player.currentHp = Math.round(getPlayerStats(state).hp * PLAYER_RESPAWN_HP_RATIO);
  state.player.gold = Math.max(0, state.player.gold - Math.round(state.player.level * 6));
  state.world.state = "walking";
  state.world.loot = null;
  state.world.enemy = null;
  hooks.onLog("El caballero cayó y volvió al campamento, perdiendo algo de oro.", "boss");
  state.world.bubbles.push({ id: `bubble-hurt-${Date.now()}`, x: state.world.playerX - 4, y: 170, ttl: 1.7, text: "That one hurt..." });
  spawnEnemy(state, stageWidth, true);
}

export function updateCombat(state, delta, runtime, hooks) {
  if (state.combatPaused) return;

  const enemy = state.world.enemy;
  const hero = getPlayerStats(state);
  state.world.playerAttackClass = "";

  if (!enemy && !state.world.loot) {
    spawnEnemy(state, runtime.stageWidth, true);
  }

  if (state.world.loot) {
    state.world.state = "looting";
    state.world.loot.collectTimer -= delta;
    state.world.loot.x -= delta * WALK_SPEED * 0.92;
    if (Math.abs(state.world.playerX - state.world.loot.x) < 48 || state.world.loot.collectTimer <= 0) {
      hooks.onLootCollected(state.world.loot);
      state.world.loot = null;
      state.world.state = "walking";
      const spawnLog = spawnEnemy(state, runtime.stageWidth, false);
      if (spawnLog) hooks.onLog(spawnLog.message, spawnLog.className);
    }
  }

  if (!enemy) return;

  enemy.hitFlash = Math.max(0, enemy.hitFlash - delta);
  if (enemy.attackClass) enemy.attackClass = "";

  if (enemy.state === "dying") {
    state.world.enemyDeathTimer -= delta;
    if (state.world.enemyDeathTimer <= 0) state.world.enemy = null;
    return;
  }

  const gap = enemy.x - state.world.playerX;
  if (gap > ATTACK_RANGE) {
    state.world.state = "walking";
    enemy.x -= delta * (WALK_SPEED + ENEMY_APPROACH_SPEED);
    runtime.playerAttackTimer = 0;
    runtime.enemyAttackTimer = 0;
    return;
  }

  state.world.state = "attacking";
  runtime.playerAttackTimer += delta * hero.speed;
  runtime.enemyAttackTimer += delta * enemy.speed;

  while (runtime.playerAttackTimer >= 1 && enemy.currentHp > 0) {
    runtime.playerAttackTimer -= 1;
    const crit = Math.random() < hero.critChance;
    const baseDamage = Math.max(1, hero.attack - enemy.defense * 0.55);
    const damage = Math.max(1, Math.round(baseDamage * (randInt(92, 108) / 100) * (crit ? 1.75 : 1)));
    state.world.playerAttackClass = knightAttackClasses[randInt(0, knightAttackClasses.length - 1)];
    enemy.currentHp = Math.max(0, enemy.currentHp - damage);
    enemy.hitFlash = 0.16;
    state.world.popups.push(createPopup(enemy.x + 20, 280, `${crit ? "CRIT " : ""}${damage}`, "damage", crit ? "#fff0a3" : "#ffb8a6", crit));
    hooks.onLog(`${state.player.name} golpea a ${enemy.name} por ${damage}${crit ? " crítico" : ""}.`);
    hooks.onSound("attack");
    if (damage >= Math.max(14, Math.round(hero.attack * 0.8))) state.world.shakeTimer = 0.16;

    if (enemy.currentHp <= 0) {
      enemy.state = "dying";
      state.world.enemyDeathTimer = 0.42;
      rewardEnemy(state, enemy, hooks);
      break;
    }
  }

  while (runtime.enemyAttackTimer >= 1 && enemy.currentHp > 0) {
    runtime.enemyAttackTimer -= 1;
    const crit = Math.random() < enemy.critChance;
    const baseDamage = Math.max(1, enemy.attack - hero.defense * 0.48);
    const damage = Math.max(1, Math.round(baseDamage * (randInt(90, 112) / 100) * (crit ? 1.55 : 1)));
    enemy.attackClass = enemyAttackClasses[enemy.key] || "attack-thrust";
    state.player.currentHp = Math.max(0, state.player.currentHp - damage);
    state.world.popups.push(createPopup(state.world.playerX + 18, 250, `${crit ? "CRIT " : ""}${damage}`, "damage", crit ? "#fff0a3" : "#91e6ff", crit));
    hooks.onLog(`${enemy.name} contraataca por ${damage}${crit ? " crítico" : ""}.`);
    if (damage >= Math.max(18, Math.round(enemy.attack * 0.7))) state.world.shakeTimer = 0.18;
    if (state.player.currentHp <= 0) {
      defeatPlayer(state, hooks, runtime.stageWidth);
      break;
    }
  }
}
