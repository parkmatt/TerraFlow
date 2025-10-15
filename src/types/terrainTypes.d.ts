// Streamlined TerraFlow type definitions
// Contains only types that are actually used by the extension

// Event types for calendar functionality
export interface TerrainEvent {
  id?: string;
  status?: string;
  title?: string;
  justification?: string;
  attendance?: {
    leader_members?: Array<{
      id: string;
      first_name: string;
      last_name: string;
    }>;
    assistant_members?: Array<{
      id: string;
      first_name: string;
      last_name: string;
    }>;
    attendee_members?: Array<{
      id: string;
      first_name: string;
      last_name: string;
    }>;
  };
  equipment_notes?: string;
  challenge_area?: string;
  description?: string;
  end_datetime: string;
  invitees?: Array<{
    invitee_id: string;
    invitee_type: string;
  }>;
  location?: string;
  organisers?: Array<{
    id: string;
    first_name: string;
    last_name: string;
  }>;
  owner_id?: string;
  owner_type?: string;
  review?: {
    scout_method_elements: string[];
  };
  start_datetime: string;
  uploads?: never[];
}

export interface TerrainEventSummary {
  id?: string;
  title?: string;
  description?: string;
  location?: string;
  start_datetime?: string;
  end_datetime?: string;
  status?: string;
  challenge_area?: string;
  event_type?: string;
  calendar_id?: string;
  cancelled?: boolean;
  attendee?: boolean;
  organiser?: boolean;
  invited?: boolean;
}

// Profile types for authentication
interface ProfileUnit {
  id: string;
  name: string;
  roles: string[];
  section: string;
}

interface ProfileGroup {
  id: string;
  name: string;
  roles: string[];
}

interface ProfileMember {
  id: string;
  name: string;
  roles: string[];
}

interface ProfileBranch {
  id: string;
  name: string;
  roles: string[];
}

export interface TerrainProfile {
  unit: ProfileUnit;
  group: ProfileGroup;
  member: ProfileMember;
  branch?: ProfileBranch;
}

// Unit member types
export interface TerrainUnitMemberGroup {
  id: string;
  name: string;
}

export interface TerrainUnitMemberMetadata {
  has_youth_position: boolean;
}

export interface TerrainUnitMemberPatrol {
  id: string;
  name: string;
  duty: TerrainUnitMemberDuty;
}

export enum TerrainUnitMemberDuty {
  PARTICIPANT = "participant",
  LEADER = "leader",
  ASSISTANT = "assistant",
}

export interface TerrainUnitMember {
  id: string;
  member_number: string;
  first_name: string;
  last_name: string;
  status: string;
  date_of_birth: string;
  groups: TerrainUnitMemberGroup[];
  unit_id: string;
  patrol: TerrainUnitMemberPatrol | null;
  metadata: TerrainUnitMemberMetadata;
}

// Calendar types
export interface TerrrainCalendarResult {
  own_calendars?: TerrainCalendar[];
  other_calendars?: TerrainCalendar[];
}

export interface TerrainCalendar {
  id: string;
  name: string;
  colour: string;
  selected: boolean;
  type?: string;
}