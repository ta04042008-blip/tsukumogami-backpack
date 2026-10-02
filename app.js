
(() => {
  "use strict";

  const COLS = 6;
  const ROWS = 5;
  const STAGING_LIMIT = 6;
  const MAX_HP = 100;

  const {
    ITEM_DEFS,
    SHOP_ENTRIES,
    RARITY_META,
    RECIPES,
    AWAKEN_BATTLES,
    AWAKENINGS,
    ENEMIES,
    DIRS
  } = window.TSUKUMOGAMI_DATA;

  let uid = 1;
  let toastTimer = null;
  let state = null;
  let battle = null;
  let battleTicker = null;
  let lastNewRecipes = [];

  const el = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    [
      "turnLabel", "playerHpBar", "playerHpLabel", "coinLabel", "stageMap", "combatScene", "sceneFxLayer",
      "sceneEnemyName", "enemySprite", "enemyTrait", "bagGrid", "reactionLinks", "selectionText",
      "itemDetailName", "itemDetailGlyph", "itemDetailStats", "itemDetailClose",
      "rotateButton", "storageButton", "sellButton", "stagingArea", "stagingCount", "reactionList", "shopGrid",
      "rerollButton", "enemyPreview", "battleButton", "recipeBook", "recipeProgress",
      "tsukumogamiBook", "tsukumogamiProgress", "resetButton",
      "battleModal", "battleEnemyName", "battleTimer", "enemyHpLabel", "enemyHpBar",
      "battlePlayerHpLabel", "battlePlayerHpBar", "shieldLabel", "battleBag", "battleLog", "battleResult",
      "battleResultTitle", "battleResultText", "discoveryNotice", "battleCloseButton", "toast"
    ].forEach(id => el[id] = document.getElementById(id));

    el.rotateButton.addEventListener("click", rotateSelected);
    el.storageButton.addEventListener("click", handleStorageAction);
    el.itemDetailClose?.addEventListener("click", () => {
      state.selectedId = null;
      state.previewType = null;
      document.body.classList.remove("has-item-detail");
      renderAll();
    });
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
      rerollCount: 0,
      previewType: null,
      reactionPreference: {},
      discovered: loadDiscovered(),
      tsukumogamiDiscovered: loadTsukumogamiDiscovered()
    };

    const starter = makeItem("sword", "bag");
    starter.x = 2;
    starter.y = 2;
    starter.rot = 1;
    state.items.push(starter);

    document.body.classList.remove("battle-mode");
    el.battleModal.classList.remove("open");
    el.battleModal.setAttribute("aria-hidden", "true");
    renderAll();
    requestAnimationFrame(() => {
      el.combatScene?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
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

  function itemGlyph(itemOrType) {
    const def = defOf(itemOrType);
    if (!def) return "?";
    return def.name.replace(/^付喪神・/, "").replace(/^お/, "").slice(0, 1) || "?";
  }

  function shortItemName(itemOrType) {
    const def = defOf(itemOrType);
    if (!def) return "";
    return def.name.replace(/^付喪神・/, "").slice(0, 5);
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

  function canPlaceIgnoring(item, x, y, rot, ignoreIds) {
    const cells = cellsFor(item, x, y, rot);
    if (!cells.length) return false;

    for (const cell of cells) {
      if (cell.x < 0 || cell.x >= COLS || cell.y < 0 || cell.y >= ROWS) return false;

      for (const other of bagItems()) {
        if (ignoreIds.has(other.id)) continue;
        if (cellsFor(other).some(occupied => occupied.x === cell.x && occupied.y === cell.y)) {
          return false;
        }
      }
    }
    return true;
  }

  function cellsOverlap(firstCells, secondCells) {
    const firstSet = new Set(firstCells.map(cell => `${cell.x},${cell.y}`));
    return secondCells.some(cell => firstSet.has(`${cell.x},${cell.y}`));
  }

  function canSwapItems(first, second) {
    if (!first || !second || first.id === second.id) return false;
    if (first.location !== "bag" || second.location !== "bag") return false;

    const ignoreIds = new Set([first.id, second.id]);
    if (!canPlaceIgnoring(first, second.x, second.y, first.rot, ignoreIds)) return false;
    if (!canPlaceIgnoring(second, first.x, first.y, second.rot, ignoreIds)) return false;

    const firstAfter = cellsFor(first, second.x, second.y, first.rot);
    const secondAfter = cellsFor(second, first.x, first.y, second.rot);
    return !cellsOverlap(firstAfter, secondAfter);
  }

  function dragTargetCanAccept(itemId, target) {
    const item = itemById(itemId);
    if (!item || state.inBattle || state.runOver || !target) return false;

    if (target.kind === "bag") {
      if (!Number.isInteger(target.x) || !Number.isInteger(target.y)) return false;
      const occupied = itemAt(target.x, target.y);
      if (!occupied) return canPlace(item, target.x, target.y, item.rot, item.id);
      if (occupied.id === item.id) return true;
      return canSwapItems(item, occupied);
    }

    if (target.kind === "staging") {
      return item.location === "bag" && stagingItems().length < STAGING_LIMIT;
    }

    return false;
  }

  function performDragDrop(itemId, target) {
    const item = itemById(itemId);
    if (!item || !dragTargetCanAccept(itemId, target)) {
      state.selectedId = null;
      state.previewType = null;
      renderAll();
      return false;
    }

    if (target.kind === "bag") {
      const occupied = itemAt(target.x, target.y);
      if (occupied && occupied.id !== item.id) {
        const sx = item.x;
        const sy = item.y;
        item.x = occupied.x;
        item.y = occupied.y;
        occupied.x = sx;
        occupied.y = sy;
        showToast("道具の位置を入れ替えました。");
      } else if (!occupied) {
        item.location = "bag";
        item.x = target.x;
        item.y = target.y;
      }
    } else if (target.kind === "staging") {
      item.location = "staging";
      item.x = null;
      item.y = null;
    }

    state.selectedId = null;
    state.previewType = null;
    document.body.classList.remove("has-item-detail");
    renderAll();
    return true;
  }

  function selectForDrag(itemId) {
    const item = itemById(itemId);
    if (!item || state.inBattle || state.runOver) return false;
    state.selectedId = item.id;
    state.previewType = null;
    document.body.classList.remove("has-item-detail");
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

    const validPreferences = {};
    for (const candidate of candidates) {
      if (!isPreferredReaction(candidate)) continue;
      validPreferences[candidate.aId] = candidate.bId;
      validPreferences[candidate.bId] = candidate.aId;
    }
    state.reactionPreference = validPreferences;

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
    renderStageMap();
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
    const currentEnemy = ENEMIES[Math.min(state.turn - 1, ENEMIES.length - 1)];
    el.turnLabel.textContent = `${Math.min(state.turn, ENEMIES.length)} / ${ENEMIES.length} ・ 第${currentEnemy.act || 1}幕`;
    el.playerHpLabel.textContent = `${Math.max(0, Math.round(state.hp))} / ${MAX_HP}`;
    el.playerHpBar.style.width = `${Math.max(0, Math.min(100, state.hp))}%`;
    el.coinLabel.textContent = `${state.coins}文`;
  }

  function renderStageMap() {
    if (!el.stageMap) return;
    el.stageMap.innerHTML = "";

    ENEMIES.forEach((enemy, index) => {
      const number = index + 1;
      const node = document.createElement("div");
      node.className = "stage-node";
      if (number < state.turn) node.classList.add("done");
      if (number === state.turn && !state.runOver) node.classList.add("current");
      if (enemy.boss) node.classList.add("boss");
      node.textContent = number;
      node.title = `${number}戦目：${enemy.name}${enemy.boss ? "（ボス）" : ""}`;
      el.stageMap.appendChild(node);
    });
  }

  function renderBag() {
    const reactions = computeReactions();
    const reactingIds = new Set(reactions.flatMap(r => [r.aId, r.bId]));
    const selectedForPlacement = itemById(state.selectedId);
    el.bagGrid.innerHTML = "";

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "bag-cell";
        cell.dataset.x = String(x);
        cell.dataset.y = String(y);

        const item = itemAt(x, y);
        if (!item) {
          cell.classList.add("empty");
          if (selectedForPlacement && !state.inBattle && !state.runOver) {
            cell.classList.add(
              canPlace(selectedForPlacement, x, y, selectedForPlacement.rot, selectedForPlacement.id)
                ? "place-valid"
                : "place-invalid"
            );
          }
          cell.setAttribute("aria-label", `空きマス ${x + 1},${y + 1}`);
          cell.addEventListener("click", () => handleBagCell(x, y, null));
        } else {
          const def = defOf(item);
          cell.classList.add("occupied", def.category);
          cell.dataset.itemId = item.id;
          if (item.id === state.selectedId) cell.classList.add("selected");
          if (reactingIds.has(item.id)) cell.classList.add("reacting");

          const isAnchor = item.x === x && item.y === y;
          if (isAnchor) {
            cell.dataset.anchor = "1";
            const label = document.createElement("span");
            label.className = "cell-label";

            const glyph = document.createElement("span");
            glyph.className = "item-glyph";
            glyph.textContent = itemGlyph(item);
            label.appendChild(glyph);

            const name = document.createElement("span");
            name.className = "cell-item-name";
            name.textContent = shortItemName(item);
            label.appendChild(name);

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

    requestAnimationFrame(() => renderReactionLinks(reactions));
  }

  function itemVisualCenter(itemId) {
    const cells = [...el.bagGrid.querySelectorAll(`.bag-cell[data-item-id="${itemId}"]`)];
    if (!cells.length) return null;

    const rects = cells.map(node => node.getBoundingClientRect());
    const left = Math.min(...rects.map(r => r.left));
    const right = Math.max(...rects.map(r => r.right));
    const top = Math.min(...rects.map(r => r.top));
    const bottom = Math.max(...rects.map(r => r.bottom));
    return { x: (left + right) / 2, y: (top + bottom) / 2 };
  }

  function renderReactionLinks(reactions) {
    if (!el.reactionLinks || !el.bagGrid?.isConnected) return;
    el.reactionLinks.innerHTML = "";

    const overlayRect = el.reactionLinks.getBoundingClientRect();
    if (!overlayRect.width || !overlayRect.height) return;

    for (const reaction of reactions) {
      const a = itemVisualCenter(reaction.aId);
      const b = itemVisualCenter(reaction.bId);
      if (!a || !b) continue;

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(a.x - overlayRect.left));
      line.setAttribute("y1", String(a.y - overlayRect.top));
      line.setAttribute("x2", String(b.x - overlayRect.left));
      line.setAttribute("y2", String(b.y - overlayRect.top));
      line.setAttribute("class", "reaction-link-line");
      el.reactionLinks.appendChild(line);

      const seal = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      seal.setAttribute("cx", String((a.x + b.x) / 2 - overlayRect.left));
      seal.setAttribute("cy", String((a.y + b.y) / 2 - overlayRect.top));
      seal.setAttribute("r", "4");
      seal.setAttribute("class", "reaction-link-seal");
      el.reactionLinks.appendChild(seal);
    }
  }

  window.addEventListener("resize", () => {
    if (!state) return;
    requestAnimationFrame(() => renderReactionLinks(computeReactions()));
  });

  function handleBagCell(x, y, occupiedId) {
    if (state.inBattle || state.runOver) return;

    if (occupiedId) {
      state.previewType = null;

      if (state.selectedId && state.selectedId !== occupiedId) {
        const selected = itemById(state.selectedId);
        const target = itemById(occupiedId);

        if (canSwapItems(selected, target)) {
          const sx = selected.x;
          const sy = selected.y;
          selected.x = target.x;
          selected.y = target.y;
          target.x = sx;
          target.y = sy;
          showToast("道具の位置を入れ替えました。");
          renderAll();
          return;
        }
      }

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
      slot.dataset.stagingIndex = String(i);
      const item = staged[i];

      if (item) {
        const def = defOf(item);
        slot.classList.add("filled");
        slot.dataset.itemId = item.id;
        if (item.id === state.selectedId) slot.classList.add("selected");
        slot.innerHTML = `<span class="staging-glyph">${itemGlyph(item)}</span><strong>${shortItemName(item)}</strong><span>${dimensions(item).w}×${dimensions(item).h}</span>`;
        slot.addEventListener("click", () => {
          if (state.inBattle || state.runOver) return;
          state.previewType = null;
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

  function effectiveStatText(item) {
    if (!item) return "";
    const def = defOf(item);
    const mods = item.location === "bag"
      ? getModifiers(item)
      : { powerMult: 1, intervalMult: 1, extraDamage: 0 };

    if (def.action) {
      const interval = (def.action.interval * mods.intervalMult / 1000).toFixed(1);
      const amount = Math.max(
        1,
        Math.round(def.action.amount * mods.powerMult + (def.action.kind === "damage" ? mods.extraDamage : 0))
      );

      if (def.action.kind === "damage") return `現在: ${amount}ダメージ / ${interval}秒`;
      if (def.action.kind === "heal") return `現在: HP${amount}回復 / ${interval}秒`;
      if (def.action.kind === "shield") return `現在: 結界${amount} / ${interval}秒`;
      if (def.action.kind === "hybrid") {
        const shield = Math.max(1, Math.round(def.action.shield * mods.powerMult));
        return `現在: ${amount}ダメージ + 結界${shield} / ${interval}秒`;
      }
    }

    if (def.retaliation) {
      const amount = Math.max(1, Math.round(def.retaliation * mods.powerMult));
      return `現在: 被弾時${amount}反撃`;
    }

    if (def.containerCapacity) {
      return `現在: ${item.stored?.length || 0}/${def.containerCapacity}収納`;
    }

    return "";
  }

  function renderSelection() {
    const item = itemById(state.selectedId);
    const previewType = !item ? state.previewType : null;
    document.body.classList.toggle("has-item-detail", Boolean(item || previewType));
    const disabled = !item || state.inBattle || state.runOver;
    el.rotateButton.disabled = disabled || (!defOf(item).rotatable && !defOf(item).directional);
    el.sellButton.disabled = disabled;

    if (!item) {
      el.storageButton.disabled = true;
      el.storageButton.textContent = "収納";

      if (previewType) {
        renderItemDetail(null, previewType, "ショップ");
      } else {
        el.selectionText.textContent = "道具を選ぶと、ここに性能・変化・使用年月が表示されます。";
        if (el.itemDetailName) el.itemDetailName.textContent = "道具を選択";
        if (el.itemDetailGlyph) el.itemDetailGlyph.textContent = "?";
        if (el.itemDetailStats) {
          el.itemDetailStats.innerHTML = '<span class="detail-placeholder">カバンや入手品をタップしてください。</span>';
        }
      }
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
    const effectiveInfo = effectiveStatText(item);
    el.selectionText.textContent = `${def.name}｜${place}${storedInfo}${awakeningInfo}｜${def.description}${effectiveInfo ? "｜" + effectiveInfo : ""}`;
    renderItemDetail(item, item.typeId, place);
  }

  function renderItemDetail(item, typeId, sourceLabel) {
    const def = ITEM_DEFS[typeId];
    if (!def || !el.itemDetailStats) return;

    el.itemDetailName.textContent = def.name;
    el.itemDetailGlyph.textContent = itemGlyph(typeId);
    el.selectionText.textContent = def.description;

    const fake = item || { typeId, rot: 0, location: "preview", stored: [], battlesUsed: 0 };
    const dims = dimensions(fake);
    const rows = [
      ["分類", sourceLabel || def.category],
      ["サイズ", `${dims.w}×${dims.h}`],
      ["価値", `${def.price}文`]
    ];

    const effective = item ? effectiveStatText(item) : "";
    if (effective) rows.push(["実効", effective.replace(/^現在:\s*/, "")]);

    if (AWAKENINGS[typeId]) {
      rows.push(["使用年月", `${item?.battlesUsed || 0}/${AWAKEN_BATTLES}戦`]);
    } else if (def.tsukumogami) {
      rows.push(["状態", "付喪神"]);
    }

    const related = RECIPES.filter(recipe => recipe.a === typeId || recipe.b === typeId).slice(0, 3);
    if (related.length) {
      const text = related.map(recipe => {
        const partner = recipe.a === typeId ? recipe.b : recipe.a;
        const known = state.discovered.has(recipeKey(recipe));
        return `${ITEM_DEFS[partner].name} → ${known ? ITEM_DEFS[recipe.result].name : "？？？"}`;
      }).join(" / ");
      rows.push(["変化", text]);
    }

    if (def.directionalPowerBuff) rows.push(["向き", "正面1マスに効果"]);
    if (def.containerCapacity) rows.push(["収納", `${item?.stored?.length || 0}/${def.containerCapacity}`]);

    el.itemDetailStats.innerHTML = rows.map(([label, value]) =>
      `<div class="detail-stat"><b>${label}</b><span>${value}</span></div>`
    ).join("");
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
        <div class="shop-sprite" aria-hidden="true">${itemGlyph(typeId)}</div>
        <p>${def.description}</p>
        <div class="shop-footer">
          <span class="price">${def.price}文</span>
          <button type="button">買う</button>
        </div>
      `;
      card.addEventListener("click", event => {
        if (event.target.closest("button") || state.inBattle || state.runOver) return;
        state.selectedId = null;
        state.previewType = typeId;
        renderSelection();
      });
      const button = card.querySelector("button");
      button.disabled = state.runOver || state.inBattle || state.coins < def.price || stagingItems().length >= STAGING_LIMIT;
      button.addEventListener("click", () => buyItem(index));
      el.shopGrid.appendChild(card);
    });

    const cost = rerollCost();
    el.rerollButton.textContent = `品揃え更新 ${cost}文`;
    el.rerollButton.disabled = state.runOver || state.inBattle || state.coins < cost;
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
    state.previewType = null;
    state.selectedId = item.id;
    showToast(`${def.name}を購入しました。`);
    renderAll();
  }

  function rerollCost() {
    const schedule = [1, 1, 2, 3, 4];
    return schedule[Math.min(state.rerollCount || 0, schedule.length - 1)];
  }

  function rerollShop() {
    const cost = rerollCost();
    if (state.inBattle || state.runOver || state.coins < cost) return;
    state.coins -= cost;
    state.rerollCount = (state.rerollCount || 0) + 1;
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
    const battleType = enemy.boss ? "BOSS" : "ENCOUNTER";
    el.enemyPreview.textContent = `第${enemy.act || 1}幕 / ${battleType}　${enemy.name}　HP ${enemy.hp}`;
    if (el.combatScene) {
      el.combatScene.dataset.act = String(enemy.act || 1);
      el.combatScene.classList.toggle("boss-scene", Boolean(enemy.boss));
    }
    if (el.sceneEnemyName) el.sceneEnemyName.textContent = enemy.name;
    if (el.enemySprite) {
      const hasOfficialSprite = enemy.name === "小鬼";
      el.enemySprite.classList.toggle("official-kogoni", hasOfficialSprite);
      const span = el.enemySprite.querySelector(".enemy-fallback");
      if (span) span.textContent = enemy.name.slice(0, 1);
      el.enemySprite.classList.toggle("boss-sprite", Boolean(enemy.boss));
    }
    if (el.enemyTrait) {
      const traits = [];
      if (enemy.boss) traits.push(enemy.finalBoss ? "最終ボス" : "幕ボス");
      if (enemy.reduction) traits.push(`軽減${Math.round(enemy.reduction * 100)}%`);
      if (enemy.heavy) traits.push("強攻撃");
      el.enemyTrait.textContent = traits.length ? traits.join("・") : "妖怪";
    }

    if (state.runOver) {
      el.battleButton.disabled = true;
      el.battleButton.textContent = state.hp <= 0 ? "ラン終了" : "踏破済み";
      return;
    }

    el.battleButton.disabled = state.inBattle;
    el.battleButton.textContent = enemy.boss ? "ボス戦開始" : "戦闘開始";
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

    mods.powerMult = Math.min(mods.powerMult, 2);
    mods.intervalMult = Math.max(mods.intervalMult, 0.5);
    return mods;
  }

  function startBattle() {
    if (state.inBattle || state.runOver) return;

    const reactionSnapshot = computeReactions().map(reaction => ({
      aId: reaction.aId,
      bId: reaction.bId,
      recipe: reaction.recipe,
      priority: reaction.priority
    }));

    state.inBattle = true;
    state.selectedId = null;
    state.previewType = null;
    document.body.classList.add("battle-mode");
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
      reactions: reactionSnapshot,
      finished: false
    };

    for (const item of bagItems()) battle.itemLast.set(item.id, 0);

    el.battleEnemyName.textContent = enemyDef.name;
    renderBattleBag();
    el.battleLog.innerHTML = "";
    el.discoveryNotice.classList.add("hidden");
    el.discoveryNotice.innerHTML = "";
    el.battleResult.classList.add("hidden");
    el.battleCloseButton.textContent = "次へ";
    el.battleModal.classList.add("open");
    el.battleModal.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => {
      el.battleModal.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    logBattle(`${enemyDef.name}が現れた。`);
    if (enemyDef.boss) showSceneBanner(enemyDef.finalBoss ? "FINAL BOSS" : "BOSS", "boss");

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

  function flashSceneEffect(className) {
    if (!el.combatScene) return;
    el.combatScene.classList.remove(className);
    void el.combatScene.offsetWidth;
    el.combatScene.classList.add(className);
    setTimeout(() => el.combatScene?.classList.remove(className), 380);
  }

  function spawnSceneFloat(target, text, kind = "damage") {
    if (!el.sceneFxLayer) return;
    const node = document.createElement("span");
    node.className = `scene-float ${target} ${kind}`;
    node.textContent = text;
    el.sceneFxLayer.appendChild(node);
    setTimeout(() => node.remove(), 720);
  }

  function showSceneBanner(text, kind = "normal") {
    if (!el.sceneFxLayer) return;
    const node = document.createElement("strong");
    node.className = `scene-banner ${kind}`;
    node.textContent = text;
    el.sceneFxLayer.appendChild(node);
    setTimeout(() => node.remove(), 950);
  }

  function executeItemAction(item, def, mods) {
    flashBattleItem(item.id);
    const action = def.action;
    const power = Math.max(1, Math.round(action.amount * mods.powerMult + (action.kind === "damage" ? mods.extraDamage : 0)));

    if (action.kind === "damage") {
      flashSceneEffect("enemy-hit");
      const dealt = applyEnemyDamage(power);
      spawnSceneFloat("enemy", `-${dealt}`, "damage");
      logBattle(`${def.name} → ${dealt}ダメージ`);
    } else if (action.kind === "heal") {
      flashSceneEffect("player-heal");
      const before = battle.playerHp;
      battle.playerHp = Math.min(MAX_HP, battle.playerHp + power);
      const healed = Math.round(battle.playerHp - before);
      if (healed > 0) spawnSceneFloat("player", `+${healed}`, "heal");
      logBattle(`${def.name} → HP${healed}回復`);

      if (action.selfDamage) {
        battle.playerHp = Math.max(0, battle.playerHp - action.selfDamage);
        spawnSceneFloat("player", `-${action.selfDamage}`, "damage");
        logBattle(`${def.name}の濁りで${action.selfDamage}ダメージ`);
      }
    } else if (action.kind === "shield") {
      flashSceneEffect("player-shield");
      const before = battle.shield;
      battle.shield = Math.min(MAX_HP * 0.5, battle.shield + power);
      const gained = Math.max(0, Math.round(battle.shield - before));
      if (gained > 0) spawnSceneFloat("player", `結界+${gained}`, "shield");
      logBattle(`${def.name} → 結界+${gained}`);
    } else if (action.kind === "hybrid") {
      flashSceneEffect("enemy-hit");
      const dealt = applyEnemyDamage(power);
      const shield = Math.max(1, Math.round(action.shield * mods.powerMult));
      const before = battle.shield;
      battle.shield = Math.min(MAX_HP * 0.5, battle.shield + shield);
      const gained = Math.max(0, Math.round(battle.shield - before));
      spawnSceneFloat("enemy", `-${dealt}`, "damage");
      if (gained > 0) spawnSceneFloat("player", `結界+${gained}`, "shield");
      logBattle(`${def.name} → ${dealt}ダメージ / 結界+${gained}`);
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
    flashSceneEffect("player-hit");
    let amount = baseDamage;
    if (enraged) amount = Math.round(amount * 1.5);

    const blocked = Math.min(battle.shield, amount);
    battle.shield -= blocked;
    const hpDamage = amount - blocked;
    battle.playerHp = Math.max(0, battle.playerHp - hpDamage);

    const suffix = blocked > 0 ? `（結界が${blocked}防いだ）` : "";
    if (hpDamage > 0) spawnSceneFloat("player", `-${hpDamage}`, "damage");
    if (blocked > 0) spawnSceneFloat("player", `BLOCK ${blocked}`, "shield");
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
      spawnSceneFloat("enemy", `反撃 -${dealt}`, "retaliation");
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

      const reactions = battle.reactions || [];
      const awakenings = advanceUsageYears(reactions);
      lastNewRecipes = [];
      const changes = applyTransformations(reactions);
      if (awakenings.length) {
        flashSceneEffect("scene-awaken");
      } else if (changes.length) {
        flashSceneEffect("scene-transform");
      }
      const changeText = changes.length ? " 道具変化：" + changes.join("、") : "";
      const awakeningText = awakenings.length ? " 付喪神化：" + awakenings.join("、") : "";

      if (state.turn >= ENEMIES.length) {
        state.runOver = true;
        resultText = `${battle.enemyDef.name}を倒し、全${ENEMIES.length}戦を踏破しました。${changeText}${awakeningText}`;
      } else {
        state.turn += 1;
        state.shop = randomShop();
        state.rerollCount = 0;
        resultText = `${reward}文を獲得。戦闘後にHPを20回復しました。${changeText}${awakeningText}`;
      }

      el.battleResultTitle.textContent = state.runOver ? "踏破！" : "勝利";
      showSceneBanner(state.runOver ? "踏破！" : "勝利", "win");

      const discoveryLines = [];
      if (lastNewRecipes.length) {
        discoveryLines.push(`<strong>新レシピ発見</strong><br>${lastNewRecipes.join("、")}`);
      }
      if (awakenings.length) {
        discoveryLines.push(`<strong>付喪神化</strong><br>${awakenings.join("、")}`);
      }
      if (discoveryLines.length) {
        el.discoveryNotice.innerHTML = discoveryLines.join("<hr>");
        el.discoveryNotice.classList.remove("hidden");
      }
    } else {
      state.runOver = true;
      el.battleResultTitle.textContent = "敗北";
      showSceneBanner("敗北", "lose");
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
      const key = recipeKey(reaction.recipe);
      const wasKnown = state.discovered.has(key);
      state.discovered.add(key);

      const resultName = ITEM_DEFS[reaction.recipe.result].name;
      if (!wasKnown) lastNewRecipes.push(resultName);
      changedNames.push(resultName);
    }

    return changedNames;
  }

  function closeBattleModal() {
    document.body.classList.remove("battle-mode");
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

  window.TSUKUMOGAMI_INTERACTION = {
    selectForDrag,
    canDrop: dragTargetCanAccept,
    drop: performDragDrop,
    cancelDragSelection() {
      if (!state) return;
      state.selectedId = null;
      state.previewType = null;
      document.body.classList.remove("has-item-detail");
      renderAll();
    }
  };
})();
