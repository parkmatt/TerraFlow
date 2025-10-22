import React from "react";
import { Calendar, momentLocalizer, Event, View } from "react-big-calendar";
import { DatePicker, TimePicker, Select, TreeSelect, Input, Modal, Button, message, Form, InputRef } from "antd";
import moment from "moment";
import dayjs, { Dayjs } from 'dayjs';
import "react-big-calendar/lib/css/react-big-calendar.css";
import TerraFlowCalendarItem from "../models/TerraFlowCalendarItems";
import { createNewEvent, deleteEvent, fetchActivity, fetchMemberCalendars, fetchMemberEvents, fetchUnitMembers, updateEvent, updateMemberCalendars } from "@/services";
import { TerrainEvent, TerrainEventSummary, TerrainUnitMember, TerrrainCalendarResult } from "@/types/terrainTypes";
import { TerrainState } from "@/helpers";

const localizer = momentLocalizer(moment);

// React Big Calendar display formats (use DD/MM/YYYY for dates)
const rbcFormats: any = {
  agendaDateFormat: (date: Date) => moment(date).format('DD/MM/YYYY'),
  agendaTimeFormat: (date: Date) => moment(date).format('HH:mm'),
  // Ensure React Big Calendar uses DD/MM/YYYY where it displays dates
  dateFormat: 'DD/MM/YYYY',
  dayFormat: (date: Date) => moment(date).format('DD/MM/YYYY'),
  // dayRangeHeaderFormat used by month/week/day header rendering
  dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) => `${moment(start).format('DD/MM/YYYY')} – ${moment(end).format('DD/MM/YYYY')}`,
  // Agenda header can be covered by dayRangeHeaderFormat, but set anyway
  agendaHeaderFormat: ({ start, end }: { start: Date; end: Date }) => `${moment(start).format('DD/MM/YYYY')} – ${moment(end).format('DD/MM/YYYY')}`,
};

// Default event settings helper functions
const getDefaultEventSettings = () => {
  const defaultStartTime = localStorage.getItem('terraflow_event_startTime') || '19:00';
  const defaultDuration = parseInt(localStorage.getItem('terraflow_event_duration') || '90');
  const defaultLocation = localStorage.getItem('terraflow_event_location') || '';
  const defaultCalendar = localStorage.getItem('terraflow_event_defaultCalendar') || '';
  const startingDayOfWeek = parseInt(localStorage.getItem('terraflow_event_startingDayOfWeek') || '1'); // Monday
  return { defaultStartTime, defaultDuration, defaultLocation, defaultCalendar, startingDayOfWeek };
};

// Utility functions
const formatDateTimeForAPI = (date: moment.Moment | null, time: Dayjs | null): string => {
  if (!date || !time) return '';
  return moment(date)
    .hour(time.hour())
    .minute(time.minute())
    .utc()
    .format("YYYY-MM-DDTHH:mm:ss.SSSZ");
};

const createEventPayload = (formData: any, selectedEvent?: TerraFlowCalendarItem, allCalendars?: { id: string; name: string; selected: boolean; type?: string }[], fullEvent?: any) => {
  const startDateTime = formatDateTimeForAPI(formData.startDate, formData.startTime);
  const endDateTime = formatDateTimeForAPI(formData.endDate, formData.endTime);

  // Find the selected calendar to get its type
  const selectedCalendar = allCalendars?.find(cal => cal.id === formData.selectedInviteeId);
  const calendarType = selectedCalendar?.type || formData.eventType;

  // For updates, only send the fields that should change
  if (selectedEvent) {
    // Preserve existing review data or use default
    const existingReview = fullEvent?.review;
    const reviewData = {
      general_tags: [],
      scout_method_elements: existingReview?.scout_method_elements || ["symbolic_framework"],
      scout_spices_elements: []
    };

    return {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      start_datetime: startDateTime,
      end_datetime: endDateTime,
      challenge_area: formData.challengeArea,
      status: selectedEvent.event.status || "planned",
      review: reviewData,
    };
  }

  // For new events, send full payload
  return {
    title: formData.title,
    description: formData.description,
    location: formData.location,
    start_datetime: startDateTime,
    end_datetime: endDateTime,
    challenge_area: formData.challengeArea,
    event_type: { 
      type: calendarType, 
      id: formData.selectedInviteeId || TerrainState.getUnitID()  // Use calendar ID as target
    },
    type: calendarType,
    invitees: formData.selectedInviteeId ? [{
      invitee_id: formData.selectedInviteeId,
      invitee_type: calendarType
    }] : [],
    iana_timezone: "Australia/Brisbane",
    status: "planned",
  organisers: [TerrainState.getMemberID()],
    attendance: {
      leader_member_ids: [],
      assistant_member_ids: [],
      attendee_member_ids: [],
      participant_member_ids: [],
    },
    achievement_pathway_logbook_data: {
      achievement_meta: {
        stream: "",
        branch: "",
      },
    },
    achievement_pathway_oas_data: {
      award_rule: "individual",
      verifier: {
        name: "Not Applicable",
        contact: "",
        type: "member",
      },
      groups: [],
    },
    review: { 
      general_tags: [], 
      scout_method_elements: ["symbolic_framework"], 
      scout_spices_elements: [] 
    },
    justification: "",
    equipment_notes: "",
    uploads: [],
    schedule_items: [],
  };
};

interface TerraFlowCalendarProps {
  items: TerraFlowCalendarItem[];
  onUpdate: (items: TerraFlowCalendarItem[]) => void;
}

