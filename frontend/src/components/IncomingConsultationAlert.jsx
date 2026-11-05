import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { createSocket } from '../utils/socket';
import { soundService } from '../utils/soundService';
import { getApiUrl } from '../utils/apiConfig';
import { useAuth } from '../context/AuthContext';

/**
 * Global incoming call and chat consultation alert for experts.
 * Listens to real-time socket events anywhere in the platform (Home page,
 * Expert Dashboard, Categories, etc.) and keeps ringing/displaying the
 * action banner until the expert accepts or rejects the consultation.
 */
const IncomingConsultationAlert = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [incomingAlert, setIncomingAlert] = useState(null);
  const socketRef = useRef(null);

  // Check if current user is an expert
  const isExpert = user?.role === 'EXPERT' || (() => {
    try {
      const stored = JSON.parse(localStorage.getItem('user'));
      return stored?.role === 'EXPERT';
    } catch (e) {
      return false;
    }
  })();

  const expertId = user?._id || (() => {
    try {
      return JSON.parse(localStorage.getItem('user'))?._id;
    } catch (e) {
      return null;
    }
  })();

  useEffect(() => {
    if (!isExpert || !expertId) return;

    const socket = createSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[IncomingAlert] Connected to socket for expert:', expertId);
      socket.emit('join_user', expertId);
    });

    socket.on('connect_error', (err) => {
      console.warn('[IncomingAlert] Socket connection error:', err.message);
    });

    // 1. Incoming Audio/Video Call
    socket.on('VIDEO_USER_WAITING', (data) => {
      console.log('[IncomingAlert] Received VIDEO_USER_WAITING:', data);
      const rawType = String(data.type || 'audio').toLowerCase();
      const isVideo = rawType === 'video';
      setIncomingAlert({
        kind: 'call',
        type: isVideo ? 'video' : 'audio',
        consultationId: data.consultationId,
        sessionId: data.sessionId,
        userId: data.userId,
        userName: data.userName || 'Client',
        userProfileImage: data.userProfileImage || data.profileImage || '',
        serviceName: data.serviceName
      });
      soundService.playIncomingRing();
    });

    // 2. Incoming Consultation Request (Dynamically checks if Chat, Audio Call, or Video Call)
    socket.on('new_chat_consultation', (data) => {
      console.log('[IncomingAlert] Received new_chat_consultation:', data);
      const rawType = String(data.type || data.consultation?.type || 'chat').toLowerCase();
      const isVideo = rawType === 'video';
      const isAudio = rawType === 'audio' || rawType === 'call';
      const isCall = isVideo || isAudio;

      setIncomingAlert({
        kind: isCall ? 'call' : 'chat',
        type: isVideo ? 'video' : isAudio ? 'audio' : 'chat',
        consultationId: data.consultationId || data.consultation?._id,
        partnerId: data.partnerId || data.consultation?.user?._id || data.consultation?.user,
        userId: data.partnerId || data.consultation?.user?._id || data.consultation?.user,
        userName: data.userName || data.consultation?.user?.name || 'Client',
        userProfileImage: data.userProfileImage || data.consultation?.user?.profileImage || '',
        conversationId: data.conversationId,
        isFree: Boolean(data.consultation?.isFree)
      });
      soundService.playIncomingRing();
    });

    // 3. User cancelled / left or session ended remotely
    const handleRemoteEnd = (data) => {
      setIncomingAlert((curr) => {
        if (!curr) return null;
        if (!data?.consultationId || curr.consultationId === data.consultationId) {
          soundService.stopRing();
          return null;
        }
        return curr;
      });
    };

    socket.on('VIDEO_USER_LEFT', handleRemoteEnd);
    socket.on('VIDEO_SESSION_ENDED', handleRemoteEnd);
    socket.on('session_ended', handleRemoteEnd);

    return () => {
      soundService.stopRing();
      socket.off('VIDEO_USER_WAITING');
      socket.off('new_chat_consultation');
      socket.off('VIDEO_USER_LEFT');
      socket.off('VIDEO_SESSION_ENDED');
      socket.off('session_ended');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isExpert, expertId]);

  // If already on the live call page for this consultation, suppress the banner
  if (!incomingAlert) return null;
  if (location.pathname.startsWith('/live/') && incomingAlert.kind === 'call') {
    return null;
  }

  const handleAccept = () => {
    soundService.stopRing();
    const alert = incomingAlert;
    setIncomingAlert(null);

    const rawType = String(alert.type || '').toLowerCase();
    const isVideoCall = rawType === 'video';
    const isAudioCall = rawType === 'audio' || rawType === 'call';
    const isCallSession = alert.kind === 'call' || isVideoCall || isAudioCall;

    if (isCallSession) {
      const callType = isVideoCall ? 'video' : 'audio';
      navigate(`/live/${alert.consultationId}?type=${callType}&incoming=true`);
    } else {
      const targetUser = alert.partnerId || alert.userId;
      navigate(targetUser ? `/expert/messages?user=${targetUser}` : '/expert/messages');
    }
  };

  const handleReject = async () => {
    soundService.stopRing();
    const alert = incomingAlert;
    setIncomingAlert(null);

    if (!alert) return;

    const rawType = String(alert.type || '').toLowerCase();
    const isCallSession = alert.kind === 'call' || rawType === 'video' || rawType === 'audio' || rawType === 'call';

    // Real-time socket broadcast to immediately update caller's screen
    try {
      if (socketRef.current) {
        if (isCallSession) {
          socketRef.current.emit('reject_call', {
            consultationId: alert.consultationId,
            userId: alert.userId || alert.partnerId,
            reason: 'Call was declined by expert'
          });
        } else {
          socketRef.current.emit('reject_chat', {
            consultationId: alert.consultationId,
            userId: alert.partnerId || alert.userId,
            reason: 'Chat consultation was declined by expert'
          });
        }
      }
    } catch (e) {
      console.warn('Socket reject emit warning:', e);
    }

    // Call backend API to mark consultation cancelled
    try {
      const token = localStorage.getItem('token');
      if (token && alert.consultationId) {
        await axios.post(
          getApiUrl(`/bookings/${alert.consultationId}/reject`),
          { reason: 'Declined by expert' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (e) {
      console.warn('API reject error:', e);
    }
  };

  const rawType = String(incomingAlert.type || '').toLowerCase();
  const isVideo = rawType === 'video';
  const isAudio = rawType === 'audio' || rawType === 'call';
  const isCall = isVideo || isAudio || incomingAlert.kind === 'call';
  const isChat = !isCall;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] w-[92vw] max-w-xl animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 text-white px-4 sm:px-6 py-3.5 sm:py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex items-center justify-between gap-3 sm:gap-4 ring-1 ring-emerald-500/20">
        
        {/* Left Pulse Icon / User Profile Avatar */}
        <div className="relative shrink-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-slate-800 border-2 border-emerald-500/50 shadow-md flex items-center justify-center">
            {incomingAlert.userProfileImage ? (
              <img
                src={incomingAlert.userProfileImage}
                alt={incomingAlert.userName}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : null}
            <span className={`text-base font-bold text-white ${incomingAlert.userProfileImage ? 'hidden' : ''}`}>
              {incomingAlert.userName ? incomingAlert.userName.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
          <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white border-2 border-slate-900 shadow">
            <span className="material-symbols-outlined text-[13px]">
              {isVideo ? 'videocam' : isAudio ? 'call' : 'chat'}
            </span>
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-white text-sm sm:text-base tracking-tight truncate">
              {isVideo
                ? 'Incoming Video Call'
                : isAudio
                ? 'Incoming Audio Call'
                : 'Incoming Chat Request'}
            </h4>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          </div>
          <p className="text-xs sm:text-sm text-slate-300 truncate mt-0.5">
            <span className="font-semibold text-white">{incomingAlert.userName}</span>{' '}
            {isVideo
              ? 'is calling you (Video Call).'
              : isAudio
              ? 'is calling you (Audio Call).'
              : 'is requesting a chat consultation.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAccept}
            className="px-3.5 py-2 sm:px-5 sm:py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-900/40 flex items-center gap-1.5 sm:gap-2 transition-transform active:scale-95 cursor-pointer text-xs sm:text-sm"
          >
            <span className="material-symbols-outlined text-base sm:text-lg">
              {isVideo ? 'videocam' : isAudio ? 'call' : 'chat'}
            </span>
            <span>
              {isVideo ? 'Accept Video' : isAudio ? 'Accept Call' : 'Accept Chat'}
            </span>
          </button>

          <button
            onClick={handleReject}
            title="Decline"
            className="p-2 sm:p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">close</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingConsultationAlert;
