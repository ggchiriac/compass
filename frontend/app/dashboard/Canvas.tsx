"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  useDroppable,
  UniqueIdentifier,
  useSensors,
  useSensor,
  MeasuringStrategy,
  KeyboardCoordinateGetter,
  defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import {
  AnimateLayoutChanges,
  SortableContext,
  useSortable,
  arrayMove,
  defaultAnimateLayoutChanges,
  verticalListSortingStrategy,
  SortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createPortal, unstable_batchedUpdates } from "react-dom";

import { Course, Profile } from "@/types";

import Search from "@/components/Search";
import useSearchStore from "@/store/searchSlice";

import { Item, Container, ContainerProps } from "../../components";
import { TabbedMenu } from "../../components/TabbedMenu";

import {
  coordinateGetter as multipleContainersCoordinateGetter
} from "./multipleContainersKeyboardCoordinates";
import { min } from "lodash";

type Dictionary = {
  [key: string]: any;
};

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true });

// TODO: Might be needed for styling
// const gridContainerStyle = {
//   display: 'grid',
//   gridTemplateColumns: '1fr 1fr', // Two columns
//   gridTemplateRows: 'repeat(4, 1fr)', // Four rows
//   gap: '10px', // Space between grid items
// };

// const gridItemStyle = {
//   border: '1px solid #ccc',
//   padding: '10px',
//   textAlign: 'center',
// };

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
  style?: React.CSSProperties;
}) {
  const {
    active,
    attributes,
    isDragging,
    listeners,
    over,
    setNodeRef,
    transition,
    transform
  } =
    useSortable({
      id,
      data: {
        type: "container",
        children: items
      },
      animateLayoutChanges
    });
  const isOverContainer = over
    ? (id === over.id && active?.data.current?.type !== "container") || items.includes(over.id)
    : false;

  return (
    <Container
      ref={disabled ? undefined : setNodeRef}
      style={{
        ...style,
        transition,
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : undefined
      }}
      hover={isOverContainer}
      handleProps={{
        ...attributes,
        ...listeners
      }}
      columns={columns}
      {...props}
    >
      {children}
    </Container>
  );
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5"
      }
    }
  })
};

type Items = Record<UniqueIdentifier, UniqueIdentifier[]>;

interface Props {
  user: Profile;
  adjustScale?: boolean;
  cancelDrop?: CancelDrop;
  columns?: number;
  initialItems?: Items; // Consider removing since we populate semester bins based on classyear
  containerStyle?: React.CSSProperties;
  coordinateGetter?: KeyboardCoordinateGetter;

  getItemStyles?(args: {
    value: UniqueIdentifier;
    index: number;
    overIndex: number;
    isDragging: boolean;
    containerId: UniqueIdentifier;
    isSorting: boolean;
    isDragOverlay: boolean;
  }): React.CSSProperties;

  wrapperStyle?(args: { index: number }): React.CSSProperties;

  itemCount?: number;
  items?: Items;
  handle?: boolean;

  renderItem?(): React.ReactElement;

  strategy?: SortingStrategy;
  modifiers?: Modifiers;
  minimal?: boolean;
  trashable?: boolean;
  scrollable?: boolean;
  vertical?: boolean;
}

export const TRASH_ID = "void";
export const PLACEHOLDER_ID = "placeholder";
export const SEARCH_RESULTS_ID = "Search Results";

