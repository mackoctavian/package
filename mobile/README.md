# DMRC mobile app

The Divine Mercy Retreat Center app for iOS and Android, built with Expo (SDK 58) and Expo Router.
It uses the same backend as the website in the repository root.

## What it does

- **Onboarding:** a four-slide welcome tour with full-bleed photography, shown on first launch.
- **Home:** greeting, quick actions, word for today, upcoming retreats carousel, Mass intention promo, bookshop, news, gallery, testimonials and contact.
- **Retreats:** search, category filter, upcoming and past retreats, a detail page with availability, and a four-step booking wizard (the same fields as the website). Booking creates a real booking through `/api/retreats/bookings`, and the confirmation shows a QR ticket.
- **My tickets:** tickets are saved on the phone. Bookings made elsewhere can be added by ticket code. From a ticket you can cancel or move to another retreat (same rules as the website).
- **Give:** a three-step donation flow (fund, amount, details) and Mass intentions. Both are recorded through the existing public APIs.
- **Bookshop:** catalogue with search, categories and sorting, a product page, cart and checkout (pick-up or delivery).
- **Gallery, News, Ministries, About, More:** a full-screen photo viewer, videos and audio, articles, ministries and contact details. A profile kept on the phone pre-fills forms.

### Demo-only parts

- **Payments** use a clearly labelled demo checkout (`src/components/MockCheckout.tsx`), the same as the website. No money moves and card details never leave the screen. Swap `simulatePayment` for the chosen provider's SDK when one is picked.
- **Bookshop orders** are kept on the phone only, because the backend has no orders table yet.
- **Social links** are the website's placeholders (`src/app/data/site.ts` in the web app).

## Backend

The app reads from read-only routes added to the website under `/api/mobile/*`: `home`, `retreats`, `publications`, `news`, `gallery` and `ministries`. They reuse the site's own loaders, so admin changes show up in the app.
Forms post to the existing public endpoints. If the API cannot be reached, screens fall back to a bundled snapshot (`src/data/snapshot.json`) and show an "offline" notice.

Set the API base URL in `app.json` → `expo.extra.apiUrl`, or with `EXPO_PUBLIC_API_URL` (see `.env.example`).

## Run it

```bash
cd mobile
npm install
npx expo start        # scan the QR code with Expo Go, or press i / a for a simulator
```

To use a local website instead of production, run `npm run dev` in the repository root and start the app with `EXPO_PUBLIC_API_URL=http://<your-computer-LAN-IP>:3000 npx expo start`.

Checks: `npm run typecheck`, `npm run lint`, `npx expo-doctor`.

## Build and publish

EAS is configured (`eas.json`, project id in `app.json`).

```bash
npx eas-cli@latest build --profile preview --platform android   # installable APK for testing
npx eas-cli@latest build --profile production --platform all    # store builds
npx eas-cli@latest submit --platform ios|android
```

Bundle ids are `org.dmrc.app` (change them in `app.json` before the first store build if you prefer another).

## Structure

```
src/app/            screens (Expo Router): (tabs)/, retreat/, book/, ticket/, tickets/, publication/, article/, ministry/, …
src/components/     UI kit (ui.tsx, form.tsx, feedback.tsx, headers.tsx, cards.tsx), TabBar, TicketCard, MockCheckout, FlowLayout
src/lib/            api.ts (queries and submissions), store.ts (persisted state), config.ts, format.ts, types.ts
src/theme/          brand tokens: navy / gold / ivory, Cormorant Garamond + Inter
src/data/           bundled content and the offline snapshot
```

To refresh the offline snapshot, fetch each `/api/mobile/<name>` route and save the `data` fields into `src/data/snapshot.json` under the same keys.
