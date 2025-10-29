TerraFlow v3.1.2 — Release notes

Summary:
- UX improvements to the calendar and agenda view: clickable rows, expanded details (location, organiser, description), month-based agenda navigation, and greyed past events.
- Date handling normalized to Dayjs in UI; centralized date formatting helper.
- Added confirmation for marking events concluded; removed reopen action due to server constraints.
- Build and CI updates: production build, release workflow, and artifact naming fixed.

Packaging:
- Built production artifacts and packaged release ZIP: `release/terraflow-extension-3.1.2.zip`.

Notes for reviewers:
- The extension injects packaged scripts into `terrain.scouts.com.au` and makes authorized API requests to `events.terrain.scouts.com.au` and `members.terrain.scouts.com.au` as the user interacts with the UI.
- Privacy policy: https://raw.githubusercontent.com/parkmatt/TerraFlow/main/PRIVACY.md
