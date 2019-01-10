import React from 'react';
import ReactDOM from 'react-dom';

import { subscribe } from './push';

if ('serviceWorker' in navigator) {
    navigator
        .serviceWorker
        .register('service-worker.js')
        .then(async registration => {
            console.log('Service Worker registered');
            const ret = await subscribe(registration);
            console.log('Push subscribed');
            return ret;
        })
        .catch(err => {
            console.error(err);
        });
}

if (Notification != null && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            new Notification('Notification is now enabled!');
        }
    });
}

const app = document.createElement('div');
document.body.appendChild(app);

ReactDOM.render(
    (<div />),
    app,
);
