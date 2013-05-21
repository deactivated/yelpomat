console.log("inject-start");

window.addEventListener("message", function (event) {
  "use strict";
  if (event.source !== window) {
    return;
  }

  if (event.data.type && (event.data.type === "focus_thumb")) {
    var target_thumb = event.data.url;
    $('img[src="' + target_thumb + '"]').closest("a").click();
  }
}, false);

console.log("inject-end");
