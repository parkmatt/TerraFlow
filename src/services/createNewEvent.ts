import { TerrainState } from "@/helpers";

export default async function createNewEvent(body: string, calendarId?: string, calendarType?: string): Promise<void | string> {
  try {
    if (!TerrainState.getToken()) return undefined;
    
    // Use different endpoints based on calendar type
    let endpoint: string;
    if (calendarType === 'patrol' && calendarId) {
      // Use patrol-specific endpoint for patrol calendars
      endpoint = `https://events.terrain.scouts.com.au/patrols/${calendarId}/events`;
    } else if (calendarType === 'group' && calendarId) {
      // Use group-specific endpoint for group calendars
      endpoint = `https://events.terrain.scouts.com.au/groups/${calendarId}/events`;
    } else {
      // Fall back to unit endpoint for unit and other calendar types
      endpoint = `https://events.terrain.scouts.com.au/units/${TerrainState.getUnitID()}/events`;
    }
    
    const response = await fetch(endpoint, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Authorization: TerrainState.getToken(),
      },
      redirect: "error",
      referrerPolicy: "strict-origin-when-cross-origin",
      body,
    });
    
    
    if (!response.ok) {
      const errorText = await response.text();
      return JSON.parse(errorText);
    } else {
      // 204 No Content means success but no response body
      if (response.status === 204) {
        return undefined;
      } else {
        // For other success codes, try to parse JSON
        try {
          const successData = await response.json();
          return undefined;
        } catch (e) {
          // If JSON parsing fails but status is OK, treat as success
          return undefined;
        }
      }
    }
  } catch (e) {
    throw e;
  }
}
