# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 3.x.x   | :white_check_mark: |

# Security Policy

This document describes how to report security vulnerabilities for TerraFlow and how we handle them.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 3.x.x   | :white_check_mark: |


## Reporting a Vulnerability (preferred)

Please do NOT open public GitHub issues with vulnerability details. Instead use one of the private channels below so we can investigate before public disclosure:

- Preferred: Create a private GitHub Security Advisory for this repository:
	https://github.com/parkmatt/TerraFlow/security/advisories/new

If you cannot use GitHub Security Advisories, open a discussion via the repository's Security tab or contact the maintainer via the repository contact details (see README).

When reporting a vulnerability, please include:

- A short, descriptive title
- Affected version(s) of TerraFlow
- Step-by-step reproduction steps and a minimal proof-of-concept (PoC) if possible
- Description of the impact (e.g., data exposure, remote code execution)
- Any relevant logs, screenshots, or environment details


## Response Targets

We aim to:

- Acknowledge receipt within 3 business days
- Provide a preliminary triage within 7 business days
- Work with the reporter on an appropriate fix or mitigation; timeframe depends on severity and complexity

If a fix requires coordination with third parties (e.g., backend/API owners), we will clearly communicate expected timelines.


## Disclosure and CVE

We prefer coordinated disclosure. After a fix is available, we will work with the reporter to agree on a disclosure timeline. If appropriate, we will request a CVE and coordinate with the reporter on attribution.


## What to expect after reporting

- We will investigate and confirm the issue.
- We may ask for additional details or help reproducing the issue.
- When a fix is ready we will publish release notes and update this policy if needed.


## Third-party dependencies

TerraFlow depends on third-party libraries (listed in `package.json`). Security fixes for dependencies will be applied as they become available and as appropriate for supported versions.


## Built on Summit

This project was originally based on the open source [Summit project](https://github.com/pete-mc/Summit). Any vulnerabilities discovered that originated in upstream code will be reported to the upstream project as appropriate.
