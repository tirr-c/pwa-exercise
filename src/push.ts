export async function subscribe(
    registration: ServiceWorkerRegistration,
): Promise<PushSubscription> {
    let subscription;
    subscription = await registration.pushManager.getSubscription();
    if (subscription == null) {
        const resp = await fetch(new URL('/vapid', PUSH_BASE_URL).toString());
        const vapid = new Uint8Array(await resp.arrayBuffer());
        subscription = await registration
            .pushManager
            .subscribe({
                userVisibleOnly: true,
                applicationServerKey: vapid,
            });
    }

    await register(subscription);

    return subscription;
}

export async function register(
    currentSubscription: PushSubscription,
    previousSubscription?: PushSubscription,
) {
    const resp = await fetch(
        new URL('/register', PUSH_BASE_URL).toString(),
        {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                current: currentSubscription,
                previous: previousSubscription,
            }),
        },
    );

    if (resp.status !== 201) {
        throw new Error('Failed to subscribe to push');
    }
}
