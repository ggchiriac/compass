import { ListItem, ListItemText, Typography } from '@mui/material';

import useCalendarStore from '@/store/calendarSlice';

const CalendarSearchItem = ({ course }) => {
  const addCourse = useCalendarStore((state) => state.addCourse);

  const handleClick = () => {
    addCourse(course);
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
            {course.title}
          </Typography>
        }
        secondary={
          <Typography variant='body2' color='textSecondary' component='div'>
            {`${course.department_code} ${course.catalog_number}`}
          </Typography>
        }
      />
    </ListItem>
  );
};

export default CalendarSearchItem;
