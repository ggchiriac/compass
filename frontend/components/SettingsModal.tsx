import { FC } from 'react';

import { createPortal } from 'react-dom';

import { SettingsModalProps } from '@/types';

const SettingsModal: FC<SettingsModalProps> = ({ children }) => {
  return createPortal(
    <>
      {/* TODO: Would be nice but likely not before deadline: Need an equivalent fade out animation when 'Close' is pressed */}
      <div className='modal-backdrop fixed inset-0 backdrop-blur-sm bg-black bg-opacity-30 z-50'></div>
      <div className='modal-entrance fixed inset-0 flex justify-center items-center z-50'>
        <div className='p-5 rounded-lg max-w-md w-1/2 shadow-xl'>{children}</div>
      </div>
    </>,
    document.body
  );
};

export default SettingsModal;
