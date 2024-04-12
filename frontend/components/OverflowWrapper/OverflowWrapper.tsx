import { ReactNode } from 'react';

import styles from './OverflowWrapper.module.scss';

type OverflowWraperProps = {
  children: ReactNode;
};

export function OverflowWrapper({ children }: OverflowWraperProps) {
  return <div className={styles.OverflowWrapper}>{children}</div>;
}
