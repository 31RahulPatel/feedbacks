const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const Session = require('../models/Session');
const Feedback = require('../models/Feedback');
const Whitelist = require('../models/Whitelist');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

// Upload sessions CSV
router.post('/uploadSessions', adminAuth, upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const sessions = [];

    if (req.file.mimetype === 'text/csv') {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          if (row.sessionId && row.title) {
            sessions.push({
              sessionId: row.sessionId,
              title: row.title,
              speaker: row.speakers || row.speaker || 'TBA',
              time: row.time || 'TBA',
              room: row.room || 'TBA',
              track: row.track || 'General'
            });
          }
        })
        .on('end', async () => {
          await Session.deleteMany({});
          await Session.insertMany(sessions);
          fs.unlinkSync(filePath);
          res.json({ message: `${sessions.length} sessions uploaded successfully` });
        });
    } else {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);
      
      const sessions = data.filter(row => row.sessionId && row.title).map(row => ({
        sessionId: row.sessionId,
        title: row.title,
        speaker: row.speakers || row.speaker || 'TBA',
        time: row.time || 'TBA',
        room: row.room || 'TBA',
        track: row.track || 'General'
      }));

      await Session.deleteMany({});
      await Session.insertMany(sessions);
      fs.unlinkSync(filePath);
      res.json({ message: `${sessions.length} sessions uploaded successfully` });
    }
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Upload whitelist
router.post('/uploadWhitelist', adminAuth, upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const attendees = [];

    if (req.file.mimetype === 'text/csv') {
      // Parse CSV
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          attendees.push({
            email: row.email?.toLowerCase(),
            name: row.name,
            phone: row.phone
          });
        })
        .on('end', async () => {
          await Whitelist.deleteMany({});
          await Whitelist.insertMany(attendees);
          fs.unlinkSync(filePath);
          res.json({ message: `${attendees.length} attendees uploaded successfully` });
        });
    } else {
      // Parse Excel
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);
      
      const attendees = data.map(row => ({
        email: row.email?.toLowerCase(),
        name: row.name,
        phone: row.phone
      }));

      await Whitelist.deleteMany({});
      await Whitelist.insertMany(attendees);
      fs.unlinkSync(filePath);
      res.json({ message: `${attendees.length} attendees uploaded successfully` });
    }
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Create session
router.post('/createSession', adminAuth, async (req, res) => {
  try {
    const session = new Session(req.body);
    await session.save();
    res.status(201).json({ message: 'Session created successfully', session });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Session ID already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all sessions (admin)
router.get('/sessions', adminAuth, async (req, res) => {
  try {
    const sessions = await Session.find().sort({ time: 1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get feedback for a session
router.get('/feedback/:sessionId', adminAuth, async (req, res) => {
  try {
    const feedback = await Feedback.find({ sessionId: req.params.sessionId });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export all feedback
router.get('/exportFeedback', adminAuth, async (req, res) => {
  try {
    const feedback = await Feedback.find().populate('sessionId');
    const csvData = feedback.map(f => ({
      sessionId: f.sessionId,
      userEmail: f.userEmail,
      rating: f.rating,
      comment: f.comment,
      createdAt: f.createdAt
    }));
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=feedback-export.csv');
    
    const csvHeader = 'SessionID,UserEmail,Rating,Comment,CreatedAt\n';
    const csvRows = csvData.map(row => 
      `${row.sessionId},${row.userEmail},${row.rating},"${row.comment}",${row.createdAt}`
    ).join('\n');
    
    res.send(csvHeader + csvRows);
  } catch (error) {
    res.status(500).json({ message: 'Export failed', error: error.message });
  }
});

// Get dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalSessions = await Session.countDocuments();
    const totalFeedback = await Feedback.countDocuments();
    const totalAttendees = await Whitelist.countDocuments();
    
    res.json({
      totalSessions,
      totalFeedback,
      totalAttendees
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;