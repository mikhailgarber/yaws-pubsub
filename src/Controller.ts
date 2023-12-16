import { WebSocket } from "ws";

type COMMAND_TYPE = 'subscribe' | 'unsubscribe' | 'publish';
type executeFunction = (payload: any) => void;

const subsByChannel: Map<string, Set<string>> = new Map();
const receiverById: Map<string, executeFunction> = new Map();

export function connect(clientId: string, func?: executeFunction) {
    if (func) {
        receiverById.set(clientId, func);
    }
}


export function disconnect(clientId: string) {
    receiverById.delete(clientId);
    for (const channel of subsByChannel.keys()) {
        doUnsubscribe({ channel }, 'unsubscribe', clientId);
    }
}

export async function executeCommand(clientId: string, message: any) {
    const command: COMMAND_TYPE = message.command;
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
        default:
            console.error(`unknown command: ${command}`)
    }
}

function printSubscriptions() {
    subsByChannel.forEach((value, key) => {
        console.log(`channel: ${key}, subscribers:`);
        value.forEach(subscriber => {
            console.log(subscriber);
        });
    });
}

function doSubscribe(message: any, command: string, clientId: string) {
    {
        const channel = getChannel(message, command);
        console.log(`subscribing ${clientId} to ${channel}`)
        let subs = subsByChannel.get(channel);
        if (!subs) {
            subs = new Set();
            subsByChannel.set(channel, subs);
        }
        subs.add(clientId);
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
                    const receiver = receiverById.get(sub);
                    if (receiver) {
                        receiver(payload);
                        console.log(`sent message from ${clientId} to ${sub}`);
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
        const subs = subsByChannel.get(channel);
        if (subs) {
            subs.delete(clientId);
            if (subs.size === 0) {
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

