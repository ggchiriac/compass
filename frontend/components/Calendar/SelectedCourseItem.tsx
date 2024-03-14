// Renders individual selected course items

import Button from '@mui/material/Button';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

import useKairosStore from '@/store/kairosSlice';

const styles = {
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '10px',
  },
};

const SelectedCourseItem: React.FC<{ course: CalendarEvent }> = ({ course }) => {
  const removeCourse = useKairosStore((state) => state.removeCourse);

  return (
    <ListItem style={styles.listContainer}>
      <ListItemText
        primary={course.title}
        secondary={`${course.department_code} ${course.catalog_number}`}
      />
      <Button onClick={() => removeCourse(course.guid)}>Remove</Button>
    </ListItem>
  );
};

export default SelectedCourseItem;
