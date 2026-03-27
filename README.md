# DayCal

A smart daily schedule planner with social features — build your day, track streaks, and stay in sync with friends.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnoaho325%2FDayCal&env=NEXT_PUBLIC_FIREBASE_API_KEY,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,NEXT_PUBLIC_FIREBASE_PROJECT_ID,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,NEXT_PUBLIC_FIREBASE_APP_ID&envDescription=Firebase%20config%20from%20.env.example&envLink=https%3A%2F%2Fgithub.com%2Fnoaho325%2FDayCal%2Fblob%2Fmain%2F.env.example)

## Features

- 📅 **Day / Week / Month views** — drag, delay, and manage your schedule
- 🔥 **Streaks & points** — stay consistent and climb the leaderboard
- 👥 **Social** — add friends, see their schedules, and compare progress
- 📌 **Reminders** — daily and pinned reminders that reset each morning
- 📋 **Lists** — shopping lists, to-dos, and more
- ☁️ **Cloud sync** — everything backed by Firebase, synced across devices
- 🌙 **Dark mode** — full dark/light theme support

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/noaho325/DayCal.git
cd DayCal
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

The `.env.example` already contains the Firebase config — all users share the same backend so social features work between everyone. No changes needed.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for production

```bash
npm run build
npm start
```

---

## Staying Up to Date

When new updates are pushed to the repo, run:

```bash
git pull
npm install      # only needed if package.json changed
npm run build    # for production; skip if running dev mode
```

All data lives in the cloud so nothing is lost on update.

---

## Tech Stack

- [Next.js 14](https://nextjs.org/) — App Router, TypeScript
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [Firebase](https://firebase.google.com/) — Auth, Firestore, Storage
- [Lucide React](https://lucide.dev/) — icons

---

## Deploying

Click the **Deploy with Vercel** button at the top of this page. It will:
1. Fork the repo to your GitHub account
2. Prompt you to fill in the Firebase env vars (copy them from `.env.example`)
3. Deploy automatically — you'll get a live URL in ~1 minute

---

## Contributing

Pull requests are welcome. For major changes please open an issue first.
