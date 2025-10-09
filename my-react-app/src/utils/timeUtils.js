export const formatTime = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const adjustedHours = hours % 12 || 12;
  return `${adjustedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const getTimeSlots = (dateStr) => {
  const date = new Date(dateStr);
  const day = date.getDay();
  if (day === 0) return [];

  let startHour, endHour;
  if (day === 6) {
    startHour = 2;
    endHour = 17;
  } else {
    startHour = 8;
    endHour = 23;
  }

  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const endMinute = minute + 15;
      const endHourAdj = hour + Math.floor(endMinute / 60);
      const endMinuteAdj = endMinute % 60;
      const endTime = `${endHourAdj.toString().padStart(2, '0')}:${endMinuteAdj.toString().padStart(2, '0')}`;
      slots.push({ time, formatted: formatTime(time), start: time, end: endTime });
    }
  }
  return slots;
};

export const parseTime = (input) => {
  if (!input) return '';
  if (input.includes(' ')) {
    const [timePart, period] = input.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  return input;
};