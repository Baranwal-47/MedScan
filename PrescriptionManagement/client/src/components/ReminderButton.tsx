import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { reminderAPI, Reminder } from '../services/reminderApi';
import { useToast } from '@/hooks/use-toast';

const SLOTS = [
  { id: 'morning', label: 'Morning (8:00 AM)' },
  { id: 'afternoon', label: 'Afternoon (2:00 PM)' },
  { id: 'night', label: 'Night (9:00 PM)' },
] as const;

// Per-medicine reminder toggle + schedule editor. Self-contained popover;
// pass the existing reminder if the parent already fetched the list.
export default function ReminderButton({
  medicineId,
  existing,
  onChange,
}: {
  medicineId: string;
  existing?: Reminder | null;
  onChange?: (r: Reminder | null) => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reminder, setReminder] = useState<Reminder | null>(existing ?? null);
  const [slots, setSlots] = useState<string[]>(existing?.slots ?? []);
  const [customTime, setCustomTime] = useState('');
  const [customTimes, setCustomTimes] = useState<string[]>(existing?.customTimes ?? []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setReminder(existing ?? null);
    setSlots(existing?.slots ?? []);
    setCustomTimes(existing?.customTimes ?? []);
  }, [existing]);

  const toggleSlot = (id: string) =>
    setSlots(prev => (prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]));

  const addCustomTime = () => {
    if (/^([01]\d|2[0-3]):[0-5]\d$/.test(customTime) && !customTimes.includes(customTime)) {
      setCustomTimes([...customTimes, customTime]);
      setCustomTime('');
    }
  };

  const save = async () => {
    if (slots.length === 0 && customTimes.length === 0) {
      toast({ title: 'Pick at least one time', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      const res = await reminderAPI.saveReminder(medicineId, slots, customTimes);
      setReminder(res.data);
      onChange?.(res.data);
      setOpen(false);
      toast({ title: 'Reminder saved', description: 'We will notify you at the scheduled times.' });
    } catch {
      toast({ title: 'Failed to save reminder', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!reminder) return;
    try {
      setSaving(true);
      await reminderAPI.deleteReminder(reminder._id);
      setReminder(null);
      setSlots([]);
      setCustomTimes([]);
      onChange?.(null);
      setOpen(false);
      toast({ title: 'Reminder removed' });
    } catch {
      toast({ title: 'Failed to remove reminder', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          reminder
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {reminder ? <Bell className="w-4 h-4 mr-1.5" /> : <BellOff className="w-4 h-4 mr-1.5" />}
        {reminder ? 'Reminder on' : 'Set reminder'}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-72 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Medicine reminder</h4>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 mb-3">
            {SLOTS.map(s => (
              <label key={s.id} className="flex items-center text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={slots.includes(s.id)}
                  onChange={() => toggleSlot(s.id)}
                  className="mr-2 rounded border-gray-300"
                />
                {s.label}
              </label>
            ))}
          </div>

          <div className="mb-3">
            <div className="flex gap-2">
              <input
                type="time"
                value={customTime}
                onChange={e => setCustomTime(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <button
                type="button"
                onClick={addCustomTime}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
              >
                Add
              </button>
            </div>
            {customTimes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {customTimes.map(t => (
                  <span key={t} className="inline-flex items-center bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">
                    {t}
                    <button
                      onClick={() => setCustomTimes(customTimes.filter(x => x !== t))}
                      className="ml-1 hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-1.5 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            {reminder && (
              <button
                onClick={remove}
                disabled={saving}
                className="px-3 py-1.5 bg-red-50 text-red-600 rounded text-sm font-medium hover:bg-red-100 disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
