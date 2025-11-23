import { TerrainEvent, TerrainEventSummary } from "@/types/terrainTypes";

export default class TerraFlowCalendarItem {
  Id: string;
  Subject: string;
  StartTime: Date;
  EndTime: Date;
  Description: string;
  Location?: string;
  color: string;
  event: TerrainEventSummary;
  activity: TerrainEvent | null = null;

  constructor(event: TerrainEventSummary) {
    // Normalize fields with safe fallbacks to satisfy strict typing
    this.Id = event.id || "";
    this.event = event;
    this.Subject = (event.status === "concluded" ? "✅" : "") + (event.title || "");
    this.StartTime = new Date(event.start_datetime || new Date().toISOString());
    this.EndTime = new Date(event.end_datetime || new Date().toISOString());

    const inviteeType = (event.invitee_type || "").toString();
    const inviteeName = event.invitee_name || "";
    const statusText = (event.status || "").toString().replace(/(?:^|_)(.)/g, (match, group1) => " " + group1.toUpperCase());
    const areaText = (event.challenge_area || "").toString().replace(/(?:^|_)(.)/g, (match, group1) => " " + group1.toUpperCase());

    this.Description = `${inviteeType ? (inviteeType.charAt(0).toUpperCase() + inviteeType.slice(1).toLowerCase() + ': ') : ''}${inviteeName}\nStatus:${statusText}\nArea:${areaText}`;
    
    // Enhanced color assignment considering both section and calendar type
    this.color = this.getEventColor(event);
  }

  private getEventColor(event: TerrainEventSummary): string {
    // Base colors for sections
    const sectionColors: { [key: string]: string } = {
      joey: "#b65518",
      cub: "#ffc82e", 
      scout: "#00ae42",
      venturer: "#9e1b32",
      rover: "#dc291e"
    };

    // Special colors for specific calendar types and names
  const inviteeType = event.invitee_type || '';
  const inviteeName = event.invitee_name || '';

  if (inviteeType === 'patrol') {
      // Use the same hash-based color system as the calendar selection
      const patrolColors = ["#8B4513", "#FF6347", "#4682B4", "#32CD32", "#FFD700", "#9370DB", "#20B2AA", "#F0E68C"];
      const nameHash = inviteeName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      return patrolColors[nameHash % patrolColors.length];
    }
    
    if (inviteeType === 'group') {
      // Groups get a purple/violet theme
      return "#6A5ACD"; // Slate Blue for groups
    }
    
    if (inviteeType === 'unit') {
      // Units get the standard section colors
      return sectionColors[event.section || ''] || "#f89d69";
    }

    // Fallback to section color
    return sectionColors[event.section || ''] || "#f89d69";
  }

  private darkenColor(color: string, factor: number): string {
    // Convert hex to RGB, darken, and convert back
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.floor(parseInt(hex.substr(0, 2), 16) * (1 - factor)));
    const g = Math.max(0, Math.floor(parseInt(hex.substr(2, 2), 16) * (1 - factor)));
    const b = Math.max(0, Math.floor(parseInt(hex.substr(4, 2), 16) * (1 - factor)));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}
