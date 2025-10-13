(function () {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("scripts/terraflow.js");
  (document.head || document.documentElement).appendChild(script);
})();