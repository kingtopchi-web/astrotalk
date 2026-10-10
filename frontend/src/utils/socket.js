import { io } from 'socket.io-client';

const SOCKET_URL = 'https://astrotalk-hlg2.onrender.com';

/**
 * Creates a new Socket.IO connection with robust reconnection settings.
 * Render.com free tier servers sleep after inactivity, so we use
 * longer timeouts and more reconnection attempts to handle cold starts.
 */
export const createSocket = () => {
  return io(SOCKET_URL, {
    // Transport: try websocket first, fall back to polling
    transports: ['websocket', 'polling'],

    // Reconnection settings (critical for Render.com free tier cold starts)
    reconnection: true,
    reconnectionAttempts: 10,       // Try 10 times before giving up
    reconnectionDelay: 2000,        // Wait 2s between attempts
    reconnectionDelayMax: 10000,    // Max wait 10s between attempts
    randomizationFactor: 0.5,

    // Timeouts - longer to accommodate cold starts (~30s on Render free tier)
    timeout: 30000,                 // 30s connection timeout
  });
};

export default SOCKET_URL;
