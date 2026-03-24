// Google Calendar API Integration for Meetify
// Этот модуль предоставляет функции для работы с Google Calendar

const { google } = require('googleapis');
const path = require('path');

// Конфигурация Google Calendar API
const CALENDAR_CONFIG = {
  // Путь к файлу сервисного аккаунта (должен быть создан в Google Cloud Console)
  keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEYFILE || './credentials/google-service-account.json',
  // ID календаря (primary для основного календаря сервисного аккаунта)
  calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
  // OAuth scopes
  scopes: ['https://www.googleapis.com/auth/calendar']
};

// Инициализация Google Auth
let auth = null;
let calendar = null;

/**
 * Инициализировать Google Calendar API
 * @returns {Promise<boolean>} - true если успешно
 */
async function initializeCalendar() {
  try {
    // Проверяем наличие файла сервисного аккаунта
    const fs = require('fs');
    if (!fs.existsSync(CALENDAR_CONFIG.keyFile)) {
      console.warn('[Calendar] Service account key file not found:', CALENDAR_CONFIG.keyFile);
      console.warn('[Calendar] Calendar integration will be disabled. Create credentials/google-service-account.json to enable.');
      return false;
    }

    auth = new google.auth.GoogleAuth({
      keyFile: CALENDAR_CONFIG.keyFile,
      scopes: CALENDAR_CONFIG.scopes,
    });

    const authClient = await auth.getClient();
    calendar = google.calendar({ version: 'v3', auth: authClient });

    console.log('[Calendar] Google Calendar API initialized successfully');
    return true;
  } catch (error) {
    console.error('[Calendar] Failed to initialize Google Calendar API:', error.message);
    return false;
  }
}

/**
 * Создать событие в Google Calendar
 * @param {Object} options - Параметры события
 * @param {string} options.summary - Название события
 * @param {string} options.description - Описание события
 * @param {string} options.startTime - Время начала (ISO 8601)
 * @param {string} options.endTime - Время окончания (ISO 8601)
 * @param {string} options.timeZone - Часовой пояс (по умолчанию Europe/Moscow)
 * @param {Array<{email: string, displayName?: string}>} options.attendees - Участники
 * @param {string} options.location - Место проведения (ссылка на комнату)
 * @param {Array<{method: string, minutes: number}>} options.reminders - Напоминания
 * @returns {Promise<Object|null>} - Данные созданного события или null
 */
