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
