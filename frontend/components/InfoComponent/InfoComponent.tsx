import { useState, useEffect } from 'react';

import { Button } from '@mui/joy';
import classNames from 'classnames';
import { createPortal } from 'react-dom';

import LoadingComponent from '../LoadingComponent';
import SettingsModal from '../Modal';
import ReviewMenu from '../ReviewMenu';

import styles from './InfoComponent.module.scss';

interface InfoComponentProps {
  value: string;
}

const InfoComponent: React.FC<InfoComponentProps> = ({ value }) => {
  const dept = value.split(' ')[0];
  const coursenum = value.split(' ')[1];
  const [showPopup, setShowPopup] = useState(false);
  const [courseDetails, setCourseDetails] = useState<{ [key: string]: any } | null>(null);

  useEffect(() => {
    if (showPopup && dept && coursenum) {
      const url = new URL(`${process.env.BACKEND}/course_details/`);
      url.searchParams.append('dept', dept);
      url.searchParams.append('coursenum', coursenum);

      fetch(url.toString(), {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((data) => {
          setCourseDetails(data);
        });
    }
  }, [showPopup, dept, coursenum]);

  const handleKeyDown = (event) => {
    if (event.key === 'Escape' || event.key === 'Enter') {
      handleClose(event);
    }
  };

  const handleClick = (event) => {
    event.stopPropagation();
    setShowPopup(true);
    document.addEventListener('keydown', handleKeyDown);
  };

  const handleClose = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setShowPopup(false);
    document.removeEventListener('keydown', handleKeyDown);
  };

  const modalContent = showPopup ? (
    <SettingsModal>
      <div className={styles.modal} style={{ width: '85%', height: '75%', padding: '25px' }}>
        {' '}
        {/* Ensure full width */}
        {courseDetails ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              width: '100vw',
              overflowX: 'auto',
              overflowY: 'auto',
            }}
          >
            {' '}
            {/* Full width and row direction */}
            {/* Details section with explicit width */}
            <div
              style={{
                height: '485px',
                overflowWrap: 'break-word',
                flexWrap: 'wrap',
                overflowY: 'auto',
                width: '55%',
                paddingLeft: '10px',
              }}
            >
              <div>
                <div className={styles.detailRow}>
                  <strong className={styles.strong}>{value}</strong>
                </div>
                {Object.entries(courseDetails).map(([key, value]) => (
                  <div key={key} className={styles.detailRow}>
                    <strong className={styles.strong}>{key}:</strong> {value}
                  </div>
                ))}
              </div>
            </div>
            {/* ReviewMenu with explicit width */}
            <div style={{ paddingLeft: '20px', width: '45%', height: '400px' }}>
              {' '}
              {/* Half width */}
              <ReviewMenu dept={dept} coursenum={coursenum} />
            </div>
          </div>
        ) : (
          <LoadingComponent />
          // <div>Loading...</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '15px' }}>
          <footer className='mt-auto text-right'>
            <Button
              variant='outlined'
              color='neutral'
              onClick={handleClose}
              sx={{ ml: 2 }}
              size='sm'
            >
              Close
            </Button>
          </footer>
        </div>
      </div>
    </SettingsModal>
  ) : null;

  return (
    <>
      <div
        onClick={handleClick}
        style={{
          position: 'relative',
          display: 'block', // changed from inline-block to block
          cursor: 'pointer',
          maxWidth: '100%', // ensure it respects the container's max width
          overflow: 'hidden', // ensure overflow is hidden
          whiteSpace: 'nowrap', // no wrap
          textOverflow: 'ellipsis', // apply ellipsis
        }}
        className={classNames(styles.Action)}
      >
        {value.length > 28 ? `${value.substring(0, 27)}...` : value}
      </div>
      {modalContent && createPortal(modalContent, document.body)}
    </>
  );
};

export default InfoComponent;
