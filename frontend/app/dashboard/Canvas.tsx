'use client';

import { CSSProperties, ReactElement, useCallback, useEffect, useRef, useState } from 'react';

import {
  CancelDrop,
  closestCenter,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
  DndContext,
  DragOverlay,
  DropAnimation,
  getFirstCollision,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  Modifiers,
  // TODO: Should probably delete this: useDroppable,
  UniqueIdentifier,
  useSensors,
  useSensor,
  MeasuringStrategy,
  KeyboardCoordinateGetter,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  AnimateLayoutChanges,
  SortableContext,
  useSortable,
  defaultAnimateLayoutChanges,
  verticalListSortingStrategy,
  SortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createPortal } from 'react-dom';

import { Course, Profile } from '@/types';

import Search from '@/components/Search';
import { TabbedMenu } from '@/components/TabbedMenu';
import useSearchStore from '@/store/searchSlice';

import { Item, Container, ContainerProps } from '../../components';

import { coordinateGetter as multipleContainersCoordinateGetter } from './multipleContainersKeyboardCoordinates';

const PRIMARY_COLOR_LIST: string[] = [
  '#ff7895',
  '#e38a62',
  '#cdaf7b',
  '#94bb77',
  '#e2c25e',
  '#ead196',
  '#e7bc7d',
  '#d0b895',
  '#72b4c9',
  '#2cdbca',
  '#a8cadc',
  '#c5bab6',
  '#bf91bd',
];

const SECONDARY_COLOR_LIST: string[] = [
  '#ff91a9',
  '#e9a88a',
  '#d7bf95',
  '#afcb9a',
  '#e9d186',
  '#f5db9d',
  '#f0d2a8',
  '#dcc9af',
  '#96c7d6',
  '#2ee8d6',
  '#a8d3dc',
  '#cac1be',
  '#c398c1',
];

function simpleHash(str: string) {
  if (str.length !== 3) {
    return 0;
  }

  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    sum += (i + 1) * str.charCodeAt(i);
  }
  return sum % 11;
}

async function fetchCsrfToken() {
  try {
    const response = await fetch(`${process.env.BACKEND}/csrf`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data.csrfToken ? String(data.csrfToken) : '';
  } catch (error) {
    return 'Error fetching CSRF token!';
  }
}
let csrfToken: string;

if (typeof window === 'undefined') {
  // Server-side or during pre-rendering/build time
  csrfToken = '';
} else {
  // Client-side
  (async () => {
    csrfToken = await fetchCsrfToken();
  })();
}

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true });

function DroppableContainer({
  children,
  columns = 1,
  disabled,
  id,
  items,
  style,
  ...props
}: ContainerProps & {
  disabled?: boolean;
  id: UniqueIdentifier;
  items: UniqueIdentifier[];
  style?: CSSProperties;
}) {
  const { active, isDragging, over, setNodeRef, transition, transform } = useSortable({
    id,
    data: {
      type: 'container',
      children: items,
    },
    animateLayoutChanges,
  });
  const isOverContainer = over
    ? (id === over.id && active?.data.current?.type !== 'container') || items.includes(over.id)
    : false;

  return (
    <Container
      ref={disabled ? undefined : setNodeRef}
      style={{
        ...style,
        transition,
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : undefined,
      }}
      hover={isOverContainer}
      columns={columns}
      {...props}
    >
      {children}
    </Container>
  );
}

