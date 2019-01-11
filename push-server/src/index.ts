import fs from 'fs';

import Koa from 'koa';
import cors from '@koa/cors';
import bodyparser from 'koa-bodyparser';
import Router from 'koa-router';
import webpush from 'web-push';

interface SubscriptionState {
}

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

function serializeSubMap(subMap: Map<string, SubscriptionState>): string {
    const obj: { [key: string]: SubscriptionState; } = {};
    for (const [key, value] of subMap.entries()) {
        obj[key] = value;
    }
    return JSON.stringify(obj);
}

function deserializeSubMap(rawSubMap: string): Map<string, SubscriptionState> {
    const obj: { [key: string]: SubscriptionState; } = JSON.parse(rawSubMap);
    return new Map(Object.entries(obj));
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

    let subMap = new Map();
    try {
        const rawSubMap = await fs.promises.readFile('subscribers.json', { encoding: 'utf8' });
        subMap = deserializeSubMap(rawSubMap);
    } catch (_) {
    }

    const binaryPublicKey = Buffer.from(vapidKeys.publicKey.replace(/\-/g, '+').replace(/_/g, '/'), 'base64');

    const app = new Koa();
    const router = new Router();

    router.get('/vapid', (ctx, next) => {
        ctx.body = binaryPublicKey;
    });

    router.get('/vapid.txt', (ctx, next) => {
        ctx.body = vapidKeys.publicKey;
    });

    router.post('/register', async (ctx, next) => {
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
        } else if (subMap.has(currentKey)) {
            registerData = subMap.get(currentKey);
        }
        subMap.set(currentKey, registerData);
        await fs.promises.writeFile('subscribers.json', serializeSubMap(subMap), {
            encoding: 'utf8',
            mode: 0o600,
        });
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
