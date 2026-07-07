(function () {
  var storageKey = "motm-theme";
  var stored = localStorage.getItem(storageKey);
  var theme = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  var resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  var root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  }
  root.style.colorScheme = resolved;

  var languageKey = "motm-language";
  var language = localStorage.getItem(languageKey);
  if (language === "en" || language === "th") {
    root.lang = language;
  }
})();