async function createEvent(options) {
  if (!calendar) {
    console.warn('[Calendar] Calendar API not initialized');
    return null;
  }

  try {
    const {
      summary,
      description = '',
      startTime,
      endTime,
      timeZone = 'Europe/Moscow',
      attendees = [],
      location = '',
      reminders = [
        { method: 'email', minutes: 60 },  // За час по email
        { method: 'popup', minutes: 15 }   // За 15 минут popup
      ]
    } = options;

    // Валидация обязательных полей
    if (!summary || !startTime || !endTime) {
      throw new Error('Missing required fields: summary, startTime, endTime');
    }

    const event = {
      summary,
      description,
      location,
      start: {
        dateTime: startTime,
        timeZone
      },
      end: {
        dateTime: endTime,
        timeZone
      },
      attendees: attendees.map(a => ({
        email: a.email,
        displayName: a.displayName || a.email.split('@')[0],
        responseStatus: 'needsAction'
      })),
      reminders: {
        useDefault: false,
        overrides: reminders
      },
      // Добавляем conferenceData для Google Meet (опционально)
      conferenceData: {
        createRequest: {
          requestId: `meetify-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    };

    const response = await calendar.events.insert({
      calendarId: CALENDAR_CONFIG.calendarId,
      resource: event,
      sendUpdates: 'all', // Отправляем приглашения всем участникам
      conferenceDataVersion: 1
    });

    console.log('[Calendar] Event created:', response.data.htmlLink);
    console.log('[Calendar] Event ID:', response.data.id);
    console.log('[Calendar] Attendees invited:', attendees.length);

    return {
      id: response.data.id,
      htmlLink: response.data.htmlLink,
      summary: response.data.summary,
      start: response.data.start,
      end: response.data.end,
      attendees: response.data.attendees,
      conferenceData: response.data.conferenceData
    };
  } catch (error) {
    console.error('[Calendar] Error creating event:', error.message);
    if (error.response) {
      console.error('[Calendar] API Error details:', error.response.data);
    }
    return null;
  }
}

/**
 * Обновить событие в Google Calendar
 * @param {string} eventId - ID события
 * @param {Object} updates - Поля для обновления
 * @returns {Promise<Object|null>} - Обновлённое событие или null
 */
async function updateEvent(eventId, updates) {
  if (!calendar) {
    console.warn('[Calendar] Calendar API not initialized');
    return null;
  }

  try {
    const response = await calendar.events.patch({
      calendarId: CALENDAR_CONFIG.calendarId,
      eventId: eventId,
      resource: updates,
      sendUpdates: 'all'
    });

    console.log('[Calendar] Event updated:', response.data.htmlLink);
    return response.data;
  } catch (error) {
    console.error('[Calendar] Error updating event:', error.message);
    return null;
  }
}

/**
 * Удалить событие из Google Calendar
 * @param {string} eventId - ID события
 * @returns {Promise<boolean>} - true если успешно удалено
 */
async function deleteEvent(eventId) {
  if (!calendar) {
    console.warn('[Calendar] Calendar API not initialized');
    return false;
  }

  try {
    await calendar.events.delete({
      calendarId: CALENDAR_CONFIG.calendarId,
      eventId: eventId,
      sendUpdates: 'all'
    });

    console.log('[Calendar] Event deleted:', eventId);
    return true;
  } catch (error) {
    console.error('[Calendar] Error deleting event:', error.message);
    return false;
  }
}

/**
 * Получить событие по ID
 * @param {string} eventId - ID события
 * @returns {Promise<Object|null>} - Данные события или null
 */
async function getEvent(eventId) {
  if (!calendar) {
    console.warn('[Calendar] Calendar API not initialized');
    return null;
  }

  try {
    const response = await calendar.events.get({
      calendarId: CALENDAR_CONFIG.calendarId,
      eventId: eventId
    });

    return response.data;
  } catch (error) {
    console.error('[Calendar] Error getting event:', error.message);
    return null;
  }
}

/**
 * Создать событие для комнаты Meetify
 * Упрощённая функция для создания события при создании комнаты
 * @param {Object} roomData - Данные комнаты
 * @param {string} roomData.roomId - ID комнаты
 * @param {string} roomData.name - Название комнаты
 * @param {string} roomData.description - Описание
 * @param {string} roomData.startTime - Время начала (ISO 8601)
 * @param {string} roomData.duration - Длительность в минутах (по умолчанию 60)
 * @param {Array<{email: string, name?: string}>} roomData.participants - Участники
 * @param {string} roomData.baseUrl - Базовый URL для ссылки на комнату
 * @returns {Promise<Object|null>} - Созданное событие или null
 */
async function createRoomEvent(roomData) {
  const {
    roomId,
    name,
    description = '',
    startTime,
    duration = 60,
    participants = [],
    baseUrl = 'https://meetify.example.com'
  } = roomData;

  // Вычисляем время окончания
  const startDate = new Date(startTime);
  const endDate = new Date(startDate.getTime() + duration * 60000);
  const endTime = endDate.toISOString();

  // Формируем ссылку на комнату
  const roomUrl = `${baseUrl}/room.html?id=${roomId}`;

  // Формируем описание с ссылкой
  const fullDescription = `${description}\n\n🔗 Ссылка на комнату: ${roomUrl}\n\nID комнаты: ${roomId}`;

  return createEvent({
    summary: name,
    description: fullDescription,
    startTime,
    endTime,
    location: roomUrl,
    attendees: participants.map(p => ({
      email: p.email,
      displayName: p.name || p.email.split('@')[0]
    })),
    reminders: [
      { method: 'email', minutes: 60 },   // За час
      { method: 'popup', minutes: 15 },   // За 15 минут
      { method: 'popup', minutes: 5 }     // За 5 минут
    ]
  });
}

/**
 * Проверить статус инициализации календаря
 * @returns {boolean}
 */
function isInitialized() {
  return calendar !== null;
}

module.exports = {
  initializeCalendar,
  createEvent,
  updateEvent,
  deleteEvent,
  getEvent,
  createRoomEvent,
  isInitialized,
  CALENDAR_CONFIG
};
