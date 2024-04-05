import { CalendarEvent } from '@/types';

import styles from '@/components/Item/Item.module.scss';
import useCalendarStore from '@/store/calendarSlice';

interface SelectedCourseItemProps {
  course: CalendarEvent;
}

const SelectedCourseItem: React.FC<SelectedCourseItemProps> = ({ course }) => {
  const removeCourse = useCalendarStore((state) => state.removeCourse);

  const handleRemove = () => {
    removeCourse(String(course.course.guid));
  };

  return (
    <div className={styles.Wrapper}>
      <div
        className={`${styles.Item} ${styles.color}`}
        style={
          {
            '--color_primary': course.color,
            '--color_secondary': course.textColor,
          } as React.CSSProperties
        }
      >
        <div className={styles.TextContainer}>
          <div>{course.course.title}</div>
          <div>{`${course.course.departmentCode} ${course.course.catalogNumber}`}</div>
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
