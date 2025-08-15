import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit, Trash2, User, Phone, Mail, MapPin, Clock, Users, Video, PhoneCall, CalendarDays, Search, Filter, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { CalendarService, CalendarEvent, CalendarContact, CreateEventData, CreateContactData } from '../services/calendarService';
import { CreateEventModal } from './CreateEventModal';

interface CalendarPageProps {
  onBack: () => void;
}

export function CalendarPage({ onBack }: CalendarPageProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [contacts, setContacts] = useState<CalendarContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [eventsList, contactsList] = await Promise.all([
        CalendarService.getAllEvents(),
        CalendarService.getAllContacts()
      ]);
      
      setEvents(eventsList);
      setContacts(contactsList);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      setError('Ошибка при загрузке данных календаря');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setShowCreateEventModal(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowCreateEventModal(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это событие?')) {
      return;
    }

    try {
      await CalendarService.deleteEvent(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Ошибка при удалении события');
    }
  };

  const handleEventCreated = (event: CalendarEvent) => {
    setShowCreateEventModal(false);
    setSelectedEvent(null);
    
    // Обновляем список событий
    if (selectedEvent) {
      setEvents(prev => prev.map(e => e.id === event.id ? event : e));
    } else {
      setEvents(prev => [event, ...prev]);
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <PhoneCall className="h-4 w-4" />;
      case 'meeting':
        return <Users className="h-4 w-4" />;
      case 'consultation':
        return <CalendarDays className="h-4 w-4" />;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Запланировано';
      case 'confirmed':
        return 'Подтверждено';
      case 'completed':
        return 'Завершено';
      case 'cancelled':
        return 'Отменено';
      case 'rescheduled':
        return 'Перенесено';
      default:
        return status;
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Фильтрация событий
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.contact?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || event.eventType === filterType;
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Группировка событий по дате
  const groupedEvents = filteredEvents.reduce((groups, event) => {
    const date = formatDate(event.startTime);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {} as Record<string, CalendarEvent[]>);

  const sortedDates = Object.keys(groupedEvents).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка календаря...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <Card className="rounded-none border-b shadow-sm bg-white/95 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBack}
                  className="hover:bg-muted"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Календарь событий
                    </h1>
                    <p className="text-sm text-gray-600">
                      {events.length} событий, {contacts.length} контактов
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCreateEvent}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Создать событие
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="rounded-none border-b shadow-sm bg-white/95 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Поиск по названию, контакту или описанию..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">Все типы</option>
                  <option value="meeting">Встречи</option>
                  <option value="call">Звонки</option>
                  <option value="consultation">Консультации</option>
                  <option value="presentation">Презентации</option>
                  <option value="other">Другое</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">Все статусы</option>
                  <option value="scheduled">Запланировано</option>
                  <option value="confirmed">Подтверждено</option>
                  <option value="completed">Завершено</option>
                  <option value="cancelled">Отменено</option>
                  <option value="rescheduled">Перенесено</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <p className="text-red-700">{error}</p>
                  </CardContent>
                </Card>
              )}

              {sortedDates.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Calendar className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg mb-2">Нет событий</CardTitle>
                    <CardDescription className="mb-4">
                      {searchTerm || filterType !== 'all' || filterStatus !== 'all' 
                        ? 'Попробуйте изменить фильтры поиска'
                        : 'Создайте первое событие в календаре'
                      }
                    </CardDescription>
                    {!searchTerm && filterType === 'all' && filterStatus === 'all' && (
                      <Button onClick={handleCreateEvent}>
                        <Plus className="h-4 w-4 mr-2" />
                        Создать событие
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                sortedDates.map(date => (
                  <div key={date} className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                        <Calendar className="h-4 w-4 text-white" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-800">{date}</h2>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {groupedEvents[date].length} событий
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {groupedEvents[date].map(event => (
                        <Card key={event.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                  <div className="p-1 bg-blue-100 rounded">
                                    {getEventTypeIcon(event.eventType)}
                                  </div>
                                  <h3 className="font-semibold text-gray-900 truncate">
                                    {event.title}
                                  </h3>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${getStatusColor(event.status)}`}
                                  >
                                    {getStatusLabel(event.status)}
                                  </Badge>
                                </div>

                                <div className="space-y-1 text-sm text-gray-600">
                                  <div className="flex items-center space-x-2">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                                    </span>
                                  </div>

                                  {event.contact && (
                                    <div className="flex items-center space-x-2">
                                      <User className="h-3 w-3" />
                                      <span className="font-medium">{event.contact.name}</span>
                                      {event.contact.phone && (
                                        <span className="text-gray-500">• {event.contact.phone}</span>
                                      )}
                                    </div>
                                  )}

                                  {event.location && (
                                    <div className="flex items-center space-x-2">
                                      <MapPin className="h-3 w-3" />
                                      <span>{event.location}</span>
                                    </div>
                                  )}

                                  {event.description && (
                                    <p className="text-gray-600 mt-2 line-clamp-2">
                                      {event.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-1 ml-4">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditEvent(event)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Редактировать</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteEvent(event.id)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Удалить</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Create/Edit Event Modal */}
        <CreateEventModal
          isOpen={showCreateEventModal}
          onClose={() => {
            setShowCreateEventModal(false);
            setSelectedEvent(null);
          }}
          onEventCreated={handleEventCreated}
          currentTwinId={undefined}
        />
      </div>
    </TooltipProvider>
  );
} 