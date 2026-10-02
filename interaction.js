(() => {
  "use strict";

  // Desktop convenience layer. The core game remains tap-to-select/tap-to-place,
  // which works well on phones; this adds drag & drop without coupling to app.js internals.
  const selectors = {
    draggable: ".bag-cell.occupied, .staging-slot.filled",
    bagDrop: ".bag-cell.empty",
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