export function Canvas({
                         user,
                         adjustScale = false,
                         // itemCount = 3, // remove this?
                         cancelDrop,
                         columns = 2,
                         handle = false,
                         // initialItems, // remove
                         containerStyle,
                         coordinateGetter = multipleContainersCoordinateGetter,
                         getItemStyles = () => ({}),
                         wrapperStyle = () => ({}),
                         minimal = false,
                         modifiers,
                         renderItem,
                         strategy = verticalListSortingStrategy,
                         trashable = false,
                         // vertical = false,
                         scrollable
                       }: Props) {
  const classYear = user.classYear ?? 2025;
  console.log(user.classYear);
  console.log(user);

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
    user_courses: { [key: number]: Course[] }
  ): Items => {
    const startYear = classYear - 4;
    console.log("updateSemesters called");

    let semester = 1;
    for (let year = startYear; year < classYear; ++year) {
      prevItems[`Fall ${year}`] = user_courses[semester].map(
        (course) => `${course.department_code} ${course.catalog_number}`
      );
      semester += 1;
      prevItems[`Spring ${year + 1}`] = user_courses[semester].map(
        (course) => `${course.department_code} ${course.catalog_number}`
      );
      semester += 1;
    }

    console.log(user_courses);
    console.log(prevItems);
    return prevItems;
  };

  const semesters = generateSemesters(classYear);
  const [items, setItems] = useState<Items>(() => ({
    [SEARCH_RESULTS_ID]: [], // Initialize search container with no courses
    ...semesters
  }));

  const nestedDictionary: Dictionary = {
    'Requirements': ""
  };
  const [reqDict, setReqDict] = useState<Dictionary>(() => ({
    reqDict: nestedDictionary
  }));

  function mapKeysToStrings(obj: Dictionary): Dictionary {
    const result: Dictionary = {};
  
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Since values can be either string or Dictionary, no further type check is required here
        result[String(key)] = obj[key];
      }
    }
  
    return result;
  }

  interface RequirementDict {
    [key: string]: any; // Define the shape of your requirement objects
  }
  
  interface User {
    major?: { code: string };
    minors?: Array<{ code: string }>;
  }
  
  // Assuming 'user' is of type User
  let majorCode = user.major?.code;
  let minors = user.minors ?? [];
  
  const requirements: RequirementDict = { "blank": { "blank": "hi" } };
  
  // Add major to requirements if it's a string
  if (typeof majorCode === 'string') {
    requirements[majorCode] = reqDict.reqDict[majorCode];
  }
  
  // Iterate over minors and add them to requirements if their code is a string
  minors.forEach(minor => {
    let minorCode = minor.code;
    if (typeof minorCode === 'string') {
      requirements[minorCode] = reqDict.reqDict[minorCode];
    }
  });
  
  
  useEffect(() => {
    let user_courses: { [key: number]: Course[] } = {};

    fetch(`${process.env.BACKEND}/get_user_courses/`, {
      method: "GET",
      credentials: "include"
    })
      .then((response) => response.json())
      .then((data) => {
        user_courses = data;

        setItems((prevItems) => ({
          ...updateSemesters(prevItems, classYear, user_courses)
        }));
      })
      .catch((error) => console.error("User Courses Error:", error));
  }, []);

  const { searchResults } = useSearchStore();
  // useEffect(() => {
  //   setItems((prevItems) => ({
  //     ...prevItems,
  //     // for deptcode catalognum in each semesterbin:
  //     // exclude if shared with search results bin
  //     [SEARCH_RESULTS_ID]: searchResults.map(
  //       (course) => `${course.department_code} ${course.catalog_number}`
  //     )
  //   }));
  // }, [searchResults]);

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
          .filter((course) => !userCurrentCourses.has(`${course.department_code} ${course.catalog_number}`))
          .map((course) => `${course.department_code} ${course.catalog_number}`),
      };
    });
  }, [searchResults]);
  
  // useEffect(() => {
  //   const updatedSemesters = generateSemesters(classYear);
  //   setContainers([SEARCH_RESULTS_ID, ...Object.keys(updatedSemesters)]);
  // }, [classYear]);

  const initialContainers = [SEARCH_RESULTS_ID, ...Object.keys(semesters)];
  const [containers, setContainers] = useState<UniqueIdentifier[]>(initialContainers);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const recentlyMovedToNewContainer = useRef(false);
  const isSortingContainer = activeId ? containers.includes(activeId) : false;

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
          )
        });
      }

      // Start by finding any intersecting droppable
      const pointerIntersections = pointerWithin(args);
      const intersections =
        pointerIntersections.length > 0
          ? // If there are droppables intersecting with the pointer, return those
          pointerIntersections
          : rectIntersection(args);
      let overId = getFirstCollision(intersections, "id");

      if (overId !== null) {
        if (overId === TRASH_ID) {
          // If the intersecting droppable is the trash, return early
          // Remove this if you're not using trashable functionality in your app
          return intersections;
        }

        if (overId in items) {
          const containerItems = items[overId];

          // If a container is matched and it contains items (columns 'A', 'B', 'C')
          if (containerItems.length > 0) {
            // Return the closest droppable within that container
            overId = closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter(
                (container) => container.id !== overId && containerItems.includes(container.id)
              )
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
      coordinateGetter
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
    console.log("Drag canceled");
    if (clonedItems) {
      // Reset items to their original state in case items have been
      // Dragged across containers
      setItems(clonedItems);
    }

    setActiveId(null);
    setClonedItems(null);
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      recentlyMovedToNewContainer.current = false;
    });
  }, [items]);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always
          }
        }}
        onDragStart={({ active }) => {
          console.log("Drag started: ", active.id);
          setActiveId(active.id);
          setClonedItems(items);
        }}
        onDragOver={({ active, over }) => {
          console.log("Drag over: ", {
            activeId: active.id,
            overId: over?.id
          });
          const overId = over?.id;

          if (overId === null || overId === undefined || overId === TRASH_ID || active.id in items) {
            return;
          }

          const overContainer = findContainer(overId);
          const activeContainer = findContainer(active.id);

          if (!overContainer || !activeContainer) {
            return;
          }

          if (activeContainer !== overContainer) {
            setItems((items) => {
              const activeItems = items[activeContainer];
              const overItems = items[overContainer];
              const overIndex = overItems.indexOf(overId);
              const activeIndex = activeItems.indexOf(active.id);

              let newIndex: number;

              if (overId in items) {
                newIndex = overItems.length + 1;
              } else {
                const isBelowOverItem =
                  over &&
                  active.rect.current.translated &&
                  active.rect.current.translated.top > over.rect.top + over.rect.height;

                const modifier = isBelowOverItem ? 1 : 0;

                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
              }

              recentlyMovedToNewContainer.current = true;

              return {
                ...items,
                [activeContainer]: items[activeContainer].filter((item) => item !== active.id),
                [overContainer]: [
                  ...items[overContainer].slice(0, newIndex),
                  items[activeContainer][activeIndex],
                  ...items[overContainer].slice(newIndex, items[overContainer].length)
                ]
              };
            });
          }
        }}
        onDragEnd={({ active, over }) => {
          console.log("Drag end: ", {
            activeId: active.id,
            overId: over?.id
          });
          if (active.id in items && over?.id) {
            setContainers((containers) => {
              const activeIndex = containers.indexOf(active.id);
              const overIndex = containers.indexOf(over.id);

              return arrayMove(containers, activeIndex, overIndex);
            });
          }

          const activeContainer = findContainer(active.id);

          if (!activeContainer) {
            setActiveId(null);
            return;
          }

          const overId = over?.id;

          if (overId === null || overId === undefined) {
            setActiveId(null);
            return;
          }

          if (overId === TRASH_ID) {
            setItems((items) => ({
              ...items,
              [activeContainer]: items[activeContainer].filter(
                (id) => id !== activeId
              ),
            }));
            setActiveId(null);
            return;
          }

          if (overId === PLACEHOLDER_ID) {
            const newContainerId = getNextContainerId();

            unstable_batchedUpdates(() => {
              setContainers((containers) => [...containers, newContainerId]);
              setItems((items) => ({
                ...items,
                [activeContainer]: items[activeContainer].filter((id) => id !== activeId),
                [newContainerId]: [active.id]
              }));
              setActiveId(null);
            });
            return;
          }

          const overContainer = findContainer(overId);

          if (overContainer) {
            const activeIndex = items[activeContainer].indexOf(active.id);
            const overIndex = items[overContainer].indexOf(overId);

            if (activeIndex !== overIndex) {
              setItems((items) => ({
                ...items,
                [overContainer]: arrayMove(items[overContainer], activeIndex, overIndex)
              }));
            }
          }

          setActiveId(null);

          const courseId = active.id;
          const semesterId = activeContainer;
          fetch(`${process.env.BACKEND}/update_user_courses/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            // Need CSRF token here from Next.js
            body: JSON.stringify({ courseId, semesterId })
          })
            .then((response) => response.json())
            .then((data) => console.log("Update success", data))
            .catch((error) => console.error("Update Error:", error));

          fetch(`${process.env.BACKEND}/check_requirements/`, {
            method: "GET",
            credentials: "include"
          }).then((response) => response.json())
            .then((data) => {
              console.log(data);
              setReqDict((reqDict) => ({
                reqDict: mapKeysToStrings(data)
              }));
              console.log(reqDict.reqDict);
            })
            .catch((error) => console.error("Requirements Check Error:", error));
        }}
        cancelDrop={cancelDrop}
        onDragCancel={onDragCancel}
        modifiers={modifiers}
      >
        <SortableContext items={[...containers, PLACEHOLDER_ID]}>
          <div style={{ display: "flex", flexDirection: "row" }}>
            {/* Left Section for Search Results */}
            {containers.includes("Search Results") && (
              <div style={{ width: "100%", marginRight: "20px" }}>
                <DroppableContainer
                  key="Search Results"
                  id="Search Results"
                  label={<Search />}
                  columns={columns}
                  items={items["Search Results"]}
                  scrollable={scrollable}
                  style={containerStyle}
                  unstyled={minimal}
                  height="688px"
                >
                  <SortableContext items={items["Search Results"]}
                                   strategy={strategy}>
                    {items["Search Results"].map((value, index) => (
                      <SortableItem
                        disabled={isSortingContainer}
                        key={index}
                        id={value}
                        index={index}
                        handle={handle}
                        style={getItemStyles}
                        wrapperStyle={wrapperStyle}
                        renderItem={renderItem}
                        containerId="Search Results"
                        getIndex={getIndex}
                      />
                    ))}
                  </SortableContext>
                </DroppableContainer>
              </div>
            )}

            {/* Right Section for other containers in a 2x4 grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gridTemplateRows: "1fr 1fr 1fr 1fr",
                gap: "0px"
              }}
            >
              {containers
                .filter((id) => id !== "Search Results")
                .map((containerId) => (
                  <DroppableContainer
                    key={containerId}
                    id={containerId}
                    label={minimal ? undefined : `${containerId}`}
                    columns={columns}
                    items={items[containerId]}
                    scrollable={scrollable}
                    style={containerStyle}
                    unstyled={minimal}
                    onRemove={() => handleRemove(containerId)}
                    height="150px"
                  >
                    <SortableContext items={items[containerId]}
                                     strategy={strategy}>
                      {items[containerId].map((value, index) => (
                        <SortableItem
                          disabled={isSortingContainer}
                          key={index}
                          id={value}
                          index={index}
                          handle={handle}
                          style={getItemStyles}
                          wrapperStyle={wrapperStyle}
                          renderItem={renderItem}
                          containerId={containerId}
                          getIndex={getIndex}
                        />
                      ))}
                    </SortableContext>
                  </DroppableContainer>
                ))}
            </div>
          </div>
        </SortableContext>

        {createPortal(
          <DragOverlay adjustScale={adjustScale}
                       dropAnimation={dropAnimation}>
            {activeId
              ? containers.includes(activeId)
                ? renderContainerDragOverlay(activeId)
                : renderSortableItemDragOverlay(activeId)
              : null}
          </DragOverlay>,
          document.body
        )}
        {trashable && activeId && !containers.includes(activeId) ?
          <Trash id={TRASH_ID} /> : null}
      </DndContext>
      <div className="w-1/4"> {/* Adjust width as necessary */}
        <div>
          <TabbedMenu tabsData = {requirements} />
        </div>
        
      </div>
    </>
  );

  function renderSortableItemDragOverlay(id: UniqueIdentifier) {
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
          isDragOverlay: true
        })}
        color={getColor(id)}
        wrapperStyle={wrapperStyle({ index: 0 })}
        renderItem={renderItem}
        dragOverlay
      />
    );
  }

  function renderContainerDragOverlay(containerId: UniqueIdentifier) {
    return (
      <Container
        label={`${containerId}`}
        columns={columns}
        style={{
          height: "100%"
        }}
        shadow
        unstyled={false}
      >
        {items[containerId].map((item, index) => (
          <Item
            key={item}
            value={item}
            handle={handle}
            style={getItemStyles({
              containerId,
              overIndex: -1,
              index: getIndex(item),
              value: item,
              isDragging: false,
              isSorting: false,
              isDragOverlay: false
            })}
            color={getColor(item)}
            wrapperStyle={wrapperStyle({ index })}
            renderItem={renderItem}
          />
        ))}
      </Container>
    );
  }

  function handleRemove(containerID: UniqueIdentifier) {
    setContainers((containers) => containers.filter((id) => id !== containerID));
  }

  function getNextContainerId() {
    const containerIds = Object.keys(items);
    const lastContainerId = containerIds[containerIds.length - 1];

    return String.fromCharCode(lastContainerId.charCodeAt(0) + 1);
  }
}

function getColor(id: UniqueIdentifier) {
  switch (String(id)[0]) {
    case "A":
      return "#7193f1";
    case "B":
      return "#ffda6c";
    case "C":
      return "#00bcd4";
    case "D":
      return "#ef769f";
  }

  return undefined;
}

function Trash({ id }: { id: UniqueIdentifier }) {
  const { setNodeRef, isOver } = useDroppable({
    id
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "fixed",
        left: "50%",
        marginLeft: -150,
        bottom: 20,
        width: 300,
        height: 60,
        borderRadius: 5,
        border: "1px solid",
        borderColor: isOver ? "red" : "#DDD"
      }}
    >
      Drop here to delete
    </div>
  );
}

interface SortableItemProps {
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
  }): React.CSSProperties;

  getIndex(id: UniqueIdentifier): number;

  renderItem?(): React.ReactElement;

  wrapperStyle({ index }: { index: number }): React.CSSProperties;
}

function SortableItem({
                        disabled,
                        id,
                        index,
                        handle,
                        renderItem,
                        style,
                        containerId,
                        getIndex,
                        wrapperStyle
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
    transition
  } = useSortable({
    id
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
        containerId
      })}
      color={getColor(id)}
      transition={transition}
      transform={transform}
      fadeIn={mountedWhileDragging}
      listeners={listeners}
      renderItem={renderItem}
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
