import { TerrainRootState } from "@/types/terrainState";
import { defineComponent } from "vue";
import fetchMemberCalendars from "@/services/fetchMemberCalendars";
import { TerrainCalendar } from "@/types/terrainTypes";

// Default event settings interface
interface EventDefaultSettings {
  startTime: string;
  duration: number;
  location: string;
  defaultCalendar: string;
  startingDayOfWeek: number;
}

// Default values
const DEFAULT_EVENT_SETTINGS: EventDefaultSettings = {
  startTime: "19:00", // 7pm
  duration: 90, // 90 minutes
  location: "", // empty default location
  defaultCalendar: "", // empty default calendar
  startingDayOfWeek: 1 // Monday (0=Sunday, 1=Monday, etc.)
};

// Helper functions
const getStoredEventSetting = (key: keyof EventDefaultSettings, defaultValue: any) => {
  const stored = localStorage.getItem(`summit_event_${key}`);
  return stored ? (key === 'duration' ? parseInt(stored) : stored) : defaultValue;
};

const storeEventSetting = (key: keyof EventDefaultSettings, value: any) => {
  localStorage.setItem(`summit_event_${key}`, value.toString());
  // Dispatch event for other components to listen to
  window.dispatchEvent(new CustomEvent('summitEventSettingsChanged', {
    detail: { key, value }
  }));
};

export default defineComponent({
  data() {
    return {
      // Event default settings
      defaultStartTime: getStoredEventSetting('startTime', DEFAULT_EVENT_SETTINGS.startTime),
      defaultDuration: getStoredEventSetting('duration', DEFAULT_EVENT_SETTINGS.duration),
      defaultLocation: getStoredEventSetting('location', DEFAULT_EVENT_SETTINGS.location),
      defaultCalendar: getStoredEventSetting('defaultCalendar', DEFAULT_EVENT_SETTINGS.defaultCalendar),
      startingDayOfWeek: getStoredEventSetting('startingDayOfWeek', DEFAULT_EVENT_SETTINGS.startingDayOfWeek),
      // Calendar data
      availableCalendars: [] as TerrainCalendar[],
      calendarsLoading: true,
    };
  },
  methods: {
    updateDefaultStartTime() {
      storeEventSetting('startTime', this.defaultStartTime);
    },
    
    updateDefaultDuration() {
      storeEventSetting('duration', this.defaultDuration);
    },
    
    updateDefaultLocation() {
      storeEventSetting('location', this.defaultLocation);
    },
    
    updateDefaultCalendar() {
      storeEventSetting('defaultCalendar', this.defaultCalendar);
    },
    
    updateStartingDayOfWeek() {
      storeEventSetting('startingDayOfWeek', this.startingDayOfWeek);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    },
    
    async loadAvailableCalendars() {
      try {
        this.calendarsLoading = true;
        const calendarsData = await fetchMemberCalendars();
        this.availableCalendars = [
          ...(calendarsData.own_calendars || []),
          ...(calendarsData.other_calendars || [])
        ];
      } catch (error) {
        console.error("Error loading calendars:", error);
      } finally {
        this.calendarsLoading = false;
      }
    },

    applyAndReturn() {
      // Ensure all current settings are saved
      this.updateDefaultStartTime();
      this.updateDefaultDuration();
      this.updateDefaultLocation();
      this.updateDefaultCalendar();
      this.updateStartingDayOfWeek();
      
      
      // Navigate back to TerraFlow Calendar
      this.$router.push('/terraflow/tools/TerraFlowCalendar');
    },

    cancelAndReturn() {
      // Navigate back to TerraFlow Calendar without saving any pending changes
      this.$router.push('/terraflow/tools/TerraFlowCalendar');
    }
  },

  mounted() {
    
    // Load available calendars
    this.loadAvailableCalendars();
    
    (window.$nuxt.$store.state as TerrainRootState).global.breadcrumbs = [
      {
        text: "TerraFlow",
        disabled: false,
        to: "/terraflow/tools/TerraFlowCalendar",
        exact: true,
      },
      {
        text: "Settings",
        disabled: true,
        to: "/terraflow/tools/TerraFlowSettings",
        exact: true,
      },
    ];
  },
  // Include other methods as needed...
});

// Export the helper functions for use in other components
export { getStoredEventSetting, storeEventSetting, DEFAULT_EVENT_SETTINGS };
