import { supabase } from '../lib/supabase';

export interface CalendarContact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  position?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  contactId: string;
  twinId?: string;
  title: string;
  description?: string;
  eventType: 'meeting' | 'call' | 'consultation' | 'presentation' | 'other';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  startTime: string;
  endTime: string;
  timezone: string;
  location?: string;
  meetingLink?: string;
  reminderMinutes: number;
  isReminderSent: boolean;
  chatContext?: string;
  createdAt: string;
  updatedAt: string;
  contact?: CalendarContact;
  twin?: {
    id: string;
    name: string;
  };
}

export interface CreateEventData {
  contactId: string;
  twinId?: string;
  title: string;
  description?: string;
  eventType?: 'meeting' | 'call' | 'consultation' | 'presentation' | 'other';
  startTime: string;
  endTime: string;
  timezone?: string;
  location?: string;
  meetingLink?: string;
  reminderMinutes?: number;
  chatContext?: string;
}

export interface CreateContactData {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  position?: string;
  notes?: string;
}

export interface ExtractedEventInfo {
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  eventTitle?: string;
  eventType?: 'meeting' | 'call' | 'consultation' | 'presentation' | 'other';
  startTime?: string;
  endTime?: string;
  location?: string;
  meetingLink?: string;
}

export class CalendarService {
  // Контакты
  static async getAllContacts(): Promise<CalendarContact[]> {
    try {
      const { data, error } = await supabase
        .from('calendar_contacts')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      return data.map((contact: any) => ({
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        company: contact.company,
        position: contact.position,
        notes: contact.notes,
        createdAt: contact.created_at,
        updatedAt: contact.updated_at
      }));
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw new Error('Ошибка при загрузке контактов');
    }
  }

  static async createContact(contactData: CreateContactData): Promise<CalendarContact> {
    try {
      const { data, error } = await supabase
        .from('calendar_contacts')
        .insert(contactData)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        company: data.company,
        position: data.position,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error creating contact:', error);
      throw new Error('Ошибка при создании контакта');
    }
  }

