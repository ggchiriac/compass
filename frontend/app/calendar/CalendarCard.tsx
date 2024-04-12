import { FC, CSSProperties } from 'react';

import { CalendarEvent } from '@/types';

import './Calendar.scss';

interface CalendarCardProps {
  event: CalendarEvent;
  style?: CSSProperties;
  onSectionClick: () => void;
  width?: number;
  offsetLeft?: number;
  startIndex: number;
  endIndex: number;
}

const CalendarCard: FC<CalendarCardProps> = ({
  event,
  onSectionClick,
  width = 1,
  offsetLeft = 0,
  startIndex,
  endIndex,
}) => {
  const dayToStartColumnIndex: Record<string, number> = {
    M: 1,
    T: 2,
    W: 3,
    Th: 4,
    F: 5,
  };

  const getStartColumnIndexForDays = (meetingDays: string): number[] => {
    console.log(`Mapping meeting days: ${meetingDays}`);
    const days = meetingDays.split(',');
    const indices = days.map((day) => dayToStartColumnIndex[day.trim()]);
    console.log(`Column indices for days ${meetingDays}:`, indices);
    return indices;
  };

  const relevantMeetings = event.section.class_meetings.filter((meeting) =>
    getStartColumnIndexForDays(meeting.days).includes(event.startColumnIndex)
  );

  console.log(
    `Relevant meetings found for event starting at row ${event.startRowIndex}:`,
    relevantMeetings
  );

  return (
    <div
      className={`calendar-card ${event.textColor}`}
      style={{
        backgroundColor: event.color,
        gridRow: `${startIndex} / ${endIndex}`,
        gridColumn: `${event.startColumnIndex + 1} / span 1`,
        width: `calc(100% * ${width})`,
        marginLeft: `calc(100% * ${offsetLeft})`,
        overflow: 'hidden',
      }}
      onClick={onSectionClick}
    >
      {/* <div className='card-header'></div>
      <div className='card-body'>
        {relevantMeetings.map((classMeeting, index) => (
          <div key={index} className='event-details'>
            <div className='event-department'>
              <span className='department-code'>{event.course.department_code}</span>
              <span className='catalog-number'>{event.course.catalog_number}</span>
            </div>
            <div className='event-location'>
              <span className='building-name'>{classMeeting.building_name}</span>
            </div>
          </div>
        ))}
      </div> */}
      <div className='event-department'>
        {event.course.department_code} {event.course.catalog_number}
      </div>
      {/* Button */}
    </div>
  );
};

export default CalendarCard;
