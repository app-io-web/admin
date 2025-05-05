self.addEventListener('push', function (event) {
  const data = event.data?.json() || {};

  console.log('📥 Notificação recebida via push:', data);

  const title = data.title || 'Nova mensagem';
  const options = {
    body: data.body || 'Você recebeu uma nova mensagem',
    icon: data.icon || '/vite.svg',
    data: data.data || {}, // inclui os dados extras (ex: { de, para })
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  console.log('🖱️ Notificação clicada:', event.notification);
  event.notification.close();

  const notificationData = event.notification.data || {};

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          console.log('🔄 Focando janela existente e enviando mensagem...');
          client.postMessage({ type: 'ABRIR_CHAT', payload: notificationData });
          return client.focus();
        }
      }

      // fallback: abrir nova aba
      console.log('🆕 Abrindo nova aba /admin/chat');
      return clients.openWindow('/admin/chat');
    })
  );
});
