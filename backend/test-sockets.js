const io = require('socket.io-client');

const SERVER_URL = 'http://localhost:5000';
const ROOM_ID = 'test-room-123';

const userSocket = io(SERVER_URL);

console.log("Starting simulation...");

// Setup User
userSocket.on('connect', () => {
    console.log("[USER] Connected:", userSocket.id);
    userSocket.emit('join_call_room', ROOM_ID);
    userSocket.emit('webrtc_ready', { roomId: ROOM_ID });
});

userSocket.on('webrtc_offer', (data) => {
    console.log("[USER] Received offer from:", data.callerId);
    // Send answer back
    userSocket.emit('webrtc_answer', { targetRoom: ROOM_ID, signal: { type: 'answer', sdp: 'fake-sdp' } });
});

userSocket.on('webrtc_ice_candidate', (data) => {
    console.log("[USER] Received ICE candidate from expert:", data);
});

// Setup Expert
setTimeout(() => {
    const expertSocket = io(SERVER_URL);
    expertSocket.on('connect', () => {
        console.log("[EXPERT] Connected:", expertSocket.id);
        expertSocket.emit('join_call_room', ROOM_ID);
        
        // Expert sends offer
        expertSocket.emit('webrtc_offer', { targetRoom: ROOM_ID, signal: { type: 'offer', sdp: 'fake-offer-sdp' } });
        
        // Expert sends ICE candidate
        expertSocket.emit('webrtc_ice_candidate', { targetRoom: ROOM_ID, candidate: { candidate: 'fake-ice' } });
    });

    expertSocket.on('webrtc_answer', (data) => {
        console.log("[EXPERT] Received answer from user:", data);
    });
}, 1000);

// Close after 3 seconds
setTimeout(() => {
    console.log("Simulation complete, closing.");
    process.exit(0);
}, 3000);
