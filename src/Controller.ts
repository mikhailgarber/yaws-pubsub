import { WebSocket } from "ws";

type COMMAND_TYPE = 'subscribe' | 'unsubscribe' | 'publish';

const subsByChannel: Map<string, Array<any>> = new Map();
const socketsById: Map<string, WebSocket> = new Map();

export async function executeCommand(clientId: string, command: COMMAND_TYPE, message: any) {
    console.log(`executing command ${command} from ${clientId}`)
    switch (command) {
        case 'subscribe':
            doSubscribe(message, command, clientId);
            printSubscriptions();
            break;

        case 'publish':
            doPublish(message, command, clientId);
            break;

        case 'unsubscribe':
            doUnsubscribe(message, command, clientId);
            printSubscriptions();
            break;
    }
}

function printSubscriptions() {
    subsByChannel.forEach((value, key) => {
        console.log(`channel: ${key}, subscribers: ${value}`);
    });
}

function doSubscribe(message: any, command: string, clientId: string) {
    {
        const channel = getChannel(message, command);
        console.log(`subscribing ${clientId} to ${channel}`)
        let subs = subsByChannel.get(channel);
        if (!subs) {
            subs = [];
            subsByChannel.set(channel, subs);
        }
        subs.push(clientId);
    }
}

function doPublish(message: any, command: string, clientId: string) {
    {
        const channel = getChannel(message, command);
        const subs = subsByChannel.get(channel);
        const payload = message.payload;
        if (!payload) {
            throw new Error(`payload is missing in ${command}`);
        }

        if (subs) {
            for (const sub of subs) {
                setImmediate(() => {
                    const socket = socketsById.get(sub);
                    if (socket) {
                        const stringPayload = JSON.stringify(payload);
                        socket.send(stringPayload, () => {
                            console.log(`sent message from ${clientId} to ${sub}: ${stringPayload}`);
                        });
                    }
                });
            }
        }
    }
}

function doUnsubscribe(message: any, command: string, clientId: string) {
    {
        const channel = getChannel(message, command);
        console.log(`unsubscribing ${clientId} from ${channel}`)
        let subs = subsByChannel.get(channel);
        if (subs) {
            const idx = subs.indexOf(clientId);
            if (idx > -1) {
                subs.splice(idx);
            }
            if (subs.length === 0) {
                subsByChannel.delete(channel);
                console.log(`deleted subs for channel: ${channel}`);
            }
        }

    }
}


function getChannel(message: any, command: string) {
    const channel = message.channel;
    if (!channel) {
        throw new Error(`channel is missing in ${command}`);
    }
    return channel;
}

export function connect(clientId: string, socket: WebSocket) {
    console.log(`new connection ${clientId}`)
    socketsById.set(clientId, socket);
}

export function disconnect(clientId: string) {
    console.log(`closing client ${clientId}`)
    socketsById.delete(clientId);
    for (const channel of subsByChannel.keys()) {
        doUnsubscribe({ channel }, 'unsubscribe', clientId);
    }
}