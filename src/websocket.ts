import WebSocket from 'ws';

export const initWebsocket = (server) => {
    
    const wss = new WebSocket.WebSocketServer({ server });
    
    wss.on('connection', (ws) => {
        console.log("Socket Connect Successfully");
        ws.on('message', (msg) => {
            const messageString = msg.toString(); // Convert Buffer to string
          
            ws.send(`This message from socket: ${messageString}`);
        })

        ws.on('close', () => {
            console.log("client disconnected");
        })

        return wss;
    })

}