interface TerraFlowCalendarState {
  items: TerraFlowCalendarItem[];
  activity: any;
  members: { value: string; text: string }[];
  unitMembers: TerrainUnitMember[];
  hideDialog: boolean;
  calendars: TerrrainCalendarResult;
  allCalendars: { id: string; name: string; selected: boolean; type?: string }[];
  isModalVisible: boolean;
  selectedEvent: TerraFlowCalendarItem | null;
  filteredEvents: Event[];
  calendarKey: number;
  startingDayOfWeek: number;
  currentDate: Date;
  newEventForm: {
    title: string;
    description: string;
    location: string;
    startDate: moment.Moment | null;
    startTime: Dayjs | null;
    endDate: moment.Moment | null;
    endTime: Dayjs | null;
    challengeArea: string;
    eventType: string;
    selectedInviteeId: string;
  };
  isCreatingEvent: boolean;
  isDeletingEvent: boolean;
  currentView?: View;
  agendaRange?: [Dayjs, Dayjs];
  locationCache?: { [id: string]: string };
}

export class TerraFlowCalendarComponent extends React.Component<TerraFlowCalendarProps, TerraFlowCalendarState> {
  private titleInputRef: any = null;

  constructor(props: TerraFlowCalendarProps) {
    super(props);
    this.state = {
      items: [],
      activity: {},
      members: [],
      unitMembers: [],
      hideDialog: true,
      calendars: {},
      allCalendars: [],
      isModalVisible: false,
      selectedEvent: null,
      filteredEvents: [],
      calendarKey: 0,
      startingDayOfWeek: parseInt(localStorage.getItem('terraflow_event_startingDayOfWeek') || '1'), // Monday
  currentDate: new Date(),
  currentView: 'month',
  agendaRange: [dayjs().startOf('month'), dayjs().endOf('month')],
      newEventForm: {
        title: '',
        description: '',
        location: '',
        startDate: null,
        startTime: null,
        endDate: null,
        endTime: null,
        challengeArea: 'not_applicable',
        eventType: 'unit',
        selectedInviteeId: '',
      },
      isCreatingEvent: false,
      isDeletingEvent: false,
      locationCache: {},
    };
  }

  // Keep track of in-flight location fetches to avoid duplicates
  private loadingLocations: Set<string> = new Set();

  loadLocation = async (eventId: string) => {
    if (!eventId) return;
    if (this.state.locationCache && this.state.locationCache[eventId] !== undefined) return;
    if (this.loadingLocations.has(eventId)) return;
    this.loadingLocations.add(eventId);
    try {
      const full = await fetchActivity(eventId);
      const location = full?.location || '';
      this.setState({ locationCache: { ...(this.state.locationCache || {}), [eventId]: location } });
    } catch (err) {
      console.error('Error loading activity for location', eventId, err);
      this.setState({ locationCache: { ...(this.state.locationCache || {}), [eventId]: '' } });
    } finally {
      this.loadingLocations.delete(eventId);
    }
  };

  // Update moment locale to use the configured starting day of week
  updateMomentLocale = () => {
    const startingDayOfWeek = parseInt(localStorage.getItem('terraflow_event_startingDayOfWeek') || '1');
    
    // Update moment locale to use the configured first day of week
    moment.updateLocale('en', {
      week: {
        dow: startingDayOfWeek, // Monday is 1, Sunday is 0, Tuesday is 2, etc.
      }
    });
    
    // Update component state if it has changed
    if (this.state.startingDayOfWeek !== startingDayOfWeek) {
      this.setState({ 
        startingDayOfWeek,
        calendarKey: this.state.calendarKey + 1 // Force calendar re-render
      });
    }
  };

  componentDidMount() {
    this.updateMomentLocale(); // Set initial moment locale
    this.fetchCalendars();
    this.fetchData();
    
    // Listen for changes to default event settings
    window.addEventListener('terraflowEventSettingsChanged', this.handleEventSettingsChange as EventListener);
  }

  componentWillUnmount() {
    // Clean up event listener
    window.removeEventListener('terraflowEventSettingsChanged', this.handleEventSettingsChange as EventListener);
  }

  componentDidUpdate(prevProps: TerraFlowCalendarProps, prevState: TerraFlowCalendarState) {
    // Focus title input when modal becomes visible
    if (!prevState.isModalVisible && this.state.isModalVisible) {
      // Use a longer delay to ensure the modal is fully rendered
      setTimeout(() => {
        if (this.titleInputRef) {
          // Try different methods for Ant Design Input focus
          if (this.titleInputRef.focus) {
            this.titleInputRef.focus();
          } else if (this.titleInputRef.input && this.titleInputRef.input.focus) {
            this.titleInputRef.input.focus();
          }
        }
      }, 200);
    }
  }

  

  handleEventSettingsChange = (event: Event) => {
    // Force re-render when settings change
    const customEvent = event as CustomEvent;
    
    // Update moment locale when starting day of week changes
    this.updateMomentLocale();
  };

  fetchCalendars = async () => {
    try {
      const calendars = await fetchMemberCalendars();
      
      const allCalendars =
        calendars && calendars.own_calendars && calendars.other_calendars
          ? calendars.own_calendars
              ?.map((calendar: any) => ({ 
                id: calendar.id, 
                name: calendar.title, 
                selected: calendar.selected,
                type: calendar.type 
              }))
              .concat(calendars.other_calendars?.map((calendar: any) => ({ 
                id: calendar.id, 
                name: calendar.title, 
                selected: calendar.selected,
                type: calendar.type 
              })))
          : [];
      
      // If no calendars are selected, select all by default
      if (allCalendars.length > 0 && allCalendars.filter(c => c.selected).length === 0) {
        allCalendars.forEach(cal => cal.selected = true);
      }
      
      this.setState({ calendars: calendars, allCalendars: allCalendars }, () => {
        this.updateFilteredEvents();
      });
    } catch (error) {
      console.error('Error fetching calendars:', error);
    }
  };

