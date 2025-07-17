import { Injectable } from '@nestjs/common';
import { StudyRemind } from '@prisma/client';
import { google } from 'googleapis';

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI = 'http://localhost:3000/api/google/callback'
} = process.env;

@Injectable()
export class GoogleService {
  private oauth2 = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
  async exchangeCode(code: string) {
    const { tokens } = await this.oauth2.getToken(code);
    if (!tokens.access_token) {
      throw new Error('Không nhận được access_token');
    }

    this.oauth2.setCredentials(tokens);
    return tokens;
  }

  async createEvent(eventData: {
    summary: string;
    description?: string;
    start: string; // ISO string
    end: string; // ISO string
    recurrence?: string[];
    timeZone: string;
  }) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2 });

    const event = {
      summary: eventData.summary,
      description: eventData.description,
      start: {
        dateTime: eventData.start,
        timeZone: eventData.timeZone || 'Asia/Ho_Chi_Minh'
      },
      end: {
        dateTime: eventData.end,
        timeZone: eventData.timeZone || 'Asia/Ho_Chi_Minh'
      },
      recurrence: eventData.recurrence
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event
    });

    return response.data;
  }
  async resyncEventIfDeleted(studyRemind: StudyRemind) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2 });
    const oldEvent = (
      await calendar.events.get({
        calendarId: 'primary',
        eventId: studyRemind.googleEventId
      })
    ).data;
    if (oldEvent.status === 'cancelled') {
      const newEvent = {
        summary: studyRemind.summary,
        description: studyRemind.description,
        start: {
          dateTime: studyRemind.time.toISOString(),
          timeZone:
            Intl.DateTimeFormat().resolvedOptions().timeZone ||
            'Asia/Ho_Chi_Minh'
        },
        end: {
          dateTime: studyRemind.time.toISOString(),
          timeZone:
            Intl.DateTimeFormat().resolvedOptions().timeZone ||
            'Asia/Ho_Chi_Minh'
        },
        recurrence:
          studyRemind.recurrenceRule === null
            ? null
            : [studyRemind.recurrenceRule]
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: newEvent
      });

      return response.data;
    }
  }
  async deleteEvent(googleEventId: string) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2 });
    return calendar.events.delete({
      calendarId: 'primary',
      eventId: googleEventId
    });
  }
}
