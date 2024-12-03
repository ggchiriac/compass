import type { CSSProperties, ReactNode } from 'react';
import { memo, forwardRef, useEffect } from 'react';

import classNames from 'classnames';

import { InfoComponent } from '../InfoComponent';

import { Handle, Remove } from './components';
import styles from './Item.module.css';

import type { DraggableSyntheticListeners } from '@dnd-kit/core';
import type { Transform } from '@dnd-kit/utilities';

export type Props = {
  dragOverlay?: boolean;
  color_primary?: string;
  color_secondary?: string;
  disabled?: boolean;
  dragging?: boolean;
  handle?: boolean;
  handleProps?: (element: HTMLElement | null) => void | undefined;
  height?: number;
  index?: number;
  fadeIn?: boolean;
  transform?: Transform | null;
  listeners?: DraggableSyntheticListeners;
  sorting?: boolean;
  style?: CSSProperties;
  transition?: string | null;
  wrapperStyle?: CSSProperties;
  value: ReactNode; // Text or JSX
  onRemove?(): void;
};

export const Item = memo(
  forwardRef<HTMLLIElement, Props>(
    (
      {
        color_primary,
        color_secondary,
        dragOverlay = false,
        dragging = false,
        disabled = false,
        fadeIn = false,
        handle = false,
        handleProps,
        index = 0,
        listeners,
        onRemove,
        sorting = false,
        style,
        transition,
        transform = null,
        value,
        wrapperStyle,
        ...props
      },
      ref
    ) => {
      // Grabbing cursor style on overlay
      useEffect(() => {
        if (!dragOverlay) {
          return;
        }
        document.body.style.cursor = 'grabbing';
        return () => {
          document.body.style.cursor = '';
        };
      }, [dragOverlay]);

      // Safely extract transform properties with defaults
      const translateX = transform.x != null ? `${Math.round(transform.x)}px` : undefined;
      const translateY = transform.y != null ? `${Math.round(transform.y)}px` : undefined;
      const scaleX = transform.scaleX != null ? `${transform.scaleX}` : undefined;
      const scaleY = transform.scaleY != null ? `${transform.scaleY}` : undefined;

      // Safely convert value to string for InfoComponent
      const stringValue = typeof value === 'string' ? value : (value.toString() ?? '');
      const infoValue = stringValue.split('|')[1] ?? '';

      return (
        <li
          className={classNames(
            styles.Wrapper,
            fadeIn && styles.fadeIn,
            sorting && styles.sorting,
            dragOverlay && styles.dragOverlay
          )}
          style={
            {
              ...wrapperStyle,
              transition: [transition, wrapperStyle.transition].filter(Boolean).join(', '),
              '--translate-x': translateX,
              '--translate-y': translateY,
              '--scale-x': scaleX,
              '--scale-y': scaleY,
              '--index': index,
              '--color_primary': color_primary,
              '--color_secondary': color_secondary,
            } as CSSProperties
          }
          ref={ref}
        >
          <div
            className={classNames(
              styles.Item,
              dragging && styles.dragging,
              handle && styles.withHandle,
              dragOverlay && styles.dragOverlay,
              disabled && styles.disabled,
              color_primary && styles.color_primary,
              color_secondary && styles.color_secondary
            )}
            style={style}
            data-cypress='draggable-item'
            {...(!handle && !disabled ? listeners : undefined)}
            {...props}
            tabIndex={disabled ? -1 : !handle ? 0 : undefined}
          >
            {/* Text Container for InfoComponent */}
            <div className={styles.TextContainer}>
              {!disabled ? <InfoComponent value={infoValue} /> : infoValue}
            </div>

            {!disabled && handle ? (
              <Handle {...handleProps} {...listeners} className={styles.Handle} />
            ) : null}

            {/* Actions Container for the Remove button */}
            {!disabled ? (
              <span className={styles.Actions}>
                <Remove className={styles.Remove} onClick={onRemove} />
              </span>
            ) : null}
          </div>
        </li>
      );
    }
  )
);
