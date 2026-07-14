import { api } from '../lib/apiBase';

export interface Reminder {
  _id: string;
  medicine: { _id: string; name: string; image_url?: string; manufacturer?: string };
  slots: ('morning' | 'afternoon' | 'night')[];
  customTimes: string[];
  active: boolean;
}

export const reminderAPI = {
  getReminders: async (): Promise<{ success: boolean; data: Reminder[] }> => {
    const response = await api.get('/reminders');
    return response.data;
  },

  saveReminder: async (
    medicineId: string,
    slots: string[],
    customTimes: string[] = [],
    active = true
  ): Promise<{ success: boolean; data: Reminder }> => {
    const response = await api.post('/reminders', { medicineId, slots, customTimes, active });
    return response.data;
  },

  deleteReminder: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/reminders/${id}`);
    return response.data;
  },
};