  static async updateContact(contactId: string, contactData: Partial<CreateContactData>): Promise<CalendarContact> {
    try {
      const { data, error } = await supabase
        .from('calendar_contacts')
        .update(contactData)
        .eq('id', contactId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        company: data.company,
        position: data.position,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error updating contact:', error);
      throw new Error('Ошибка при обновлении контакта');
    }
  }

  static async deleteContact(contactId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('calendar_contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw new Error('Ошибка при удалении контакта');
    }
  }

  // События
  static async getAllEvents(): Promise<CalendarEvent[]> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          calendar_contacts(*),
          digital_twins(id, name)
        `)
        .order('start_time', { ascending: true });

      if (error) throw error;

      return data.map((event: any) => ({
        id: event.id,
        contactId: event.contact_id,
        twinId: event.twin_id,
        title: event.title,
        description: event.description,
        eventType: event.event_type,
        status: event.status,
        startTime: event.start_time,
        endTime: event.end_time,
        timezone: event.timezone,
        location: event.location,
        meetingLink: event.meeting_link,
        reminderMinutes: event.reminder_minutes,
        isReminderSent: event.is_reminder_sent,
        chatContext: event.chat_context,
        createdAt: event.created_at,
        updatedAt: event.updated_at,
        contact: event.calendar_contacts ? {
          id: event.calendar_contacts.id,
          name: event.calendar_contacts.name,
          phone: event.calendar_contacts.phone,
          email: event.calendar_contacts.email,
          company: event.calendar_contacts.company,
          position: event.calendar_contacts.position,
          notes: event.calendar_contacts.notes,
          createdAt: event.calendar_contacts.created_at,
          updatedAt: event.calendar_contacts.updated_at
        } : undefined,
        twin: event.digital_twins ? {
          id: event.digital_twins.id,
          name: event.digital_twins.name
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching events:', error);
      throw new Error('Ошибка при загрузке событий');
    }
  }

  static async createEvent(eventData: CreateEventData): Promise<CalendarEvent> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          contact_id: eventData.contactId,
          twin_id: eventData.twinId,
          title: eventData.title,
          description: eventData.description,
          event_type: eventData.eventType || 'meeting',
          start_time: eventData.startTime,
          end_time: eventData.endTime,
          timezone: eventData.timezone || 'Europe/Moscow',
          location: eventData.location,
          meeting_link: eventData.meetingLink,
          reminder_minutes: eventData.reminderMinutes || 15,
          chat_context: eventData.chatContext
        })
        .select(`
          *,
          calendar_contacts(*),
          digital_twins(id, name)
        `)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        contactId: data.contact_id,
        twinId: data.twin_id,
        title: data.title,
        description: data.description,
        eventType: data.event_type,
        status: data.status,
        startTime: data.start_time,
        endTime: data.end_time,
        timezone: data.timezone,
        location: data.location,
        meetingLink: data.meeting_link,
        reminderMinutes: data.reminder_minutes,
        isReminderSent: data.is_reminder_sent,
        chatContext: data.chat_context,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        contact: data.calendar_contacts ? {
          id: data.calendar_contacts.id,
          name: data.calendar_contacts.name,
          phone: data.calendar_contacts.phone,
          email: data.calendar_contacts.email,
          company: data.calendar_contacts.company,
          position: data.calendar_contacts.position,
          notes: data.calendar_contacts.notes,
          createdAt: data.calendar_contacts.created_at,
          updatedAt: data.calendar_contacts.updated_at
        } : undefined,
        twin: data.digital_twins ? {
          id: data.digital_twins.id,
          name: data.digital_twins.name
        } : undefined
      };
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error('Ошибка при создании события');
    }
  }

  static async updateEvent(eventId: string, eventData: Partial<CreateEventData>): Promise<CalendarEvent> {
    try {
      const updateData: any = {};
      if (eventData.contactId) updateData.contact_id = eventData.contactId;
      if (eventData.twinId) updateData.twin_id = eventData.twinId;
      if (eventData.title) updateData.title = eventData.title;
      if (eventData.description !== undefined) updateData.description = eventData.description;
      if (eventData.eventType) updateData.event_type = eventData.eventType;
      if (eventData.startTime) updateData.start_time = eventData.startTime;
      if (eventData.endTime) updateData.end_time = eventData.endTime;
      if (eventData.timezone) updateData.timezone = eventData.timezone;
      if (eventData.location !== undefined) updateData.location = eventData.location;
      if (eventData.meetingLink !== undefined) updateData.meeting_link = eventData.meetingLink;
      if (eventData.reminderMinutes) updateData.reminder_minutes = eventData.reminderMinutes;
      if (eventData.chatContext !== undefined) updateData.chat_context = eventData.chatContext;

      const { data, error } = await supabase
        .from('calendar_events')
        .update(updateData)
        .eq('id', eventId)
        .select(`
          *,
          calendar_contacts(*),
          digital_twins(id, name)
        `)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        contactId: data.contact_id,
        twinId: data.twin_id,
        title: data.title,
        description: data.description,
        eventType: data.event_type,
        status: data.status,
        startTime: data.start_time,
        endTime: data.end_time,
        timezone: data.timezone,
        location: data.location,
        meetingLink: data.meeting_link,
        reminderMinutes: data.reminder_minutes,
        isReminderSent: data.is_reminder_sent,
        chatContext: data.chat_context,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        contact: data.calendar_contacts ? {
          id: data.calendar_contacts.id,
          name: data.calendar_contacts.name,
          phone: data.calendar_contacts.phone,
          email: data.calendar_contacts.email,
          company: data.calendar_contacts.company,
          position: data.calendar_contacts.position,
          notes: data.calendar_contacts.notes,
          createdAt: data.calendar_contacts.created_at,
          updatedAt: data.calendar_contacts.updated_at
        } : undefined,
        twin: data.digital_twins ? {
          id: data.digital_twins.id,
          name: data.digital_twins.name
        } : undefined
      };
    } catch (error) {
      console.error('Error updating event:', error);
      throw new Error('Ошибка при обновлении события');
    }
  }

  static async deleteEvent(eventId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw new Error('Ошибка при удалении события');
    }
  }

  // Извлечение информации из чата
  static async extractEventInfoFromChat(chatMessages: string[]): Promise<ExtractedEventInfo> {
    try {
      // Здесь можно использовать AI для извлечения информации из чата
      // Пока возвращаем базовую структуру
      return {
        contactName: undefined,
        contactPhone: undefined,
        contactEmail: undefined,
        eventTitle: undefined,
        eventType: undefined,
        startTime: undefined,
        endTime: undefined,
        location: undefined,
        meetingLink: undefined
      };
    } catch (error) {
      console.error('Error extracting event info from chat:', error);
      throw new Error('Ошибка при извлечении информации из чата');
    }
  }

  // Поиск контакта по номеру телефона или email
  static async findContactByPhoneOrEmail(phone?: string, email?: string): Promise<CalendarContact | null> {
    try {
      let query = supabase
        .from('calendar_contacts')
        .select('*');

      if (phone) {
        query = query.eq('phone', phone);
      } else if (email) {
        query = query.eq('email', email);
      } else {
        return null;
      }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        company: data.company,
        position: data.position,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error finding contact:', error);
      return null;
    }
  }
} 