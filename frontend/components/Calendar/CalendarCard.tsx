import { CalendarEvent } from '@/types';

interface CourseCardProps {
  event: CalendarEvent;
  style?: React.CSSProperties;
  onSectionClick: (section: any) => void;
}

function getContrastYIQ(hexcolor: string) {
  const hex = hexcolor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 2), 16);
  const b = parseInt(hex.slice(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? 'black' : 'white';
}

function stringToColor(name: string, description: string) {
  const base = name + description;
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = base.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
}

function convertTo12hFormat(time) {
  const [hours, minutes] = time.split(':');
  const hrs = parseInt(hours, 10);
  const suffix = hrs >= 12 ? 'PM' : 'AM';
  const convertedHours = ((hrs + 11) % 12 + 1); // Converts 0-23 hour format into 1-12 format
  return `${convertedHours}:${minutes} ${suffix}`;
}


const CourseCard: React.FC<CourseCardProps> = ({ event, onSectionClick, style }) => {
  const backgroundColor = event.color || stringToColor(event.title, event.description);
  const textColor = getContrastYIQ(backgroundColor);
  const handleSectionClick = () => {
    onSectionClick(event.selectedSection || event.sections[0]);
  };

  const startTime = convertTo12hFormat(event.startTime);
  const endTime = convertTo12hFormat(event.endTime);

  const calculateDurationRows = (startRowIndex, endRowIndex) => {
    return endRowIndex - startRowIndex;
  };

  return (
    <div
      className='relative border border-gray-400 m-0.5 z-10 rounded-lg p-2 text-xs leading-5'
      style={{
        backgroundColor: backgroundColor,
        color: textColor,
        gridColumnStart: event.startColumnIndex || 1,
        gridRowStart: event.startRowIndex || 1,
        gridRowEnd: `span ${calculateDurationRows(event.startRowIndex, event.endRowIndex)}`,
        ...style,
      }}
      onClick={handleSectionClick}
    >
      <div className='flex flex-col'>
        <strong className='font-semibold text-xs'>{event.department_code} {event.catalog_number}</strong>
        <time dateTime={event.startTime}>
          {startTime} - {endTime}
        </time>
      </div>
    </div>
  );
};

export default CourseCard;
