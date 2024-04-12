import { HTMLAttributes, FC, ReactNode } from 'react';

import classNames from 'classnames';

import styles from './Button.module.scss';

export type Props = HTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export const Button: FC<Props> = ({ children, ...props }) => {
  return (
    <button className={classNames(styles.Button)} {...props}>
      {children}
    </button>
  );
};
