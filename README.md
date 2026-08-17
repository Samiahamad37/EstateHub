# EstateHub

Production-style real estate marketplace built with **Next.js**, **Prisma**, and **SQLite**.

## Features

- Role-based access for customers, agents, owners, and admins
- Property listings, search, filters, list/map views
- Viewing appointments with status notifications
- Customer-agent messaging
- Favorites and price-drop alerts
- AI recommendations and natural-language assistant
- JWT access tokens + refresh tokens
- Email verification and password reset
- Admin approvals, users, locations, reports, and settings

## Setup

```bash
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo accounts

Password for all accounts: `EstateHub@2026`

| Role | Email |
| --- | --- |
| Admin | admin@estatehub.com |
| Agent | agent@estatehub.com |
| Owner | owner@estatehub.com |
| Customer | customer@estatehub.com |

New registrations send a verification link. In development the link is returned by the API and opened automatically after sign-up.

## Optional environment

Copy `.env.example` to `.env`.

- `OPENAI_API_KEY`  optional. If set, the assistant uses OpenAI; otherwise it uses the built-in recommendation engine.
- SMTP variables  optional. Without SMTP, verification and reset emails are logged to the server console.
