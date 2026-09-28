const escape = value => String(value || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
const stamp = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
export function calendarEvent(event, origin, now = new Date()) {
 const start = new Date(event.date)
 if (!Number.isFinite(start.getTime())) throw new Error('Date invalide')
 const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Planify//Invitation//FR','CALSCALE:GREGORIAN','BEGIN:VEVENT',
 'UID:' + escape(event.id || event.invite_link_id) + '@planify.manoulabs.com','DTSTAMP:' + stamp(now),'DTSTART:' + stamp(start),
 'SUMMARY:' + escape(event.event_name),'LOCATION:' + escape(event.location),
 'DESCRIPTION:' + escape('Retrouve tes apports et les dernières infos : ' + origin + '/invite/' + event.invite_link_id + '?recap=1')]
 for (const trigger of ['-P1D','-PT2H']) lines.push('BEGIN:VALARM','TRIGGER:' + trigger,'ACTION:DISPLAY','DESCRIPTION:' + escape(event.event_name),'END:VALARM')
 lines.push('END:VEVENT','END:VCALENDAR')
 // Fold on UTF-8 byte boundaries as required by iCalendar.
 return lines.map(line => { let out = '', width = 0; for (const ch of line) { const size = new TextEncoder().encode(ch).length; if (width + size > 75) { out += '\r\n '; width = 1 } out += ch; width += size } return out }).join('\r\n') + '\r\n'
}
