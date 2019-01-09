const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener('push', event => {
    if (event.data == null) {
        return;
    }

    // Handle event
    const data = event.data.json();
    sw.registration.showNotification('PWA Exercise', {
        body: data.body,
    });
});

sw.addEventListener('notificationclick', async event => {
    const clients = sw.clients;
    event.waitUntil((async () => {
        const clientList = await clients.matchAll({ type: 'window' });
        for (const client of clientList) {
            if (WindowClient != null && client instanceof WindowClient) {
                client.focus();
                return;
            }
        }

        // No open window found, open a new one
        if (clients.openWindow) {
            await clients.openWindow('/');
        }
    })());
});
