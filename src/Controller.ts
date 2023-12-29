
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
        doUnsubscribe({ channel }, clientId);
    }
}

export async function executeCommand(clientId: string, message: any) {
    try {
        const command: COMMAND_TYPE = message.command;
        switch (command) {
            case 'subscribe':
                doSubscribe(message, clientId);
                printSubscriptions();
                break;

            case 'publish':
                doPublish(message);
                break;

            case 'unsubscribe':
                doUnsubscribe(message, clientId);
                printSubscriptions();
                break;
            default:
                console.error(`unknown command: ${command}`)
        }
    } catch (err) {
        console.error(`error executing command in message:${JSON.stringify(message)}\n, ${err}`)
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

function doSubscribe(message: any, clientId: string) {

    const channel = getChannel(message);
    console.log(`subscribing ${clientId} to ${channel}`)
    let subs = subsByChannel.get(channel);
    if (!subs) {
        subs = new Set();
        subsByChannel.set(channel, subs);
    }
    subs.add(clientId);
    doPublish({ channel: 'system-subscriptions', payload: message }, true);
}

function doPublish(message: any, allowSystem?: boolean) {

    const channel = getChannel(message);
    if (channel.startsWith('system') && !allowSystem) {
        throw new Error('cant publish to system channels');
    }
    const subs = subsByChannel.get(channel);
    const payload = message.payload;
    if (!payload) {
        throw new Error(`payload is missing in ${message.command}`);
    }

    if (subs) {
        for (const sub of subs) {
            setImmediate(() => {
                const receiver = receiverById.get(sub);
                if (receiver) {
                    receiver(payload);
                }

            });
        }
    }

}

function doUnsubscribe(message: any, clientId: string) {

    const channel = getChannel(message);
    console.log(`unsubscribing ${clientId} from ${channel}`)
    const subs = subsByChannel.get(channel);
    if (subs) {
        subs.delete(clientId);
        if (subs.size === 0) {
            subsByChannel.delete(channel);
            console.log(`deleted subs for channel: ${channel}`);
        }
    }
    doPublish({ channel: 'system-subscriptions', payload: message }, true);
}


function getChannel(message: any): string {
    const channel = message.channel;
    if (!channel) {
        throw new Error(`channel is missing in ${message.command}`);
    }
    return channel;
}

