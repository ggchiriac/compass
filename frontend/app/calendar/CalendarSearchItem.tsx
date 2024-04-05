// Renders individual courses for the calendar search results

import { ListItem, ListItemText, Typography } from '@mui/material';

import useCalendarStore from '@/store/calendarSlice';

const CalendarSearchItem = ({ course }) => {
  const addCourse = useCalendarStore((state) => state.addCourse);
  // const selectedCourses = useCalendarStore((state) => state.selectedCourses);

  const handleClick = () => {
    addCourse(course);
  };

  // useEffect(() => {
  //   console.log('Course List rn:', selectedCourses.sections);
  // }, [selectedCourses]);

  return (
    <ListItem
      onClick={handleClick}
      sx={{
        '&.Mui-selected': {
          backgroundColor: 'action.selected',
        },
        '&.Mui-selected:hover': {
          backgroundColor: 'action.hover',
        },
      }}
    >
      <ListItemText
        primary={
          <Typography variant='subtitle1' component='div'>
            {course.crosslistings}
          </Typography>
        }
        secondary={
          <Typography variant='body2' color='textSecondary' component='div'>
            {`${course.title}`}
          </Typography>
        }
      />
    </ListItem>
  );
};

export default CalendarSearchItem;