  fetchData = async () => {
    try {
      const unitMembers = await fetchUnitMembers();
      const members = unitMembers.map((member) => ({ value: member.id, text: member.first_name + " " + member.last_name }));
      this.setState({ members: members, unitMembers: unitMembers });
      
      // Expand date range to include past and future months to ensure we get events
      const startDate = moment().subtract(12, 'months').startOf('month').format("YYYY-MM-DDTHH:mm:ss");
      const endDate = moment().add(12, 'months').endOf('month').format("YYYY-MM-DDTHH:mm:ss");

      const data = await fetchMemberEvents(startDate, endDate);
      const items = data.map((item) => new TerraFlowCalendarItem(item));
      
      this.setState({ items }, () => {
        this.updateFilteredEvents();
      });
      this.props.onUpdate(items);
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Failed to load calendar data');
    }
  };

  fetchDataForRange = async (date: Date) => {
    try {
      // Use wider range when navigating to ensure we get events
      const startDate = moment(date).subtract(1, 'month').startOf('month').format("YYYY-MM-DDTHH:mm:ss");
      const endDate = moment(date).add(2, 'months').endOf('month').format("YYYY-MM-DDTHH:mm:ss");

      const data = await fetchMemberEvents(startDate, endDate);
      const items = data.map((item) => new TerraFlowCalendarItem(item));
      this.setState({ items }, () => {
        // Ensure calendar selections are preserved after fetching new data
        this.updateFilteredEvents();
      });
      this.props.onUpdate(items);
    } catch (error) {
      console.error('Error fetching data for range:', error);
    }
  };

  // Utility function to check if an event matches a calendar
  private mapEventToCalendars = (item: TerraFlowCalendarItem): string[] => {
    const matchingInviteeIds: string[] = [];
    
    // Use invitee_id to match calendar IDs directly
    if (item.event.invitee_id) {
      const directMatch = this.state.allCalendars.find(cal => cal.id === item.event.invitee_id);
      if (directMatch) {
        matchingInviteeIds.push(item.event.invitee_id);
      }
    }
    
    return matchingInviteeIds;
  };

