try {
  var t = localStorage.getItem("health-theme");
  if (t && ["dark", "grey", "oled"].includes(t)) document.documentElement.dataset.theme = t;
} catch (e) {}
