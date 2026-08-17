import 'dotenv/config';
import { createServer } from 'http';
import app, { initializeJobs, shutdown } from './app.js';
import { setupWebSocket } from './shared/websocket/index.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function main() {
    // Create HTTP server
    const server = createServer(app);

    // Setup WebSocket server
    setupWebSocket(server);

    // Initialize job infrastructure
    await initializeJobs();

    // Start server
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`WebSocket server initialized`);
    });
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('[Server] SIGINT received, shutting down...');
    await shutdown();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('[Server] SIGTERM received, shutting down...');
    await shutdown();
    process.exit(0);
});

main().catch((error) => {
    console.error('[Server] Fatal error:', error);
    process.exit(1);
});
