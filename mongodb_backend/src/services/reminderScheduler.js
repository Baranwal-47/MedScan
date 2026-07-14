const Reminder = require('../models/Reminder');
const Notification = require('../models/Notification');
const { sendEmailSafe, emailTemplates } = require('../config/email');

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
      .populate('medicine', 'name')
      .populate('user', 'name email');

    for (const reminder of due) {
      const times = [
        ...reminder.slots.map(s => SLOT_TIMES[s]),
        ...(reminder.customTimes || [])
      ];
      if (!times.includes(hhmm)) continue;

      reminder.lastFiredKey = firedKey;
      await reminder.save();

      const medName = reminder.medicine?.name || 'your medicine';
      await Notification.create({
        user: reminder.user._id || reminder.user,
        type: 'medicine_reminder',
        title: 'Medicine Reminder',
        message: `Time to take ${medName}.`
      });
      if (reminder.user?.email) {
        sendEmailSafe(reminder.user.email, `MedScan — time to take ${medName}`,
          emailTemplates.medicineReminder(reminder.user.name || 'there', medName));
      }
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
