import {connect, disconnect, executeCommand} from './Controller';
import { DeferredPromise } from './TestUtils';

test('connect two clients and send message', async () => {
    const sender = 'sender';
    const receiver = 'receiver';
    try {
        connect('sender');
        const receivedPromise = new DeferredPromise();
        connect(receiver, payload => {
            receivedPromise.resolve(payload);
        });
        executeCommand(receiver, {command: 'subscribe', channel: 'test23'});
        executeCommand(sender, {command: 'publish', channel: 'test23', payload: 'hello world'});
        const receivedMessage = await receivedPromise.promise;
        expect(receivedMessage).toBe('hello world');
    } finally {
        disconnect(sender);
        disconnect(receiver);
    }
});