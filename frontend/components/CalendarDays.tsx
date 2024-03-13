export default function CalendarDays({ days }) {
  return (
    <div
      className={`grid grid-cols-6 border-1 border-r divide-x divide-gray-100 border-b border-gray-300 relative text-sm leading-6 text-gray-500`}
    >
      {days.map((day) => (
        <div key={day.name} className='flex flex-col items-center p-2'>
          <span
            className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full font-semibold ${
              day.current ? 'bg-indigo-600 text-white' : 'text-gray-900'
            }`}
          >
            {day.date}
          </span>
          <span>{day.name}</span>
        </div>
      ))}
    </div>
  );
}
