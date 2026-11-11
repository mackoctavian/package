# DMRC Admin (Expo)

The staff app for Divine Mercy Retreat Center. It signs in with the same accounts as the web admin panel and follows the same access levels (Owner, Manager, Viewer, with per-area view or edit), so each person only sees what they are allowed to.

## What it does

| Tab / screen | Who sees it | What they can do |
| --- | --- | --- |
| **Home** | everyone | Greeting, “needs your attention” (bookings to approve, intentions to schedule, new gifts, unread messages), key numbers, giving chart, open retreats with capacity, latest bookings, this week's Masses, recent activity |
| **Bookings** | Retreats (view) | Search and filter every booking, filter by retreat, long-press to select many and approve / mark paid / check in / cancel in one go. Booking detail: call, WhatsApp, SMS, email, approve and issue ticket, mark paid, check in, move to another retreat, resend the ticket email, notes, party members and form answers |
| **Scan** | Check-in desk (edit) or Retreats (edit) | Live QR scanner with torch, per-retreat check-in with live “guests in” numbers, instant result card (welcome / already in / wrong retreat / not approved) with undo, type a code by hand, or check guests in from the expected list |
| **Giving** | Donations and/or Mass intentions (view) | Monthly giving, awaiting payment, top method, donation list with payment status; Mass intentions to schedule with a date picker and celebrant, this week's Masses |
| **More** | everyone | Profile and access summary, Retreats (status, places, price, dates), Inbox, Publications / News / Events / Articles editor with cover photo upload, Team & access (invite, change role and per-area access, deactivate), Activity log, Account & password, sign out |

Viewers see everything they have access to with a “view-only” note and no edit buttons. The server enforces the same rules, so the app can never do more than the web panel allows.

## How it talks to the site

- `POST /api/mobile/admin/session` signs in and returns a 30-day token. The app keeps it in the device keychain (`expo-secure-store`) and sends it as `Authorization: Bearer …`.
- Every existing admin API (`/api/admin/*`, `/api/retreats/*`, `/api/content/*`, `/api/uploads`) accepts that header as well as the web cookie, so the app reuses them unchanged.
- `GET /api/mobile/admin/overview` powers Home; `GET /api/mobile/admin/activity` powers the activity log.
- Signing out, deactivating a person, or changing their access on the web ends the app session too (the app gets a 401 and returns to sign-in).

No database changes are needed: app sessions use the existing `admin_sessions` table.

## Run it

```bash
cd admin-mobile
npm install
npx expo start          # scan the QR code with Expo Go
```

Everything it uses (camera, secure store, image picker) is available in Expo Go, so no custom build is needed to try it.

Point it at another server with `EXPO_PUBLIC_API_URL` (see `.env.example`) or `extra.apiUrl` in `app.json`. The default `https://dmrc-ten.vercel.app` is a placeholder until the production domain is confirmed.

## Build for the stores

```bash
npx eas-cli@latest init           # once: creates the EAS project for this app
npx eas-cli@latest build --profile preview --platform android   # installable APK for the team
npx eas-cli@latest build --profile production --platform all
```

Bundle id / package: `org.dmrc.admin` (separate from the public app, `org.dmrc.app`).

## Checks

```bash
npx tsc --noEmit
npx expo lint
```
