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

const createEventPayload = (formData: any, selectedEvent?: TerraFlowCalendarItem, allCalendars?: { id: string; name: string; selected: boolean; type?: string }[]) => {
  const startDateTime = formatDateTimeForAPI(formData.startDate, formData.startTime);
  const endDateTime = formatDateTimeForAPI(formData.endDate, formData.endTime);

  // Find the selected calendar to get its type
  const selectedCalendar = allCalendars?.find(cal => cal.id === formData.selectedInviteeId);
  const calendarType = selectedCalendar?.type || formData.eventType;

  // For updates, only send the fields that should change
  if (selectedEvent) {
    return {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      start_datetime: startDateTime,
      end_datetime: endDateTime,
      challenge_area: formData.challengeArea,
      status: selectedEvent.event.status || "planned",
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
    };
  }

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
    
    // Simple and reliable: Use invitee_id to match calendar IDs directly
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
        title: item.Subject,
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
    // Handle view changes if needed
  };

  onSelectEvent = async (event: any) => {
    const calendarItem = event.resource as TerraFlowCalendarItem;
    
    // Parse the event description to extract challenge area (basic parsing)
    const challengeArea = calendarItem.event.challenge_area || 'community';
    
    // Determine event type from invitee_type
    const eventType = calendarItem.event.invitee_type || 'unit';
    
    // Fetch the full event details to get location and description
    const fullEvent = await fetchActivity(calendarItem.Id);
    const location = fullEvent?.location || '';
    const description = fullEvent?.description || '';
    
    // Use invitee_id as the authoritative calendar ID
    const selectedInviteeId = calendarItem.event.invitee_id || '';
    
    // Go directly to edit mode when clicking on an event
    this.setState({ 
      selectedEvent: calendarItem,
      isModalVisible: true,
      newEventForm: {
        title: calendarItem.event.title,
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
      // For updates, delete the old event and create a new one
      // This works around CORS/permission issues with PATCH
      await deleteEvent(selectedEvent.Id);
      
      // Create new event with updated data (don't pass selectedEvent to get full payload)
      const eventToUpload = createEventPayload(newEventForm, undefined, this.state.allCalendars);
      await createNewEvent(JSON.stringify(eventToUpload));
      
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

  handleToggleCompletion = async () => {
    const { selectedEvent } = this.state;
    
    if (!selectedEvent) {
      message.error('No event selected');
      return;
    }

    const currentStatus = selectedEvent.event.status;
    const newStatus = currentStatus === "concluded" ? "planned" : "concluded";
    const actionText = newStatus === "concluded" ? "completed" : "incomplete";

    this.setState({ isCreatingEvent: true });

    try {
      // Fetch full event details to get all the necessary data
      const fullEvent = await fetchActivity(selectedEvent.Id);
      
      // Use invitee_id as the authoritative calendar ID, fallback to current unit
      const originalInviteeId = selectedEvent.event.invitee_id || TerrainState.getUnitID();
      
      // Create a complete event payload using the same structure as new events
      const eventToUpload = {
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
        review: { 
          general_tags: [], 
          scout_method_elements: ["symbolic_framework"], 
          scout_spices_elements: [] 
        },
        justification: `Status changed to ${newStatus} by ${TerrainState.getMemberID()}`,
      };

      // Delete the old event and create a new one with updated status
      await deleteEvent(selectedEvent.Id);
      await createNewEvent(
        JSON.stringify(eventToUpload), 
        originalInviteeId, 
        selectedEvent.event.invitee_type || 'unit'
      );
      
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
          
          // Open Terrain in a new tab
          const terrainUrl = `https://terrain.scouts.com.au/programming/view-activity`;
          window.open(terrainUrl, '_blank');
        } else {
          // Fallback to programming calendar
          const eventTitle = this.state.selectedEvent.event.title;
          this.fallbackToProgrammingCalendar(eventTitle, eventData.id);
        }
      } catch (error) {
        // Fallback to programming calendar
        const eventTitle = this.state.selectedEvent.event.title;
        this.fallbackToProgrammingCalendar(eventTitle, eventData.id);
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
    return (
      <Modal
        title={this.state.selectedEvent ? "Edit Event" : "New Event"}
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
            // Edit mode - show Open in Terrain, Mark Complete/Incomplete, Update, Delete, and Cancel buttons
            <Button key="terrain" onClick={this.openInTerrain}>
              View in Terrain
            </Button>,
            <Button 
              key="completion" 
              type={this.state.selectedEvent.event.status === "concluded" ? "default" : "primary"}
              style={{
                backgroundColor: this.state.selectedEvent.event.status === "concluded" ? "#ffa940" : "#52c41a",
                borderColor: this.state.selectedEvent.event.status === "concluded" ? "#ffa940" : "#52c41a",
                color: "white"
              }}
              loading={this.state.isCreatingEvent}
              onClick={this.handleToggleCompletion}
            >
              {this.state.selectedEvent.event.status === "concluded" ? "Mark as Incomplete" : "Mark as Complete"}
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
        {/* Always show form - no read-only view */}
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
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
        </div>
      </Modal>
    );
  };



  render(): React.ReactNode {
    // Use the pre-computed filtered events from state
    const events = [...this.state.filteredEvents];
    
    return (
      <div id="scheduler" style={{ width: "100%", height: "100%" }}>
        <div style={{ marginBottom: 16 }}>
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
        </div>
        
        <Calendar
          key={`calendar-${this.state.calendarKey}-${events.length}`}
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          style={{ height: "calc(100% - 60px)" }}
          date={this.state.currentDate}
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
          max={moment().hour(23).minute(59).toDate()}
          min={moment().hour(0).minute(0).toDate()}
        />
        
        {this.renderEventModal()}

      </div>
    );
  }
}