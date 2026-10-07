import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

function LiveSession() {
  const { id: consultationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Can be User or Expert
  
  const [sessionStatus, setSessionStatus] = useState('LOADING'); // LOADING, SCHEDULED, USER_WAITING, EXPERT_JOINED, LIVE, COMPLETED
  const [seconds, setSeconds] = useState(0);
  const [billedAmount, setBilledAmount] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showGiftTray, setShowGiftTray] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [consultation, setConsultation] = useState(null);
  const [remoteUser, setRemoteUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const [isIncoming, setIsIncoming] = useState(new URLSearchParams(window.location.search).get('incoming') === 'true');
  const [callAccepted, setCallAccepted] = useState(!isIncoming);

  // Force expert to be the receiver (incoming) if not specified otherwise
  useEffect(() => {
    if (user?.role === 'EXPERT' && !new URLSearchParams(window.location.search).has('incoming')) {
      setIsIncoming(true);
      setCallAccepted(false);
    }
  }, [user]);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  
  const ratePerMinute = consultation ? consultation.cost / consultation.durationInMinutes : 0;
  const isExpert = user?.role === 'EXPERT';

  useEffect(() => {
    fetchSessionData();
  }, [consultationId]);

  const fetchSessionData = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch consultation details
      const res = await axios.get(`http://localhost:5000/api/bookings/${consultationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConsultation(res.data);
      setRemoteUser(isExpert ? res.data.user : res.data.expert);

      // Fetch video session status
      const statusRes = await axios.get(`http://localhost:5000/api/video/sessions/${consultationId}/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let status = statusRes.data.status || 'SCHEDULED';
      
      if (status === 'LIVE' && statusRes.data.startedAt) {
        const started = new Date(statusRes.data.startedAt);
        setSeconds(Math.floor((new Date() - started) / 1000));
      }
      
      // Auto join and force start for a seamless ringing experience
      // If incoming, don't join until accepted!
      if (!isIncoming) {
        if (isExpert) {
           await axios.post(`http://localhost:5000/api/video/expert/sessions/${consultationId}/join`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(()=>{});
           await axios.post(`http://localhost:5000/api/video/expert/sessions/${consultationId}/start`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(()=>{});
        } else {
           await axios.post(`http://localhost:5000/api/video/sessions/${consultationId}/join`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(()=>{});
        }
      }
      
      setSessionStatus('LIVE');
    } catch (error) {
      console.error('Failed to load consultation:', error);
      setErrorMsg('Failed to load session data.');
      setSessionStatus('ERROR');
    }
  };

  const handleAcceptCall = async () => {
    try {
      const token = localStorage.getItem('token');
      if (isExpert) {
         await axios.post(`http://localhost:5000/api/video/expert/sessions/${consultationId}/join`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(()=>{});
         await axios.post(`http://localhost:5000/api/video/expert/sessions/${consultationId}/start`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(()=>{});
      } else {
         await axios.post(`http://localhost:5000/api/video/sessions/${consultationId}/join`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(()=>{});
      }
      setCallAccepted(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Basic Socket setup - Runs once
  useEffect(() => {
    if (!consultation || sessionStatus === 'COMPLETED' || sessionStatus === 'ERROR' || sessionStatus === 'LOADING') return;
    if (socketRef.current) return; // Already initialized

    socketRef.current = io('http://localhost:5000');
    const socket = socketRef.current;

    socket.on('connect', () => {
      socket.emit('join_call_room', consultationId);
      socket.emit('join_user', user._id); 
    });

    socket.on('VIDEO_EXPERT_JOINED', () => {
      if (!isExpert) {
        setSessionStatus('EXPERT_JOINED');
      }
    });

    socket.on('VIDEO_SESSION_STARTED', (data) => {
      setSessionStatus('LIVE');
      if (data.startedAt) {
        setSeconds(Math.floor((new Date() - new Date(data.startedAt)) / 1000));
      } else {
        setSeconds(0);
      }
    });

    socket.on('VIDEO_SESSION_ENDED', () => {
      setSessionStatus('COMPLETED');
    });

    socket.on('VIDEO_USER_LEFT', () => {
      if (isExpert && sessionStatus === 'USER_WAITING') {
         // Optionally handle
      }
    });

    return () => {
      // Cleanup Socket
      socket.emit('leave_call_room', consultationId);
      socket.disconnect();
      socketRef.current = null;
      
      // Cleanup WebRTC
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, [consultationId]); // Run once on mount

  // WebRTC setup - Runs when LIVE
  useEffect(() => {
    if (sessionStatus !== 'LIVE') return;
    if (isIncoming && !callAccepted) return; // Don't start WebRTC until accepted
    if (!socketRef.current) return;
    if (peerConnectionRef.current) return; // Already started

    const socket = socketRef.current;

    const initWebRTC = async () => {
      console.log("[WEBRTC] initWebRTC called");
      try {
        console.log("[WEBRTC] Requesting camera and microphone permissions...");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log("[WEBRTC] Local stream acquired:", stream);
        console.log("[WEBRTC] Video tracks:", stream.getVideoTracks());
        console.log("[WEBRTC] Audio tracks:", stream.getAudioTracks());
        
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          console.log("[WEBRTC] Local video srcObject set");
          localVideoRef.current.play().catch(e => console.error("[WEBRTC] Local video play error:", e));
        } else {
          console.error("[WEBRTC] localVideoRef.current is null!");
        }
        
        // Initial mute states (using the latest state variables is tricky here without adding them to deps, 
        // so we'll just enable them initially and the toggle functions will handle changes)
        stream.getAudioTracks().forEach(t => t.enabled = true);
        stream.getVideoTracks().forEach(t => t.enabled = true);

        const configuration = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] };
        console.log("[WEBRTC] Creating RTCPeerConnection with config:", configuration);
        const peerConnection = new RTCPeerConnection(configuration);
        peerConnectionRef.current = peerConnection;

        // Add state change listeners for debugging
        peerConnection.onconnectionstatechange = () => {
            console.log("[WEBRTC] connectionState:", peerConnection.connectionState);
        };
        peerConnection.oniceconnectionstatechange = () => {
            console.log("[WEBRTC] iceConnectionState:", peerConnection.iceConnectionState);
        };
        peerConnection.onsignalingstatechange = () => {
            console.log("[WEBRTC] signalingState:", peerConnection.signalingState);
        };

        stream.getTracks().forEach(track => {
          console.log("[WEBRTC] Adding local track:", track.kind, track.id, track.readyState);
          peerConnection.addTrack(track, stream);
        });

        console.log("[WEBRTC] WAITING FOR REMOTE TRACK...");
        peerConnection.ontrack = (event) => {
          console.log("[WEBRTC] REMOTE TRACK RECEIVED", event.track.kind, event.track.id, event.track.readyState);
          console.log("[WEBRTC] Streams:", event.streams);
          const [remoteStream] = event.streams;
          
          if (remoteVideoRef.current && remoteStream) {
            if (remoteVideoRef.current.srcObject !== remoteStream) {
              console.log("[WEBRTC] Setting remoteVideo srcObject");
              remoteVideoRef.current.srcObject = remoteStream;
              setIsConnected(true);
              
              remoteVideoRef.current.play().catch(error => {
                 console.error("[WEBRTC] Remote video play failed:", error);
              });
            }
          } else {
             console.error("[WEBRTC] remoteVideoRef.current or remoteStream is missing", { ref: !!remoteVideoRef.current, stream: !!remoteStream });
          }
        };

        // If the other user is already in the room, they won't trigger user_joined_call again.
        // We can emit a signal to request the other user to ping us.
        console.log("[SIGNALING] SEND webrtc_ready");
        socket.emit('webrtc_ready', { roomId: consultationId });

        socket.on('webrtc_ready', async (data) => {
           console.log("[SIGNALING] RECEIVE webrtc_ready");
           // When the other person is ready, if we are the expert, we create the offer to avoid collision.
           if (isExpert) {
             try {
               const offer = await peerConnection.createOffer();
               console.log("[WEBRTC] OFFER CREATED", offer);
               await peerConnection.setLocalDescription(offer);
               console.log("[SIGNALING] SEND OFFER");
               socket.emit('webrtc_offer', { targetRoom: consultationId, signal: offer });
             } catch (e) { console.error("[WEBRTC] Offer creation error", e); }
           }
        });

        socket.on('user_joined_call', async (data) => {
          console.log("[SIGNALING] RECEIVE user_joined_call", data);
          // Fallback if they join after us
          if (isExpert) {
            try {
               const offer = await peerConnection.createOffer();
               console.log("[WEBRTC] OFFER CREATED (fallback)", offer);
               await peerConnection.setLocalDescription(offer);
               console.log("[SIGNALING] SEND OFFER (fallback)");
               socket.emit('webrtc_offer', { targetRoom: consultationId, signal: offer });
            } catch (e) { console.error("[WEBRTC] Offer creation error (fallback)", e); }
          } else {
             // If we are the user and the expert just joined, let them know we are ready
             console.log("[SIGNALING] Replying to user_joined_call with webrtc_ready");
             socket.emit('webrtc_ready', { roomId: consultationId });
          }
        });

        socket.on('webrtc_offer', async (data) => {
          console.log("[SIGNALING] RECEIVE OFFER");
          if (isExpert) {
             console.log("[WEBRTC] Expert received offer, ignoring (Expert sends offers)");
             return; 
          }
          try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
            const answer = await peerConnection.createAnswer();
            console.log("[WEBRTC] ANSWER CREATED", answer);
            await peerConnection.setLocalDescription(answer);
            console.log("[SIGNALING] SEND ANSWER");
            socket.emit('webrtc_answer', { targetRoom: consultationId, signal: answer });
          } catch (e) { console.error("[WEBRTC] Error handling offer/creating answer", e); }
        });

        socket.on('webrtc_answer', async (data) => {
          console.log("[SIGNALING] RECEIVE ANSWER");
          if (!isExpert) {
             console.log("[WEBRTC] User received answer, ignoring (User receives offers)");
             return; 
          }
          try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
            console.log("[WEBRTC] Remote description set successfully from answer");
          } catch (e) { console.error("[WEBRTC] Error setting remote description from answer", e); }
        });

        socket.on('webrtc_ice_candidate', async (data) => {
          // Avoid echoing our own candidates
          if (data.senderId === socket.id) return;
          console.log("[SIGNALING] RECEIVE ICE candidate", data.candidate);
          try {
            if (data.candidate) {
              await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
              console.log("[WEBRTC] ICE candidate added successfully");
            }
          } catch (e) { console.error("[WEBRTC] Error adding ICE candidate", e); }
        });

        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            console.log("[SIGNALING] SEND ICE candidate");
            socket.emit('webrtc_ice_candidate', { targetRoom: consultationId, candidate: event.candidate });
          }
        };

        socket.on('user_left_call', () => {
          console.log("[SIGNALING] RECEIVE user_left_call");
          setIsConnected(false);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        });

      } catch (err) {
        console.error('[WEBRTC] Error accessing media devices.', err);
        setErrorMsg('Failed to access camera and microphone. Please ensure permissions are granted.');
        setSessionStatus('ERROR');
      }
    };

    initWebRTC();

    // No cleanup here. We handle WebRTC cleanup when component unmounts 
    // to prevent disconnecting when sessionStatus changes to LIVE.
  }, [sessionStatus, consultationId, isExpert]);

  // Timer & Heartbeat logic
  useEffect(() => {
    if (sessionStatus !== 'LIVE') return;
    const timer = setInterval(() => {
      setSeconds(prev => {
        const next = prev + 1;
        if (next % 60 === 0 && ratePerMinute > 0) {
          setBilledAmount(b => b + ratePerMinute);
        }
        return next;
      });
    }, 1000);
    
    // Heartbeat
    const heartbeat = setInterval(() => {
       const token = localStorage.getItem('token');
       axios.post(`http://localhost:5000/api/video/sessions/${consultationId}/heartbeat`, {}, {
         headers: { Authorization: `Bearer ${token}` }
       }).catch(() => {});
    }, 15000);
    
    return () => {
      clearInterval(timer);
      clearInterval(heartbeat);
    };
  }, [sessionStatus, ratePerMinute]);

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micOn;
      }
    }
    setMicOn(!micOn);
  };

  const toggleCam = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !camOn;
      }
    }
    setCamOn(!camOn);
  };

  const endCall = async () => {
    try {
      const token = localStorage.getItem('token');
      if (isExpert) {
        await axios.post(`http://localhost:5000/api/video/expert/sessions/${consultationId}/end`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`http://localhost:5000/api/video/sessions/${consultationId}/leave`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error('Failed to end session', err);
    }
    navigate(-1);
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (sessionStatus === 'LOADING') {
    return <div className="flex h-screen items-center justify-center bg-slate-900 text-white">Loading Session...</div>;
  }
  
  if (sessionStatus === 'ERROR') {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-900 text-white p-6">
        <span className="material-symbols-outlined text-red-500 text-6xl mb-4">error</span>
        <h2 className="text-xl font-bold mb-2">Unable to Join</h2>
        <p className="text-slate-400 mb-6 text-center max-w-md">{errorMsg}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-slate-700 rounded-xl font-bold hover:bg-slate-600">Go Back</button>
      </div>
    );
  }
  
  if (sessionStatus === 'COMPLETED') {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-900 text-white p-6">
        <span className="material-symbols-outlined text-green-500 text-6xl mb-4">task_alt</span>
        <h2 className="text-xl font-bold mb-2">Consultation Ended</h2>
        <p className="text-slate-400 mb-6 text-center max-w-md">This consultation has been completed successfully.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-blue-600 rounded-xl font-bold hover:bg-blue-500">Go Back</button>
      </div>
    );
  }

  // Waiting room and manual start logic removed to enable direct calling.

  // Live or Joined Session
  return (
    <div className="bg-slate-900 font-sans text-white antialiased flex flex-col min-h-screen">
      <header className="fixed top-0 inset-x-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <h1 className="text-lg font-bold truncate">Live Session</h1>
             {sessionStatus === 'LIVE' && (
                 <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">Live</span>
             )}
          </div>
          {!isExpert && sessionStatus === 'LIVE' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-blue-500/20 px-3 py-1 rounded-full">
                <span className="text-sm text-blue-400 font-bold">${billedAmount.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex flex-col relative w-full pt-16 pb-6 bg-slate-900 min-h-screen">
        <div className="flex flex-col w-full px-4 flex-1">
          
          <div className="relative w-full rounded-2xl bg-slate-800/50 border border-slate-700/50 p-4 my-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 bg-slate-700/30 px-3 py-1 rounded-full">
                <span className="text-sm font-bold tracking-tight text-slate-300">
                  {sessionStatus === 'LIVE' ? formatTime(seconds) : 'Pre-Session'}
                </span>
              </div>
            </div>
          </div>

          <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl bg-black aspect-[3/4] md:aspect-video flex items-center justify-center border border-slate-700/50">
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Overlays */}
            <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10 pointer-events-none">
              <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full pointer-events-auto border border-white/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs font-medium text-white">Encrypted</span>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1 pointer-events-none">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <span className="text-sm font-bold text-white">{remoteUser?.name || 'Remote User'}</span>
                {remoteUser?.role === 'EXPERT' && <span className="material-symbols-outlined text-[14px] text-blue-400">verified</span>}
              </div>
            </div>

            {/* Local Video Picture-in-Picture */}
            <div className="absolute top-4 right-4 w-24 h-36 md:w-32 md:h-48 rounded-xl overflow-hidden shadow-2xl z-20 bg-slate-800 border-2 border-slate-700/50">
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover ${!camOn ? 'hidden' : ''}`}
              />
              {!camOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                  <span className="material-symbols-outlined text-3xl text-slate-500">videocam_off</span>
                </div>
              )}
              <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] font-bold text-white">You</div>
            </div>
            
            {toastMsg && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-black/80 text-white backdrop-blur-md px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce border border-white/10">
                <span className="text-3xl">{toastMsg.icon}</span>
                <span className="text-sm font-bold">Sent!</span>
              </div>
            )}
          </div>

          {/* Call Controls */}
          <div className="w-full bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-4 mt-6 flex items-center justify-center gap-4 md:gap-6">
            <button 
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg ${!micOn ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
              onClick={toggleMic}
            >
              <span className="material-symbols-outlined text-2xl">{micOn ? 'mic' : 'mic_off'}</span>
            </button>
            <button 
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg ${!camOn ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
              onClick={toggleCam}
            >
              <span className="material-symbols-outlined text-2xl">{camOn ? 'videocam' : 'videocam_off'}</span>
            </button>
            {!isExpert && sessionStatus === 'LIVE' && (
              <button 
                className="w-14 h-14 rounded-full flex items-center justify-center bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30 transition-all active:scale-95 shadow-lg"
                onClick={() => setShowGiftTray(!showGiftTray)}
              >
                <span className="material-symbols-outlined text-2xl">featured_seasonal_and_gifts</span>
              </button>
            )}
            <button 
              className="w-16 h-16 rounded-full flex items-center justify-center bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:bg-red-500 transition-all active:scale-95"
              onClick={() => setShowEndModal(true)}
            >
              <span className="material-symbols-outlined text-3xl">call_end</span>
            </button>
          </div>

        </div>
      </main>

      {/* End Call Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-700">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4 mx-auto border border-red-500/50">
              <span className="material-symbols-outlined text-3xl">phone_disabled</span>
            </div>
            <h2 className="text-xl font-bold text-white text-center mb-2">End Consultation?</h2>
            {sessionStatus === 'LIVE' && (
                <p className="text-sm text-slate-400 text-center mb-6">
                  Session duration: {formatTime(seconds)}.<br/> 
                </p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowEndModal(false)} className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-slate-700 hover:bg-slate-600 transition-colors">
                Resume
              </button>
              <button onClick={endCall} className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 transition-colors shadow-lg">
                End Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gift Tray */}
      {showGiftTray && !isExpert && (
        <div className="absolute inset-x-4 bottom-32 z-50 bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-sm font-bold text-white">Send Quick Gift</span>
            <button onClick={() => setShowGiftTray(false)} className="text-slate-400 hover:text-white">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => {setShowGiftTray(false); setToastMsg({icon:'☕'}); setTimeout(()=>setToastMsg(null),2000)}} className="flex flex-col items-center p-3 rounded-xl bg-slate-700/50 hover:bg-slate-600 active:scale-95">
              <span className="text-2xl mb-1">☕</span>
            </button>
            <button onClick={() => {setShowGiftTray(false); setToastMsg({icon:'❤️'}); setTimeout(()=>setToastMsg(null),2000)}} className="flex flex-col items-center p-3 rounded-xl bg-slate-700/50 hover:bg-slate-600 active:scale-95">
              <span className="text-2xl mb-1">❤️</span>
            </button>
            <button onClick={() => {setShowGiftTray(false); setToastMsg({icon:'🏆'}); setTimeout(()=>setToastMsg(null),2000)}} className="flex flex-col items-center p-3 rounded-xl bg-slate-700/50 hover:bg-slate-600 active:scale-95">
              <span className="text-2xl mb-1">🏆</span>
            </button>
            <button onClick={() => {setShowGiftTray(false); setToastMsg({icon:'🌟'}); setTimeout(()=>setToastMsg(null),2000)}} className="flex flex-col items-center p-3 rounded-xl bg-slate-700/50 hover:bg-slate-600 active:scale-95">
              <span className="text-2xl mb-1">🌟</span>
            </button>
          </div>
        </div>
      )}

      {/* Full Screen Call Overlays for Ringing and Incoming Call */}
      {!isConnected && (
        <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-between py-8 sm:py-12 transition-colors duration-500 ${isIncoming && !callAccepted ? 'bg-[#06261b]' : 'bg-[#0b162c]'}`}>
          
          {/* Top spacer to replace header and push content down slightly */}
          <div className="pt-2 sm:pt-8"></div>
          
          {/* Center Avatar & Name */}
          <div className="flex flex-col items-center flex-1 justify-center -mt-8 sm:-mt-12">
             <div className="relative flex items-center justify-center w-48 h-48 sm:w-64 sm:h-64 mb-6">
               {/* Animated Rings */}
               <div className="absolute inset-0 rounded-full border border-white/5 animate-[ping_3s_ease-out_infinite]"></div>
               <div className="absolute inset-4 rounded-full border border-white/10 animate-[ping_3s_ease-out_infinite_0.5s]"></div>
               <div className="absolute inset-8 rounded-full border border-white/10 animate-[ping_3s_ease-out_infinite_1s]"></div>
               
               {/* Avatar */}
               <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center text-5xl sm:text-6xl font-bold text-white z-10 shadow-2xl relative
                 ${isIncoming && !callAccepted ? 'bg-[#2dd4bf] shadow-[#2dd4bf]/20' : 'bg-[#f97316] shadow-[#f97316]/20'}`}>
                 {remoteUser?.name ? remoteUser.name.charAt(0).toUpperCase() : 'U'}
               </div>
             </div>
             
             <h3 className="text-2xl sm:text-3xl font-bold text-white mt-2 sm:mt-4">{remoteUser?.name || 'Remote User'}</h3>
             
             {isIncoming && !callAccepted ? (
               <p className="text-emerald-400 text-sm sm:text-base font-medium mt-2 sm:mt-3 flex items-center gap-2">
                 <span className="material-symbols-outlined text-[18px]">call</span>
                 Incoming Audio Consultation...
               </p>
             ) : (
               <p className="text-blue-300 text-sm sm:text-base font-medium mt-2 sm:mt-3 flex items-center gap-1">
                 Ringing <span className="animate-pulse flex gap-0.5 ml-1"><span className="w-1.5 h-1.5 bg-blue-300 rounded-full"></span><span className="w-1.5 h-1.5 bg-blue-300 rounded-full"></span><span className="w-1.5 h-1.5 bg-blue-300 rounded-full"></span></span>
               </p>
             )}
          </div>
          
          {/* Bottom Actions */}
          <div className="pb-8 sm:pb-12 w-full px-4 sm:px-8 flex items-center justify-center gap-8 sm:gap-16">
            {isIncoming && !callAccepted ? (
               <>
                 <div className="flex flex-col items-center gap-2 sm:gap-3">
                   <button onClick={endCall} className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center text-white shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-transform active:scale-90">
                     <span className="material-symbols-outlined text-3xl sm:text-4xl">phone_disabled</span>
                   </button>
                   <span className="text-xs sm:text-sm font-bold text-white/90">Decline</span>
                 </div>
                 <div className="flex flex-col items-center gap-2 sm:gap-3">
                   <button onClick={handleAcceptCall} className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center text-white shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-transform active:scale-90">
                     <span className="material-symbols-outlined text-3xl sm:text-4xl">call</span>
                   </button>
                   <span className="text-xs sm:text-sm font-bold text-white/90">Accept</span>
                 </div>
               </>
            ) : (
               <div className="flex flex-col items-center gap-2 sm:gap-3">
                 <button onClick={endCall} className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center text-white shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-transform active:scale-90">
                   <span className="material-symbols-outlined text-3xl sm:text-4xl">call_end</span>
                 </button>
                 <span className="text-xs sm:text-sm font-bold text-white/90">Cancel Call</span>
               </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default LiveSession;
