import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, MapPin, Link, MessageSquare, Plus, X, Save, CalendarDays, Users, Video, PhoneCall } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { CalendarService, CalendarContact, CreateEventData, ExtractedEventInfo } from '../services/calendarService';
import { DigitalTwinService } from '../services/digitalTwinService';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: any) => void;
  chatContext?: string;
  extractedInfo?: ExtractedEventInfo;
  currentTwinId?: string;
}

interface DigitalTwin {
  id: string;
  name: string;
}

export function CreateEventModal({ 
  isOpen, 
  onClose, 
  onEventCreated, 
  chatContext, 
  extractedInfo,
  currentTwinId 
}: CreateEventModalProps) {
  const [contacts, setContacts] = useState<CalendarContact[]>([]);
  const [twins, setTwins] = useState<DigitalTwin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Форма события
  const [eventData, setEventData] = useState<CreateEventData>({
    contactId: '',
    twinId: currentTwinId,
    title: '',
    description: '',
    eventType: 'meeting',
    startTime: '',
    endTime: '',
    timezone: 'Europe/Moscow',
    location: '',
    meetingLink: '',
    reminderMinutes: 15,
    chatContext
  });

  // Форма нового контакта
  const [showNewContact, setShowNewContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    position: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (extractedInfo) {
        setEventData(prev => ({
          ...prev,
          title: extractedInfo.eventTitle || prev.title,
          eventType: extractedInfo.eventType || prev.eventType,
          startTime: extractedInfo.startTime || prev.startTime,
          endTime: extractedInfo.endTime || prev.endTime,
          location: extractedInfo.location || prev.location,
          meetingLink: extractedInfo.meetingLink || prev.meetingLink
        }));
      }
    }
  }, [isOpen, extractedInfo]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [contactsList, twinsList] = await Promise.all([
        CalendarService.getAllContacts(),
        DigitalTwinService.getAllTwins()
      ]);
      
      setContacts(contactsList);
      setTwins(twinsList.map(twin => ({ id: twin.id, name: twin.name })));
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Ошибка при загрузке данных');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateContact = async () => {
    if (!newContact.name.trim()) {
      setError('Введите имя контакта');
      return;
    }

    try {
      const contact = await CalendarService.createContact({
        name: newContact.name.trim(),
        phone: newContact.phone.trim() || undefined,
        email: newContact.email.trim() || undefined,
        company: newContact.company.trim() || undefined,
        position: newContact.position.trim() || undefined,
        notes: newContact.notes.trim() || undefined
      });

      setContacts(prev => [...prev, contact]);
      setEventData(prev => ({ ...prev, contactId: contact.id }));
      setShowNewContact(false);
      setNewContact({ name: '', phone: '', email: '', company: '', position: '', notes: '' });
    } catch (error) {
      console.error('Error creating contact:', error);
      setError('Ошибка при создании контакта');
    }
  };

  const handleCreateEvent = async () => {
    if (!eventData.contactId || !eventData.title.trim() || !eventData.startTime || !eventData.endTime) {
      setError('Заполните все обязательные поля');
      return;
    }

    try {
      setIsLoading(true);
      const event = await CalendarService.createEvent(eventData);
      onEventCreated(event);
      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
      setError('Ошибка при создании события');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateEndTime = (startTime: string, duration: number = 60) => {
    if (!startTime) return '';
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);
    return end.toISOString().slice(0, 16);
  };

  const handleStartTimeChange = (startTime: string) => {
    setEventData(prev => ({
      ...prev,
      startTime,
      endTime: calculateEndTime(startTime, 60)
    }));
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <PhoneCall className="h-4 w-4" />;
      case 'meeting':
        return <Users className="h-4 w-4" />;
      case 'consultation':
        return <MessageSquare className="h-4 w-4" />;
      case 'presentation':
        return <Video className="h-4 w-4" />;
      default:
        return <CalendarDays className="h-4 w-4" />;
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'call':
        return 'Звонок';
      case 'meeting':
        return 'Встреча';
      case 'consultation':
        return 'Консультация';
      case 'presentation':
        return 'Презентация';
      default:
        return 'Другое';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Создать событие в календаре</span>
          </DialogTitle>
          <DialogDescription>
            Запишите встречу или звонок в календарь
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="mt-2 text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="space-y-6">
          {/* Контакт */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Контакт</span>
            </label>
            
            {!showNewContact ? (
              <div className="space-y-2">
                <select
                  value={eventData.contactId}
                  onChange={(e) => setEventData(prev => ({ ...prev, contactId: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Выберите контакт</option>
                  {contacts.map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name} {contact.phone && `(${contact.phone})`}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewContact(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Создать новый контакт
                </Button>
              </div>
            ) : (
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium">Имя *</label>
                    <Input
                      value={newContact.name}
                      onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Имя контакта"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Телефон</label>
                    <Input
                      value={newContact.phone}
                      onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Email</label>
                    <Input
                      value={newContact.email}
                      onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Компания</label>
                    <Input
                      value={newContact.company}
                      onChange={(e) => setNewContact(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="Название компании"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Должность</label>
                    <Input
                      value={newContact.position}
                      onChange={(e) => setNewContact(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="Должность"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Заметки</label>
                    <Input
                      value={newContact.notes}
                      onChange={(e) => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Дополнительная информация"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleCreateContact}
                    disabled={!newContact.name.trim()}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Создать контакт
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewContact(false)}
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Отмена
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Основная информация о событии */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-sm font-medium">Название события *</label>
              <Input
                value={eventData.title}
                onChange={(e) => setEventData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Встреча с клиентом"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Тип события</label>
              <select
                value={eventData.eventType}
                onChange={(e) => setEventData(prev => ({ ...prev, eventType: e.target.value as any }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="meeting">Встреча</option>
                <option value="call">Звонок</option>
                <option value="consultation">Консультация</option>
                <option value="presentation">Презентация</option>
                <option value="other">Другое</option>
              </select>
            </div>
          </div>

          {/* Время */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Начало *</span>
              </label>
              <Input
                type="datetime-local"
                value={eventData.startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Окончание *</label>
              <Input
                type="datetime-local"
                value={eventData.endTime}
                onChange={(e) => setEventData(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>
          </div>

          {/* Место и ссылка */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Место</span>
              </label>
              <Input
                value={eventData.location}
                onChange={(e) => setEventData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Адрес или место встречи"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center space-x-2">
                <Link className="h-4 w-4" />
                <span>Ссылка на встречу</span>
              </label>
              <Input
                value={eventData.meetingLink}
                onChange={(e) => setEventData(prev => ({ ...prev, meetingLink: e.target.value }))}
                placeholder="Zoom, Teams, Google Meet..."
              />
            </div>
          </div>

          {/* Описание */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Описание</label>
            <Textarea
              value={eventData.description}
              onChange={(e) => setEventData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Детали встречи или звонка..."
              rows={3}
            />
          </div>

          {/* Двойник */}
          {twins.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Двойник (опционально)</label>
              <select
                value={eventData.twinId || ''}
                onChange={(e) => setEventData(prev => ({ ...prev, twinId: e.target.value || undefined }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Без двойника</option>
                {twins.map(twin => (
                  <option key={twin.id} value={twin.id}>
                    {twin.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Контекст чата */}
          {chatContext && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Контекст из чата</label>
              <div className="p-3 bg-gray-50 border rounded-lg">
                <p className="text-sm text-gray-600">{chatContext}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button
            onClick={handleCreateEvent}
            disabled={isLoading || !eventData.contactId || !eventData.title.trim() || !eventData.startTime || !eventData.endTime}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Создаем...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Создать событие</span>
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 