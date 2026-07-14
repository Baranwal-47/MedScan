const express = require('express');
const Reminder = require('../models/Reminder');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/reminders — current user's reminders
router.get('/', protect, async (req, res) => {
  try {
    const reminders = await Reminder.find({ user: req.user._id })
      .populate('medicine', 'name image_url manufacturer')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reminders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/reminders — create or update the reminder for a medicine
router.post('/', protect, async (req, res) => {
  try {
    const { medicineId, slots = [], customTimes = [], active = true } = req.body;
    if (!medicineId) {
      return res.status(400).json({ success: false, message: 'medicineId is required' });
    }
    const validTimes = customTimes.every(t => /^([01]\d|2[0-3]):[0-5]\d$/.test(t));
    if (!validTimes) {
      return res.status(400).json({ success: false, message: 'customTimes must be HH:MM (24h)' });
    }
    if (slots.length === 0 && customTimes.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one slot or custom time is required' });
    }

    const reminder = await Reminder.findOneAndUpdate(
      { user: req.user._id, medicine: medicineId },
      { slots, customTimes, active },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate('medicine', 'name image_url manufacturer');

    res.status(201).json({ success: true, data: reminder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/reminders/:id — toggle / edit
router.put('/:id', protect, async (req, res) => {
  try {
    const { slots, customTimes, active } = req.body;
    const update = {};
    if (slots !== undefined) update.slots = slots;
    if (customTimes !== undefined) update.customTimes = customTimes;
    if (active !== undefined) update.active = active;

    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      update,
      { new: true, runValidators: true }
    ).populate('medicine', 'name image_url manufacturer');

    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }
    res.json({ success: true, data: reminder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/reminders/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }
    res.json({ success: true, message: 'Reminder deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
