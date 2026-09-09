# Brawn Mobile

Mobile application for the Brawn gym management platform.

## Stack

- Expo / React Native
- TypeScript
- Expo Router
- Expo SecureStore
- Existing Brawn NestJS API and PostgreSQL data

## First milestone

The initial mobile foundation provides:

- Brawn-branded login experience
- Authentication context connected to `/auth/login`
- Role-aware routing for members and personal trainers
- Member dashboard shell
- Trainer "Today" dashboard shell
- Member schedule, membership and profile routes
- Trainer calendar, members and profile routes
- Shared Brawn design tokens and reusable mobile components

## Local setup

```bash
npm install
cp .env.example .env
npm start
```

Set `EXPO_PUBLIC_API_URL` to the Brawn API address reachable from the device/emulator. A physical phone cannot use the computer's `127.0.0.1`; use the development machine's LAN IP instead.
