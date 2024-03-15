import { memo, forwardRef, useEffect } from 'react';

import type { DraggableSyntheticListeners } from '@dnd-kit/core';
import type { Transform } from '@dnd-kit/utilities';
import classNames from 'classnames';

import { InfoComponent } from '../InfoComponent';

import { Handle, Remove } from './components';
import styles from './Item.module.scss';

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
  style?: React.CSSProperties;
  transition?: string | null;
  wrapperStyle?: React.CSSProperties;
  value: React.ReactNode; // This should be the text that appears on the course card
  onRemove?(): void;
  renderItem?(args: {
    dragOverlay: boolean;
    dragging: boolean;
    sorting: boolean;
    index: number | undefined;
    fadeIn: boolean;
    listeners: DraggableSyntheticListeners;
    ref: React.Ref<HTMLElement>;
    style: React.CSSProperties | undefined;
    transform: Props['transform'];
    transition: Props['transition'];
    value: Props['value'];
  }): React.ReactElement;
};

export const Item = memo(
  forwardRef<HTMLLIElement, Props>(
    (
      {
        color_primary,
        color_secondary,
        dragOverlay,
        dragging,
        disabled,
        fadeIn,
        handle,
        handleProps,
        // TODO: need?: height,
        index,
        listeners,
        onRemove,
        renderItem,
        sorting,
        style,
        transition,
        transform,
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

      return renderItem ? (
        renderItem({
          dragOverlay: Boolean(dragOverlay),
          dragging: Boolean(dragging),
          sorting: Boolean(sorting),
          index,
          fadeIn: Boolean(fadeIn),
          listeners,
          ref,
          style,
          transform,
          transition,
          value,
        })
      ) : (
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
              transition: [transition, wrapperStyle?.transition].filter(Boolean).join(', '),
              '--translate-x': transform ? `${Math.round(transform.x)}px` : undefined,
              '--translate-y': transform ? `${Math.round(transform.y)}px` : undefined,
              '--scale-x': transform?.scaleX ? `${transform.scaleX}` : undefined,
              '--scale-y': transform?.scaleY ? `${transform.scaleY}` : undefined,
              '--index': index,
              '--color_primary': color_primary,
              '--color_secondary': color_secondary,
            } as React.CSSProperties
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
            {...(!handle ? listeners : undefined)}
            {...props}
            tabIndex={!handle ? 0 : undefined}
          >
            {/* Text Container for InfoComponent */}
            <div className={styles.TextContainer}>
              <InfoComponent value={value.toString().split('|')[1]} />
            </div>

            {handle ? <Handle {...handleProps} {...listeners} className={styles.Handle} /> : null}

            {/* Actions Container for the Remove button */}
            <span className={styles.Actions}>
              <Remove className={styles.Remove} onClick={onRemove} />
            </span>
          </div>
        </li>
      );
    }
  )
);