// THIS IS WHERE YOU EDIT THE DND DROP ANIMATION
const dropAnimation: DropAnimation = {
  // TODO: Lowkey, this is where we can render the course card differently -> full title to DEPT CATNUM
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

type Items = Record<UniqueIdentifier, UniqueIdentifier[]>;

type Props = {
  user: Profile;
  adjustScale?: boolean;
  cancelDrop?: CancelDrop;
  columns?: number;

  // TODO: Consider removing since we populate semester bins based on classyear
  initialItems?: Items;
  containerStyle?: CSSProperties;

  coordinateGetter?: KeyboardCoordinateGetter;

  getItemStyles?(args: {
    value: UniqueIdentifier;
    index: number;
    overIndex: number;
    isDragging: boolean;
    containerId: UniqueIdentifier;
    isSorting: boolean;
    isDragOverlay: boolean;
  }): CSSProperties;

  itemCount?: number;
  items?: Items;
  handle?: boolean;
  onRemove?(courseId: string): void;
  renderItem?(): ReactElement;

  strategy?: SortingStrategy;
  modifiers?: Modifiers;
  minimal?: boolean;
  scrollable?: boolean;
  vertical?: boolean;
};

export const PLACEHOLDER_ID = 'placeholder';
export const SEARCH_RESULTS_ID = 'Search Results';
const defaultClassYear = new Date().getFullYear() + 1;

export function Canvas({
  user,
  adjustScale = false,
  cancelDrop,
  columns = 2,
  handle = true,
  containerStyle,
  coordinateGetter = multipleContainersCoordinateGetter,
  getItemStyles = () => ({}),
  minimal = false,
  renderItem,
  strategy = verticalListSortingStrategy,
  // vertical = false,
  scrollable,
}: Props) {
  // This limits the width of the course cards
  const wrapperStyle = () => ({
    width: 150,
    height: 150,
    transition: 'width 0.3s ease-in-out',
  });
  const searchWrapperStyle = () => ({
    height: 150,
    transition: 'width 0.3s ease-in-out',
  });
  const classYear = user.classYear ?? defaultClassYear;

  const generateSemesters = (classYear: number): Items => {
    const semesters: Items = {};
    const startYear = classYear - 4;

    for (let year = startYear; year < classYear; ++year) {
      semesters[`Fall ${year}`] = [];
      semesters[`Spring ${year + 1}`] = [];
    }
    return semesters;
  };

  const updateSemesters = (
    prevItems: Items,
    classYear: number,
    userCourses: { [key: number]: Course[] }
  ): Items => {
    const startYear = classYear - 4;
    let semester = 1;
    for (let year = startYear; year < classYear; ++year) {
      prevItems[`Fall ${year}`] = userCourses[semester].map(
        (course) => `${course.course_id}|${course.crosslistings}`
      );
      semester += 1;
      prevItems[`Spring ${year + 1}`] = userCourses[semester].map(
        (course) => `${course.course_id}|${course.crosslistings}`
      );
      semester += 1;
    }
    return prevItems;
  };

  const semesters = generateSemesters(classYear);
  const [items, setItems] = useState<Items>(() => ({
    [SEARCH_RESULTS_ID]: [], // Initialize search container with no courses
    ...semesters,
  }));

  // The width of the semester bins is hard-coded here
  const semesterBinStyle = {
    ...containerStyle,
    width: '322px',
  };

  type Dictionary = {
    [key: string]: any; // TODO: Aim to replace 'any' with more specific types.
  };

  // Initialize a more structured dictionary if possible
  const initialRequirements: Dictionary = {};

  // State for academic requirements
  const [academicPlan, setAcademicPlan] = useState<Dictionary>(initialRequirements);

  // Assuming 'user' is of type User
  const userMajorCode = user.major?.code;
  const userMinors = user.minors ?? [];

  // Structure to hold degree requirements
  const degreeRequirements: Dictionary = { General: '' };

  // Add major to degree requirements if it's a string
  if (userMajorCode && typeof userMajorCode === 'string') {
    degreeRequirements[userMajorCode] = academicPlan[userMajorCode] ?? {};
  }

  // Iterate over minors and add them to degree requirements if their code is a string
  userMinors.forEach((minor) => {
    const minorCode = minor.code;
    if (minorCode && typeof minorCode === 'string') {
      degreeRequirements[minorCode] = academicPlan[minorCode] ?? {};
    }
  });

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${process.env.BACKEND}/fetch_courses/`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return null; // Handle error appropriately
    }
  };

  const checkRequirements = () => {
    fetch(`${process.env.BACKEND}/check_requirements/`, {
      method: 'GET',
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((data) => {
        setAcademicPlan(data);
      });
  };

  // Fetch user courses and check requirements on initial render
  useEffect(() => {
    fetchCourses().then((fetchedData) => {
      if (fetchedData) {
        setItems((prevItems) => ({
          ...updateSemesters(prevItems, classYear, fetchedData),
        }));
      }
    });
    checkRequirements();
  }, [classYear]);

  const searchResults = useSearchStore((state) => state.searchResults);

  useEffect(() => {
    setItems((prevItems) => {
      const userCurrentCourses: Set<string> = new Set<string>();
      Object.keys(prevItems).forEach((key) => {
        if (key !== SEARCH_RESULTS_ID) {
          const courses = prevItems[key];
          courses.forEach((course) => {
            userCurrentCourses.add(course.toString());
          });
        }
      });

      return {
        ...prevItems,
        [SEARCH_RESULTS_ID]: searchResults
          .filter(
            (course) => !userCurrentCourses.has(`${course.course_id}|${course.crosslistings}`)
          )
          .map((course) => `${course.course_id}|${course.crosslistings}`),
      };
    });
  }, [searchResults]);

  const initialContainers = [SEARCH_RESULTS_ID, ...Object.keys(semesters)];
  const containers = initialContainers;
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeContainerId, setActiveContainerId] = useState<UniqueIdentifier | null>(null);
  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const recentlyMovedToNewContainer = useRef(false);
  // isSortingContainer is legacy code, since we are not using sortable containers
  const isSortingContainer = false;
  const [overContainerId, setOverContainerId] = useState(null);

  /**
   * Custom collision detection strategy optimized for multiple containers
   *
   * - First, find any droppable containers intersecting with the pointer.
   * - If there are none, find intersecting containers with the active draggable.
   * - If there are no intersecting containers, return the last matched intersection
   *
   */
  const collisionDetectionStrategy: CollisionDetection = useCallback(
    (args) => {
      if (activeId && activeId in items) {
        return closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter(
            (container) => container.id in items
          ),
        });
      }

      // Start by finding any intersecting droppable
      const pointerIntersections = pointerWithin(args);
      const intersections =
        pointerIntersections.length > 0
          ? // If there are droppables intersecting with the pointer, return those
            pointerIntersections
          : rectIntersection(args);
      let overId = getFirstCollision(intersections, 'id');

      if (overId !== null) {
        if (overId in items) {
          const containerItems = items[overId];

          // If a container is matched and it contains items (columns 'A', 'B', 'C')
          if (containerItems.length > 0) {
            // Return the closest droppable within that container
            overId = closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter(
                (container) => container.id !== overId && containerItems.includes(container.id)
              ),
            })[0]?.id;
          }
        }

        lastOverId.current = overId;

        return [{ id: overId }];
      }
      // When a draggable item moves to a new container, the layout may shift
      // and the `overId` may become `null`. We manually set the cached `lastOverId`
      // to the id of the draggable item that was moved to the new container, otherwise
      // the previous `overId` will be returned which can cause items to incorrectly shift positions
      if (recentlyMovedToNewContainer.current) {
        lastOverId.current = activeId;
      }

      // If no droppable is matched, return the last match
      return lastOverId.current ? [{ id: lastOverId.current }] : [];
    },
    [activeId, items]
  );
  const [clonedItems, setClonedItems] = useState<Items | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter,
    })
  );
  const findContainer = (id?: UniqueIdentifier) => {
    if (id === null || id === undefined) {
      return;
    }
    if (id in items) {
      return id;
    }
    return Object.keys(items).find((key) => items[key].includes(id));
  };

  const getIndex = (id: UniqueIdentifier) => {
    const container = findContainer(id);

    if (!container) {
      return -1;
    }

    const index = items[container].indexOf(id);

    return index;
  };

  const onDragCancel = () => {
    if (clonedItems) {
      // Reset items to their original state in case items have been
      // Dragged across containers
      setItems(clonedItems);
    }

    setActiveId(null);
    setActiveContainerId(null);
    setOverContainerId(null);
    setClonedItems(null);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
        onDragStart={({ active }) => {
          const activeContainer = findContainer(active.id);

          setActiveId(active.id);
          setActiveContainerId(activeContainer);
          setOverContainerId(activeContainer);
          setClonedItems(items);
        }}
        onDragOver={({ active, over }) => {
          const overId = over?.id;
          if (overId === null || overId === undefined || active.id in items) {
            return;
          }

          const overContainer = findContainer(overId);
          const activeContainer = findContainer(active.id);
          setOverContainerId(overContainer);

          if (!overContainer || !activeContainer) {
            return;
          }

          if (activeContainer !== overContainer) {
            setItems((items) => {
              const activeItems = items[activeContainer];
              const overItems = items[overContainer];
              const activeIndex = activeItems.indexOf(active.id);
              const newIndex: number = overItems.length + 1;
              recentlyMovedToNewContainer.current = true;

              return {
                ...items,
                [activeContainer]: items[activeContainer].filter((item) => item !== active.id),
                [overContainer]: [
                  ...items[overContainer].slice(0, newIndex),
                  items[activeContainer][activeIndex],
                  ...items[overContainer].slice(newIndex, items[overContainer].length),
                ],
              };
            });
          }
        }}
        onDragEnd={async ({ active, over }) => {
          // Active and over are course draggables.
          if (!activeContainerId) {
            setActiveId(null);
            return;
          }

          const overId = over?.id;

          if (overId === null || overId === undefined) {
            setActiveId(null);
            setActiveContainerId(null);
            return;
          }

          const overContainerId = findContainer(overId);

          if (overContainerId) {
            if (activeContainerId !== overContainerId) {
              const csrfToken = await fetchCsrfToken();
              fetch(`${process.env.BACKEND}/update_courses/`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                  'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify({
                  courseId: active.id.toString().split('|')[0],
                  semesterId: overContainerId,
                }),
              }).then((response) => response.json());
              checkRequirements();
            }
          }

          setActiveId(null);
          setActiveContainerId(null);
          setOverContainerId(null);
        }}
        cancelDrop={cancelDrop}
        onDragCancel={onDragCancel}
      >
        <SortableContext items={[...containers, PLACEHOLDER_ID]}>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            {/* Left Section for Search Results */}
            {containers.includes('Search Results') && (
              <div style={{ width: '360px' }}>
                {/* issue here with resizing + with requirements dropdowns*/}
                {/* Try to get this to fixed height*/}
                <DroppableContainer
                  key='Search Results'
                  id='Search Results'
                  label={<Search />}
                  columns={1}
                  items={items['Search Results']}
                  scrollable={scrollable}
                  style={containerStyle}
                  height='703px'
                >
                  <SortableContext items={items['Search Results']} strategy={strategy}>
                    {items['Search Results'].map((value, index) => (
                      <SortableItem
                        disabled={isSortingContainer}
                        key={index}
                        id={value}
                        index={index}
                        handle={handle}
                        style={getItemStyles}
                        wrapperStyle={searchWrapperStyle}
                        renderItem={renderItem} // This render function should render with full name
                        containerId='Search Results'
                        getIndex={getIndex}
                      />
                    ))}
                  </SortableContext>
                </DroppableContainer>
              </div>
            )}

            {/* Center Section for other containers in a 2x4 grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gridTemplateRows: '1fr 1fr 1fr 1fr',
              }}
            >
              {containers
                .filter((id) => id !== 'Search Results')
                .map((containerId) => (
                  <DroppableContainer
                    key={containerId}
                    id={containerId}
                    label={minimal ? undefined : `${containerId}`}
                    columns={columns}
                    items={items[containerId]}
                    scrollable={scrollable}
                    style={semesterBinStyle}
                    unstyled={minimal}
                    height='160px'
                  >
                    <SortableContext items={items[containerId]} strategy={strategy}>
                      {items[containerId].map((course, index) => (
                        <SortableItem
                          disabled={isSortingContainer}
                          key={index}
                          id={course}
                          index={index}
                          handle={handle}
                          style={getItemStyles}
                          wrapperStyle={wrapperStyle}
                          onRemove={() => handleRemove(course, containerId)}
                          renderItem={renderItem}
                          containerId={containerId}
                          getIndex={getIndex}
                        />
                      ))}
                    </SortableContext>
                  </DroppableContainer>
                ))}
            </div>

            {/* Right section for requirements */}
            <div style={{ width: '380px' }}>
              <TabbedMenu
                tabsData={academicPlan}
                csrfToken={csrfToken}
                checkRequirements={checkRequirements}
              />
            </div>
          </div>
        </SortableContext>

        {createPortal(
          <DragOverlay adjustScale={adjustScale} dropAnimation={dropAnimation}>
            {activeId ? renderSortableItemDragOverlay(activeId) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </>
  );

  function renderSortableItemDragOverlay(id: UniqueIdentifier) {
    // Determine the current overlay width based on overContainerId
    const currentOverlayWidth = overContainerId === SEARCH_RESULTS_ID ? '340px' : '150px';
    const currentOverlayLeft =
      activeContainerId === SEARCH_RESULTS_ID && overContainerId !== SEARCH_RESULTS_ID
        ? '190px'
        : activeContainerId !== SEARCH_RESULTS_ID && overContainerId === SEARCH_RESULTS_ID
          ? '-190px'
          : '0px';

    // Modify the wrapperStyle function or directly adjust the style here to use the determined width
    const dynamicWrapperStyle = {
      ...wrapperStyle(), // Spread the original styles
      width: currentOverlayWidth, // Override the width with the current overlay width
      left: currentOverlayLeft,
      transition: 'width 0.2s ease-in-out, left 0.2s ease-in-out', // Ensure smooth transition
    };

    return (
      <Item
        value={id}
        handle={handle}
        style={getItemStyles({
          containerId: findContainer(id) as UniqueIdentifier,
          overIndex: -1,
          index: getIndex(id),
          value: id,
          isSorting: true,
          isDragging: true,
          isDragOverlay: true,
        })}
        color_primary={getPrimaryColor(id)}
        color_secondary={getSecondaryColor(id)}
        wrapperStyle={dynamicWrapperStyle}
        renderItem={renderItem}
        dragOverlay
      />
    );
  }

  function handleRemove(value: UniqueIdentifier, containerId: UniqueIdentifier) {
    setItems((items) => {
      const userCurrentCourses: Set<string> = new Set<string>();
      Object.keys(items).forEach((key) => {
        if (key !== SEARCH_RESULTS_ID) {
          const courses = items[key];
          courses.forEach((course) => {
            if (course.toString() !== value.toString()) {
              userCurrentCourses.add(course.toString());
            }
          });
        }
      });
      const updatedCourses = {
        ...items,
        [SEARCH_RESULTS_ID]: searchResults
          .filter(
            (course) => !userCurrentCourses.has(`${course.course_id}|${course.crosslistings}`)
          )
          .map((course) => `${course.course_id}|${course.crosslistings}`),
        [containerId]: items[containerId].filter((course) => course !== value.toString()),
      };
      return updatedCourses;
    });

    fetch(`${process.env.BACKEND}/update_courses/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({
        courseId: value.toString().split('|')[0],
        semesterId: 'Search Results',
      }),
    }).then((response) => {
      response.json();
      checkRequirements();
    });
  }
}

