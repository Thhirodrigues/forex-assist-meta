self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('intent://#Intent;package=com.xm.webapp;scheme=xm;end'));
});
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
