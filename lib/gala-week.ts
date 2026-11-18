export function weekBounds(today: string) {
  const date = new Date(today + 'T12:00:00Z');
  const start = new Date(date);
  start.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return {start:start.toISOString().slice(0,10), end:end.toISOString().slice(0,10)};
}
export function safeDocumentUrl(value: string) {
  try {const url=new URL(value);return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password;} catch {return false;}
}
