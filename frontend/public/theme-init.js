try {
  var t = localStorage.getItem("world-theme");
  if (t && ["dark", "grey", "oled"].includes(t)) document.documentElement.dataset.theme = t;
  // Realm drives --accent, so restoring it here avoids a flash of the wrong
  // accent before React mounts. Keep this list in sync with `realms` in
  // frontend/src/app/core.ts.
  var r = localStorage.getItem("world-realm");
  if (r && ["health", "money", "settings"].includes(r)) document.documentElement.dataset.realm = r;
} catch (e) {}
