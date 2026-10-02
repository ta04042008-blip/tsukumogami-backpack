(() => {
  "use strict";

  // Desktop convenience layer. The core game remains tap-to-select/tap-to-place,
  // which works well on phones; this adds drag & drop without coupling to app.js internals.
  const selectors = {
    draggable: ".bag-cell.occupied, .staging-slot.filled",
    bagDrop: ".bag-cell",
    stagingDrop: ".staging-slot:not(.filled)"
  };

  let dragging = null;
  let suppressClickUntil = 0;

  function interactionApi() {
    return window.TSUKUMOGAMI_INTERACTION || null;
  }

  function itemIdFromSource(source) {
    return source?.dataset?.itemId || null;
  }

  function targetInfoFromNode(node) {
    if (!node) return null;
    if (node.matches?.(".bag-cell")) {
      return {
        kind: "bag",
        x: Number(node.dataset.x),
        y: Number(node.dataset.y)
      };
    }
    if (node.matches?.(".staging-slot:not(.filled)")) {
      return { kind: "staging" };
    }
    return null;
  }

  function dropValidity(itemId, targetNode) {
    const api = interactionApi();
    const target = targetInfoFromNode(targetNode);
    if (!api || !itemId || !target) return false;
    return Boolean(api.canDrop(itemId, target));
  }

  function refreshDraggables(root = document) {
    const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;
    root.querySelectorAll(selectors.draggable).forEach(node => {
      node.draggable = !coarsePointer;
      node.title = node.title || "ドラッグして移動できます";
    });
  }

  function clearDropTargets() {
    document.querySelectorAll(".drop-target, .drop-valid, .drop-invalid").forEach(node => {
      node.classList.remove("drop-target", "drop-valid", "drop-invalid");
    });
  }

  function markDropTarget(target, valid) {
    clearDropTargets();
    if (!target) return;
    target.classList.add("drop-target", valid ? "drop-valid" : "drop-invalid");
  }

  document.addEventListener("dragstart", event => {
    const source = event.target.closest(selectors.draggable);
    if (!source) return;

    const itemId = itemIdFromSource(source);
    if (!itemId || !interactionApi()?.selectForDrag(itemId)) {
      event.preventDefault();
      return;
    }

    dragging = { source, itemId };
    source.classList.add("dragging");

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", itemId);
    }
  });

  document.addEventListener("dragend", () => {
    if (dragging?.source) dragging.source.classList.remove("dragging");
    interactionApi()?.cancelDragSelection();
    dragging = null;
    clearDropTargets();
  });

  document.addEventListener("dragover", event => {
    const target = event.target.closest(`${selectors.bagDrop}, ${selectors.stagingDrop}`);
    if (!target || !dragging) return;

    event.preventDefault();
    const valid = dropValidity(dragging.itemId, target);
    markDropTarget(target, valid);

    if (event.dataTransfer) event.dataTransfer.dropEffect = valid ? "move" : "none";
  });

  document.addEventListener("dragleave", event => {
    const target = event.target.closest(".drop-target");
    if (target && !target.contains(event.relatedTarget)) {
      target.classList.remove("drop-target");
    }
  });

  document.addEventListener("drop", event => {
    const targetNode = event.target.closest(`${selectors.bagDrop}, ${selectors.stagingDrop}`);
    if (!targetNode || !dragging) return;

    event.preventDefault();
    const target = targetInfoFromNode(targetNode);
    if (target && dropValidity(dragging.itemId, targetNode)) {
      interactionApi()?.drop(dragging.itemId, target);
    } else {
      interactionApi()?.cancelDragSelection();
    }
    clearDropTargets();
  });

  // Pointer-based drag for phones/tablets. HTML5 drag events are unreliable on iOS,
  // so this mirrors the same select -> empty-cell click flow with Pointer Events.
  let pointerDrag = null;

  function createTouchGhost(source) {
    const ghost = document.createElement("div");
    ghost.className = "touch-drag-ghost";
    ghost.innerHTML = source.innerHTML;
    ghost.setAttribute("aria-hidden", "true");
    document.body.appendChild(ghost);
    return ghost;
  }

  function moveTouchGhost(ghost, x, y, target, valid) {
    if (!ghost) return;
    ghost.style.left = `${x}px`;
    ghost.style.top = `${y - 58}px`;
    ghost.classList.toggle("can-drop", Boolean(target && valid));
    ghost.classList.toggle("cannot-drop", Boolean(target && !valid));
  }

  function removeTouchGhost(ghost) {
    if (ghost?.isConnected) ghost.remove();
  }

  function cleanupPointerDrag({ suppressClick = false } = {}) {
    if (!pointerDrag) return;
    const drag = pointerDrag;
    pointerDrag = null;

    drag.source?.classList.remove("dragging");
    removeTouchGhost(drag.ghost);
    document.body.classList.remove("touch-drag-active");
    clearDropTargets();

    if (drag.active) interactionApi()?.cancelDragSelection();
    if (suppressClick) suppressClickUntil = performance.now() + 500;
  }

  document.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse" || event.isPrimary === false || pointerDrag) return;
    const source = event.target.closest(selectors.draggable);
    if (!source) return;

    const itemId = itemIdFromSource(source);
    if (!itemId) return;

    pointerDrag = {
      id: event.pointerId,
      source,
      itemId,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
      target: null,
      ghost: null
    };

    try {
      source.setPointerCapture?.(event.pointerId);
    } catch {
      // Pointer capture is an optimization, not a requirement.
    }
  }, { passive: true });

  document.addEventListener("pointermove", event => {
    if (!pointerDrag || pointerDrag.id !== event.pointerId) return;

    const dx = event.clientX - pointerDrag.startX;
    const dy = event.clientY - pointerDrag.startY;
    if (!pointerDrag.active && Math.hypot(dx, dy) < 9) return;

    if (!pointerDrag.active) {
      if (!interactionApi()?.selectForDrag(pointerDrag.itemId)) {
        cleanupPointerDrag();
        return;
      }
      pointerDrag.active = true;
      pointerDrag.ghost = createTouchGhost(pointerDrag.source);
      pointerDrag.source.classList.add("dragging");
      document.body.classList.add("touch-drag-active");
    }

    event.preventDefault();

    const underPointer = document.elementFromPoint(event.clientX, event.clientY);
    const target = underPointer?.closest?.(`${selectors.bagDrop}, ${selectors.stagingDrop}`) || null;
    const valid = dropValidity(pointerDrag.itemId, target);
    pointerDrag.target = target;
    markDropTarget(target, valid);
    moveTouchGhost(pointerDrag.ghost, event.clientX, event.clientY, target, valid);
  }, { passive: false });

  function finishPointerDrag(event) {
    if (!pointerDrag || pointerDrag.id !== event.pointerId) return;
    const drag = pointerDrag;

    if (!drag.active) {
      pointerDrag = null;
      return;
    }

    event.preventDefault();
    suppressClickUntil = performance.now() + 500;
    pointerDrag = null;

    drag.source?.classList.remove("dragging");
    removeTouchGhost(drag.ghost);
    document.body.classList.remove("touch-drag-active");
    clearDropTargets();

    const target = targetInfoFromNode(drag.target);
    if (drag.target?.isConnected && target && dropValidity(drag.itemId, drag.target)) {
      interactionApi()?.drop(drag.itemId, target);
    } else {
      interactionApi()?.cancelDragSelection();
    }
  }

  document.addEventListener("pointerup", finishPointerDrag, { passive: false });
  document.addEventListener("pointercancel", event => {
    if (!pointerDrag || pointerDrag.id !== event.pointerId) return;
    cleanupPointerDrag({ suppressClick: pointerDrag.active });
  });

  document.addEventListener("lostpointercapture", event => {
    if (!pointerDrag || pointerDrag.id !== event.pointerId) return;
    cleanupPointerDrag({ suppressClick: pointerDrag.active });
  }, true);

  document.addEventListener("click", event => {
    if (performance.now() >= suppressClickUntil) return;
    if (!event.target.closest(".bag-grid, .staging-area")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  window.addEventListener("blur", () => cleanupPointerDrag({ suppressClick: Boolean(pointerDrag?.active) }));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cleanupPointerDrag({ suppressClick: Boolean(pointerDrag?.active) });
  });

  // app.js rebuilds bag/staging DOM frequently, so keep draggable attributes current.
  const observer = new MutationObserver(records => {
    for (const record of records) {
      record.addedNodes.forEach(node => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        if (node.matches?.(selectors.draggable)) {
          node.title = "ドラッグして移動できます";
        }
        refreshDraggables(node.parentElement || node);
      });
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    refreshDraggables();
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
