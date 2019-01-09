import React from 'react';
import ReactDOM from 'react-dom';

if ('serviceWorker' in navigator) {
    navigator
        .serviceWorker
        .register('service-worker.js')
        .then(registration => {
            console.log('Service Worker registered');
            return registration.pushManager
                .getSubscription()
                .then(async subscription => {
                    if (subscription != null) {
                        return subscription;
                    }
                    const resp = await fetch(new URL('/vapid', PUSH_BASE_URL).toString());
                    const vapid = new Uint8Array(await resp.arrayBuffer());
                    return await registration
                        .pushManager
                        .subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: vapid,
                        });
                });
        })
        .then(subscription => {
            // TODO: Send subscription to the server
            console.log('Push subscribed');
        })
        .catch(err => {
            console.error(err);
        });
}

const app = document.createElement('div');
document.body.appendChild(app);

ReactDOM.render(
    (<div />),
    app,
);
