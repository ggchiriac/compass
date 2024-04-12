import { FC } from 'react';

import { CalendarEvent } from '@/types';

import styles from '@/components/Item/Item.module.scss';
import useCalendarStore from '@/store/calendarSlice';

interface SelectedCourseItemProps {
  event: CalendarEvent;
}

const SelectedCourseItem: FC<SelectedCourseItemProps> = ({ event }) => {
  const removeCourse = useCalendarStore((state) => state.removeCourse);

  const handleRemove = () => {
    removeCourse(String(event.course.guid));
  };

  return (
    <div className={styles.Wrapper}>
      <div
        className={`${styles.Item} ${styles.color}`}
        style={
          {
            '--color_primary': event.color,
            '--color_secondary': event.textColor,
          } as React.CSSProperties
        }
      >
        <div className={styles.TextContainer}>
          <div>{event.course.title}</div>
          <div>{`${event.course.department_code} ${event.course.catalog_number}`}</div>
          <div>{`${event.section.class_type} - ${event.section.class_section}`}</div>
        </div>
        <div className={styles.Actions}>
          <button className={styles.Remove} onClick={handleRemove}>
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectedCourseItem;
