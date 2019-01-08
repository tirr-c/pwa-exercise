(self as unknown as ServiceWorkerGlobalScope).addEventListener('push', event => {
    if (event.data == null) {
        return;
    }
    // TODO: Handle event
    // const payload = event.data.text();
});
