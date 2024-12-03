import { FC, CSSProperties } from "react";
import { CalendarEvent } from "@/types";
import "./Calendar.css";
import { departmentColors } from "@/utils/departmentColors";

interface CalendarCardProps {
  event: CalendarEvent;
  style?: CSSProperties;
  onSectionClick: () => void;
  width?: number;
  offsetLeft?: number;
  startIndex: number;
  endIndex: number;
  dept: string;
}

const CalendarCard: FC<CalendarCardProps> = ({
  event,
  onSectionClick,
  width = 1,
  offsetLeft = 0,
  startIndex,
  endIndex,
  dept,
}) => {
  function getGradientStyle(
    dept: string,
    needsChoice: boolean,
    isChosen: boolean,
  ): string {
    const baseGradient =
      departmentColors[dept] || "linear-gradient(135deg, #3498db, #2980b9)";

    if (!needsChoice || isChosen) {
      return baseGradient;
    }

    return `
      ${baseGradient},
      repeating-linear-gradient(
        45deg,
        rgba(255, 255, 255, 0.1) 0px,
        rgba(255, 255, 255, 0.1) 8px,
        rgba(0, 0, 0, 0.05) 8px,
        rgba(0, 0, 0, 0.05) 16px
      )
    `;
  }

  return (
    <div
      className={`calendar-card ${event.textColor}`}
      style={{
        background: getGradientStyle(dept, event.needsChoice, event.isChosen),
        opacity: event.needsChoice && !event.isChosen ? 0.5 : 1,
        gridRow: `${startIndex} / ${endIndex}`,
        gridColumn: `${event.startColumnIndex + 1} / span 1`,
        width: `calc(100% * ${width})`,
        marginLeft: `calc(100% * ${offsetLeft})`,
        overflow: "hidden",
        position: "relative",
      }}
      onClick={onSectionClick}
    >
      <div className="event-department">
        {event.course.department_code} {event.course.catalog_number} -{" "}
        {event.section.class_section}
      </div>

      <div className="text-sm text-white/80 mt-1">
        {event.startTime} – {event.endTime}
      </div>

      <div className="flex justify-between items-center text-sm text-white/80 mt-1">
        <span>{event.section.class_meetings[0].building_name}</span>
        <span>
          {event.section.enrollment} / {event.section.capacity}
        </span>
      </div>
    </div>
  );
};

export default CalendarCard;
