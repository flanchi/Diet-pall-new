# Backend (Express)

Requirements: Node.js 16+

Install and run:

```bash
cd backend
npm install
npm start
```

Endpoints:
- `POST /api/mealplan` - body: medical profile JSON. Returns a simple 3-meal plan.
- `GET /api/nearby?lat={lat}&lng={lng}&type=restaurants|ingredients&radius={km}` - returns sample TT items near coordinates.

Auth endpoints:
- `POST /api/auth/register` - body: `{ email, password, name? }` returns `{ token, user }`.
- `POST /api/auth/login` - body: `{ email, password }` returns `{ token, user }`.

Protected profile endpoints (require `Authorization: Bearer {token}`):
- `GET /api/auth/profiles` - returns saved profiles for the logged-in user.
- `POST /api/auth/profiles` - body: `{ ...profile }` saves profile for the logged-in user.

Set the environment variable `JWT_SECRET` for production to a strong secret.

## Deploy both backend + frontend on Render

Because this workspace is split into separate `backend` and `frontend` folders, deploy them as two Render services:

1. **Backend API service**
	- Use blueprint/config from `backend/render.yaml`.
	- Set required runtime env vars (for example `GOOGLE_API_KEY`, `JWT_SECRET`).

2. **Frontend static site**
	- Use blueprint/config from `frontend/render.yaml`.
	- This sets `VITE_API_URL=https://diet-pall-new.onrender.com` so the frontend points to the Render API.

3. **Verify**
	- Open the frontend Render URL.
	- Confirm API requests succeed against the backend Render URL.
