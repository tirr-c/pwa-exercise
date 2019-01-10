import { register } from './push';

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

sw.addEventListener('pushsubscriptionchange', event => {
    if (event.newSubscription == null) {
        return;
    }
    const currentSubscription = event.newSubscription;
    const previousSubscription = event.oldSubscription || undefined;
    event.waitUntil(register(currentSubscription, previousSubscription));
});

sw.addEventListener('notificationclick', event => {
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
