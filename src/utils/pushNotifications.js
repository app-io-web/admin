async function registrarNotificacaoPush(unicID) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.error('🚫 Navegador não suporta notificações push');
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('🔕 Permissão de notificação negada pelo usuário');
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array('BJGZB2ya9Iupel0LqPNj3jNnFB21rgy1j4Xyc6Jlqiae6e7xXK8yKXfWvzEzsPLMFKjz9JqmXOo2mXMgN9-MI3E')
  });

  const res = await fetch('https://api.chat.nexusnerds.com.br/notificacao/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unicID, subscription })
  });

  if (res.ok) {
    console.log('✅ Subscription registrada com sucesso!');
  } else {
    console.error('❌ Falha ao registrar subscription');
  }
}



// Função auxiliar para converter a chave VAPID
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return new Uint8Array([...raw].map(char => char.charCodeAt(0)));
}

export { registrarNotificacaoPush };
