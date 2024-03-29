// TODO: Move this to types.d.ts?
interface CalendarDaysProps {
  days: {
    name: string;
    date: number | null;
    current: boolean;
  }[];
}

const CalendarDays: React.FC<CalendarDaysProps> = ({ days }) => {
  return (
    <div className='grid' style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
      {days.map((day) => (
        <div key={day.name} className='flex flex-col items-center p-2 border-r border-gray-200'>
          <span
            className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full font-semibold ${
              day.current ? 'bg-indigo-600 text-white' : 'text-gray-900'
            }`}
          >
            {day.date}
          </span>
          <span className='text-sm leading-6 text-gray-500'>{day.name}</span>
        </div>
      ))}
    </div>
  );
};

export default CalendarDays;
