# Frontend Mobile (Vite + React + Capacitor)

Install and run:

```bash
cd frontend_mobile
npm install
npm run dev
```

## Build Android app (separate mobile frontend)

From `frontend_mobile`:

```bash
npm install
npm run build
npm run mobile:sync
npm run mobile:open
```

Then in Android Studio:

1. Wait for Gradle sync to finish.
2. Run on emulator/device, or build APK/AAB.

Quick one-command flow:

```bash
npm run mobile:run
```

## Build APK with GitHub Actions

This repo includes a workflow at `.github/workflows/build-frontend-mobile-apk.yml`.

How to run:

1. Go to your GitHub repo.
2. Open **Actions**.
3. Select **Build Frontend Mobile APK**.
4. Click **Run workflow**.
5. When complete, download artifact **frontend-mobile-debug-apk**.

The app expects the backend to run on `http://localhost:4000`.

Notes:
- Click "Use GPS" to prompt for location permission and show nearby sample restaurants.
- This is a starter; replace sample data and add authentication/data upload as needed.

## Deploy frontend on Render

This project now includes a Render blueprint in `render.yaml`.

1. Push the `frontend_mobile` folder to your Git provider (GitHub/GitLab/Bitbucket).
2. In Render, create a new Blueprint/Static Site from that repo.
3. Render will use:
	- Build command: `npm install && npm run build`
	- Publish directory: `dist`
4. The blueprint sets `VITE_API_URL` to `https://diet-pall-new.onrender.com` so the frontend calls your backend API.

For the full two-service deployment flow (backend API + frontend static site), see `../backend/README.md`.
