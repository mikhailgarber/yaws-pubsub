# Yet Another Web Socket PubSub - YAWS-PubSub

Here is another one of those websocket brokers that allow for pubsub message exchange. Unlike others you might see elsewhere, this one
can augument your existign http server, i.e. Express.

## Commands

After client connects to a websocket (with optional external authentication), they can issue commands by sending these JSON messages:

```
{
    "command" : "subscribe",
    "channel" : "string-name"
}
```

```
{
    "command" : "unsubscribe",
    "channel" : "string-name"
}
```

```
{
    "command" : "publish",
    "channel" : "string-name",
    "payload" : { some - object}
}
```
## How to start using built-in http server


```
const server = http.createServer();
start(server);
server.listen(PORT);
```

Also see ./tests/TestUtils.ts

## how to integrate with existing Express server

pass instance of Express to createServer:


```
import express, { Request, Response } from 'express';
import http from 'http';
import { start } from 'yaws-pubsub/Server';

const app = express();
const port = 3000;

app.get('/hello', (req: Request, res: Response) => {
    res.send('Hello from Express!');
});

const server = http.createServer(app);
start(server);

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
```

