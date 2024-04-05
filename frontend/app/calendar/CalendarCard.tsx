import { CalendarEvent } from '@/types';
import './Calendar.scss';

interface CalendarCardProps {
  event: CalendarEvent;
  style?: React.CSSProperties;
  onSectionClick: () => void;
  width?: number;
  offsetLeft?: number;
}

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
  const startTime = convertTo12hFormat(event.startTime);
  const endTime = convertTo12hFormat(event.endTime);

  const calculateDurationRows = (startRowIndex: number, endRowIndex: number) => {
    return endRowIndex - startRowIndex;
  };

  const dayToStartColumnIndex: Record<string, number> = {
    M: 1, // Monday
    T: 2, // Tuesday
    W: 3, // Wednesday
    Th: 4, // Thursday
    F: 5, // Friday
  };

  function getStartColumnIndexForDays(meetingDays: string): number[] {
    const days = meetingDays.split(',');
    return days.map((day) => dayToStartColumnIndex[day.trim()]);
  }

  const classMeeting = event.section.classMeetings.find(
    (meeting) => getStartColumnIndexForDays(meeting.meetingDays)[0] === event.startColumnIndex
  );

  return (
    <div
      className={`text-xs calendar-card ${event.textColor}`}
      style={{
        backgroundColor: event.color,
        gridColumn: `${event.startColumnIndex} / span 1`,
        gridRow: `${event.startRowIndex + 1} / span ${calculateDurationRows(event.startRowIndex, event.endRowIndex)}`,
        width: `calc(100% * ${width || 1})`,
        marginLeft: `calc(100% * ${offsetLeft || 0})`,
        overflow: 'hidden',
        maxHeight: '100%',
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
        <div className='event-details'>
          <div className='event-time'>
            <time dateTime={event.startTime} title={`${startTime} - ${endTime}`}>
              {startTime} - {endTime}
            </time>
          </div>
          <div className='event-location'>
            <span
              className='location'
              title={`${classMeeting?.buildingName} ${classMeeting?.room}`}
            >
              {classMeeting?.buildingName}
              <br />
              {classMeeting?.room}
            </span>
          </div>
        </div>
      </div>
      <button className='options-button' title='Options' style={{ backgroundColor: event.color }}>
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
