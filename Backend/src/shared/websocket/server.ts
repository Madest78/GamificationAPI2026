import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { jwtVerify } from 'jose';
import { env } from '@/config/env.js';

interface AuthenticatedSocket extends WebSocket {
    userId?: string;
    email?: string;
}

interface WSMessage {
    type: string;
    payload?: unknown;
}

export function setupWebSocket(server: Server): WebSocketServer {
    const wss = new WebSocketServer({ server });

    wss.on('connection', async (ws: AuthenticatedSocket, req) => {
        console.log('[WS] New connection');

        // Аутентификация через query string или headers
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const token = url.searchParams.get('token') || req.headers.authorization?.split(' ')[1];

        if (!token) {
            ws.close(4001, 'Token required');
            return;
        }

        try {
            const secret = new TextEncoder().encode(env.JWT_SECRET);
            const { payload } = await jwtVerify(token, secret);

            ws.userId = payload.sub as string;
            ws.email = payload.email as string;

            console.log(`[WS] User authenticated: ${ws.email}`);

            // Отправляем приветствие
            ws.send(JSON.stringify({ type: 'connected', payload: { userId: ws.userId } }));

            // Обработка сообщений
            ws.on('message', (data) => {
                try {
                    const message: WSMessage = JSON.parse(data.toString());
                    handleMessage(ws, message);
                } catch (error) {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid message format' } }));
                }
            });

            ws.on('close', () => {
                console.log(`[WS] User disconnected: ${ws.email}`);
            });

        } catch (error) {
            ws.close(4002, 'Invalid token');
        }
    });

    console.log('[WS] WebSocket server initialized');
    return wss;
}

function handleMessage(ws: AuthenticatedSocket, message: WSMessage): void {
    switch (message.type) {
        case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;

        case 'subscribe':
            // Подписка на каналы (achievements, kudos, etc.)
            ws.send(JSON.stringify({ type: 'subscribed', payload: { channel: message.payload } }));
            break;

        default:
            ws.send(JSON.stringify({ type: 'error', payload: { message: `Unknown message type: ${message.type}` } }));
    }
}

// Отправка уведомления конкретному пользователю
export function sendToUser(wss: WebSocketServer, userId: string, message: WSMessage): void {
    wss.clients.forEach((client) => {
        const socket = client as AuthenticatedSocket;
        if (socket.userId === userId && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        }
    });
}

// Отправка уведомления всем подключённым пользователям
export function broadcast(wss: WebSocketServer, message: WSMessage): void {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}
