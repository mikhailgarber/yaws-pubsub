import http from 'http';
import WebSocket from 'ws';

const TEST_PORT = 7124;


export async function awaitReceive(socket: WebSocket): Promise<any> {
    return new Promise((resolve, reject) => {
        socket.on('message', (data: WebSocket.RawData, isBinary: boolean) => {
            resolve(JSON.parse(data.toString()));
        });
    });
}

export async function awaitSend(socket: WebSocket, message: any) {
    const payload = JSON.stringify(message);
    return new Promise((resolve, reject) => {
        socket.send(payload, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve('ok');
            }
        });
    });
}

export async function createClientSocket(path?: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${TEST_PORT}/${path ? path : ''}`);
        ws.on('open', () => {
            console.log('client ws open');
            resolve(ws);
        });
        ws.on('error', (error) => {
            reject(error);
        });
    });
}

export async function startServer(server: http.Server) {

    return new Promise((resolve, reject) => {
        server.on('listening', () => {
            console.log('http server is listening')
            resolve('ok');
        })
        server.on('error', (error) => {
            reject(error);
        })
        server.listen(TEST_PORT);
    });
}

export async function stopServer(server: http.Server) {
    return new Promise((resolve, reject) => {

        server.on('close', () => {
            console.log('http server is closed')
            resolve('ok');
        });
        server.on('error', (error) => {
            reject(error);
        })
        server.close();
    });
}

export class DeferredPromise {
    promise: Promise<any>;
    reject: (reason?: any) => void = () => {};
    resolve: (value: any) => void = () => {};;
    
    constructor() {
      this.promise = new Promise((resolve, reject) => {
        this.reject = reject;
        this.resolve = resolve;
      });
    }
  }