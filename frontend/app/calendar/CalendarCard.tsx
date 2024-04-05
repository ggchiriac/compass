import { CalendarEvent } from '@/types';
import './CalendarCard.css';

interface CalendarCardProps {
  event: CalendarEvent;
  style?: React.CSSProperties;
  onSectionClick: () => void;
  width?: number;
  offsetLeft?: number;
}

const getContrastYIQ = (hexcolor: string) => {
  const hex = hexcolor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? 'black' : 'white';
};

const stringToColor = (name: string, description: string) => {
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
};

const convertTo12hFormat = (time: string) => {
  const [hours, minutes] = time.split(':');
  const hrs = parseInt(hours, 10);
  const suffix = hrs >= 12 ? 'PM' : 'AM';
  const convertedHours = ((hrs + 11) % 12) + 1;
  return `${convertedHours}:${minutes} ${suffix}`;
};

const CalendarCard: React.FC<CalendarCardProps> = ({
  event,
  onSectionClick,
  width,
  offsetLeft,
}) => {
  const backgroundColor =
    event.color || stringToColor(event.course.title, event.course.description);
  const textColor = getContrastYIQ(backgroundColor);

  const startTime = convertTo12hFormat(event.startTime);
  const endTime = convertTo12hFormat(event.endTime);

  const calculateDurationRows = (startRowIndex: number, endRowIndex: number) => {
    return endRowIndex - startRowIndex;
  };

  return (
    <div
      className='calendar-card'
      style={{
        backgroundColor,
        color: textColor,
        gridColumn: `${event.startColumnIndex} / span 1`,
        gridRow: `${event.startRowIndex + 1} / span ${calculateDurationRows(event.startRowIndex, event.endRowIndex)}`,
        width: `calc(100% * ${width || 1})`,
        marginLeft: `calc(100% * ${offsetLeft || 0})`,
      }}
      onClick={onSectionClick}
    >
      <div className='card-header'>
        <strong
          className='course-code'
          title={`${event.course.departmentCode} ${event.course.catalogNumber}`}
        >
          {event.course.departmentCode} {event.course.catalogNumber}
        </strong>
        <span className='course-title' title={event.course.title}>
          {event.course.title}
        </span>
      </div>
      <div className='card-body'>
        <time dateTime={event.startTime} title={`${startTime} - ${endTime}`}>
          {startTime} - {endTime}
        </time>
        <span
          className='location'
          title={`${event.section.classMeetings[0].buildingName} ${event.section.classMeetings[0].room}`}
        >
          {event.section.classMeetings[0].buildingName} {event.section.classMeetings[0].room}
        </span>
      </div>
      <button className='options-button' title='Options'>
        <svg className='options-icon' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z'
          />
        </svg>
      </button>
    </div>
  );
};

export default CalendarCard;
