
import http from 'http';
import WebSocket from 'ws';
import { start } from '../src/Server';
import { sleep } from '../src/Utils';
import { awaitReceive, awaitSend, createClientSocket, startServer, stopServer } from './TestUtils';

test('Hello World', async () => {
    const server = http.createServer();
    await startServer(server);
    let senderSocket: WebSocket;
    let receiverSocket: WebSocket;
    try {
        console.log('testing using http server')
        start(server);
        receiverSocket = await createClientSocket();
        senderSocket = await createClientSocket();
        await awaitSend(receiverSocket, { command: 'subscribe', channel: 'test' });
        await sleep(200);
        await awaitSend(senderSocket, { command: 'publish', channel: 'test', payload: { message: 'hello world' } });
        const receivedMessage = await awaitReceive(receiverSocket);
        console.log(`received message ${JSON.stringify(receivedMessage)}`)
        expect(receivedMessage.message).toBe('hello world');
        await awaitSend(receiverSocket, { command: 'unsubscribe', channel: 'test' });
        await sleep(200);
        await awaitSend(senderSocket, { command: 'publish', channel: 'test', payload: { message: 'hello world' } });
    } finally {
        if (senderSocket) {
            senderSocket.close();
        }
        if (receiverSocket) {
            receiverSocket.close();
        }
        await stopServer(server);
        await sleep(200);
    }
});

