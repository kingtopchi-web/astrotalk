import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { createSocket } from '../utils/socket';
import { useAuth } from '../context/AuthContext';
import ReviewForm from '../components/ReviewForm';
import { soundService } from '../utils/soundService';

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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [userWalletBalance, setUserWalletBalance] = useState(0);
  const [isBalanceExhausted, setIsBalanceExhausted] = useState(false);
  const isEndingRef = useRef(false);
  
  const [consultation, setConsultation] = useState(null);
  const [remoteUser, setRemoteUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const [isIncoming, setIsIncoming] = useState(new URLSearchParams(window.location.search).get('incoming') === 'true');
  const [callAccepted, setCallAccepted] = useState(!isIncoming);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  
  const isExpert = user?.role === 'EXPERT';
  const searchType = (new URLSearchParams(window.location.search).get('type') || '').toLowerCase();
  const consType = (consultation?.type || '').toLowerCase();
  // Any consultation that isn't explicitly video is an audio call (e.g. 'call', 'audio', etc.)
  const isAudioOnly = searchType === 'audio' || searchType === 'call' || (searchType !== 'video' && consType !== 'video');
  const expertRatePerMin = consultation?.expert?.rates 
    ? (consultation.expert.rates[consultation.type?.toLowerCase()] || consultation.expert.pricePerMinute || 30)
    : (consultation?.cost && consultation?.durationInMinutes ? (consultation.cost / consultation.durationInMinutes) : 30);
  
  const costPerSecond = Number(((expertRatePerMin * 1.20) / 60).toFixed(4));
  const maxAllowedSeconds = userWalletBalance > 0 && costPerSecond > 0 
    ? Math.floor(userWalletBalance / costPerSecond) 
    : 3600;
  const currentBilled = Number((seconds * costPerSecond).toFixed(2));
  const remainingLiveBalance = Math.max(0, Number((userWalletBalance - currentBilled).toFixed(2)));
  const remainingSeconds = Math.max(0, maxAllowedSeconds - seconds);

  useEffect(() => {
    if (!user) return; // Wait for auth to load

    const urlIncoming = new URLSearchParams(window.location.search).get('incoming') === 'true';
    const expertShouldBeIncoming = user.role === 'EXPERT' && !new URLSearchParams(window.location.search).has('incoming');
    const finalIsIncoming = urlIncoming || expertShouldBeIncoming;
    
    setIsIncoming(finalIsIncoming);
    if (finalIsIncoming) {
      setCallAccepted(false);
    }

    fetchSessionData(finalIsIncoming);
  }, [consultationId, user]);

  const fetchSessionData = async (incomingFlag) => {
    try {
      const token = localStorage.getItem('token');
      // Fetch consultation details
      const res = await axios.get(`https://experthub.nextgoodtechnologies.in/api/bookings/${consultationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConsultation(res.data);
      setRemoteUser(isExpert ? res.data.user : res.data.expert);

      // Fetch video session status
      const statusRes = await axios.get(`https://experthub.nextgoodtechnologies.in/api/video/sessions/${consultationId}/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let status = statusRes.data?.status || 'SCHEDULED';
      
      // If consultation or video session is completed or cancelled, do not ringing or accept
      if (res.data?.status === 'completed' || res.data?.status === 'cancelled' || status === 'COMPLETED' || status === 'USER_LEFT') {
        setSessionStatus('COMPLETED');
        setIsIncoming(false);
        setCallAccepted(false);
        setIsConnected(false);
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(t => t.stop());
          localStreamRef.current = null;
        }
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
        }
        return;
      }
      
      if (status === 'LIVE' && statusRes.data.startedAt) {
        const started = new Date(statusRes.data.startedAt);
        setSeconds(Math.floor((new Date() - started) / 1000));
      }
      
      // Auto join and force start for a seamless ringing experience
      // If incoming, don't join until accepted!
      if (!incomingFlag) {
        if (isExpert) {
           await axios.post(`https://experthub.nextgoodtechnologies.in/api/video/expert/sessions/${consultationId}/join`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(()=>{});
           await axios.post(`https://experthub.nextgoodtechnologies.in/api/video/expert/sessions/${consultationId}/start`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(()=>{});
        } else {
           await axios.post(`https://experthub.nextgoodtechnologies.in/api/video/sessions/${consultationId}/join`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(()=>{});
        }
      }
      
      // Fetch user wallet balance for pay-as-you-go live metering
      if (!isExpert) {
        try {
          const wRes = await axios.get('https://experthub.nextgoodtechnologies.in/api/wallet', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (wRes.data && typeof wRes.data.balance === 'number') {
            setUserWalletBalance(wRes.data.balance);
          }
        } catch (wErr) {
          console.error('Failed to load wallet balance:', wErr);
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
      soundService.stopRing();
      const token = localStorage.getItem('token');
      // Verify consultation has not ended before accepting
      const checkRes = await axios.get(`https://experthub.nextgoodtechnologies.in/api/bookings/${consultationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (checkRes.data?.status === 'completed' || checkRes.data?.status === 'cancelled') {
        setSessionStatus('COMPLETED');
        setIsIncoming(false);
        setCallAccepted(false);
        return;
      }
      if (isExpert) {
         await axios.post(`https://experthub.nextgoodtechnologies.in/api/video/expert/sessions/${consultationId}/join`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(()=>{});
         await axios.post(`https://experthub.nextgoodtechnologies.in/api/video/expert/sessions/${consultationId}/start`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(()=>{});
      } else {
         await axios.post(`https://experthub.nextgoodtechnologies.in/api/video/sessions/${consultationId}/join`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(()=>{});
      }
      setCallAccepted(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Basic Socket setup - Runs once
  useEffect(() => {
    // DO NOT return early based on consultation or sessionStatus! 
    // We want the socket to connect immediately so it's ready for WebRTC.
    if (sessionStatus === 'COMPLETED' || sessionStatus === 'ERROR') return;
    if (socketRef.current) return; // Already initialized

    socketRef.current = createSocket();
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

    const handleRemoteEnd = () => {
      soundService.stopRing();
      setSessionStatus('COMPLETED');
      setIsIncoming(false);
      setCallAccepted(false);
      setIsConnected(false);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };

    socket.on('VIDEO_SESSION_ENDED', handleRemoteEnd);
    socket.on('session_ended', handleRemoteEnd);
    socket.on('VIDEO_USER_LEFT', handleRemoteEnd);

    return () => {
      // Cleanup Socket
      soundService.stopRing();
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

  // Ringing sound management (Ringtone for incoming, dial tone for outgoing)
  useEffect(() => {
    if (sessionStatus !== 'LIVE' || isConnected) {
      soundService.stopRing();
      return;
    }

    if (isIncoming && !callAccepted) {
      soundService.playIncomingRing();
    } else if (!isIncoming && !isConnected) {
      soundService.playOutgoingRing();
    } else {
      soundService.stopRing();
    }

    return () => {
      soundService.stopRing();
    };
  }, [sessionStatus, isConnected, isIncoming, callAccepted]);

  // Connection Timeout Logic (Show error if WebRTC doesn't connect in 30s)
  useEffect(() => {
    let timeoutId;
    if (sessionStatus === 'LIVE' && !isConnected && (!isIncoming || callAccepted)) {
      timeoutId = setTimeout(() => {
        if (!isConnected) {
          console.warn("[WEBRTC] Connection timed out after 30 seconds");
          soundService.stopRing();
          setErrorMsg('Connection timed out. The other user may have disconnected, closed their browser, or has network issues. Please try booking again.');
          setSessionStatus('ERROR');
        }
      }, 30000); // 30 seconds timeout
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [sessionStatus, isConnected, isIncoming, callAccepted]);

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
        let stream;
        try {
          if (isAudioOnly) {
            console.log("[WEBRTC] Audio call requested. Requesting microphone only...");
            stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
            setCamOn(false);
          } else {
            console.log("[WEBRTC] Requesting camera and microphone permissions...");
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          }
        } catch (mediaErr) {
          console.warn("[WEBRTC] Failed to get requested media. Trying audio only.", mediaErr);
          try {
             stream = await navigator.mediaDevices.getUserMedia({ audio: true });
             setCamOn(false);
          } catch (audioErr) {
             console.warn("[WEBRTC] Failed to get audio. Using empty stream for viewing only.", audioErr);
             stream = new MediaStream();
             setCamOn(false);
             setMicOn(false);
          }
        }
        
        console.log("[WEBRTC] Local stream acquired:", stream);
        
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
            if (peerConnection.iceConnectionState === 'connected' || peerConnection.iceConnectionState === 'completed') {
                setIsConnected(true);
            } else if (peerConnection.iceConnectionState === 'disconnected' || peerConnection.iceConnectionState === 'failed') {
                console.warn("[WEBRTC] ICE connection lost!");
                setErrorMsg('Network connection lost with the other user. The call has ended.');
                setSessionStatus('ERROR');
            }
        };
        peerConnection.onsignalingstatechange = () => {
            console.log("[WEBRTC] signalingState:", peerConnection.signalingState);
        };

        stream.getTracks().forEach(track => {
          console.log("[WEBRTC] Adding local track:", track.kind, track.id, track.readyState);
          peerConnection.addTrack(track, stream);
        });

        // Ensure we negotiate receiving media even if local hardware is missing
        if (stream.getAudioTracks().length === 0) {
            peerConnection.addTransceiver('audio', { direction: 'recvonly' });
        }
        if (stream.getVideoTracks().length === 0) {
            peerConnection.addTransceiver('video', { direction: 'recvonly' });
        }

        // Construct a remote stream robustly
        const remoteStream = new MediaStream();
        peerConnection.ontrack = (event) => {
          console.log("[WEBRTC] REMOTE TRACK RECEIVED", event.track.kind, event.track.id, event.track.readyState);
          
          remoteStream.addTrack(event.track);
          
          if (remoteVideoRef.current) {
            if (remoteVideoRef.current.srcObject !== remoteStream) {
              console.log("[WEBRTC] Setting remoteVideo srcObject");
              remoteVideoRef.current.srcObject = remoteStream;
            }
            setIsConnected(true);
            
            remoteVideoRef.current.play().catch(error => {
               console.error("[WEBRTC] Remote video play failed:", error);
            });
          } else {
             console.error("[WEBRTC] remoteVideoRef.current is missing");
          }
        };

        // If the other user is already in the room, they won't trigger user_joined_call again.
        // We can emit a signal to request the other user to ping us.
        if (isExpert) {
          console.log("[WEBRTC] Expert creating initial offer");
          try {
             const offer = await peerConnection.createOffer();
             console.log("[WEBRTC] INITIAL OFFER CREATED", offer);
             await peerConnection.setLocalDescription(offer);
             console.log("[SIGNALING] SEND INITIAL OFFER");
             socket.emit('webrtc_offer', { targetRoom: consultationId, signal: offer });
          } catch (e) { console.error("[WEBRTC] Initial Offer creation error", e); }
        } else {
          console.log("[SIGNALING] SEND webrtc_ready");
          socket.emit('webrtc_ready', { roomId: consultationId });
        }

        socket.on('webrtc_ready', async (data) => {
           console.log("[SIGNALING] RECEIVE webrtc_ready");
           // When the other person is ready, if we are the expert, we create the offer to avoid collision.
           if (isExpert) {
             try {
               const offer = await peerConnection.createOffer();
               console.log("[WEBRTC] OFFER CREATED from webrtc_ready", offer);
               await peerConnection.setLocalDescription(offer);
               console.log("[SIGNALING] SEND OFFER from webrtc_ready");
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

        // Queue for ICE candidates that arrive before remote description is set
        const iceCandidateQueue = [];

        socket.on('webrtc_offer', async (data) => {
          console.log("[SIGNALING] RECEIVE OFFER");
          if (isExpert) {
             console.log("[WEBRTC] Expert received offer, ignoring (Expert sends offers)");
             return; 
          }
          try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
            
            // Process queued candidates
            while(iceCandidateQueue.length) {
                const c = iceCandidateQueue.shift();
                await peerConnection.addIceCandidate(c).catch(e => console.error("Queued ICE error", e));
            }

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
            
            // Process queued candidates
            while(iceCandidateQueue.length) {
                const c = iceCandidateQueue.shift();
                await peerConnection.addIceCandidate(c).catch(e => console.error("Queued ICE error", e));
            }
          } catch (e) { console.error("[WEBRTC] Error setting remote description from answer", e); }
        });

        socket.on('webrtc_ice_candidate', async (data) => {
          // Avoid echoing our own candidates
          if (data.senderId === socket.id) return;
          console.log("[SIGNALING] RECEIVE ICE candidate", data.candidate);
          try {
            if (data.candidate) {
              const rtcCandidate = new RTCIceCandidate(data.candidate);
              if (!peerConnection.remoteDescription) {
                  console.log("[WEBRTC] Queueing ICE candidate because remoteDescription is null");
                  iceCandidateQueue.push(rtcCandidate);
              } else {
                  await peerConnection.addIceCandidate(rtcCandidate);
                  console.log("[WEBRTC] ICE candidate added successfully");
              }
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
  }, [sessionStatus, consultationId, isExpert, isIncoming, callAccepted]);

  // Timer & Heartbeat logic
  useEffect(() => {
    if (sessionStatus !== 'LIVE') return;
    const timer = setInterval(() => {
      setSeconds(prev => {
        const next = prev + 1;
        // Pay-As-You-Go Balance Check: If user runs out of balance, disconnect call
        if (!isExpert && userWalletBalance > 0 && maxAllowedSeconds > 0 && next >= maxAllowedSeconds) {
          if (!isEndingRef.current) {
            isEndingRef.current = true;
            setIsBalanceExhausted(true);
            // Auto terminate call on insufficient balance
            setTimeout(() => {
              endCall(true, next);
            }, 500);
          }
        }
        return next;
      });
    }, 1000);
    
    // Heartbeat
    const heartbeat = setInterval(() => {
       const token = localStorage.getItem('token');
       axios.post(`https://experthub.nextgoodtechnologies.in/api/video/sessions/${consultationId}/heartbeat`, {}, {
         headers: { Authorization: `Bearer ${token}` }
       }).catch(() => {});
    }, 15000);
    
    return () => {
      clearInterval(timer);
      clearInterval(heartbeat);
    };
  }, [sessionStatus, isExpert, userWalletBalance, maxAllowedSeconds]);

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

  const endCall = async (isAutoDisconnect = false, finalSeconds = null) => {
    soundService.stopRing();
    const autoDisconnect = typeof isAutoDisconnect === 'boolean' ? isAutoDisconnect : false;
    if (isEndingRef.current && !autoDisconnect) return;
    isEndingRef.current = true;

    try {
      const token = localStorage.getItem('token');
      const usedSeconds = finalSeconds !== null ? finalSeconds : seconds;
      // Calculate actual duration in minutes based on seconds
      const actualDuration = Number((usedSeconds / 60).toFixed(2)) || 0.01;

      if (isExpert) {
        await axios.post(`https://experthub.nextgoodtechnologies.in/api/video/expert/sessions/${consultationId}/end`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(()=>{});
      } else {
        await axios.post(`https://experthub.nextgoodtechnologies.in/api/video/sessions/${consultationId}/leave`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(()=>{});
      }

      // Call end endpoint to deduct actual duration from wallet
      await axios.post(`https://experthub.nextgoodtechnologies.in/api/bookings/${consultationId}/end`, { actualDuration }, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch((e)=>{
        console.warn('Booking end response:', e?.response?.data || e.message);
      });

      // Release media stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      setIsIncoming(false);
      setCallAccepted(false);
      setIsConnected(false);
      setSessionStatus('COMPLETED');

      // If disconnected due to low balance, keep modal open
      if (autoDisconnect) {
        setIsBalanceExhausted(true);
        return;
      }

      // If user is client, show review prompt after consultation completion
      if (!isExpert) {
        setShowEndModal(false);
        setShowReviewModal(true);
        return;
      }
    } catch (err) {
      console.error('Failed to end session', err);
    }
    if (!autoDisconnect) {
      navigate(isExpert ? '/expert/consultations' : '/bookings', { replace: true });
    }
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (sessionStatus === 'LOADING') {
    return <div className="flex h-screen items-center justify-center bg-slate-900 text-background">Loading Session...</div>;
  }
  
  if (sessionStatus === 'ERROR') {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-900 text-background p-6">
        <span className="material-symbols-outlined text-red-500 text-6xl mb-4">error</span>
        <h2 className="text-xl font-bold mb-2">Unable to Join</h2>
        <p className="text-on-surface/50 mb-6 text-center max-w-md">{errorMsg}</p>
        <button onClick={() => navigate(isExpert ? '/expert/consultations' : '/bookings', { replace: true })} className="px-6 py-2 bg-slate-700 rounded-xl font-bold hover:bg-slate-600">Go Back</button>
      </div>
    );
  }
  
  if (sessionStatus === 'COMPLETED') {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-900 text-background p-6">
        <span className="material-symbols-outlined text-green-500 text-6xl mb-4">task_alt</span>
        <h2 className="text-xl font-bold mb-2">Consultation Ended</h2>
        <p className="text-on-surface/50 mb-6 text-center max-w-md">This consultation has been completed successfully.</p>
        <button onClick={() => navigate(isExpert ? '/expert/consultations' : '/bookings', { replace: true })} className="px-6 py-2 bg-primary rounded-xl font-bold hover:bg-primary/100">Go Back</button>
      </div>
    );
  }

  // Waiting room and manual start logic removed to enable direct calling.

  // Live or Joined Session
  return (
    <div className="bg-slate-900 font-sans text-background antialiased flex flex-col min-h-screen">
      <header className="fixed top-0 inset-x-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800">
        <div className="h-14 sm:h-16 px-3 sm:px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
             <h1 className="text-sm sm:text-base md:text-lg font-bold truncate max-w-[130px] sm:max-w-xs">
               {isAudioOnly ? 'Audio Consultation' : 'Live Session'}
             </h1>
             {sessionStatus === 'LIVE' && (
                 <span className="bg-red-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded uppercase tracking-wider animate-pulse shrink-0">Live</span>
             )}
          </div>
          {!isExpert && sessionStatus === 'LIVE' && (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="flex items-center bg-emerald-500/10 border border-emerald-500/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold text-emerald-400 gap-1 sm:gap-1.5">
                <span className="material-symbols-outlined text-[13px] sm:text-[15px]">account_balance_wallet</span>
                <span>₹{remainingLiveBalance.toFixed(2)}</span>
              </div>
              <div className={`flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold gap-1 ${remainingSeconds < 60 ? 'bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse' : 'bg-primary/20 border border-primary/30 text-primary'}`}>
                <span className="material-symbols-outlined text-[13px] sm:text-[15px]">hourglass_top</span>
                <span>{formatTime(remainingSeconds)}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {isAudioOnly ? (
        /* SIMPLE CLEAN AUDIO CALL SCREEN */
        <main className="flex flex-col relative w-full pt-16 sm:pt-20 pb-6 sm:pb-8 bg-slate-900 min-h-[calc(100dvh-3.5rem)] flex-1 justify-between">
          {/* Hidden video elements so WebRTC audio streams remain actively playing */}
          <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />
          <video ref={localVideoRef} autoPlay playsInline muted className="hidden" />

          <div className="flex flex-col items-center justify-between w-full max-w-md mx-auto px-4 flex-1 py-4 sm:py-6">
            
            {/* Center Simple Audio Call Avatar & Details */}
            <div className="flex flex-col items-center my-auto w-full text-center">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-3xl sm:text-5xl font-bold text-white shadow-xl mb-4">
                {remoteUser?.name ? remoteUser.name.charAt(0).toUpperCase() : 'U'}
              </div>

              <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center justify-center gap-1.5">
                {remoteUser?.name || 'Remote User'}
                {remoteUser?.role === 'EXPERT' && (
                  <span className="material-symbols-outlined text-blue-400 text-base sm:text-lg" title="Verified Expert">verified</span>
                )}
              </h2>

              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                {remoteUser?.role === 'EXPERT' ? 'Expert Consultant' : 'Client Consultation'}
              </p>

              <div className="mt-3 sm:mt-4 px-3 sm:px-4 py-1 sm:py-1.5 bg-slate-800/80 rounded-full border border-slate-700 text-xs font-mono font-bold text-emerald-400 inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{sessionStatus === 'LIVE' ? formatTime(seconds) : 'Connecting...'}</span>
              </div>

              {toastMsg && (
                <div className="mt-4 bg-black/80 text-white backdrop-blur-md px-5 py-2 rounded-full shadow-2xl flex items-center gap-2 border border-white/10 animate-bounce">
                  <span className="text-2xl">{toastMsg.icon}</span>
                  <span className="text-xs font-bold">Sent!</span>
                </div>
              )}
            </div>

            {/* Simple Call Controls */}
            <div className="w-full bg-slate-800/90 border border-slate-700/70 rounded-2xl shadow-xl p-3 sm:p-4 flex items-center justify-center gap-4 sm:gap-6 mt-4">
              {/* Mic Toggle */}
              <div className="flex flex-col items-center gap-1">
                <button 
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-md ${!micOn ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                  onClick={toggleMic}
                  title={micOn ? 'Mute' : 'Unmute'}
                >
                  <span className="material-symbols-outlined text-xl sm:text-2xl">{micOn ? 'mic' : 'mic_off'}</span>
                </button>
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-400">{micOn ? 'Mute' : 'Unmuted'}</span>
              </div>

              {/* Gift button for client */}
              {!isExpert && sessionStatus === 'LIVE' && (
                <div className="flex flex-col items-center gap-1">
                  <button 
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30 transition-all active:scale-95 shadow-md"
                    onClick={() => setShowGiftTray(!showGiftTray)}
                    title="Send Gift"
                  >
                    <span className="material-symbols-outlined text-xl sm:text-2xl">featured_seasonal_and_gifts</span>
                  </button>
                  <span className="text-[10px] sm:text-[11px] font-medium text-slate-400">Gift</span>
                </div>
              )}

              {/* End Call Button */}
              <div className="flex flex-col items-center gap-1">
                <button 
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-red-600 text-white shadow-lg hover:bg-red-500 transition-all active:scale-95"
                  onClick={() => setShowEndModal(true)}
                  title="End Call"
                >
                  <span className="material-symbols-outlined text-2xl sm:text-3xl">call_end</span>
                </button>
                <span className="text-[10px] sm:text-[11px] font-medium text-red-400">End</span>
              </div>
            </div>

          </div>
        </main>
      ) : (
        /* STANDARD VIDEO CALL SCREEN */
        <main className="flex flex-col relative w-full pt-14 sm:pt-16 pb-4 sm:pb-6 bg-slate-900 min-h-[calc(100dvh-3.5rem)]">
          <div className="flex flex-col w-full max-w-5xl mx-auto px-2.5 sm:px-4 flex-1">
            
            <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-black h-[58vh] sm:h-[68vh] md:h-[72vh] flex items-center justify-center border border-slate-700/50 mt-2 sm:mt-4">
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Overlays */}
              <div className="absolute top-3 sm:top-4 inset-x-3 sm:inset-x-4 flex items-center justify-between z-10 pointer-events-none">
                <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-full pointer-events-auto border border-white/10 text-[10px] sm:text-xs text-white">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span>Encrypted</span>
                </div>
                <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-full pointer-events-auto border border-white/10 text-[10px] sm:text-xs text-white font-mono">
                  <span>{sessionStatus === 'LIVE' ? formatTime(seconds) : 'Pre-Session'}</span>
                </div>
              </div>

              <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-10 flex flex-col gap-1 pointer-events-none">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-black/60 backdrop-blur-md px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-white/10">
                  <span className="text-xs sm:text-sm font-bold text-white">{remoteUser?.name || 'Remote User'}</span>
                  {remoteUser?.role === 'EXPERT' && <span className="material-symbols-outlined text-[13px] sm:text-[14px] text-blue-400">verified</span>}
                </div>
              </div>

              {/* Local Video Picture-in-Picture */}
              <div className="absolute top-12 sm:top-14 right-3 sm:right-4 w-20 h-28 sm:w-28 sm:h-40 md:w-32 md:h-48 rounded-xl overflow-hidden shadow-2xl z-20 bg-slate-800 border-2 border-slate-700/50">
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className={`w-full h-full object-cover ${!camOn ? 'hidden' : ''}`}
                />
                {!camOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                    <span className="material-symbols-outlined text-2xl sm:text-3xl text-white/60">videocam_off</span>
                  </div>
                )}
                <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold text-white">You</div>
              </div>
              
              {toastMsg && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-black/80 text-white backdrop-blur-md px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce border border-white/10">
                  <span className="text-3xl">{toastMsg.icon}</span>
                  <span className="text-sm font-bold">Sent!</span>
                </div>
              )}
            </div>

            {/* Video Call Controls */}
            <div className="w-full max-w-sm sm:max-w-md mx-auto bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-3 sm:p-4 mt-3 sm:mt-5 flex items-center justify-center gap-3 sm:gap-6">
              <button 
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg ${!micOn ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                onClick={toggleMic}
                title={micOn ? 'Mute' : 'Unmute'}
              >
                <span className="material-symbols-outlined text-xl sm:text-2xl">{micOn ? 'mic' : 'mic_off'}</span>
              </button>
              <button 
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg ${!camOn ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                onClick={toggleCam}
                title={camOn ? 'Turn Off Cam' : 'Turn On Cam'}
              >
                <span className="material-symbols-outlined text-xl sm:text-2xl">{camOn ? 'videocam' : 'videocam_off'}</span>
              </button>
              {!isExpert && sessionStatus === 'LIVE' && (
                <button 
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30 transition-all active:scale-95 shadow-lg"
                  onClick={() => setShowGiftTray(!showGiftTray)}
                  title="Send Gift"
                >
                  <span className="material-symbols-outlined text-xl sm:text-2xl">featured_seasonal_and_gifts</span>
                </button>
              )}
              <button 
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:bg-red-500 transition-all active:scale-95"
                onClick={() => setShowEndModal(true)}
                title="End Call"
              >
                <span className="material-symbols-outlined text-2xl sm:text-3xl">call_end</span>
              </button>
            </div>

          </div>
        </main>
      )}

      {/* End Call Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-700">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4 mx-auto border border-red-500/50">
              <span className="material-symbols-outlined text-3xl">phone_disabled</span>
            </div>
            <h2 className="text-xl font-bold text-background text-center mb-2">End Consultation?</h2>
            {sessionStatus === 'LIVE' && (
                <p className="text-sm text-on-surface/50 text-center mb-6">
                  Session duration: {formatTime(seconds)}.<br/> 
                </p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowEndModal(false)} className="flex-1 py-3 rounded-xl text-sm font-bold text-background bg-slate-700 hover:bg-slate-600 transition-colors">
                Resume
              </button>
              <button onClick={() => endCall(false)} className="flex-1 py-3 rounded-xl text-sm font-bold text-background bg-red-600 hover:bg-red-500 transition-colors shadow-lg">
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
            <span className="text-sm font-bold text-background">Send Quick Gift</span>
            <button onClick={() => setShowGiftTray(false)} className="text-on-surface/50 hover:text-background">
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
      {!isConnected && sessionStatus !== 'COMPLETED' && sessionStatus !== 'ERROR' && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between py-12 bg-slate-950">
          
          <div className="flex-1 flex flex-col items-center justify-center w-full px-4 text-center">
             <div className="w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center text-4xl md:text-5xl font-bold text-white shadow-xl bg-slate-800 border-2 border-slate-700 mb-6">
               {remoteUser?.name ? remoteUser.name.charAt(0).toUpperCase() : 'U'}
             </div>
             
             <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{remoteUser?.name || 'Remote User'}</h3>
             
             {isIncoming && !callAccepted ? (
               <p className="text-emerald-400 text-sm md:text-base font-medium mt-3 flex items-center justify-center gap-2">
                 <span className="material-symbols-outlined text-[20px]">{isAudioOnly ? 'call' : 'videocam'}</span>
                 {isAudioOnly ? 'Incoming Audio Call...' : 'Incoming Video Call...'}
               </p>
             ) : (
               <p className="text-slate-400 text-sm md:text-base font-medium mt-3 flex items-center justify-center gap-1.5">
                 <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                 {isExpert && callAccepted ? 'Connecting...' : (isAudioOnly ? 'Calling...' : 'Ringing...')}
               </p>
             )}
          </div>
          
          {/* Bottom Actions */}
          <div className="pb-10 w-full px-6 flex items-center justify-center gap-10 md:gap-16">
            {isIncoming && !callAccepted ? (
               <>
                 <div className="flex flex-col items-center gap-3">
                   <button onClick={endCall} className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center text-background shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-transform active:scale-95">
                     <span className="material-symbols-outlined text-3xl md:text-4xl">phone_disabled</span>
                   </button>
                   <span className="text-xs md:text-sm font-bold text-background/90">Decline</span>
                 </div>
                 <div className="flex flex-col items-center gap-3">
                   <button onClick={handleAcceptCall} className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center text-background shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-transform active:scale-95">
                     <span className="material-symbols-outlined text-3xl md:text-4xl">call</span>
                   </button>
                   <span className="text-xs md:text-sm font-bold text-background/90">Accept</span>
                 </div>
               </>
            ) : (
               <div className="flex flex-col items-center gap-3">
                 <button onClick={endCall} className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center text-background shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-transform active:scale-95">
                   <span className="material-symbols-outlined text-3xl md:text-4xl">call_end</span>
                 </button>
                 <span className="text-xs md:text-sm font-bold text-background/90">Cancel</span>
               </div>
            )}
          </div>
        </div>
      )}

      {/* Insufficient Balance Auto-Disconnect Modal */}
      {isBalanceExhausted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-800 border border-red-500/30 rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">Insufficient Balance / अपर्याप्त बैलेंस</h3>
            
            <p className="text-slate-300 text-sm mb-4 leading-relaxed">
              आपके वॉलेट में बैलेंस समाप्त हो गया है, इसलिए कॉल डिस्कनेक्ट कर दी गई है।
              <br />
              <span className="text-xs text-slate-400 mt-1 block">
                Total Call Duration: {formatTime(seconds)} | Deducted: ₹{(seconds * costPerSecond).toFixed(2)}
              </span>
            </p>

            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3.5 mb-6 text-left">
              <p className="text-xs text-red-400 font-medium">
                💡 आगे बात जारी रखने के लिए कृपया अपने वॉलेट में बैलेंस ऐड (Recharge) करें।
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/wallet')}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                Add Balance to Wallet / बैलेंस जोड़ें
              </button>
              
              <button
                onClick={() => navigate('/bookings')}
                className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-xl transition-colors text-sm"
              >
                Go to Bookings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Session Review Form Prompt */}
      {showReviewModal && (
        <ReviewForm
          consultationId={consultationId}
          expertName={consultation?.expert?.name || 'your expert'}
          consultationType={consultation?.type || 'Consultation'}
          onSuccess={() => {
            // Success confirmation shows in ReviewForm for 1.5s, then onClose fires
          }}
          onClose={() => {
            setShowReviewModal(false);
            navigate('/bookings', { replace: true });
          }}
        />
      )}

    </div>
  );
}

export default LiveSession;
