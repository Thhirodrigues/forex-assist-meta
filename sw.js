self.addEventListener('notificationclick', e => { e.notification.close(); });
self.addEventListener('push', e => {});
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => {});
self.show = (t,b) => self.registration.showNotification(t,{body:b,icon:'icon-192.png',vibrate:[1000,500,1000,500,1000],requireInteraction:true});
