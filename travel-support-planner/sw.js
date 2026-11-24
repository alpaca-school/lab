"use strict";

// Starter Kit intentionally does not cache assets.
// Add a cache strategy only after the game requirements justify it.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
