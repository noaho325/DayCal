# DayCal

A smart daily schedule planner with social features — build your day, track streaks, and stay in sync with friends.

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

The easiest way to deploy is [Vercel](https://vercel.com):

1. Push your fork to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add the environment variables from `.env.example` in Vercel project settings
4. Deploy — done

---

## Contributing

Pull requests are welcome. For major changes please open an issue first.