  // Convert TerraFlowCalendarItem to React Big Calendar event format
  convertToCalendarEvents = (): Event[] => {
    const selectedInviteeIds = this.state.allCalendars
      .filter((c) => c.selected)
      .map((c) => c.id);

    // If no calendars are selected, show no events
    if (selectedInviteeIds.length === 0) {
      return [];
    }

    const events: Event[] = [];
    const cubsInviteeId = 'c6ef46a6-5910-4521-8306-3d0a2f327152';

    const filteredItems = this.state.items.filter((item) => {
      const eventInviteeIds = this.mapEventToCalendars(item);
      return eventInviteeIds.some(eventInviteeId => selectedInviteeIds.includes(eventInviteeId));
    });

    return filteredItems.map((item) => {
      const start = new Date(item.StartTime);
      const end = new Date(item.EndTime);
      
      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.warn('Invalid date found in event:', item.Subject, item.StartTime, item.EndTime);
        return null;
      }
      
      return {
        id: item.Id,
        title: item.Subject || '',
        start: start,
        end: end,
        allDay: false,
        resource: item,
      };
    }).filter(event => event !== null);
  };

  // Update filtered events whenever items or calendar selection changes
  updateFilteredEvents = () => {
    const filteredEvents = this.convertToCalendarEvents();
    
    this.setState({ 
      filteredEvents: [...filteredEvents],
      calendarKey: this.state.calendarKey + 1
    });
  };

  // Get color for calendar type (TerraFlow calendar logic)
  getCalendarColor = (calendarName: string, calendarType: string, section: string = 'scout'): string => {
    const lowerName = calendarName?.toLowerCase() || '';
    
    // Special colors for specific calendar types and names
    if (calendarType === 'patrol') {
      // All patrols get unique colors based on name hash for consistency
      const patrolColors = ["#8B4513", "#FF6347", "#4682B4", "#32CD32", "#FFD700", "#9370DB", "#20B2AA", "#F0E68C"];
      const nameHash = calendarName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      return patrolColors[nameHash % patrolColors.length];
    }
    
    if (calendarType === 'group') {
      // Generate group colors based on name hash for consistency across different groups
      const groupColors = ["#6A5ACD", "#4169E1", "#7B68EE", "#9932CC", "#8A2BE2", "#9400D3", "#6495ED", "#483D8B"];
      const nameHash = calendarName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      return groupColors[nameHash % groupColors.length];
    }
    
    // For unit calendars, check for specific sections by name
    // This only applies to unit-level calendars, not patrols
    if (lowerName.includes('joey')) {
      return "#b65518"; // Joey brown
    }
    if (lowerName.includes('cub')) {
      return "#ffc82e"; // Cubs yellow
    }
    if (lowerName.includes('venturer')) {
      return "#9e1b32"; // Venturer maroon
    }
    if (lowerName.includes('rover')) {
      return "#dc291e"; // Rover red
    }
    // Scout section last to avoid conflicts with "Cub Scouts", "Venturer Scouts", etc.
    if (lowerName.includes('scout') && !lowerName.includes('cub') && !lowerName.includes('venturer') && !lowerName.includes('joey') && !lowerName.includes('rover')) {
      return "#00ae42"; // Scout green
    }
    
    // Units and others get standard section colors based on section parameter
    const sectionColors: { [key: string]: string } = {
      joey: "#b65518",
      cub: "#ffc82e", 
      scout: "#00ae42",
      venturer: "#9e1b32",
      rover: "#dc291e"
    };
    return sectionColors[section] || "#f89d69";
  };

  // Helper function to darken colors
  darkenColor = (color: string, factor: number): string => {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.floor(parseInt(hex.substr(0, 2), 16) * (1 - factor)));
    const g = Math.max(0, Math.floor(parseInt(hex.substr(2, 2), 16) * (1 - factor)));
    const b = Math.max(0, Math.floor(parseInt(hex.substr(4, 2), 16) * (1 - factor)));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Event style getter for React Big Calendar
  eventStyleGetter = (event: any) => {
    const calendarItem = event.resource as TerraFlowCalendarItem;
    return {
      style: {
        backgroundColor: calendarItem.color || '#3174ad',
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  

  // React Big Calendar event handlers
  onNavigate = (date: Date) => {
    this.setState({ currentDate: date });
    this.fetchDataForRange(date);
  };

  onView = (view: View) => {
    // Track current view so we can show agenda-specific controls
    this.setState({ currentView: view });
  };

  onSelectEvent = async (event: any) => {
    const calendarItem = event.resource as TerraFlowCalendarItem;
    
    // Get challenge area from API response
    const challengeArea = calendarItem.event.challenge_area || 'community';
    
    // Determine event type from invitee_type
    const eventType = calendarItem.event.invitee_type || 'unit';
    
    // Fetch the full event details to get location and description
    const fullEvent = await fetchActivity(calendarItem.Id);
    const location = fullEvent?.location || '';
    const description = fullEvent?.description || '';
    
    // Use invitee_id as calendar ID
    const selectedInviteeId = calendarItem.event.invitee_id || '';
    
    // Go directly to edit mode when clicking on an event
    this.setState({ 
      selectedEvent: calendarItem,
      isModalVisible: true,
      newEventForm: {
        title: calendarItem.event.title || '',
        description: description,
        location: location,
        startDate: moment(calendarItem.StartTime),
        startTime: dayjs(calendarItem.StartTime),
        endDate: moment(calendarItem.EndTime),
        endTime: dayjs(calendarItem.EndTime),
        challengeArea: challengeArea,
        eventType: eventType,
        selectedInviteeId: selectedInviteeId,
      }
    });
  };

  onSelectSlot = (slotInfo: any) => {
    // When user selects a time slot to create new event
    const { defaultStartTime, defaultDuration, defaultLocation, defaultCalendar, startingDayOfWeek } = getDefaultEventSettings();
    
    // Parse the default start time
    const [hours, minutes] = defaultStartTime.split(':').map(Number);
    
    // Set the start time to the default time on the selected date
    const startMoment = moment(slotInfo.start).hour(hours).minute(minutes);
    const startTime = dayjs().hour(hours).minute(minutes);
    
    // Calculate end time based on default duration
    const endMoment = moment(startMoment).add(defaultDuration, 'minutes');
    const endTime = dayjs(startTime).add(defaultDuration, 'minutes');
    
    // Use the saved default calendar, or fall back to previous logic
    let selectedInviteeId = '';
    if (defaultCalendar) {
      // Check if the saved default calendar still exists in available calendars
      const savedCalendar = this.state.allCalendars.find(cal => cal.id === defaultCalendar);
      if (savedCalendar) {
        selectedInviteeId = defaultCalendar;
      }
    }
    
    // If no saved default or it doesn't exist, use fallback logic
    if (!selectedInviteeId) {
      const fallbackCalendar = this.state.allCalendars.find(cal => cal.name.toLowerCase().includes('ldrs')) 
        || this.state.allCalendars[0];
      selectedInviteeId = fallbackCalendar?.id || '';
    }
    
    this.setState({ 
      selectedEvent: null, // Clear any selected event
      isModalVisible: true,
      newEventForm: {
        ...this.state.newEventForm,
        startDate: startMoment,
        startTime: startTime,
        endDate: endMoment,
        endTime: endTime,
        location: defaultLocation,
        selectedInviteeId: selectedInviteeId,
      }
    });
  };

  // New Event Form Handlers
  handleFormFieldChange = (field: string, value: any) => {
    this.setState({
      newEventForm: {
        ...this.state.newEventForm,
        [field]: value
      }
    });
  };

  handleCreateEvent = async () => {
    const { newEventForm } = this.state;
    
    // Validation
    if (!newEventForm.title || !newEventForm.startDate || !newEventForm.endDate || 
        !newEventForm.startTime || !newEventForm.endTime) {
      message.error('Please fill in all required fields');
      return;
    }

    if (!newEventForm.selectedInviteeId) {
      message.error('Please select a calendar for the event');
      return;
    }

    const eventToUpload = createEventPayload(newEventForm, undefined, this.state.allCalendars);
    this.setState({ isCreatingEvent: true });

    try {
      const selectedCalendar = this.state.allCalendars.find(cal => cal.id === newEventForm.selectedInviteeId);
      const calendarType = selectedCalendar?.type || 'unit';
      const result = await createNewEvent(JSON.stringify(eventToUpload), newEventForm.selectedInviteeId, calendarType);
      if (result) {
        message.error('Failed to create event: ' + JSON.stringify(result));
      } else {
        message.success('Event created successfully!');
        this.closeModal();
        this.fetchData();
      }
    } catch (error) {
      message.error('Error creating event: ' + error);
    } finally {
      this.setState({ isCreatingEvent: false });
    }
  };

  handleUpdateEvent = async () => {
    const { newEventForm, selectedEvent } = this.state;
    
    if (!selectedEvent) {
      message.error('No event selected for updating');
      return;
    }
    
    // Validation
    if (!newEventForm.title || !newEventForm.startDate || !newEventForm.endDate || 
        !newEventForm.startTime || !newEventForm.endTime) {
      message.error('Please fill in all required fields');
      return;
    }

    this.setState({ isCreatingEvent: true });

    try {
      // Fetch full event details to get existing review data
      const fullEvent = await fetchActivity(selectedEvent.Id);
      
      // Use update API
      // This preserves attendance, uploads, and other data we don't track
      const eventToUpdate = createEventPayload(newEventForm, selectedEvent, this.state.allCalendars, fullEvent);
      await updateEvent(selectedEvent.Id, JSON.stringify(eventToUpdate));
      
      message.success('Event updated successfully!');
      this.closeModal();
      this.fetchData();
    } catch (error) {
      console.error('Error updating event:', error);
      message.error('Error updating event: ' + error);
    } finally {
      this.setState({ isCreatingEvent: false });
    }
  };

  handleDeleteEvent = async () => {
    const { selectedEvent } = this.state;
    
    if (!selectedEvent) {
      message.error('No event selected for deletion');
      return;
    }

    // Show confirmation
    Modal.confirm({
      title: 'Delete Event',
      content: `Are you sure you want to delete "${selectedEvent.Subject}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        this.setState({ isDeletingEvent: true });
        
        try {
          await deleteEvent(selectedEvent.Id);
          message.success('Event deleted successfully!');
          this.closeModal();
          // Refresh the calendar data
          this.fetchData();
        } catch (error) {
          console.error('Error deleting event:', error);
          message.error('Error deleting event: ' + error);
        } finally {
          this.setState({ isDeletingEvent: false });
        }
      }
    });
  };

  // Confirmation for marking an event as concluded
  confirmMarkConcluded = () => {
    const { selectedEvent } = this.state;
    if (!selectedEvent) {
      message.error('No event selected');
      return;
    }

    Modal.confirm({
      title: 'Mark Event as Concluded',
      content: `Are you sure you want to mark "${selectedEvent.Subject}" as concluded? This cannot be undone.`,
      okText: 'Mark as Concluded',
      okType: 'primary',
      cancelText: 'Cancel',
      onOk: async () => {
        // Delegate to existing handler which performs the update
        await this.handleToggleCompletion();
      }
    });
  };

  handleToggleCompletion = async () => {
    const { selectedEvent } = this.state;
    
    if (!selectedEvent) {
      message.error('No event selected');
      return;
    }

    const currentStatus = selectedEvent.event.status;
    const newStatus = currentStatus === "concluded" ? "planned" : "concluded";
    const actionText = newStatus === "concluded" ? "concluded" : "planned";

    

    this.setState({ isCreatingEvent: true });

    try {
      // Fetch full event details to get all the necessary data
      const fullEvent = await fetchActivity(selectedEvent.Id);
      
      // Use invitee_id as the authoritative calendar ID, fallback to current unit
      const originalInviteeId = selectedEvent.event.invitee_id || TerrainState.getUnitID();
      
      // Preserve existing review data or use default
      const existingReview = fullEvent?.review;
      const reviewData = {
        general_tags: [],
        scout_method_elements: existingReview?.scout_method_elements || ["symbolic_framework"],
        scout_spices_elements: []
      };
      
      // Create a complete event payload using the same structure as new events
      const eventToUpload: any = {
        title: selectedEvent.event.title,
        description: fullEvent?.description || '',
        location: fullEvent?.location || '',
        start_datetime: selectedEvent.StartTime.toISOString(),
        end_datetime: selectedEvent.EndTime.toISOString(),
        challenge_area: selectedEvent.event.challenge_area,
        event_type: { 
          type: selectedEvent.event.invitee_type || 'unit',
          id: originalInviteeId  // Use the preserved original invitee ID
        },
        type: selectedEvent.event.invitee_type || 'unit',
        invitees: [{
          invitee_id: originalInviteeId,  // Use the preserved original invitee ID
          invitee_type: selectedEvent.event.invitee_type || 'unit'
        }],
        iana_timezone: "Australia/Brisbane",
        status: newStatus,
        organisers: [TerrainState.getMemberID()],
        attendance: {
          leader_member_ids: [],
          assistant_member_ids: [],
          attendee_member_ids: [],
          participant_member_ids: [],
        },
        achievement_pathway_logbook_data: {
          achievement_meta: {
            stream: "",
            branch: "",
          },
        },
        achievement_pathway_oas_data: {
          award_rule: "individual",
          verifier: {
            name: "Not Applicable",
            contact: "",
            type: "member",
          },
          groups: [],
        },
        review: reviewData,
        // justification removed to avoid unwanted status message
      };

      // Update the event status using updateEvent (PATCH)
      await updateEvent(selectedEvent.Id, JSON.stringify(eventToUpload));
      message.success(`Event marked as ${actionText}!`);
      this.closeModal();
      this.fetchData();
    } catch (error) {
      console.error('Error updating event status:', error);
      message.error('Error updating event status: ' + error);
    } finally {
      this.setState({ isCreatingEvent: false });
    }
  };

  handleCalendarChange = (selectedCalendars: string[]) => {
    // Update allCalendars state immediately for UI responsiveness
    const updatedAllCalendars = this.state.allCalendars.map(calendar => ({
      ...calendar,
      selected: selectedCalendars.includes(calendar.id)
    }));

    // Update the detailed calendars state for server sync
    const calendarUpdate = { ...this.state.calendars };
    if (!calendarUpdate.own_calendars) return;
    
    calendarUpdate.own_calendars = calendarUpdate.own_calendars.map((calendar: any) => ({
      ...calendar, 
      selected: selectedCalendars.includes(calendar.id) 
    }));
    
    if (calendarUpdate.other_calendars) {
      calendarUpdate.other_calendars = calendarUpdate.other_calendars.map((calendar: any) => ({
        ...calendar, 
        selected: selectedCalendars.includes(calendar.id) 
      }));
    }

    // Update local state first for immediate UI feedback
    this.setState({ 
      allCalendars: updatedAllCalendars,
      calendars: calendarUpdate 
    }, () => {
      this.updateFilteredEvents();
    });
    
    // Then sync to server
    updateMemberCalendars(JSON.stringify(calendarUpdate))
      .then(() => {
        // Calendar selection saved successfully
      })
      .catch((error) => {
        console.error('Error updating calendar selection:', error);
      });
  };

  closeModal = () => {
    this.setState({ 
      isModalVisible: false,
      selectedEvent: null,
      isDeletingEvent: false,
      newEventForm: {
        title: '',
        description: '',
        location: '',
        startDate: null,
        startTime: null,
        endDate: null,
        endTime: null,
        challengeArea: 'not_applicable',
        eventType: 'unit',
        selectedInviteeId: '',
      }
    });
  };

  // Open event in Terrain in a new tab
  openInTerrain = async () => {
    if (this.state.selectedEvent) {
      const eventData = this.state.selectedEvent.event;
      
      try {
        // Fetch the full event details to get the complete activity data
        const fullEvent = await fetchActivity(eventData.id);
        
        if (fullEvent && fullEvent.id) {
          // Set the activity in Terrain's Nuxt store (if available)
          if (window.$nuxt && window.$nuxt.$accessor && window.$nuxt.$accessor.programming) {
            window.$nuxt.$accessor.programming.setActivity(fullEvent);
            window.$nuxt.$accessor.programming.setActivityFlow("view");
          }
          // Open Terrain in a new tab (base URL)
          const terrainUrl = `https://terrain.scouts.com.au/programming/view-activity`;
          window.open(terrainUrl, '_blank');
        } else {
          // Fallback to programming calendar
          const eventTitle = this.state.selectedEvent.event.title || "";
          const eventId = eventData.id || "unknown";
          this.fallbackToProgrammingCalendar(eventTitle, eventId);
        }
      } catch (error) {
        // Fallback to programming calendar
        const eventTitle = this.state.selectedEvent.event.title || "";
        const eventId = eventData.id || "unknown";
        this.fallbackToProgrammingCalendar(eventTitle, eventId);
      }
    }
  };



  private fallbackToProgrammingCalendar = (eventTitle: string, eventId: string) => {
    const terrainUrl = `https://terrain.scouts.com.au/programming`;
    
    alert(`Opening Terrain Programming Calendar.\n\nPlease search for: "${eventTitle}"\n\nEvent ID: ${eventId}`);
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(eventTitle).catch(() => {
        // Silently handle clipboard errors
      });
    }
    
    window.open(terrainUrl, '_blank');
  };

  renderEventModal = () => {
  const isConcluded = this.state.selectedEvent && this.state.selectedEvent.event.status === "concluded";
    
    return (
      <Modal
        title={
          this.state.selectedEvent 
            ? (isConcluded ? "View Event (Concluded)" : "Edit Event") 
            : "New Event"
        }
        open={this.state.isModalVisible}
        onCancel={this.closeModal}
        afterOpenChange={(open) => {
          if (open) {
            // Use multiple timing strategies to ensure focus works with Ant Design Input
            setTimeout(() => {
              // Try multiple methods to focus the title input
              let focused = false;
              
              // Method 1: Use the ref
              if (this.titleInputRef && !focused) {
                if (this.titleInputRef.focus) {
                  this.titleInputRef.focus();
                  focused = true;
                } else if (this.titleInputRef.input && this.titleInputRef.input.focus) {
                  this.titleInputRef.input.focus();
                  focused = true;
                }
              }
              
              // Method 2: Query selector fallback
              if (!focused) {
                const titleInput = document.querySelector('.ant-modal input[placeholder="Enter event title"]') as HTMLInputElement;
                if (titleInput) {
                  titleInput.focus();
                }
              }
            }, 150);
          }
        }}
        footer={
          this.state.selectedEvent ? [
            // Edit mode - show different buttons based on event status
            <Button key="terrain" onClick={this.openInTerrain}>
              View in Terrain
            </Button>,
            ...(isConcluded ? [
              // For concluded events, show cancel and delete
              <Button key="cancel" onClick={this.closeModal}>
                Cancel
              </Button>,
              <Button key="delete" danger onClick={this.handleDeleteEvent} loading={this.state.isDeletingEvent}>
                Delete Event
              </Button>
            ] : [
              // For non-concluded events, show all editing options
              <Button 
                key="completion" 
                type="primary"
                style={{
                  backgroundColor: "#52c41a",
                  borderColor: "#52c41a",
                  color: "white"
                }}
                loading={this.state.isCreatingEvent}
                onClick={this.confirmMarkConcluded}
              >
                Mark as Concluded
              </Button>,
              <Button key="cancel" onClick={this.closeModal}>
                Cancel
              </Button>,
              <Button key="delete" danger onClick={this.handleDeleteEvent} loading={this.state.isDeletingEvent}>
                Delete Event
              </Button>,
              <Button 
                key="update" 
                type="primary" 
                loading={this.state.isCreatingEvent}
                onClick={this.handleUpdateEvent}
              >
                Update Event
              </Button>
            ])
          ] : [
            // Create mode - show Create and Cancel buttons
            <Button key="cancel" onClick={this.closeModal}>
              Cancel
            </Button>,
            <Button 
              key="create" 
              type="primary" 
              loading={this.state.isCreatingEvent}
              onClick={this.handleCreateEvent}
            >
              Create Event
            </Button>
          ]
        }
        width={800}
        style={{ maxHeight: '80vh' }}
      >
        {/* Show different content based on event status */}
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {isConcluded ? (
            // Read-only view for concluded events
            <div>
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#fff7e6', 
                border: '1px solid #ffd591', 
                borderRadius: '6px', 
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '16px' }}>🔒</span>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#d48806' }}>Event is Concluded</div>
                  <div style={{ color: '#ad6800', fontSize: '14px' }}>
                    This event is marked as concluded and cannot be edited here. 
                    Use "View in Terrain" to make changes to concluded events.
                  </div>
                </div>
              </div>
              
              <Form layout="vertical">
                <Form.Item label="Event Title">
                  <Input value={this.state.newEventForm.title} disabled />
                </Form.Item>
                <Form.Item label="Description">
                  <Input.TextArea value={this.state.newEventForm.description} disabled rows={3} />
                </Form.Item>
                <Form.Item label="Location">
                  <Input value={this.state.newEventForm.location} disabled />
                </Form.Item>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Form.Item label="Start Date">
                    <DatePicker value={this.state.newEventForm.startDate} disabled style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>
                  <Form.Item label="Start Time">
                    <TimePicker value={this.state.newEventForm.startTime} disabled style={{ width: '100%' }} />
                  </Form.Item>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Form.Item label="End Date">
                    <DatePicker value={this.state.newEventForm.endDate} disabled style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>
                  <Form.Item label="End Time">
                    <TimePicker value={this.state.newEventForm.endTime} disabled style={{ width: '100%' }} />
                  </Form.Item>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Form.Item label="Challenge Area">
                    <Select value={this.state.newEventForm.challengeArea} disabled style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="Calendar">
                    <Select value={this.state.newEventForm.selectedInviteeId} disabled style={{ width: '100%' }} />
                  </Form.Item>
                </div>
              </Form>
            </div>
          ) : (
            // Editable form for new events or non-concluded events
            <Form layout="vertical">
              <Form.Item 
                label="Event Title" 
                required
                validateStatus={!this.state.newEventForm.title ? 'error' : ''}
                help={!this.state.newEventForm.title ? 'Please enter an event title' : ''}
              >
                <Input
                  ref={(ref: any) => { 
                    this.titleInputRef = ref; 
                  }}
                  autoFocus={this.state.isModalVisible && !this.state.selectedEvent}
                  value={this.state.newEventForm.title}
                  onChange={(e) => this.handleFormFieldChange('title', e.target.value)}
                  placeholder="Enter event title"
                />
              </Form.Item>

              <Form.Item label="Description">
                <Input.TextArea
                  value={this.state.newEventForm.description}
                  onChange={(e) => this.handleFormFieldChange('description', e.target.value)}
                  placeholder="Enter event description"
                  rows={3}
                />
              </Form.Item>

              <Form.Item label="Location">
                <Input
                  value={this.state.newEventForm.location}
                  onChange={(e) => this.handleFormFieldChange('location', e.target.value)}
                  placeholder="Enter event location"
                />
              </Form.Item>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item 
                  label="Start Date" 
                  required
                  validateStatus={!this.state.newEventForm.startDate ? 'error' : ''}
                >
                  <DatePicker
                    value={this.state.newEventForm.startDate}
                    onChange={(date) => this.handleFormFieldChange('startDate', date)}
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                  />
                </Form.Item>

                <Form.Item 
                  label="Start Time" 
                  required
                  validateStatus={!this.state.newEventForm.startTime ? 'error' : ''}
                >
                  <TimePicker
                    value={this.state.newEventForm.startTime}
                    onChange={(time) => this.handleFormFieldChange('startTime', time)}
                    style={{ width: '100%' }}
                    format="HH:mm"
                  />
                </Form.Item>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item 
                  label="End Date" 
                  required
                  validateStatus={!this.state.newEventForm.endDate ? 'error' : ''}
                >
                  <DatePicker
                    value={this.state.newEventForm.endDate}
                    onChange={(date) => this.handleFormFieldChange('endDate', date)}
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                  />
                </Form.Item>

                <Form.Item 
                  label="End Time" 
                  required
                  validateStatus={!this.state.newEventForm.endTime ? 'error' : ''}
                >
                  <TimePicker
                    value={this.state.newEventForm.endTime}
                    onChange={(time) => this.handleFormFieldChange('endTime', time)}
                    style={{ width: '100%' }}
                    format="HH:mm"
                  />
                </Form.Item>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item label="Challenge Area">
                  <Select
                    value={this.state.newEventForm.challengeArea}
                    onChange={(value) => this.handleFormFieldChange('challengeArea', value)}
                    style={{ width: '100%' }}
                  >
                    <Select.Option value="not_applicable">Not Applicable</Select.Option>
                    <Select.Option value="community">Community</Select.Option>
                    <Select.Option value="creative">Creative</Select.Option>
                    <Select.Option value="outdoors">Outdoors</Select.Option>
                    <Select.Option value="personal_growth">Personal Growth</Select.Option>
                    <Select.Option value="social">Social</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item 
                  label="Calendar" 
                  required
                  validateStatus={!this.state.newEventForm.selectedInviteeId ? 'error' : ''}
                  help={!this.state.newEventForm.selectedInviteeId ? 'Please select a calendar' : ''}
                >
                  <Select
                    value={this.state.newEventForm.selectedInviteeId}
                    onChange={(value) => this.handleFormFieldChange('selectedInviteeId', value)}
                    style={{ width: '100%' }}
                    placeholder="Select calendar"
                  >
                    {this.state.allCalendars.map(calendar => (
                      <Select.Option key={calendar.id} value={calendar.id}>
                        {calendar.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
            </Form>
          )}
        </div>
      </Modal>
    );
  };



  render(): React.ReactNode {
    // Compute events filtered by agendaRange when in agenda view
    let events = [...this.state.filteredEvents];
    let agendaLengthDays: number | undefined;
    let calendarDate = this.state.currentDate;
    if (this.state.currentView === 'agenda' && this.state.agendaRange && this.state.agendaRange[0] && this.state.agendaRange[1]) {
      const aStart = this.state.agendaRange[0].startOf('day');
      const aEnd = this.state.agendaRange[1].endOf('day');
  // React Big Calendar's agenda `length` is end-exclusive (start + length = end date displayed),
  // so compute as difference in days without adding 1.
  agendaLengthDays = this.state.agendaRange[1].diff(this.state.agendaRange[0], 'day');
      calendarDate = this.state.agendaRange[0].toDate();
      events = events.filter(ev => {
        const s = dayjs((ev as any).start);
        const e = dayjs((ev as any).end || (ev as any).start);
        return !(s.isAfter(aEnd) || e.isBefore(aStart));
      });
    }
    
    return (
      <div id="scheduler" className={this.state.currentView === 'agenda' ? 'agenda-mode' : ''} style={{ width: "100%", height: "100%" }}>
  <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <label>Select Calendars: </label>
          <TreeSelect
            style={{ width: 300, marginLeft: 8 }}
            value={this.state.allCalendars.filter((c) => c.selected).map((c) => c.id)}
            placeholder="Select calendars to display"
            multiple
            treeCheckable
            showCheckedStrategy={TreeSelect.SHOW_ALL}
            maxTagCount={3}
            treeData={this.state.allCalendars.map(cal => {
              const color = this.getCalendarColor(cal.name, cal.type || 'unit');
              return {
                title: (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span 
                      style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        backgroundColor: color,
                        display: 'inline-block',
                        border: '1px solid #ddd'
                      }}
                    ></span>
                    {cal.name}
                  </span>
                ),
                value: cal.id,
                key: cal.id
              };
            })}
            onChange={this.handleCalendarChange}
            styles={{
              popup: {
                root: { maxHeight: 400, overflow: 'auto' }
              }
            }}
            allowClear
          />
          {this.state.currentView === 'agenda' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ marginRight: 4 }}>Agenda range:</label>
              <DatePicker.RangePicker
                value={this.state.agendaRange as [Dayjs, Dayjs]}
                onChange={(val) => {
                  if (val && val[0] && val[1]) {
                    this.setState({ agendaRange: [val[0], val[1]], currentDate: val[0].toDate() });
                    // Update calendar key so the calendar refreshes when range changes
                    this.setState({ calendarKey: this.state.calendarKey + 1 });
                  }
                }}
                style={{ marginLeft: 0 }}
                format="DD/MM/YYYY"
              />
            </div>
          )}
        </div>
        
          <Calendar
            key={`calendar-${this.state.calendarKey}-${events.length}`}
            localizer={localizer}
            // Control the active view from component state so the UI updates immediately
            view={this.state.currentView as View}
            events={events}
            startAccessor="start"
            endAccessor="end"
            titleAccessor="title"
            style={{ height: this.state.currentView === 'agenda' ? 'auto' : "calc(100% - 60px)" }}
            // Use agenda range start as calendar date when in agenda view so header matches picker
            date={calendarDate}
            onNavigate={this.onNavigate}
            onView={this.onView}
            onSelectEvent={this.onSelectEvent}
            onSelectSlot={this.onSelectSlot}
            selectable
            eventPropGetter={this.eventStyleGetter}
            views={{
              month: true,
              week: true,
              day: true,
              agenda: true
            }}
            defaultView="month"
            step={30}
            showMultiDayTimes
            // For agenda view, set the number of days to display equal to the selected agenda range
            {...(agendaLengthDays ? { length: agendaLengthDays } : {})}
            // Only supply custom formats for the agenda view so month/week/day use the library defaults
            {...(this.state.currentView === 'agenda' ? { formats: rbcFormats } : {})}
            max={moment().hour(23).minute(59).toDate()}
            min={moment().hour(0).minute(0).toDate()}
          />

        {this.state.currentView === 'agenda' && (
          <div style={{ overflow: 'auto', padding: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '120px' }} />
                <col style={{ width: '160px' }} />
                <col style={{ width: '1fr' }} />
                <col style={{ width: '220px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #eee' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #eee' }}>Time</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #eee' }}>Event</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #eee' }}>Location</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Create a sorted copy of events for agenda rendering: primary sort by start date, secondary by calendar/invitee name, tertiary by title
                  const sorted = [...events].sort((a: any, b: any) => {
                    const aStart = new Date(a.start).getTime();
                    const bStart = new Date(b.start).getTime();
                    if (aStart !== bStart) return aStart - bStart;

                    const aRes = a.resource || {};
                    const bRes = b.resource || {};
                    const aCal = (aRes.event && (aRes.event.invitee_name || aRes.event.invitee_id)) || '';
                    const bCal = (bRes.event && (bRes.event.invitee_name || bRes.event.invitee_id)) || '';
                    const aCalLower = String(aCal).toLowerCase();
                    const bCalLower = String(bCal).toLowerCase();
                    if (aCalLower < bCalLower) return -1;
                    if (aCalLower > bCalLower) return 1;

                    const aTitle = (a.title || '').toLowerCase();
                    const bTitle = (b.title || '').toLowerCase();
                    if (aTitle < bTitle) return -1;
                    if (aTitle > bTitle) return 1;
                    return 0;
                  });

                  return sorted.map((ev: any) => {
                  const start = moment(ev.start);
                  const end = moment(ev.end || ev.start);
                  const date = start.format('DD/MM/YYYY');
                  const time = ev.allDay ? 'all day' : `${start.format('h:mm a')} – ${end.format('h:mm a')}`;
                  const resource = ev.resource as TerraFlowCalendarItem | any;
                  let location = resource?.event?.location || resource?.location || resource?.Location || '';
                  // If not present in summary, try cached full-activity location; otherwise trigger a load
                  if (!location) {
                    const cached = this.state.locationCache && resource && resource.event && this.state.locationCache[resource.event.id];
                    if (cached !== undefined) {
                      location = cached;
                    } else if (resource && resource.event && resource.event.id) {
                      // Kick off an async load (no await) — this will update state when done
                      this.loadLocation(resource.event.id);
                    }
                  }
                  const color = (resource && resource.color) || '#3174ad';
                  return (
                    <tr
                      key={ev.id}
                      style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer' }}
                      tabIndex={0}
                      onClick={() => this.onSelectEvent(ev)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.onSelectEvent(ev); } }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.03)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                    >
                      <td style={{ padding: '8px', verticalAlign: 'top', fontSize: 13 }}>{date}</td>
                      <td style={{ padding: '8px', verticalAlign: 'top', fontSize: 13 }}>{time}</td>
                      <td style={{ padding: '8px', verticalAlign: 'top', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 10, height: 10, display: 'inline-block', backgroundColor: color, borderRadius: 2 }}></span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px', verticalAlign: 'top', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{location}</td>
                    </tr>
                  );
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}
        
        {this.renderEventModal()}

      </div>
    );
  }
}