const { ICalCalendar } = require('ical-generator');

/**
 * Parses event date and time string to generate a JS Date object.
 * @param {Date} dateObj - The date object from DB (e.g. 2026-06-20)
 * @param {string} timeStr - The time string (e.g. "14:30" or "02:30 PM" or "2:30 PM")
 * @returns {Date} - Combined Date object
 */
function getCombinedDateTime(dateObj, timeStr) {
  const combined = new Date(dateObj);
  let hours = 9; // Default starting hour
  let minutes = 0;

  if (timeStr) {
    // Check if time is in AM/PM format
    const ampmMatch = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    const standardMatch = timeStr.match(/^(\d+):(\d+)$/);

    if (ampmMatch) {
      hours = parseInt(ampmMatch[1], 10);
      minutes = parseInt(ampmMatch[2], 10);
      const period = ampmMatch[3].toUpperCase();

      if (period === 'PM' && hours < 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
    } else if (standardMatch) {
      hours = parseInt(standardMatch[1], 10);
      minutes = parseInt(standardMatch[2], 10);
    }
  }

  combined.setHours(hours, minutes, 0, 0);
  return combined;
}

/**
 * Generates an iCalendar (.ics) string for a given event.
 * @param {Object} event - The Mongoose Event document (populated with organizer)
 * @returns {string} - The ICS calendar content
 */
function generateICS(event) {
  const start = getCombinedDateTime(event.date, event.time);
  
  // Set default duration to 2 hours
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const calendar = new ICalCalendar({
    name: 'College Event Hub',
    timezone: 'UTC'
  });

  const organizerName = event.organizer && event.organizer.name ? event.organizer.name : 'Campus Organizer';
  const organizerEmail = event.organizer && event.organizer.email ? event.organizer.email : 'organizer@collegeeventhub.edu';

  calendar.createEvent({
    start,
    end,
    summary: event.title,
    description: event.description,
    location: event.venue,
    url: `http://localhost:3000/events/${event._id}`,
    organizer: {
      name: organizerName,
      email: organizerEmail
    }
  });

  return calendar.toString();
}

/**
 * Helper to generate a Google Calendar quick-add URL
 * @param {Object} event - The Mongoose Event document
 * @returns {string} - Google Calendar Link
 */
function generateGoogleCalendarUrl(event) {
  const start = getCombinedDateTime(event.date, event.time);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const formatGoogleDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const dates = `${formatGoogleDate(start)}/${formatGoogleDate(end)}`;
  const title = encodeURIComponent(event.title);
  const details = encodeURIComponent(event.description || '');
  const location = encodeURIComponent(event.venue || '');

  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}&sf=true&output=xml`;
}

module.exports = {
  generateICS,
  generateGoogleCalendarUrl
};
