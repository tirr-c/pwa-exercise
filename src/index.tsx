import React from 'react';
import ReactDOM from 'react-dom';

if ('serviceWorker' in navigator) {
    navigator
        .serviceWorker
        .register('service-worker.js')
        .then(_registration => {
            console.log('Service Worker registered');
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
