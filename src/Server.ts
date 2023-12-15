import http from 'http';
import https from 'https';
import * as net from 'net';
import WebSocket from 'ws';
import { v4 as uuid } from 'uuid';
import { connect, disconnect, executeCommand } from './Controller';

console.log('hello yaws-pubsub');

let wss: WebSocket.Server;

export function start(server: http.Server | https.Server, authenticate?: (socket: WebSocket, request: http.IncomingMessage) => boolean) {


    wss = new WebSocket.Server({
        noServer: true
    });
    console.log('created web socket server')

    wss.on('error', (error: Error) => {
        console.error(`ws server error: ${error}`)
    });

    wss.on('connection', (socket: WebSocket, request: http.IncomingMessage) => {
        const id = uuid();

        connect(id, socket);

        socket.on('close', () => {
            disconnect(id);
        });
        socket.on('error', error => {
            console.error(`error in client ${id}`, error);
        });

        socket.on('message', (data: WebSocket.RawData, isBinary: boolean) => {
            if (isBinary) {
                console.error(`messages can only be text`);
                return;
            }
            try {
                const message = JSON.parse(data ? data.toString() : '{}');

                console.log(`incoming message from ${id} ${data}`)
                const command = message.command;
                if (!command) {
                    console.error(`incoming command message does not contain a command`);
                    return;
                }
                setImmediate(async () => {
                    await executeCommand(id, command, message);
                });
            } catch (err) {
                console.error(`unexpected error handling message: ${err}`)
            }
        });

        if (authenticate) {
            const authResult = authenticate(socket, request);
            if (!authResult) {
                console.log('connection failed provided authentication check');
                socket.close();
            }
        }


    });


    server.on('upgrade', (request: http.IncomingMessage, socket: net.Socket, head: Buffer) => {
        console.log('server upgrade connection')
        wss.handleUpgrade(request, socket, head, (webSocket) => {
            wss.emit('connection', webSocket, request);
        });
    })

}

