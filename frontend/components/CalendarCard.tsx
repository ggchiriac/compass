import { Event } from '@/types';

interface CourseCardProps {
  event: Event;
  calculateGridRow: (timeString: string) => number;
  style?: React.CSSProperties;
}

function getContrastYIQ(hexcolor) {
  hexcolor = hexcolor.replace('#', '');
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? 'black' : 'white';
}

function stringToColor(name, description) {
  const base = name + description; // Combine name and description for more entropy
  let hash = 0;
  // Use Horner's method for hash code generation
  for (let i = 0; i < base.length; i++) {
    hash = base.charCodeAt(i) + hash * 31; // 31 is a prime number, used as a multiplier for Horner's method
    hash = hash & hash; // Ensure we stay within 32-bit integer range
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}

const CourseCard: React.FC<CourseCardProps> = ({ event, calculateGridRow }) => {
  const backgroundColor = stringToColor(event.color, event.description); // Assuming `event.color` is now a hex value
  const textColor = getContrastYIQ(backgroundColor);
  return (
    <div
      className='relative border border-gray-400 m-0.5 z-10 rounded-lg p-2 text-xs leading-5'
      style={{
        backgroundColor: backgroundColor,
        color: textColor,
        gridColumnStart: event.gridColumnStart,
        gridRowStart: calculateGridRow(event.startTime),
        gridRowEnd: `span ${calculateGridRow(event.endTime) - calculateGridRow(event.startTime)}`,
      }}
    >
      <div className='flex flex-col'>
        <strong className='font-semibold'>{event.name}</strong>
        <time dateTime={event.startTime}>{event.description}</time>
      </div>
    </div>
  );
};

export default CourseCard;
