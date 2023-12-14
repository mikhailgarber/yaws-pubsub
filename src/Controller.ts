import { WebSocket } from "ws";

type COMMAND_TYPE = 'subscribe' | 'unsubscribe' | 'publish';

const subsByChannel: Map<string, Array<any>> = new Map();
const socketsById: Map<string, WebSocket> = new Map();

export async function executeCommand(clientId: string, command: COMMAND_TYPE, message: any) {
    console.log(`executing command ${command} from ${clientId}`)
    switch (command) {
        case 'subscribe':
            {
                let { subs, channel } = getSubs(message, command);
                if (!subs) {
                    subs = [];
                    subsByChannel.set(channel, subs);
                }
                subs.push(clientId);
            }
            subsByChannel.forEach((value, key) => {
                console.log(`channel: ${key}, subscribers: ${value}`)
            });
            break;

        case 'publish':
            {
                const { subs, channel } = getSubs(message, command);

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
                                    console.log(`sent message from ${clientId} to ${sub}: ${stringPayload}`)
                                });
                            }
                        });
                    }
                }
            }
            break;

        case 'unsubscribe':
            {
                let { subs, channel } = getSubs(message, command);
                if (subs) {
                    const idx = subs.indexOf(clientId);
                    if (idx > -1) {
                        subs.splice(idx);
                    }
                    if (subs.length === 0) {
                        subsByChannel.delete(channel);
                        console.log(`deleted subs for channel: ${channel}`)
                    }
                }

            }
            subsByChannel.forEach((value, key) => {
                console.log(`channel: ${key}, subscribers: ${value}`)
            });
            break;
    }
}

function getSubs(message: any, command: string) {
    const channel = message.channel;
    if (!channel) {
        throw new Error(`channel is missing in ${command}`);
    }
    let subs = subsByChannel.get(channel);
    return { subs, channel };
}

export function connect(clientId: string, socket: WebSocket) {
    console.log(`new connection ${clientId}`)
    socketsById.set(clientId, socket);
}

export function disconnect(clientId: string) {
    console.log(`closing client ${clientId}`)
    socketsById.delete(clientId);
}