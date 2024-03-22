// Rendering individual course items in course list

import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

import useKairosStore from '@/store/calendarSlice';

const CourseListItem = ({ index, style, data }) => {
  const course = data[index];
  const addCourse = useKairosStore((state) => state.addCourse);

  const handleClick = () => {
    addCourse(course);
  };

  return (
    <ListItem button style={style} key={index} onClick={handleClick}>
      <ListItemText
        primary={course.title}
        secondary={`${course.department_code} ${course.catalog_number}`}
      />
    </ListItem>
  );
};

export default CourseListItem;
