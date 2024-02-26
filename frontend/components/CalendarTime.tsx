export default function CalendarTime({ startHour, endHour, formatHour }) {
  return (
    <div className='grid grid-cols-1 w-full'>
      {Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour).map((hour) => (
        <div key={hour} className='border-b border-gray-300 py-2 w-full'>
          {formatHour(hour)}
        </div>
      ))}
    </div>
  );
}
