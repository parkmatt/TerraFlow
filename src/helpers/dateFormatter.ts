import moment from 'moment';

// UI date/time formats (UI-only — do not use for API payloads)
export const DATE_PICKER_FORMAT = 'DD/MM/YYYY';

export function formatDate(d: any): string {
  if (!d) return '';
  return moment(d).format(DATE_PICKER_FORMAT);
}

export function formatTime(d: any, use24: boolean = false): string {
  if (!d) return '';
  return use24 ? moment(d).format('HH:mm') : moment(d).format('h:mm a');
}

export function formatDateRange(start: any, end: any): string {
  return `${formatDate(start)} – ${formatDate(end)}`;
}

// React Big Calendar formats object for UI
export const rbcFormats: any = {
  agendaDateFormat: (date: Date) => formatDate(date),
  agendaTimeFormat: (date: Date) => formatTime(date, true),
  dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) => formatDateRange(start, end),
  agendaHeaderFormat: ({ start, end }: { start: Date; end: Date }) => formatDateRange(start, end),
  dateFormat: DATE_PICKER_FORMAT,
  dayFormat: (date: Date) => formatDate(date),
};
