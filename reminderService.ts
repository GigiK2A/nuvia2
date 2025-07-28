/**
 * Servizio per l'invio di email di promemoria per eventi del calendario
 * Utilizza nodemailer per inviare email tramite Gmail
 */
import nodemailer from 'nodemailer';
import { DateTime } from 'luxon';

// Configura il trasportatore Gmail con password per app
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'nuvia.notifiche@gmail.com', 
    pass: process.env.NUVIA_APP_PASSWORD
  },
});

interface ReminderEvent {
  title: string;
  date: Date;
  description?: string | null;
  [key: string]: any; // Per permettere campi aggiuntivi dagli eventi del database
}

/**
 * Invia un'email di promemoria con gli eventi del giorno
 * @param to Email del destinatario
 * @param events Lista degli eventi per cui inviare il promemoria
 * @returns Promise con il risultato dell'invio
 */
export async function sendDailyReminder(to: string, events: ReminderEvent[]): Promise<boolean> {
  try {
    if (!events || events.length === 0) {
      console.log('⚠️ Nessun evento da notificare');
      return false;
    }

    // Ordina gli eventi per orario
    const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Formatta la lista degli eventi in HTML
    const eventsHtml = sortedEvents.map(event => {
      const dateTime = DateTime.fromJSDate(event.date, { zone: 'Europe/Rome' });
      const formattedTime = dateTime.toFormat('HH:mm');
      return `<li><strong>${event.title}</strong> – ore ${formattedTime}${event.description ? ` <br/><span style="color: #666; font-size: 0.9em;">${event.description}</span>` : ''}</li>`;
    }).join('\n');

    // Configura l'email
    const mailOptions = {
      from: '"Nuvia AI" <nuvia.notifiche@gmail.com>',
      to,
      subject: `📅 Promemoria eventi di oggi ${DateTime.now().setZone('Europe/Rome').toFormat('dd/MM/yyyy')}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4a6ee0;">Promemoria eventi di oggi</h2>
          <p>Ciao! Ecco gli eventi pianificati per oggi:</p>
          <ul style="list-style-type: none; padding-left: 5px;">
            ${eventsHtml}
          </ul>
          <p style="margin-top: 30px; font-size: 0.8em; color: #666;">
            Questo è un messaggio automatico da Nuvia, il tuo assistente personale.
          </p>
        </div>
      `
    };

    // Invia l'email
    const info = await transporter.sendMail(mailOptions);
    console.log('📨 Email di promemoria inviata con successo:', info.response);
    return true;
  } catch (error) {
    console.error('❌ Errore invio email di promemoria:', error);
    return false;
  }
}

/**
 * Invia un promemoria per un singolo evento
 * @param to Email del destinatario
 * @param event Evento per cui inviare il promemoria
 * @returns Promise con il risultato dell'invio
 */
export async function sendEventReminder(to: string, event: ReminderEvent): Promise<boolean> {
  try {
    const dateTime = DateTime.fromJSDate(event.date, { zone: 'Europe/Rome' });
    const formattedDate = dateTime.toFormat('dd/MM/yyyy');
    const formattedTime = dateTime.toFormat('HH:mm');

    // Configura l'email
    const mailOptions = {
      from: '"Nuvia AI" <nuvia.notifiche@gmail.com>',
      to,
      subject: `⏰ Promemoria: ${event.title} - oggi alle ${formattedTime}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4a6ee0;">Promemoria evento</h2>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${event.title}</h3>
            <p><strong>Data:</strong> ${formattedDate}</p>
            <p><strong>Orario:</strong> ${formattedTime}</p>
            ${event.description ? `<p><strong>Descrizione:</strong> ${event.description}</p>` : ''}
          </div>
          <p style="margin-top: 30px; font-size: 0.8em; color: #666;">
            Questo è un messaggio automatico da Nuvia, il tuo assistente personale.
          </p>
        </div>
      `
    };

    // Invia l'email
    const info = await transporter.sendMail(mailOptions);
    console.log('📨 Email di promemoria per evento inviata con successo:', info.response);
    return true;
  } catch (error) {
    console.error('❌ Errore invio email di promemoria per evento:', error);
    return false;
  }
}