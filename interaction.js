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

  function refreshDraggables(root = document) {
    root.querySelectorAll(selectors.draggable).forEach(node => {
      node.draggable = true;
      node.title = node.title || "ドラッグして移動できます";
    });
  }

  function clearDropTargets() {
    document.querySelectorAll(".drop-target").forEach(node => node.classList.remove("drop-target"));
  }

  document.addEventListener("dragstart", event => {
    const source = event.target.closest(selectors.draggable);
    if (!source) return;

    dragging = source;
    source.classList.add("dragging");

    // Reuse the core game's existing selection behavior.
    source.click();

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", "tsukumogami-item");
    }
  });

  document.addEventListener("dragend", () => {
    if (dragging) dragging.classList.remove("dragging");
    dragging = null;
    clearDropTargets();
  });

  document.addEventListener("dragover", event => {
    const target = event.target.closest(`${selectors.bagDrop}, ${selectors.stagingDrop}`);
    if (!target || !dragging) return;

    event.preventDefault();
    clearDropTargets();
    target.classList.add("drop-target");

    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  });

  document.addEventListener("dragleave", event => {
    const target = event.target.closest(".drop-target");
    if (target && !target.contains(event.relatedTarget)) {
      target.classList.remove("drop-target");
    }
  });

  document.addEventListener("drop", event => {
    const target = event.target.closest(`${selectors.bagDrop}, ${selectors.stagingDrop}`);
    if (!target || !dragging) return;

    event.preventDefault();
    clearDropTargets();

    // Reuse the core game's placement behavior.
    target.click();
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

  function moveTouchGhost(ghost, x, y, target) {
    if (!ghost) return;
    ghost.style.left = `${x}px`;
    ghost.style.top = `${y - 58}px`;
    ghost.classList.toggle("can-drop", Boolean(target && !target.classList.contains("place-invalid")));
    ghost.classList.toggle("cannot-drop", Boolean(target?.classList.contains("place-invalid")));
  }

  function removeTouchGhost(ghost) {
    if (ghost?.isConnected) ghost.remove();
  }

  document.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse") return;
    const source = event.target.closest(selectors.draggable);
    if (!source) return;

    pointerDrag = {
      id: event.pointerId,
      source,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
      target: null,
      ghost: null
    };
  }, { passive: true });

  document.addEventListener("pointermove", event => {
    if (!pointerDrag || pointerDrag.id !== event.pointerId) return;

    const dx = event.clientX - pointerDrag.startX;
    const dy = event.clientY - pointerDrag.startY;
    if (!pointerDrag.active && Math.hypot(dx, dy) < 9) return;

    if (!pointerDrag.active) {
      pointerDrag.active = true;
      pointerDrag.ghost = createTouchGhost(pointerDrag.source);
      pointerDrag.source.classList.add("dragging");
      pointerDrag.source.click();
      document.body.classList.add("touch-drag-active");
    }

    event.preventDefault();
    clearDropTargets();

    const underPointer = document.elementFromPoint(event.clientX, event.clientY);
    const target = underPointer?.closest?.(`${selectors.bagDrop}, ${selectors.stagingDrop}`) || null;
    pointerDrag.target = target;
    if (target) target.classList.add("drop-target");
    moveTouchGhost(pointerDrag.ghost, event.clientX, event.clientY, target);
  }, { passive: false });

  function finishPointerDrag(event) {
    if (!pointerDrag || pointerDrag.id !== event.pointerId) return;
    const drag = pointerDrag;
    pointerDrag = null;

    if (drag.active) {
      event.preventDefault();
      drag.source.classList.remove("dragging");
      clearDropTargets();
      removeTouchGhost(drag.ghost);
      document.body.classList.remove("touch-drag-active");
      if (drag.target?.isConnected) drag.target.click();
    }
  }

  document.addEventListener("pointerup", finishPointerDrag, { passive: false });
  document.addEventListener("pointercancel", event => {
    if (!pointerDrag || pointerDrag.id !== event.pointerId) return;
    pointerDrag.source.classList.remove("dragging");
    removeTouchGhost(pointerDrag.ghost);
    document.body.classList.remove("touch-drag-active");
    pointerDrag = null;
    clearDropTargets();
  });

  // app.js rebuilds bag/staging DOM frequently, so keep draggable attributes current.
  const observer = new MutationObserver(records => {
    for (const record of records) {
      record.addedNodes.forEach(node => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        if (node.matches?.(selectors.draggable)) {
          node.draggable = true;
          node.title = "ドラッグして移動できます";
        }
        refreshDraggables(node);
      });
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    refreshDraggables();
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
