import { FC, useEffect, useState, useCallback } from 'react';

import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Button as JoyButton } from '@mui/joy';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import classNames from 'classnames';

import useSearchStore from '@/store/searchSlice';

import LoadingComponent from '../LoadingComponent';
import SettingsModal from '../Modal';

import styles from '../InfoComponent/InfoComponent.module.scss';

interface Dictionary {
  [key: string]: any;
}

interface DropdownProps {
  data: Dictionary;
  csrfToken: string;
  checkRequirements: any;
}

interface SatisfactionStatusProps {
  satisfied: string;
  count: number;
  minNeeded: number;
  maxCounted: number;
  isRestrictions: boolean;
}

// Satisfaction status icon with styling
const SatisfactionStatus: FC<SatisfactionStatusProps> = ({
  satisfied,
  count,
  minNeeded,
  maxCounted,
  isRestrictions,
}) => {
  if (isRestrictions) {
    return <InfoOutlinedIcon style={{ color: 'blue', marginLeft: '10px' }} />;
  }
  if (maxCounted !== 1) {
    return (
      <>
        {satisfied === 'True' ? (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontWeight: 450, color: 'green' }}>{Math.floor(count / minNeeded)}</span>
            <AddCircleOutlineOutlinedIcon style={{ color: 'green', marginLeft: '10px' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontWeight: 450, color: 'red' }}>
              {count}/{minNeeded}
            </span>
            <HighlightOffIcon style={{ color: 'red', marginLeft: '10px' }} />
          </div>
        )}
      </>
    );
  }
  return (
    <>
      {satisfied === 'True' ? (
        <CheckCircleOutlineIcon style={{ color: 'green', marginLeft: '10px' }} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontWeight: 450, color: 'red' }}>
            {count}/{minNeeded}
          </span>
          <HighlightOffIcon style={{ color: 'red', marginLeft: '10px' }} />
        </div>
      )}
    </>
  );
};

