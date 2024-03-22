import { ListItem, ListItemText, Typography, Box } from '@mui/material';

import useKairosStore from '@/store/calendarSlice';

const CourseListItem = ({ item, selected, onClick }) => {
  const addCourse = useKairosStore((state) => state.addCourse);

  const handleClick = () => {
    addCourse(item);
    onClick();
  };

  return (
    <ListItem
      button
      onClick={handleClick}
      selected={selected}
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
            {item.title}
          </Typography>
        }
        secondary={
          <Typography variant='body2' color='textSecondary' component='div'>
            {`${item.department_code} ${item.catalog_number}`}
          </Typography>
        }
      />
    </ListItem>
  );
};

export default CourseListItem;
