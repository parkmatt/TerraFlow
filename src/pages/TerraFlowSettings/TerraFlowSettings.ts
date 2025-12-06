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

// School term interface
interface SchoolTerm {
  term: number;
  start: string;
  end: string;
}

interface SchoolTermsByYear {
  [year: number]: SchoolTerm[];
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
  const stored = localStorage.getItem(`terraflow_event_${key}`);
  return stored ? (key === 'duration' ? parseInt(stored) : stored) : defaultValue;
};

const storeEventSetting = (key: keyof EventDefaultSettings, value: any) => {
  localStorage.setItem(`terraflow_event_${key}`, value.toString());
  // Dispatch event for other components to listen to
  window.dispatchEvent(new CustomEvent('terraflowEventSettingsChanged', {
    detail: { key, value }
  }));
};

// School terms helpers
const getDefaultSchoolTerms = (): SchoolTermsByYear => {
  return {
    2025: [
      { term: 1, start: '2025-01-01', end: '2025-04-21' },
      { term: 2, start: '2025-04-05', end: '2025-07-13' },
      { term: 3, start: '2025-06-28', end: '2025-10-05' },
      { term: 4, start: '2025-09-20', end: '2025-12-31' },
    ],
    2026: [
      { term: 1, start: '2026-01-01', end: '2026-04-12' },
      { term: 2, start: '2026-03-28', end: '2026-07-12' },
      { term: 3, start: '2026-06-27', end: '2026-10-04' },
      { term: 4, start: '2026-09-19', end: '2026-12-31' },
    ],
  };
};

const getStoredSchoolTerms = (): SchoolTermsByYear => {
  const stored = localStorage.getItem('terraflow_school_terms');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing stored school terms:', e);
    }
  }
  return getDefaultSchoolTerms();
};

const storeSchoolTerms = (terms: SchoolTermsByYear) => {
  localStorage.setItem('terraflow_school_terms', JSON.stringify(terms));
  // Dispatch event for calendar component to reload
  window.dispatchEvent(new CustomEvent('terraflowSchoolTermsChanged'));
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
      // School terms data
      schoolTerms: getStoredSchoolTerms() as SchoolTermsByYear,
      newTermYear: new Date().getFullYear() as number | null,
    };
  },
  computed: {
    termYears(): number[] {
      return Object.keys(this.schoolTerms).map(y => parseInt(y));
    },
    sortedTermYears(): number[] {
      return this.termYears.sort((a, b) => a - b);
    },
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

    // School terms methods
    addTermYear() {
      if (!this.newTermYear || this.termYears.includes(this.newTermYear)) {
        return;
      }
      
      // Create default term dates for the new year
      this.schoolTerms[this.newTermYear] = [
        { term: 1, start: `${this.newTermYear}-01-01`, end: `${this.newTermYear}-04-21` },
        { term: 2, start: `${this.newTermYear}-04-05`, end: `${this.newTermYear}-07-13` },
        { term: 3, start: `${this.newTermYear}-06-28`, end: `${this.newTermYear}-10-05` },
        { term: 4, start: `${this.newTermYear}-09-20`, end: `${this.newTermYear}-12-31` },
      ];
      
      this.saveSchoolTerms();
      this.newTermYear = null;
    },

    removeTermYear(year: number) {
      if (confirm(`Are you sure you want to remove term dates for ${year}?`)) {
        delete this.schoolTerms[year];
        this.saveSchoolTerms();
      }
    },

    saveSchoolTerms() {
      storeSchoolTerms(this.schoolTerms);
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