// Dropdown component with refined styling
const Dropdown: FC<DropdownProps> = ({ data, csrfToken, checkRequirements }) => {
  const [showPopup, setShowPopup] = useState(false);
  // const [isLeaf, setIsLeaf] = useState(false);
  const [explanation, setExplanation] = useState<{ [key: number]: any } | null>(null);

  const handleExplanationClick = (event, reqId) => {
    const url = new URL(`${process.env.BACKEND}/requirement_info/`);
    url.searchParams.append('reqId', reqId);

    fetch(url.toString(), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setExplanation(data);
      });
    event.stopPropagation();
    setShowPopup(true);
  };

  const handleClose = useCallback(() => {
    setExplanation('');
    setShowPopup(false);
  }, [setExplanation, setShowPopup]); // Dependencies

  const handleSearch = useCallback(() => {
    if (explanation && explanation[1]) {
      useSearchStore.getState().setSearchResults(explanation[1]);
    }
    handleClose();
  }, [explanation, handleClose]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        handleSearch();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        handleClose();
      }
    };

    if (showPopup) {
      document.addEventListener('keydown', handleKeyDown);
    }

    // Remove event listener if showPopup is false, or on unmount.
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPopup, handleClose, handleSearch]);

  const modalContent = showPopup ? (
    <SettingsModal>
      <div
        style={{
          overflowWrap: 'break-word',
          flexWrap: 'wrap',
          overflowY: 'auto',
          maxHeight: '75vh',
        }}
      >
        <div className={styles.detailRow}>
          {explanation ? (
            Object.entries(explanation).map(([index, value]) => {
              if (index === '0') {
                if (value) {
                  return (
                    <div key={index}>
                      <strong className={styles.strong}>{'Explanation'}:</strong> {value}
                    </div>
                  );
                } else {
                  return (
                    <div key={index}>
                      <strong className={styles.strong}>{'Explanation'}:</strong>{' '}
                      {'No explanation available'}
                    </div>
                  );
                }
              } else if (value[0]) {
                return (
                  <div key={index}>
                    <strong className={styles.strong}>{'Course List'}: </strong>
                    {value
                      .map((course) => {
                        return `${course.crosslistings}, `;
                      })
                      .join('')
                      .slice(0, -2)}
                  </div>
                );
              }
            })
          ) : (
            <LoadingComponent />
            // <div>Loading...</div>
          )}
        </div>
      </div>
      <footer className='mt-auto text-right'>
        {explanation && explanation[1] && explanation[1].length > 0 && (
          <JoyButton variant='soft' color='primary' onClick={handleSearch} size='md'>
            Search Courses
          </JoyButton>
        )}
        <JoyButton variant='soft' color='success' onClick={handleClose} sx={{ ml: 2 }} size='md'>
          Mark Satisfied
        </JoyButton>
        <JoyButton variant='soft' color='neutral' onClick={handleClose} sx={{ ml: 2 }} size='md'>
          Close
        </JoyButton>
      </footer>
    </SettingsModal>
  ) : null;

  const handleClick = (courseId, reqId) => {
    fetch(`${process.env.BACKEND}/manually_settle/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({ courseId: courseId, reqId: reqId }),
    }).then((response) => response.json());

    checkRequirements();
  };

  const renderContent = (data: Dictionary) => {
    return Object.entries(data).map(([key, value]) => {
      if (
        key === 'req_id' ||
        key === 'satisfied' ||
        key === 'count' ||
        key === 'min_needed' ||
        key === 'max_counted'
      ) {
        return null;
      }
      const isArray = Array.isArray(value);
      if (isArray) {
        if (key === 'settled') {
          // Render as disabled buttons
          return value[0].map((item, index) => (
            <Button
              key={index}
              variant='contained'
              disabled={!item['manually_settled']}
              style={{
                margin: '5px',
                backgroundColor: '#f7f7f7',
                color: '#000',
              }}
              onClick={() => handleClick(item['id'], value[1])}
            >
              {item['code']}
            </Button>
          ));
        } else if (key === 'unsettled') {
          // Render as normal buttons
          return value[0].map((item, index) => (
            <Button
              key={index}
              variant='contained'
              style={{
                margin: '5px',
                backgroundColor: '#f7f7f7',
                color: '#000',
                opacity: 0.5,
              }}
              onClick={() => handleClick(item['id'], value[1])}
            >
              {item['code']}
            </Button>
          ));
        }
      }
      const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
      const isRestrictions = key === 'Restrictions';
      const satisfactionElement =
        isObject && 'satisfied' in value ? (
          <SatisfactionStatus
            satisfied={value.satisfied}
            count={value.count}
            minNeeded={value.min_needed}
            maxCounted={value.max_counted}
            isRestrictions={isRestrictions}
          />
        ) : null;

      const subItems = isObject ? { ...value, satisfied: undefined } : value;
      let settledEmpty = false;
      let unsettledEmpty = false;

      if (Object.prototype.hasOwnProperty.call(value, 'settled')) {
        if (Array.isArray(value['settled']) && value['settled'].length > 0) {
          settledEmpty = Array.isArray(value['settled'][0]) && value['settled'][0].length === 0;
        }
      }
      if (Object.prototype.hasOwnProperty.call(value, 'unsettled')) {
        if (Array.isArray(value['unsettled']) && value['unsettled'].length > 0) {
          unsettledEmpty =
            Array.isArray(value['unsettled'][0]) && value['unsettled'][0].length === 0;
        }
      }

      const hasItems = settledEmpty && unsettledEmpty;
      const hasNestedItems = isObject && Object.keys(subItems).length > 0;

      // Style adjustments for accordion components
      return (
        <Accordion
          key={key}
          style={{ margin: '0', boxShadow: 'none', borderBottom: '1px solid #e0e0e0' }}
        >
          <AccordionSummary
            expandIcon={hasNestedItems && !hasItems ? <ExpandMoreIcon /> : null}
            aria-controls={`${key}-content`}
            id={`${key}-header`}
            style={{ backgroundColor: '#f6f6f6' }} // subtle background color
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <div
                className={classNames(styles.Action)}
                onClick={(event) => handleExplanationClick(event, data[key]['req_id'])}
              >
                <Typography style={{ fontWeight: 500 }}>{key}</Typography>
              </div>
              {satisfactionElement}
            </div>
          </AccordionSummary>
          {!hasItems && (
            <AccordionDetails>
              {hasNestedItems ? renderContent(subItems) : <Typography>{value}</Typography>}
            </AccordionDetails>
          )}
        </Accordion>
      );
    });
  };

  return (
    <>
      {renderContent(data)}
      {modalContent}
    </>
  );
};

// Recursive dropdown component
interface RecursiveDropdownProps {
  dictionary: Dictionary;
  csrfToken: string;
  checkRequirements: any;
}

const RecursiveDropdown: FC<RecursiveDropdownProps> = ({
  dictionary,
  csrfToken,
  checkRequirements,
}) => {
  return <Dropdown data={dictionary} csrfToken={csrfToken} checkRequirements={checkRequirements} />;
};

export default RecursiveDropdown;
