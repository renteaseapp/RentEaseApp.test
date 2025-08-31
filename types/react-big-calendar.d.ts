declare module 'react-big-calendar' {
  import { ComponentType } from 'react';

  export interface Event {
    title?: string;
    start?: Date;
    end?: Date;
    resource?: any;
    allDay?: boolean;
  }

  export interface CalendarProps {
    localizer: any;
    events: Event[];
    startAccessor?: string | ((event: Event) => Date);
    endAccessor?: string | ((event: Event) => Date);
    titleAccessor?: string | ((event: Event) => string);
    allDayAccessor?: string | ((event: Event) => boolean);
    resourceAccessor?: string | ((event: Event) => any);
    onSelectEvent?: (event: Event) => void;
    onNavigate?: (date: Date) => void;
    onView?: (view: string) => void;
    view?: string;
    views?: string[] | { [key: string]: boolean | ComponentType };
    date?: Date;
    style?: React.CSSProperties;
    className?: string;
    components?: any;
    formats?: any;
    messages?: any;
    culture?: string;
    max?: Date;
    min?: Date;
    scrollToTime?: Date;
    enableAutoScroll?: boolean;
    dayLayoutAlgorithm?: string;
    popup?: boolean;
    popupOffset?: number | { x: number; y: number };
    selectable?: boolean | 'ignoreEvents';
    longPressThreshold?: number;
    onSelectSlot?: (slotInfo: any) => void;
    onDoubleClickEvent?: (event: Event) => void;
    onKeyPressEvent?: (event: Event) => void;
    onShowMore?: (events: Event[], date: Date) => void;
    showMultiDayTimes?: boolean;
    step?: number;
    timeslots?: number;
    rtl?: boolean;
    eventPropGetter?: (event: Event, start: Date, end: Date, isSelected: boolean) => any;
    slotPropGetter?: (date: Date) => any;
    dayPropGetter?: (date: Date) => any;
    showAllEvents?: boolean;
    doShowMoreDrillDown?: boolean;
    drilldownView?: string;
    length?: number;
    toolbar?: boolean;
    getNow?: () => Date;
    scrollToTime?: Date;
    defaultDate?: Date;
    defaultView?: string;
  }

  export const Calendar: ComponentType<CalendarProps>;
  export function momentLocalizer(moment: any): any;
  export function globalizeLocalizer(globalize: any): any;
  export function dateFnsLocalizer(config: any): any;
}

declare module 'react-big-calendar/lib/css/react-big-calendar.css' {
  const content: string;
  export default content;
}