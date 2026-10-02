
(() => {
  "use strict";

  const COLS = 6;
  const ROWS = 5;
  const STAGING_LIMIT = 6;
  const MAX_HP = 100;

  const ITEM_DEFS = {
    sword: {
      name: "古刀", w: 1, h: 2, price: 4, category: "weapon", rotatable: true,
      description: "2.5秒ごとに12ダメージ。",
      action: { kind: "damage", amount: 12, interval: 2500 }
    },
    hammer: {
      name: "槌", w: 1, h: 2, price: 4, category: "weapon", rotatable: true,
      description: "4秒ごとに20ダメージ。重いが強力。",
      action: { kind: "damage", amount: 20, interval: 4000 }
    },
    mirror: {
      name: "鏡", w: 1, h: 1, price: 5, category: "support",
      description: "隣接する補助道具の配置効果を20%強める。",
      mirrorAmp: 0.2
    },
    lantern: {
      name: "提灯", w: 1, h: 1, price: 3, category: "support", directional: true,
      description: "正面1マスの武器ダメージ+25%。",
      directionalPowerBuff: 0.25
    },
    umbrella: {
      name: "唐傘", w: 1, h: 2, price: 4, category: "defense", rotatable: true,
      description: "4秒ごとに結界10。",
      action: { kind: "shield", amount: 10, interval: 4000 }
    },
    fan: {
      name: "扇子", w: 2, h: 1, price: 5, category: "support", rotatable: true,
      description: "隣接道具の発動間隔-10%。",
      adjacentSpeedBuff: 0.1
    },
    charm: {
      name: "お守り", w: 1, h: 1, price: 3, category: "support",
      description: "隣接道具の効果量+15%。",
      adjacentPowerBuff: 0.15
    },
    medicine: {
      name: "薬壺", w: 1, h: 1, price: 4, category: "heal",
      description: "5秒ごとにHPを8回復。",
      action: { kind: "heal", amount: 8, interval: 5000 }
    },
    oil: {
      name: "油壺", w: 1, h: 1, price: 3, category: "support",
      description: "隣接武器に炎の追加ダメージ+4。",
      adjacentWeaponBonus: 4
    },
    flint: {
      name: "火打石", w: 1, h: 1, price: 3, category: "fire",
      description: "隣接する火系道具の効果量+25%。",
      fireBoost: 0.25
    },
    furoshiki: {
      name: "風呂敷", w: 2, h: 2, price: 6, category: "support",
      description: "隣接した1×1道具を最大5個収納。中身1個につき周囲の効果量+4%。",
      containerCapacity: 5,
      containerPowerPerItem: 0.04
    },

    cracked_mirror: {
      name: "割れた鏡", w: 1, h: 1, price: 4, category: "defense",
      description: "被弾するたび敵へ3ダメージを返す。",
      retaliation: 3
    },
    fire_pot: {
      name: "火炎壺", w: 1, h: 1, price: 5, category: "fire", fire: true,
      description: "4秒ごとに8の炎ダメージ。",
      action: { kind: "damage", amount: 8, interval: 4000 }
    },
    burning_blade: {
      name: "焼刃", w: 1, h: 2, price: 6, category: "weapon", rotatable: true, fire: true,
      description: "炎を帯びた刀。2.7秒ごとに14ダメージ。",
      action: { kind: "damage", amount: 14, interval: 2700 }
    },
    exorcist_blade: {
      name: "破邪刀", w: 1, h: 2, price: 6, category: "weapon", rotatable: true,
      description: "妖怪に強い刀。2.5秒ごとに16ダメージ。",
      action: { kind: "damage", amount: 16, interval: 2500 }
    },
    warding_mirror: {
      name: "魔除け鏡", w: 1, h: 1, price: 6, category: "defense",
      description: "5秒ごとに結界6。",
      action: { kind: "shield", amount: 6, interval: 5000 }
    },
    lit_lantern: {
      name: "灯った提灯", w: 1, h: 1, price: 5, category: "support", directional: true,
      description: "正面1マスの武器ダメージ+40%。",
      directionalPowerBuff: 0.4
    },
    oil_lantern: {
      name: "油提灯", w: 1, h: 1, price: 5, category: "support",
      description: "隣接武器の効果量+35%。",
      adjacentWeaponPowerBuff: 0.35
    },
    oiled_umbrella: {
      name: "油紙傘", w: 1, h: 2, price: 6, category: "defense", rotatable: true,
      description: "4秒ごとに結界16。",
      action: { kind: "shield", amount: 16, interval: 4000 }
    },
    scorched_umbrella: {
      name: "焦げ傘", w: 1, h: 2, price: 5, category: "fire", rotatable: true, fire: true,
      description: "結界6。被弾時に炎で5ダメージを返す。",
      action: { kind: "shield", amount: 6, interval: 4000 },
      retaliation: 5
    },
    fire_fan: {
      name: "火扇", w: 2, h: 1, price: 6, category: "fire", rotatable: true, fire: true,
      description: "3秒ごとに7の炎ダメージ。隣接CT-8%。",
      action: { kind: "damage", amount: 7, interval: 3000 },
      adjacentSpeedBuff: 0.08
    },
    lantern_fan: {
      name: "灯風の扇", w: 2, h: 1, price: 6, category: "support", rotatable: true,
      description: "隣接道具の発動間隔-18%。",
      adjacentSpeedBuff: 0.18
    },
    decoction: {
      name: "煎じ薬", w: 1, h: 1, price: 5, category: "heal",
      description: "6秒ごとにHPを15回復。",
      action: { kind: "heal", amount: 15, interval: 6000 }
    },
    murky_medicine: {
      name: "濁り薬", w: 1, h: 1, price: 4, category: "heal",
      description: "5秒ごとにHP12回復するが、2ダメージを受ける。",
      action: { kind: "heal", amount: 12, interval: 5000, selfDamage: 2 }
    },
    machete: {
      name: "鉈", w: 1, h: 2, price: 6, category: "weapon", rotatable: true,
      description: "4.5秒ごとに28ダメージ。",
      action: { kind: "damage", amount: 28, interval: 4500 }
    },
    broken_umbrella: {
      name: "壊れ傘", w: 1, h: 2, price: 4, category: "weapon", rotatable: true,
      description: "3秒ごとに10ダメージ。被弾時2ダメージ反射。",
      action: { kind: "damage", amount: 10, interval: 3000 },
      retaliation: 2
    },
    curse_return_mirror: {
      name: "厄返しの鏡", w: 1, h: 1, price: 7, category: "defense",
      description: "被弾するたび5ダメージを返す。",
      retaliation: 5
    },
    crimson_mirror: {
      name: "紅蓮鏡", w: 1, h: 1, price: 7, category: "fire", fire: true,
      description: "被弾するたび7の炎ダメージを返す。",
      retaliation: 7
    },
    secret_medicine: {
      name: "秘薬", w: 1, h: 1, price: 7, category: "heal",
      description: "6.5秒ごとにHPを25回復。",
      action: { kind: "heal", amount: 25, interval: 6500 }
    },
    warding_umbrella: {
      name: "厄除け傘", w: 1, h: 2, price: 7, category: "defense", rotatable: true,
      description: "4秒ごとに結界15。被弾時2ダメージ反射。",
      action: { kind: "shield", amount: 15, interval: 4000 },
      retaliation: 2
    },
    trick_umbrella: {
      name: "仕込み傘", w: 1, h: 2, price: 7, category: "weapon", rotatable: true,
      description: "3秒ごとに10ダメージと結界6。",
      action: { kind: "hybrid", amount: 10, shield: 6, interval: 3000 }
    },
    flame_blade: {
      name: "炎刀", w: 1, h: 2, price: 8, category: "fire", rotatable: true, fire: true,
      description: "2.6秒ごとに20の炎ダメージ。",
      action: { kind: "damage", amount: 20, interval: 2600 }
    },
    exorcist_sword: {
      name: "退魔刀", w: 1, h: 2, price: 8, category: "weapon", rotatable: true,
      description: "2.8秒ごとに22ダメージ。",
      action: { kind: "damage", amount: 22, interval: 2800 }
    },
    inferno_fan: {
      name: "業火扇", w: 2, h: 1, price: 8, category: "fire", rotatable: true, fire: true,
      description: "3秒ごとに14の炎ダメージ。隣接CT-5%。",
      action: { kind: "damage", amount: 14, interval: 3000 },
      adjacentSpeedBuff: 0.05
    },
    wind_umbrella: {
      name: "風受け傘", w: 1, h: 2, price: 8, category: "defense", rotatable: true,
      description: "3.5秒ごとに結界12。隣接CT-5%。",
      action: { kind: "shield", amount: 12, interval: 3500 },
      adjacentSpeedBuff: 0.05
    },
    reflecting_lantern: {
      name: "映し灯籠", w: 1, h: 1, price: 8, category: "support",
      description: "隣接する全道具の効果量+20%。",
      adjacentPowerBuff: 0.2
    },

    kaeshi_mirror: {
      name: "付喪神・返し鏡", w: 1, h: 1, price: 10, category: "defense", tsukumogami: true,
      description: "受けた災いを返す付喪神。被弾時9ダメージ反射。",
      retaliation: 9
    },
    fire_eater_blade: {
      name: "付喪神・火喰い刀", w: 1, h: 2, price: 11, category: "fire", rotatable: true, fire: true, tsukumogami: true,
      description: "火を喰らう妖刀。2.4秒ごとに26の炎ダメージ。",
      action: { kind: "damage", amount: 26, interval: 2400 }
    },
    bake_umbrella: {
      name: "付喪神・化け傘", w: 1, h: 2, price: 10, category: "defense", rotatable: true, tsukumogami: true,
      description: "身を守りつつ牙をむく。3.5秒ごとに結界20、被弾時3反射。",
      action: { kind: "shield", amount: 20, interval: 3500 },
      retaliation: 3
    },
    fire_wind_fan: {
      name: "付喪神・火風の扇", w: 2, h: 1, price: 11, category: "fire", rotatable: true, fire: true, tsukumogami: true,
      description: "火風を起こす付喪神。2.6秒ごとに18ダメージ、隣接CT-8%。",
      action: { kind: "damage", amount: 18, interval: 2600 },
      adjacentSpeedBuff: 0.08
    },
    ghost_lantern: {
      name: "付喪神・幽灯籠", w: 1, h: 1, price: 11, category: "support", tsukumogami: true,
      description: "妖しい光で周囲を強化。隣接道具の効果量+30%。",
      adjacentPowerBuff: 0.3
    },
    medicine_eater_pot: {
      name: "付喪神・薬喰い壺", w: 1, h: 1, price: 10, category: "heal", tsukumogami: true,
      description: "薬気を蓄えた付喪神。5.5秒ごとにHP30回復。",
      action: { kind: "heal", amount: 30, interval: 5500 }
    }
  };

  const SHOP_ENTRIES = [
    { id: "sword", weight: 14, rarity: "common" },
    { id: "hammer", weight: 12, rarity: "common" },
    { id: "lantern", weight: 14, rarity: "common" },
    { id: "charm", weight: 13, rarity: "common" },
    { id: "medicine", weight: 11, rarity: "common" },
    { id: "oil", weight: 10, rarity: "common" },
    { id: "flint", weight: 10, rarity: "common" },
    { id: "umbrella", weight: 9, rarity: "uncommon" },
    { id: "fan", weight: 6, rarity: "uncommon" },
    { id: "mirror", weight: 4, rarity: "rare" },
    { id: "furoshiki", weight: 3, rarity: "rare" }
  ];

  const RARITY_META = {
    common: { label: "並", className: "rarity-common" },
    uncommon: { label: "珍", className: "rarity-uncommon" },
    rare: { label: "希", className: "rarity-rare" }
  };

  const RECIPES = [
    { a: "hammer", b: "mirror", result: "cracked_mirror" },
    { a: "flint", b: "oil", result: "fire_pot" },
    { a: "sword", b: "flint", result: "burning_blade" },
    { a: "sword", b: "charm", result: "exorcist_blade" },
    { a: "mirror", b: "charm", result: "warding_mirror" },
    { a: "lantern", b: "flint", result: "lit_lantern" },
    { a: "lantern", b: "oil", result: "oil_lantern" },
    { a: "umbrella", b: "oil", result: "oiled_umbrella" },
    { a: "umbrella", b: "flint", result: "scorched_umbrella" },
    { a: "fan", b: "flint", result: "fire_fan" },
    { a: "fan", b: "lantern", result: "lantern_fan" },
    { a: "medicine", b: "flint", result: "decoction" },
    { a: "medicine", b: "oil", result: "murky_medicine" },
    { a: "hammer", b: "sword", result: "machete" },
    { a: "hammer", b: "umbrella", result: "broken_umbrella" },

    { a: "cracked_mirror", b: "charm", result: "curse_return_mirror" },
    { a: "cracked_mirror", b: "flint", result: "crimson_mirror" },
    { a: "murky_medicine", b: "charm", result: "secret_medicine" },
    { a: "scorched_umbrella", b: "charm", result: "warding_umbrella" },
    { a: "broken_umbrella", b: "oil", result: "trick_umbrella" },
    { a: "burning_blade", b: "oil", result: "flame_blade" },
    { a: "exorcist_blade", b: "mirror", result: "exorcist_sword" },
    { a: "fire_fan", b: "oil", result: "inferno_fan" },
    { a: "oiled_umbrella", b: "fan", result: "wind_umbrella" },
    { a: "lit_lantern", b: "mirror", result: "reflecting_lantern" }
  ];

  const AWAKEN_BATTLES = 3;
  const AWAKENINGS = {
    curse_return_mirror: "kaeshi_mirror",
    flame_blade: "fire_eater_blade",
    warding_umbrella: "bake_umbrella",
    inferno_fan: "fire_wind_fan",
    reflecting_lantern: "ghost_lantern",
    secret_medicine: "medicine_eater_pot"
  };

  const ENEMIES = [
    { name: "小鬼", hp: 65, attack: 6, interval: 2400, reward: 6 },
    { name: "一つ目小僧", hp: 90, attack: 7, interval: 2100, reward: 7 },
    { name: "骸骨武者", hp: 125, attack: 10, interval: 2500, reward: 8, reduction: 0.1 },
    { name: "火車", hp: 145, attack: 6, interval: 1500, reward: 9 },
    { name: "赤鬼", hp: 280, attack: 12, interval: 2400, reward: 0, heavy: { interval: 8000, damage: 20 } }
  ];

  const DIRS = [
    { dx: 0, dy: -1, arrow: "↑" },
    { dx: 1, dy: 0, arrow: "→" },
    { dx: 0, dy: 1, arrow: "↓" },
    { dx: -1, dy: 0, arrow: "←" }
  ];

  let uid = 1;
  let toastTimer = null;
  let state = null;
  let battle = null;
  let battleTicker = null;

  const el = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    [
      "turnLabel", "playerHpBar", "playerHpLabel", "coinLabel", "bagGrid", "selectionText",
      "rotateButton", "storageButton", "sellButton", "stagingArea", "stagingCount", "reactionList", "shopGrid",
      "rerollButton", "enemyPreview", "battleButton", "recipeBook", "recipeProgress",
      "tsukumogamiBook", "tsukumogamiProgress", "resetButton",
      "battleModal", "battleEnemyName", "battleTimer", "enemyHpLabel", "enemyHpBar",
      "battlePlayerHpLabel", "battlePlayerHpBar", "shieldLabel", "battleBag", "battleLog", "battleResult",
      "battleResultTitle", "battleResultText", "battleCloseButton", "toast"
    ].forEach(id => el[id] = document.getElementById(id));

    el.rotateButton.addEventListener("click", rotateSelected);
    el.storageButton.addEventListener("click", handleStorageAction);
    el.sellButton.addEventListener("click", sellSelected);
    el.rerollButton.addEventListener("click", rerollShop);
    el.battleButton.addEventListener("click", startBattle);
    el.battleCloseButton.addEventListener("click", closeBattleModal);
    el.resetButton.addEventListener("click", () => {
      if (confirm("現在のランを最初からやり直しますか？ 図鑑の発見状況は残ります。")) resetRun();
    });

    resetRun();
  }

  function resetRun() {
    clearBattleTicker();
    battle = null;
    uid = 1;

    state = {
      turn: 1,
      hp: MAX_HP,
      coins: 10,
      items: [],
      selectedId: null,
      inBattle: false,
      runOver: false,
      shop: ["hammer", "mirror", "flint", "oil"],
      reactionPreference: {},
      discovered: loadDiscovered(),
      tsukumogamiDiscovered: loadTsukumogamiDiscovered()
    };

    const starter = makeItem("sword", "bag");
    starter.x = 2;
    starter.y = 2;
    starter.rot = 1;
    state.items.push(starter);

    el.battleModal.classList.remove("open");
    el.battleModal.setAttribute("aria-hidden", "true");
    renderAll();
    showToast("古刀を一本持って探索を始めます。");
  }

  function makeItem(typeId, location = "staging") {
    return {
      id: `item-${uid++}`,
      typeId,
      location,
      x: null,
      y: null,
      rot: 0,
      stored: [],
      battlesUsed: 0
    };
  }

  function defOf(itemOrType) {
    const id = typeof itemOrType === "string" ? itemOrType : itemOrType.typeId;
    return ITEM_DEFS[id];
  }

  function dimensions(item, rot = item.rot) {
    const def = defOf(item);
    const swap = def.rotatable && rot % 2 === 1;
    return swap ? { w: def.h, h: def.w } : { w: def.w, h: def.h };
  }

  function cellsFor(item, x = item.x, y = item.y, rot = item.rot) {
    if (x == null || y == null) return [];
    const { w, h } = dimensions(item, rot);
    const out = [];
    for (let yy = 0; yy < h; yy++) {
      for (let xx = 0; xx < w; xx++) out.push({ x: x + xx, y: y + yy });
    }
    return out;
  }

  function bagItems() {
    return state.items.filter(item => item.location === "bag");
  }

  function stagingItems() {
    return state.items.filter(item => item.location === "staging");
  }

  function itemById(id) {
    return state.items.find(item => item.id === id) || null;
  }

  function itemAt(x, y, ignoreId = null) {
    for (const item of bagItems()) {
      if (item.id === ignoreId) continue;
      if (cellsFor(item).some(cell => cell.x === x && cell.y === y)) return item;
    }
    return null;
  }

  function canPlace(item, x, y, rot = item.rot, ignoreId = item.id) {
    const cells = cellsFor(item, x, y, rot);
    if (!cells.length) return false;
    for (const cell of cells) {
      if (cell.x < 0 || cell.x >= COLS || cell.y < 0 || cell.y >= ROWS) return false;
      if (itemAt(cell.x, cell.y, ignoreId)) return false;
    }
    return true;
  }

  function areAdjacent(a, b) {
    if (a.location !== "bag" || b.location !== "bag") return false;
    const bSet = new Set(cellsFor(b).map(c => `${c.x},${c.y}`));
    for (const c of cellsFor(a)) {
      if (
        bSet.has(`${c.x + 1},${c.y}`) ||
        bSet.has(`${c.x - 1},${c.y}`) ||
        bSet.has(`${c.x},${c.y + 1}`) ||
        bSet.has(`${c.x},${c.y - 1}`)
      ) return true;
    }
    return false;
  }

  function recipeKey(recipe) {
    return [recipe.a, recipe.b].sort().join("+");
  }

  function matchingRecipe(aType, bType) {
    return RECIPES.find(r =>
      (r.a === aType && r.b === bType) || (r.a === bType && r.b === aType)
    ) || null;
  }

  function reactionPairKey(aId, bId) {
    return [aId, bId].sort().join("|");
  }

  function allReactionCandidates() {
    const candidates = [];
    const items = bagItems();

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        if (!areAdjacent(a, b)) continue;
        const recipe = matchingRecipe(a.typeId, b.typeId);
        if (!recipe) continue;
        candidates.push({
          aId: a.id,
          bId: b.id,
          recipe,
          priority: RECIPES.indexOf(recipe)
        });
      }
    }

    return candidates;
  }

  function isPreferredReaction(candidate) {
    return state.reactionPreference?.[candidate.aId] === candidate.bId &&
      state.reactionPreference?.[candidate.bId] === candidate.aId;
  }

  function computeReactions() {
    const candidates = allReactionCandidates();
    candidates.sort((x, y) => {
      const preferredDiff = Number(isPreferredReaction(y)) - Number(isPreferredReaction(x));
      return preferredDiff || x.priority - y.priority;
    });

    const used = new Set();
    const selected = [];
    for (const candidate of candidates) {
      if (used.has(candidate.aId) || used.has(candidate.bId)) continue;
      used.add(candidate.aId);
      used.add(candidate.bId);
      selected.push(candidate);
    }
    return selected;
  }

  function chooseReaction(aId, bId) {
    if (state.inBattle || state.runOver) return;

    const preference = state.reactionPreference || (state.reactionPreference = {});
    for (const [itemId, partnerId] of Object.entries(preference)) {
      if (itemId === aId || itemId === bId || partnerId === aId || partnerId === bId) {
        delete preference[itemId];
      }
    }

    preference[aId] = bId;
    preference[bId] = aId;
    showToast("この組み合わせを次ターンの変化として予約しました。");
    renderAll();
  }

  function renderAll() {
    renderHud();
    renderBag();
    renderStaging();
    renderReactions();
    renderShop();
    renderRecipeBook();
    renderTsukumogamiBook();
    renderBattlePreview();
    renderSelection();
  }

  function renderHud() {
    el.turnLabel.textContent = `${Math.min(state.turn, 5)} / 5`;
    el.playerHpLabel.textContent = `${Math.max(0, Math.round(state.hp))} / ${MAX_HP}`;
    el.playerHpBar.style.width = `${Math.max(0, Math.min(100, state.hp))}%`;
    el.coinLabel.textContent = `${state.coins}文`;
  }

  function renderBag() {
    const reactions = computeReactions();
    const reactingIds = new Set(reactions.flatMap(r => [r.aId, r.bId]));
    el.bagGrid.innerHTML = "";

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "bag-cell";

        const item = itemAt(x, y);
        if (!item) {
          cell.classList.add("empty");
          cell.setAttribute("aria-label", `空きマス ${x + 1},${y + 1}`);
          cell.addEventListener("click", () => handleBagCell(x, y, null));
        } else {
          const def = defOf(item);
          cell.classList.add("occupied", def.category);
          if (item.id === state.selectedId) cell.classList.add("selected");
          if (reactingIds.has(item.id)) cell.classList.add("reacting");

          const isAnchor = item.x === x && item.y === y;
          if (isAnchor) {
            const label = document.createElement("span");
            label.className = "cell-label";
            label.textContent = def.name;
            const sub = document.createElement("span");
            sub.className = "cell-sub";
            const { w, h } = dimensions(item);
            const capacity = def.containerCapacity || 0;
            const awakeningTarget = AWAKENINGS[item.typeId];
            if (capacity) {
              sub.textContent = `${w}×${h}｜包${item.stored?.length || 0}/${capacity}`;
            } else if (def.tsukumogami) {
              sub.textContent = `${w}×${h}｜付喪神`;
            } else if (awakeningTarget) {
              sub.textContent = `${w}×${h}｜年${item.battlesUsed || 0}/${AWAKEN_BATTLES}`;
            } else {
              sub.textContent = `${w}×${h}`;
            }
            label.appendChild(sub);
            cell.appendChild(label);

            if (def.directional) {
              const arrow = document.createElement("span");
              arrow.className = "direction-arrow";
              arrow.textContent = DIRS[item.rot % 4].arrow;
              cell.appendChild(arrow);
            }
          } else {
            const mark = document.createElement("span");
            mark.className = "cell-sub";
            mark.textContent = "・";
            cell.appendChild(mark);
          }

          cell.setAttribute("aria-label", def.name);
          cell.addEventListener("click", () => handleBagCell(x, y, item.id));
        }

        el.bagGrid.appendChild(cell);
      }
    }
  }

  function handleBagCell(x, y, occupiedId) {
    if (state.inBattle || state.runOver) return;

    if (occupiedId) {
      state.selectedId = occupiedId;
      renderAll();
      return;
    }

    if (!state.selectedId) return;
    const selected = itemById(state.selectedId);
    if (!selected) return;

    if (!canPlace(selected, x, y, selected.rot, selected.id)) {
      showToast("その場所には置けません。");
      return;
    }

    selected.location = "bag";
    selected.x = x;
    selected.y = y;
    renderAll();
  }

  function renderStaging() {
    const staged = stagingItems();
    el.stagingCount.textContent = `${staged.length} / ${STAGING_LIMIT}`;
    el.stagingArea.innerHTML = "";

    for (let i = 0; i < STAGING_LIMIT; i++) {
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = "staging-slot";
      const item = staged[i];

      if (item) {
        const def = defOf(item);
        slot.classList.add("filled");
        if (item.id === state.selectedId) slot.classList.add("selected");
        slot.innerHTML = `<strong>${def.name}</strong><span>${dimensions(item).w}×${dimensions(item).h}</span>`;
        slot.addEventListener("click", () => {
          if (state.inBattle || state.runOver) return;
          state.selectedId = item.id;
          renderAll();
        });
      } else {
        slot.innerHTML = "<span>空き</span>";
        slot.addEventListener("click", () => {
          if (state.inBattle || state.runOver || !state.selectedId) return;
          const selected = itemById(state.selectedId);
          if (!selected || selected.location !== "bag") return;
          if (stagingItems().length >= STAGING_LIMIT) return;
          selected.location = "staging";
          selected.x = null;
          selected.y = null;
          renderAll();
        });
      }

      el.stagingArea.appendChild(slot);
    }
  }

  function renderReactions() {
    const candidates = allReactionCandidates();
    const selected = computeReactions();
    const selectedKeys = new Set(selected.map(r => reactionPairKey(r.aId, r.bId)));
    el.reactionList.innerHTML = "";

    if (!candidates.length) {
      el.reactionList.innerHTML = '<p class="empty-note">対応する道具を上下左右に並べると、ここに変化予定が表示されます。</p>';
      return;
    }

    const involvement = new Map();
    candidates.forEach(candidate => {
      involvement.set(candidate.aId, (involvement.get(candidate.aId) || 0) + 1);
      involvement.set(candidate.bId, (involvement.get(candidate.bId) || 0) + 1);
    });

    candidates
      .sort((x, y) => Number(selectedKeys.has(reactionPairKey(y.aId, y.bId))) - Number(selectedKeys.has(reactionPairKey(x.aId, x.bId))) || x.priority - y.priority)
      .forEach(reaction => {
        const a = itemById(reaction.aId);
        const b = itemById(reaction.bId);
        if (!a || !b) return;

        const pairKey = reactionPairKey(reaction.aId, reaction.bId);
        const isSelected = selectedKeys.has(pairKey);
        const hasConflict = (involvement.get(reaction.aId) || 0) > 1 || (involvement.get(reaction.bId) || 0) > 1;
        const known = state.discovered.has(recipeKey(reaction.recipe));

        const div = document.createElement("div");
        div.className = `reaction-item${isSelected ? " reaction-selected" : " reaction-alternative"}`;

        const text = document.createElement("div");
        text.innerHTML = `${defOf(a).name} + ${defOf(b).name}<br>次ターン → <strong>${known ? ITEM_DEFS[reaction.recipe.result].name : "？？？"}</strong>`;
        div.appendChild(text);

        if (isSelected) {
          const badge = document.createElement("span");
          badge.className = "reaction-status";
          badge.textContent = hasConflict ? "予約済み" : "自動予約";
          div.appendChild(badge);
        } else if (hasConflict) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "reaction-choice";
          button.textContent = "この変化を予約";
          button.addEventListener("click", () => chooseReaction(reaction.aId, reaction.bId));
          div.appendChild(button);
        }

        el.reactionList.appendChild(div);
      });
  }

  function canStoreIn(container, item) {
    if (!container || !item || container.id === item.id) return false;
    const cdef = defOf(container);
    if (!cdef.containerCapacity) return false;
    if (container.location !== "bag" || item.location !== "bag") return false;
    if ((container.stored?.length || 0) >= cdef.containerCapacity) return false;
    const dims = dimensions(item);
    return dims.w === 1 && dims.h === 1 && !defOf(item).containerCapacity;
  }

  function adjacentContainerFor(item) {
    if (!item || item.location !== "bag") return null;
    return bagItems().find(container => areAdjacent(item, container) && canStoreIn(container, item)) || null;
  }

  function handleStorageAction() {
    const item = itemById(state.selectedId);
    if (!item || state.inBattle || state.runOver) return;
    const def = defOf(item);

    if (def.containerCapacity) {
      if (!item.stored?.length) {
        showToast("風呂敷の中は空です。");
        return;
      }
      if (stagingItems().length >= STAGING_LIMIT) {
        showToast("仮置き場に空きがありません。");
        return;
      }

      const restored = item.stored.pop();
      restored.location = "staging";
      restored.x = null;
      restored.y = null;
      state.items.push(restored);
      state.selectedId = restored.id;
      showToast(`${defOf(restored).name}を風呂敷から取り出しました。`);
      renderAll();
      return;
    }

    const container = adjacentContainerFor(item);
    if (!container) {
      showToast("収納できる風呂敷を隣に置いてください。");
      return;
    }

    state.items = state.items.filter(x => x.id !== item.id);
    item.location = "stored";
    item.x = null;
    item.y = null;
    container.stored = container.stored || [];
    container.stored.push(item);
    state.selectedId = container.id;
    showToast(`${def.name}を風呂敷に収納しました。収納中は変化しません。`);
    renderAll();
  }

  function renderSelection() {
    const item = itemById(state.selectedId);
    const disabled = !item || state.inBattle || state.runOver;
    el.rotateButton.disabled = disabled || (!defOf(item).rotatable && !defOf(item).directional);
    el.sellButton.disabled = disabled;

    if (!item) {
      el.storageButton.disabled = true;
      el.storageButton.textContent = "収納";
      el.selectionText.textContent = "道具を選択し、空いているマスをタップして配置します。";
      return;
    }

    const def = defOf(item);
    if (def.containerCapacity) {
      el.storageButton.textContent = "取出";
      el.storageButton.disabled = disabled || !(item.stored?.length);
    } else {
      el.storageButton.textContent = "収納";
      el.storageButton.disabled = disabled || !adjacentContainerFor(item);
    }

    const place = item.location === "bag" ? "カバン" : "仮置き場";
    const storedInfo = def.containerCapacity ? `｜収納 ${item.stored?.length || 0}/${def.containerCapacity}` : "";
    const awakeningInfo = def.tsukumogami
      ? "｜付喪神"
      : AWAKENINGS[item.typeId]
        ? `｜使用年月 ${item.battlesUsed || 0}/${AWAKEN_BATTLES}`
        : "";
    el.selectionText.textContent = `${def.name}｜${place}${storedInfo}${awakeningInfo}｜${def.description}`;
  }

  function rotateSelected() {
    const item = itemById(state.selectedId);
    if (!item || state.inBattle || state.runOver) return;
    const def = defOf(item);
    if (!def.rotatable && !def.directional) return;

    const nextRot = (item.rot + 1) % 4;
    if (item.location === "bag" && !canPlace(item, item.x, item.y, nextRot, item.id)) {
      showToast("回転すると他の道具かカバンの外に重なります。");
      return;
    }

    item.rot = nextRot;
    renderAll();
  }

  function sellSelected() {
    const item = itemById(state.selectedId);
    if (!item || state.inBattle || state.runOver) return;
    const def = defOf(item);
    if (def.containerCapacity && item.stored?.length) {
      showToast("中身を取り出してから風呂敷を売ってください。");
      return;
    }
    const value = Math.ceil(def.price / 2);
    state.coins += value;
    state.items = state.items.filter(x => x.id !== item.id);
    state.selectedId = null;
    showToast(`${def.name}を${value}文で売りました。`);
    renderAll();
  }

  function renderShop() {
    el.shopGrid.innerHTML = "";
    state.shop.forEach((typeId, index) => {
      const card = document.createElement("div");
      card.className = "shop-item";

      if (!typeId) {
        card.innerHTML = "<h3>売り切れ</h3><p>品揃え更新で新しい道具が並びます。</p>";
        el.shopGrid.appendChild(card);
        return;
      }

      const def = ITEM_DEFS[typeId];
      const shopEntry = SHOP_ENTRIES.find(entry => entry.id === typeId);
      const rarity = RARITY_META[shopEntry?.rarity || "common"];
      card.classList.add(rarity.className);
      card.innerHTML = `
        <div class="shop-title-row">
          <h3>${def.name}</h3>
          <span class="rarity-badge ${rarity.className}">${rarity.label}</span>
        </div>
        <p>${def.description}</p>
        <div class="shop-footer">
          <span class="price">${def.price}文</span>
          <button type="button">買う</button>
        </div>
      `;
      const button = card.querySelector("button");
      button.disabled = state.runOver || state.inBattle || state.coins < def.price || stagingItems().length >= STAGING_LIMIT;
      button.addEventListener("click", () => buyItem(index));
      el.shopGrid.appendChild(card);
    });

    el.rerollButton.disabled = state.runOver || state.inBattle || state.coins < 1;
  }

  function buyItem(index) {
    if (state.inBattle || state.runOver) return;
    const typeId = state.shop[index];
    if (!typeId) return;
    const def = ITEM_DEFS[typeId];

    if (state.coins < def.price) {
      showToast("文が足りません。");
      return;
    }
    if (stagingItems().length >= STAGING_LIMIT) {
      showToast("仮置き場がいっぱいです。");
      return;
    }

    state.coins -= def.price;
    const item = makeItem(typeId, "staging");
    state.items.push(item);
    state.shop[index] = null;
    state.selectedId = item.id;
    showToast(`${def.name}を購入しました。`);
    renderAll();
  }

  function rerollShop() {
    if (state.inBattle || state.runOver || state.coins < 1) return;
    state.coins -= 1;
    state.shop = randomShop();
    renderAll();
  }

  function weightedShopItem() {
    const total = SHOP_ENTRIES.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * total;

    for (const entry of SHOP_ENTRIES) {
      roll -= entry.weight;
      if (roll <= 0) return entry.id;
    }

    return SHOP_ENTRIES[SHOP_ENTRIES.length - 1].id;
  }

  function randomShop() {
    const out = [];
    for (let i = 0; i < 4; i++) out.push(weightedShopItem());
    return out;
  }

  function renderBattlePreview() {
    const enemy = ENEMIES[Math.min(state.turn - 1, ENEMIES.length - 1)];
    el.enemyPreview.textContent = `${enemy.name}　HP ${enemy.hp}`;

    if (state.runOver) {
      el.battleButton.disabled = true;
      el.battleButton.textContent = state.hp <= 0 ? "ラン終了" : "踏破済み";
      return;
    }

    el.battleButton.disabled = state.inBattle;
    el.battleButton.textContent = state.turn === 5 ? "ボス戦開始" : "戦闘開始";
  }

  function loadDiscovered() {
    try {
      const raw = JSON.parse(localStorage.getItem("tsukumogami-discovered") || "[]");
      return new Set(Array.isArray(raw) ? raw : []);
    } catch {
      return new Set();
    }
  }

  function loadTsukumogamiDiscovered() {
    try {
      const raw = JSON.parse(localStorage.getItem("tsukumogami-awakened") || "[]");
      return new Set(Array.isArray(raw) ? raw : []);
    } catch {
      return new Set();
    }
  }

  function saveDiscovered() {
    try {
      localStorage.setItem("tsukumogami-discovered", JSON.stringify([...state.discovered]));
      localStorage.setItem("tsukumogami-awakened", JSON.stringify([...state.tsukumogamiDiscovered]));
    } catch {
      // Storage may be blocked; the run can still continue.
    }
  }

  function renderRecipeBook() {
    el.recipeProgress.textContent = `${state.discovered.size} / ${RECIPES.length}`;
    el.recipeBook.innerHTML = "";

    RECIPES.forEach((recipe, index) => {
      const known = state.discovered.has(recipeKey(recipe));
      const div = document.createElement("div");
      div.className = `recipe-entry${known ? "" : " locked"}`;

      if (known) {
        div.innerHTML = `<strong>${ITEM_DEFS[recipe.a].name} + ${ITEM_DEFS[recipe.b].name}</strong><br>→ ${ITEM_DEFS[recipe.result].name}`;
      } else {
        div.textContent = `No.${String(index + 1).padStart(2, "0")}　未発見レシピ`;
      }
      el.recipeBook.appendChild(div);
    });
  }

  function renderTsukumogamiBook() {
    const entries = Object.entries(AWAKENINGS);
    el.tsukumogamiProgress.textContent = `${state.tsukumogamiDiscovered.size} / ${entries.length}`;
    el.tsukumogamiBook.innerHTML = "";

    entries.forEach(([sourceType, resultType], index) => {
      const known = state.tsukumogamiDiscovered.has(resultType);
      const div = document.createElement("div");
      div.className = `recipe-entry${known ? " known-tsukumogami" : " locked"}`;

      if (known) {
        div.innerHTML = `<strong>${ITEM_DEFS[resultType].name}</strong><br>${ITEM_DEFS[sourceType].name}を${AWAKEN_BATTLES}戦使用`;
      } else {
        div.textContent = `付喪神 No.${String(index + 1).padStart(2, "0")}　未発見`;
      }

      el.tsukumogamiBook.appendChild(div);
    });
  }

  function supportAmplification(source) {
    let mult = 1;
    for (const other of bagItems()) {
      if (other.id === source.id || !areAdjacent(source, other)) continue;
      const def = defOf(other);
      if (def.mirrorAmp) mult += def.mirrorAmp;
    }
    return mult;
  }

  function frontTarget(source) {
    if (source.location !== "bag") return null;
    const dir = DIRS[source.rot % 4];
    return itemAt(source.x + dir.dx, source.y + dir.dy, source.id);
  }

  function getModifiers(item) {
    const def = defOf(item);
    const mods = {
      powerMult: 1,
      intervalMult: 1,
      extraDamage: 0
    };

    for (const source of bagItems()) {
      if (source.id === item.id) continue;
      const sdef = defOf(source);
      const adjacent = areAdjacent(item, source);
      if (!adjacent) continue;

      const amp = supportAmplification(source);

      if (sdef.adjacentPowerBuff) {
        mods.powerMult += sdef.adjacentPowerBuff * amp;
      }
      if (sdef.containerPowerPerItem && source.stored?.length) {
        mods.powerMult += sdef.containerPowerPerItem * source.stored.length * amp;
      }
      if (sdef.adjacentWeaponPowerBuff && def.action?.kind === "damage") {
        mods.powerMult += sdef.adjacentWeaponPowerBuff * amp;
      }
      if (sdef.adjacentSpeedBuff) {
        mods.intervalMult *= Math.max(0.45, 1 - sdef.adjacentSpeedBuff * amp);
      }
      if (sdef.adjacentWeaponBonus && def.action?.kind === "damage") {
        mods.extraDamage += sdef.adjacentWeaponBonus * amp;
      }
      if (sdef.fireBoost && def.fire) {
        mods.powerMult += sdef.fireBoost * amp;
      }
    }

    for (const source of bagItems()) {
      const sdef = defOf(source);
      if (!sdef.directionalPowerBuff) continue;
      const target = frontTarget(source);
      if (target && target.id === item.id && def.action?.kind === "damage") {
        mods.powerMult += sdef.directionalPowerBuff * supportAmplification(source);
      }
    }

    return mods;
  }

  function startBattle() {
    if (state.inBattle || state.runOver) return;

    state.inBattle = true;
    state.selectedId = null;
    renderAll();

    const enemyDef = ENEMIES[state.turn - 1];
    battle = {
      enemyDef,
      enemyHp: enemyDef.hp,
      playerHp: state.hp,
      shield: 0,
      startedAt: performance.now(),
      enemyLast: 0,
      heavyLast: 0,
      itemLast: new Map(),
      finished: false
    };

    for (const item of bagItems()) battle.itemLast.set(item.id, 0);

    el.battleEnemyName.textContent = enemyDef.name;
    renderBattleBag();
    el.battleLog.innerHTML = "";
    el.battleResult.classList.add("hidden");
    el.battleCloseButton.textContent = "次へ";
    el.battleModal.classList.add("open");
    el.battleModal.setAttribute("aria-hidden", "false");
    logBattle(`${enemyDef.name}が現れた。`);

    updateBattleUi(0);
    clearBattleTicker();
    battleTicker = setInterval(tickBattle, 100);
  }

  function tickBattle() {
    if (!battle || battle.finished) return;

    const now = performance.now();
    const elapsed = now - battle.startedAt;

    for (const item of bagItems()) {
      const def = defOf(item);
      if (!def.action) continue;

      const mods = getModifiers(item);
      const interval = Math.max(350, def.action.interval * mods.intervalMult);
      const last = battle.itemLast.get(item.id) || 0;

      if (elapsed - last >= interval) {
        battle.itemLast.set(item.id, elapsed);
        executeItemAction(item, def, mods);
        if (battle.enemyHp <= 0 || battle.playerHp <= 0) break;
      }
    }

    if (battle.enemyHp <= 0) {
      finishBattle(true);
      return;
    }
    if (battle.playerHp <= 0) {
      finishBattle(false);
      return;
    }

    if (elapsed - battle.enemyLast >= battle.enemyDef.interval) {
      battle.enemyLast = elapsed;
      enemyAttack(battle.enemyDef.attack, "攻撃", elapsed >= 30000);
      if (battle.enemyHp <= 0) {
        finishBattle(true);
        return;
      }
      if (battle.playerHp <= 0) {
        finishBattle(false);
        return;
      }
    }

    if (battle.enemyDef.heavy && elapsed - battle.heavyLast >= battle.enemyDef.heavy.interval) {
      battle.heavyLast = elapsed;
      enemyAttack(battle.enemyDef.heavy.damage, "金棒振り下ろし", elapsed >= 30000);
      if (battle.enemyHp <= 0) {
        finishBattle(true);
        return;
      }
      if (battle.playerHp <= 0) {
        finishBattle(false);
        return;
      }
    }

    if (elapsed >= 35000) {
      logBattle("長期戦となり、押し切られた。");
      finishBattle(false);
      return;
    }

    updateBattleUi(elapsed);
  }

  function renderBattleBag() {
    if (!el.battleBag) return;
    el.battleBag.innerHTML = "";

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = document.createElement("div");
        cell.className = "battle-bag-cell";
        const item = itemAt(x, y);

        if (item) {
          const def = defOf(item);
          cell.classList.add("filled", def.category);
          cell.dataset.itemId = item.id;

          if (item.x === x && item.y === y) {
            const label = document.createElement("span");
            label.textContent = def.name.replace(/^付喪神・/, "").slice(0, 3);
            cell.appendChild(label);
          }
        }

        el.battleBag.appendChild(cell);
      }
    }
  }

  function flashBattleItem(itemId) {
    if (!el.battleBag) return;
    const nodes = el.battleBag.querySelectorAll(`[data-item-id="${itemId}"]`);
    nodes.forEach(node => {
      node.classList.remove("active");
      void node.offsetWidth;
      node.classList.add("active");
      setTimeout(() => node.classList.remove("active"), 420);
    });
  }

  function executeItemAction(item, def, mods) {
    flashBattleItem(item.id);
    const action = def.action;
    const power = Math.max(1, Math.round(action.amount * mods.powerMult + (action.kind === "damage" ? mods.extraDamage : 0)));

    if (action.kind === "damage") {
      const dealt = applyEnemyDamage(power);
      logBattle(`${def.name} → ${dealt}ダメージ`);
    } else if (action.kind === "heal") {
      const before = battle.playerHp;
      battle.playerHp = Math.min(MAX_HP, battle.playerHp + power);
      const healed = Math.round(battle.playerHp - before);
      logBattle(`${def.name} → HP${healed}回復`);

      if (action.selfDamage) {
        battle.playerHp = Math.max(0, battle.playerHp - action.selfDamage);
        logBattle(`${def.name}の濁りで${action.selfDamage}ダメージ`);
      }
    } else if (action.kind === "shield") {
      battle.shield += power;
      logBattle(`${def.name} → 結界+${power}`);
    } else if (action.kind === "hybrid") {
      const dealt = applyEnemyDamage(power);
      const shield = Math.max(1, Math.round(action.shield * mods.powerMult));
      battle.shield += shield;
      logBattle(`${def.name} → ${dealt}ダメージ / 結界+${shield}`);
    }

    updateBattleUi(performance.now() - battle.startedAt);
  }

  function applyEnemyDamage(raw) {
    const reduction = battle.enemyDef.reduction || 0;
    const dealt = Math.max(1, Math.round(raw * (1 - reduction)));
    battle.enemyHp = Math.max(0, battle.enemyHp - dealt);
    return dealt;
  }

  function enemyAttack(baseDamage, label, enraged) {
    let amount = baseDamage;
    if (enraged) amount = Math.round(amount * 1.5);

    const blocked = Math.min(battle.shield, amount);
    battle.shield -= blocked;
    const hpDamage = amount - blocked;
    battle.playerHp = Math.max(0, battle.playerHp - hpDamage);

    const suffix = blocked > 0 ? `（結界が${blocked}防いだ）` : "";
    logBattle(`${battle.enemyDef.name}の${label} → ${hpDamage}ダメージ${suffix}`);

    let retaliation = 0;
    for (const item of bagItems()) {
      const def = defOf(item);
      if (!def.retaliation) continue;
      const mods = getModifiers(item);
      retaliation += Math.max(1, Math.round(def.retaliation * mods.powerMult));
    }

    if (retaliation > 0) {
      const dealt = applyEnemyDamage(retaliation);
      logBattle(`反撃 → ${dealt}ダメージ`);
    }
  }

  function updateBattleUi(elapsed) {
    if (!battle) return;
    el.battleTimer.textContent = `${(elapsed / 1000).toFixed(1)}s`;
    el.enemyHpLabel.textContent = `${Math.ceil(battle.enemyHp)} / ${battle.enemyDef.hp}`;
    el.enemyHpBar.style.width = `${Math.max(0, (battle.enemyHp / battle.enemyDef.hp) * 100)}%`;
    el.battlePlayerHpLabel.textContent = `${Math.ceil(battle.playerHp)} / ${MAX_HP}`;
    el.battlePlayerHpBar.style.width = `${Math.max(0, (battle.playerHp / MAX_HP) * 100)}%`;
    el.shieldLabel.textContent = Math.round(battle.shield);
  }

  function logBattle(message) {
    const p = document.createElement("p");
    p.textContent = message;
    el.battleLog.prepend(p);
    while (el.battleLog.children.length > 24) {
      el.battleLog.removeChild(el.battleLog.lastChild);
    }
  }

  function advanceUsageYears(reactions) {
    const transformingIds = new Set(reactions.flatMap(r => [r.aId, r.bId]));
    const awakenedNames = [];

    for (const item of bagItems()) {
      if (transformingIds.has(item.id)) continue;
      const resultType = AWAKENINGS[item.typeId];
      if (!resultType) continue;

      item.battlesUsed = (item.battlesUsed || 0) + 1;
      if (item.battlesUsed < AWAKEN_BATTLES) continue;

      item.typeId = resultType;
      item.battlesUsed = 0;
      state.tsukumogamiDiscovered.add(resultType);
      awakenedNames.push(ITEM_DEFS[resultType].name);
    }

    return awakenedNames;
  }

  function finishBattle(win) {
    if (!battle || battle.finished) return;
    battle.finished = true;
    clearBattleTicker();

    state.inBattle = false;
    state.hp = Math.max(0, Math.round(battle.playerHp));

    let resultText = "";
    if (win) {
      const reward = battle.enemyDef.reward || 0;
      state.coins += reward;
      state.hp = Math.min(MAX_HP, state.hp + 20);

      const reactions = computeReactions();
      const awakenings = advanceUsageYears(reactions);
      const changes = applyTransformations(reactions);
      const changeText = changes.length ? " 道具変化：" + changes.join("、") : "";
      const awakeningText = awakenings.length ? " 付喪神化：" + awakenings.join("、") : "";

      if (state.turn >= ENEMIES.length) {
        state.runOver = true;
        resultText = `赤鬼を倒し、全5戦を踏破しました。${changeText}${awakeningText}`;
      } else {
        state.turn += 1;
        state.shop = randomShop();
        resultText = `${reward}文を獲得。戦闘後にHPを20回復しました。${changeText}${awakeningText}`;
      }

      el.battleResultTitle.textContent = state.runOver ? "踏破！" : "勝利";
    } else {
      state.runOver = true;
      el.battleResultTitle.textContent = "敗北";
      resultText = "このランは終了です。「最初から」で新しいランを始められます。";
      el.battleCloseButton.textContent = "閉じる";
    }

    saveDiscovered();
    el.battleResultText.textContent = resultText;
    el.battleResult.classList.remove("hidden");
    updateBattleUi(performance.now() - battle.startedAt);
    renderAll();
  }

  function applyTransformations(reactions) {
    if (!reactions.length) return [];

    const valid = reactions.filter(r => itemById(r.aId) && itemById(r.bId));
    const sourceIds = new Set(valid.flatMap(r => [r.aId, r.bId]));
    const sourceSnapshots = new Map();

    for (const id of sourceIds) {
      const item = itemById(id);
      sourceSnapshots.set(id, {
        ...item,
        cells: cellsFor(item).map(c => ({ ...c }))
      });
    }

    state.items = state.items.filter(item => !sourceIds.has(item.id));
    if (sourceIds.has(state.selectedId)) state.selectedId = null;

    const changedNames = [];

    for (const reaction of valid) {
      const first = sourceSnapshots.get(reaction.aId);
      const second = sourceSnapshots.get(reaction.bId);
      const result = makeItem(reaction.recipe.result, "bag");
      const candidateCells = [...first.cells, ...second.cells];
      let placed = false;

      for (const cell of candidateCells) {
        for (const rot of [0, 1]) {
          result.rot = rot;
          if (canPlace(result, cell.x, cell.y, rot, result.id)) {
            result.x = cell.x;
            result.y = cell.y;
            placed = true;
            break;
          }
        }
        if (placed) break;
      }

      if (!placed) {
        result.location = "staging";
        result.x = null;
        result.y = null;
        result.rot = 0;
      }

      state.items.push(result);
      state.discovered.add(recipeKey(reaction.recipe));

      const resultName = ITEM_DEFS[reaction.recipe.result].name;
      changedNames.push(resultName);
    }

    return changedNames;
  }

  function closeBattleModal() {
    el.battleModal.classList.remove("open");
    el.battleModal.setAttribute("aria-hidden", "true");
    renderAll();
  }

  function clearBattleTicker() {
    if (battleTicker) {
      clearInterval(battleTicker);
      battleTicker = null;
    }
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    el.toast.textContent = message;
    el.toast.classList.add("show");
    toastTimer = setTimeout(() => el.toast.classList.remove("show"), 2200);
  }
})();
