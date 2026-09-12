self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = { title: 'Bkkari Tech', body: event.data?.text?.() || 'عندك تحديث جديد' }; }
  event.waitUntil(self.registration.showNotification(data.title || 'Bkkari Tech', { body: data.body || 'عندك تحديث جديد', icon: data.icon || '/brand/logo.svg', badge: '/brand/logo.svg', data: { href: data.href || '/' } }));
});
self.addEventListener('notificationclick', (event) => { event.notification.close(); const href = event.notification.data?.href || '/'; event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => { for (const client of list) if ('focus' in client) { client.navigate(href); return client.focus(); } return clients.openWindow(href); })); });
