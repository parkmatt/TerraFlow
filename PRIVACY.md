TerraFlow Privacy Policy

Last updated: 2025-10-23

This privacy policy describes what TerraFlow (the "extension") collects, how it uses that information, and the choices you have.

Summary
- TerraFlow does not execute remote code at runtime. All JavaScript executed in the page is packaged with the extension and injected locally.
- TerraFlow makes network requests only to the Terrain API endpoints necessary to provide calendar features: `events.terrain.scouts.com.au` and `members.terrain.scouts.com.au`.
- TerraFlow stores only small, non-sensitive settings locally in the browser's `localStorage` (UI preferences such as default start time, default duration, default location, and starting day of week).
- TerraFlow does not collect, transmit, or sell personal data to third parties. It does not implement telemetry or analytics.

What data the extension accesses and why
- Page context on Terrain site (`terrain.scouts.com.au`): Used to inject the TerraFlow UI and to integrate features into the Terrain web app. Injection occurs only when you visit the Terrain site and the extension runs.
- Events API (`https://events.terrain.scouts.com.au/*`): The extension fetches and modifies events as requested by the user (viewing event lists, loading full activity details, creating/updating/deleting events). These API calls use the browser’s existing authentication/session with Terrain (TerraFlow does not send credentials).
- Members API (`https://members.terrain.scouts.com.au/*`): The extension fetches member and profile data required to populate attendee lists and calendars.
- Local storage: small application settings are stored in the browser's `localStorage` under keys prefixed with `terraflow_event_`. Examples: `terraflow_event_startTime`, `terraflow_event_duration`, `terraflow_event_location`, `terraflow_event_defaultCalendar`, `terraflow_event_startingDayOfWeek`.

What TerraFlow does not do
- It does not fetch or execute JavaScript from third-party/remote hosts at runtime.
- It does not collect analytics, crash reports, or other telemetry.
- It does not upload or store user data on servers operated by the extension author.

Security and storage
- API requests are made to the Terrain domains only. The extension relies on the user's existing Terrain session/cookies for authentication.
- Local settings in `localStorage` can be cleared by the user via the browser's site data settings.

Contact and hosting
- If you have privacy questions, please open an issue in the repository or contact the maintainer via the repository contact details.

This privacy policy is published at: https://raw.githubusercontent.com/parkmatt/TerraFlow/main/PRIVACY.md

Date and changes
- This policy was created on 2025-10-23. If the extension's data collection changes, this file should be updated accordingly and the Web Store listing updated with the new URL/version.