function getPrimaryColor(id: UniqueIdentifier) {
  const hash = simpleHash(String(id).split('|')[1].slice(0, 3));
  return PRIMARY_COLOR_LIST[hash];
}

function getSecondaryColor(id: UniqueIdentifier) {
  const hash = simpleHash(String(id).split('|')[1].slice(0, 3));
  return SECONDARY_COLOR_LIST[hash];
}

type SortableItemProps = {
  containerId: UniqueIdentifier;
  id: UniqueIdentifier;
  index: number;
  handle: boolean;
  disabled?: boolean;

  style(args: {
    value: UniqueIdentifier;
    index: number;
    overIndex: number;
    isDragging: boolean;
    containerId: UniqueIdentifier;
    isSorting: boolean;
    isDragOverlay?: boolean;
  }): CSSProperties;

  getIndex(id: UniqueIdentifier): number;

  onRemove?(): void;

  renderItem?(): ReactElement;

  wrapperStyle({ index }: { index: number }): CSSProperties;
};

function SortableItem({
  disabled,
  id,
  index,
  handle,
  onRemove,
  renderItem,
  style,
  containerId,
  getIndex,
  wrapperStyle,
}: SortableItemProps) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    listeners,
    isDragging,
    isSorting,
    over,
    overIndex,
    transform,
    transition,
  } = useSortable({
    id,
  });
  const mounted = useMountStatus();
  const mountedWhileDragging = isDragging && !mounted;

  return (
    <Item
      ref={disabled ? undefined : setNodeRef}
      value={id}
      dragging={isDragging}
      sorting={isSorting}
      handle={handle}
      handleProps={handle ? setActivatorNodeRef : undefined}
      index={index}
      wrapperStyle={wrapperStyle({ index })}
      style={style({
        index,
        value: id,
        isDragging,
        isSorting,
        overIndex: over ? getIndex(over.id) : overIndex,
        containerId,
      })}
      color_primary={getPrimaryColor(id)}
      color_secondary={getSecondaryColor(id)}
      transition={transition}
      transform={transform}
      fadeIn={mountedWhileDragging}
      listeners={listeners}
      renderItem={renderItem}
      onRemove={onRemove}
    />
  );
}

function useMountStatus() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsMounted(true), 500);

    return () => clearTimeout(timeout);
  }, []);

  return isMounted;
}
