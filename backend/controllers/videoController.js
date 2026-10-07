const VideoSession = require('../models/VideoSession');
const Consultation = require('../models/Consultation');
const Expert = require('../models/Expert');
const User = require('../models/User');

exports.userJoinSession = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const userId = req.user._id;

    const consultation = await Consultation.findById(consultationId).populate('expert').populate('service');
    if (!consultation) return res.status(404).json({ message: 'Consultation not found' });
    if (consultation.user.toString() !== userId.toString()) return res.status(403).json({ message: 'Unauthorized' });

    if (consultation.status === 'completed' || consultation.status === 'cancelled') {
      return res.status(400).json({ message: 'Consultation is already ' + consultation.status });
    }

    // Optional: check time window
    const now = new Date();
    const startTime = new Date(consultation.startTime);
    // Allow joining anytime for testing purposes
    // const allowedJoinTime = new Date(startTime.getTime() - 10 * 60000);
    // if (now < allowedJoinTime) {
    //   return res.status(400).json({ message: 'Your consultation isn\'t ready yet. Join will be available shortly before the scheduled time.' });
    // }

    let session = await VideoSession.findOne({ consultationId });
    if (!session) {
      session = new VideoSession({
        consultationId,
        userId,
        expertId: consultation.expert._id,
        status: 'USER_WAITING',
        userJoinedAt: new Date(),
        userLastHeartbeat: new Date()
      });
      await session.save();
    } else {
      if (session.status !== 'LIVE' && session.status !== 'EXPERT_JOINED' && session.status !== 'COMPLETED') {
        session.status = 'USER_WAITING';
      }
      session.userJoinedAt = new Date();
      session.userLastHeartbeat = new Date();
      await session.save();
    }

    // Emit event to expert
    const io = req.app.get('io');
    if (io) {
      // emit to expert's personal room or just broadcast if we have user mapping
      // using "user_expertId" based on server.js socket joining logic (join_user event uses user_UserId)
      const expertRoom = `user_${consultation.expert._id}`;
      io.to(expertRoom).emit('VIDEO_USER_WAITING', {
        consultationId: consultation._id,
        sessionId: session._id,
        userId: userId,
        userName: req.user.name,
        expertId: consultation.expert._id,
        serviceName: consultation.service ? consultation.service.name : 'Consultation',
        scheduledAt: consultation.startTime,
        waitingSince: session.userJoinedAt
      });
    }

    res.json({ message: 'Joined waiting room', session });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.userLeaveSession = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const session = await VideoSession.findOne({ consultationId, userId: req.user._id });
    if (session && session.status !== 'COMPLETED') {
      session.status = 'USER_LEFT';
      await session.save();
      
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${session.expertId}`).emit('VIDEO_USER_LEFT', { consultationId });
        io.to(`call_room_${consultationId}`).emit('VIDEO_USER_LEFT', { consultationId });
      }
    }
    res.json({ message: 'Left session' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getWaitingUsers = async (req, res) => {
  try {
    const expertId = req.user._id;
    const sessions = await VideoSession.find({ expertId, status: 'USER_WAITING' })
      .populate({ path: 'consultationId', populate: { path: 'service' } })
      .populate('userId', 'name profileImage');
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.expertJoinSession = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const expertId = req.user._id;

    let session = await VideoSession.findOne({ consultationId, expertId });
    if (!session) {
      session = new VideoSession({
        consultationId,
        expertId,
        userId: (await Consultation.findById(consultationId)).user,
        status: 'EXPERT_JOINED',
        expertJoinedAt: new Date(),
        expertLastHeartbeat: new Date()
      });
    } else {
      if (session.status !== 'COMPLETED' && session.status !== 'LIVE') {
        session.status = 'EXPERT_JOINED';
      }
      session.expertJoinedAt = new Date();
      session.expertLastHeartbeat = new Date();
    }
    await session.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${session.userId}`).emit('VIDEO_EXPERT_JOINED', { consultationId, sessionId: session._id });
      io.to(`call_room_${consultationId}`).emit('VIDEO_EXPERT_JOINED', { consultationId });
    }

    res.json({ message: 'Expert joined', session });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.startSession = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const expertId = req.user._id;

    const session = await VideoSession.findOne({ consultationId, expertId });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.status = 'LIVE';
    if (!session.startedAt) {
      session.startedAt = new Date();
    }
    session.expertLastHeartbeat = new Date();
    await session.save();

    const consultation = await Consultation.findById(consultationId);
    if (consultation && consultation.status === 'scheduled') {
      consultation.status = 'ongoing';
      await consultation.save();
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`call_room_${consultationId}`).emit('VIDEO_SESSION_STARTED', { consultationId, startedAt: session.startedAt });
    }

    res.json({ message: 'Session started', session });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.endSession = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const expertId = req.user._id;

    const session = await VideoSession.findOne({ consultationId, expertId });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.status = 'COMPLETED';
    session.endedAt = new Date();
    if (session.startedAt) {
      session.actualDurationSeconds = Math.floor((session.endedAt - session.startedAt) / 1000);
    }
    await session.save();

    const consultation = await Consultation.findById(consultationId);
    if (consultation) {
      consultation.status = 'completed';
      // Calculate earnings (if not already done)
      if (consultation.cost && consultation.cost > 0) {
        consultation.expertEarning = consultation.cost * 0.8; // 80% to expert
        consultation.platformFee = consultation.cost * 0.2;
      }
      await consultation.save();
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`call_room_${consultationId}`).emit('VIDEO_SESSION_ENDED', { consultationId });
      io.to(`user_${session.userId}`).emit('VIDEO_SESSION_ENDED', { consultationId });
    }

    res.json({ message: 'Session ended', session });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getSessionStatus = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const session = await VideoSession.findOne({ consultationId });
    if (!session) return res.json({ message: 'Session not found', status: 'SCHEDULED' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.sessionHeartbeat = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const isExpert = req.user.role === 'EXPERT';
    
    const session = await VideoSession.findOne({ consultationId });
    if (session) {
      if (isExpert) session.expertLastHeartbeat = new Date();
      else session.userLastHeartbeat = new Date();
      await session.save();
    }
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
