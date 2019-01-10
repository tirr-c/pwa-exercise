import fs from 'fs';

import Koa from 'koa';
import cors from '@koa/cors';
import bodyparser from 'koa-bodyparser';
import Router from 'koa-router';
import webpush from 'web-push';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8000;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || '';

function subToString(subscription: webpush.PushSubscription) {
    return `${subscription.endpoint}|${subscription.keys.auth}|${subscription.keys.p256dh}`;
}

function stringToSub(subKey: string): webpush.PushSubscription {
    const raw = subKey.split('|');
    if (raw.length !== 3) {
        throw new Error(`${subKey} is not a valid key`);
    }
    return {
        endpoint: raw[0],
        keys: {
            auth: raw[1],
            p256dh: raw[2],
        },
    };
}

async function main() {
    let vapidKeys: webpush.VapidKeys;
    try {
        await fs.promises.access('vapid.json', fs.constants.R_OK);
        vapidKeys = JSON.parse(await fs.promises.readFile('vapid.json', { encoding: 'utf8' }));
    } catch (_) {
        console.debug('Generating new VAPID keys.');
        vapidKeys = webpush.generateVAPIDKeys();
        await fs.promises.writeFile('vapid.json', JSON.stringify(vapidKeys), {
            encoding: 'utf8',
            mode: 0o400,
        });
    }
    webpush.setVapidDetails(
        VAPID_SUBJECT,
        vapidKeys.publicKey,
        vapidKeys.privateKey,
    );

    const binaryPublicKey = Buffer.from(vapidKeys.publicKey.replace(/\-/g, '+').replace(/_/g, '/'), 'base64');

    const subMap = new Map();

    const app = new Koa();
    const router = new Router();

    router.get('/vapid', (ctx, next) => {
        ctx.body = binaryPublicKey;
    });

    router.get('/vapid.txt', (ctx, next) => {
        ctx.body = vapidKeys.publicKey;
    });

    router.post('/register', (ctx, next) => {
        const body = ctx.request.body;
        ctx.assert('current' in body, 400);
        const currentKey = subToString(body.current);
        let registerData: any = {};
        if ('previous' in body) {
            const previousKey = subToString(body.previous);
            if (subMap.has(previousKey)) {
                registerData = subMap.get(previousKey);
                subMap.delete(previousKey);
            }
        }
        subMap.set(currentKey, registerData);
        ctx.status = 201;
    });

    router.get('/notify', async (ctx, next) => {
        const promises = [];
        for (const [sub] of subMap.entries()) {
            const subscription = stringToSub(sub);
            promises.push(
                webpush.sendNotification(subscription, JSON.stringify({ body: 'Notify from server!' }))
            );
        }
        await Promise.all(promises);
        ctx.status = 204;
    });

    app
        .use(bodyparser())
        .use(cors())
        .use(router.routes())
        .use(router.allowedMethods());

    app.listen(PORT, () => {
        console.debug('Listening on port', PORT);
    });
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
