# Your Home Security Guide

> **Experimental learning guide.** Use at your own risk. Please read the [Disclaimer](DISCLAIMER.md) before applying any steps.

A free, beginner-friendly, five-part interactive guide to checking and securing the network "doors" (ports) on a Windows 11 computer. It uses one house metaphor all the way through.

| Part | Topic |
|---|---|
| 1. The Security Walk | Find which ports are open, which program opened them, and which network they face. Look only. |
| 2. Managing the Locks | Choose a network type, then block risky ports with Windows Defender Firewall. |
| 3. The Guest Rooms | Firewalls inside virtual machines; remove stale port-forwarding rules (Hyper-V, VirtualBox). |
| 4. Sealed Envelopes | Check TLS versions; tighten Remote Desktop and remote PowerShell. |
| 5. The Regular Patrol | Read-only audit script, four-week schedule, temporary test rules, checklist. |

## Run it

Static HTML, CSS, and JavaScript. No build step, no tracking, no data stored. Open `index.html` in a browser, or host the folder on any static host (for example GitHub Pages).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The original is changed only by the maintainer after review. Anyone can make their own copy (fork).

## Comments and visit counting (optional)

Both features are off until you fill in `assets/site-config.js`, the only file you need to edit.

- **Comments (giscus):** copy `data-repo`, `data-repo-id`, `data-category` and `data-category-id` from https://giscus.app into the `giscus` section. A "Questions and Comments" page then appears at the end of each part. If any value is empty, that page stays hidden.
- **Visit counting (GoatCounter):** put your GoatCounter code (the part before `.goatcounter.com`) into `goatcounter.code`. The guide counts one view per part file and sends a `finished-part-N` event when a reader reaches the last lesson page of a part.
