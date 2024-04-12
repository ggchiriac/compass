// Renders individual courses to the calendar from the calendar search results

import { ListItem, ListItemText, Typography } from '@mui/material';

import useCalendarStore from '@/store/calendarSlice';

const CalendarSearchItem = ({ course }) => {
  const addCourseToCalendar = useCalendarStore((state) => state.addCourseToCalendar);
  const handleClick = () => {
    addCourseToCalendar(course);
  };

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
