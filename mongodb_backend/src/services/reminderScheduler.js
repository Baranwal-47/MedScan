const Reminder = require('../models/Reminder');
const Notification = require('../models/Notification');

const SLOT_TIMES = { morning: '08:00', afternoon: '14:00', night: '21:00' };

// ponytail: in-process setInterval scheduler; move to a job queue (agenda/bull)
// if this ever runs on more than one server instance.
const tick = async () => {
  const now = new Date();
  const hhmm = now.toTimeString().slice(0, 5);
  const dateKey = now.toISOString().slice(0, 10);
  const firedKey = `${dateKey} ${hhmm}`;

  try {
    const due = await Reminder.find({ active: true, lastFiredKey: { $ne: firedKey } })
      .populate('medicine', 'name');

    for (const reminder of due) {
      const times = [
        ...reminder.slots.map(s => SLOT_TIMES[s]),
        ...(reminder.customTimes || [])
      ];
      if (!times.includes(hhmm)) continue;

      reminder.lastFiredKey = firedKey;
      await reminder.save();

      await Notification.create({
        user: reminder.user,
        type: 'medicine_reminder',
        title: 'Medicine Reminder',
        message: `Time to take ${reminder.medicine?.name || 'your medicine'}.`
      });
    }
  } catch (e) {
    console.error('Reminder scheduler error:', e.message);
  }
};

const startReminderScheduler = () => {
  setInterval(tick, 60 * 1000);
  console.log('Reminder scheduler started (1-minute tick)');
};

module.exports = { startReminderScheduler };
