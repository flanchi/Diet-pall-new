# Frontend (Vite + React)

Install and run:

```bash
cd frontend
npm install
npm run dev
```

The app expects the backend to run on `http://localhost:4000`.

Notes:
- Click "Use GPS" to prompt for location permission and show nearby sample restaurants.
- This is a starter; replace sample data and add authentication/data upload as needed.

## Deploy frontend on Render

This project now includes a Render blueprint in `render.yaml`.

1. Push the `frontend` folder to your Git provider (GitHub/GitLab/Bitbucket).
2. In Render, create a new Blueprint/Static Site from that repo.
3. Render will use:
	- Build command: `npm install && npm run build`
	- Publish directory: `dist`
4. The blueprint sets `VITE_API_URL` to `https://diet-pall-new.onrender.com` so the frontend calls your backend API.

For the full two-service deployment flow (backend API + frontend static site), see `../backend/README.md`.
