# DayCal

A smart daily schedule planner with social features — build your day, track streaks, and stay in sync with friends.

## Download

Go to the [**Releases**](https://github.com/noaho325/DayCal/releases) page and download the latest `.dmg`.

### Install
1. Open the `.dmg` file
2. Drag **DayCal** into your Applications folder
3. Open it from Applications or your Dock

> **First launch:** macOS may say "unidentified developer" since the app isn't signed.
> Go to **System Settings → Privacy & Security** → scroll down → click **Open Anyway**.

---

## Features

- 📅 **Day / Week / Month views** — drag, delay, and manage your schedule
- 🔥 **Streaks & points** — stay consistent and climb the leaderboard
- 👥 **Social** — add friends, see their schedules, and compare progress
- 📌 **Reminders** — daily and pinned reminders that reset each morning
- 📋 **Lists** — shopping lists, to-dos, and more
- ☁️ **Cloud sync** — everything backed by Firebase, synced across devices
- 🌙 **Dark mode** — full dark/light theme support

---

## Updates

New releases appear on the [Releases](https://github.com/noaho325/DayCal/releases) page.
Download the new `.dmg`, drag it to Applications to replace the old version. Your data is in the cloud so nothing is lost.

---

## Build from Source

Requires Node.js 20+.

```bash
git clone https://github.com/noaho325/DayCal.git
cd DayCal
npm install
# No setup needed — Firebase config is built in
npm run electron:build   # outputs dist/DayCal.dmg
```

---

## Tech Stack

- [Next.js](https://nextjs.org/) — App Router, TypeScript, static export
- [Electron](https://www.electronjs.org/) — desktop wrapper
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [Firebase](https://firebase.google.com/) — Auth, Firestore, Storage

---

## Contributing

Pull requests are welcome. For major changes please open an issue first.
