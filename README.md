# Veturo Frontend

## Frontend environment

Set the frontend API origin in Vercel:

```env
VITE_API_URL=https://veturo-frontend-e7pn.onrender.com
```

For local development, the frontend falls back to `http://localhost:5000` when `VITE_API_URL` is not set.

Do not add backend-only secrets to the frontend environment. Keep these on Render only:

- `MONGO_URL`
- `JWT_SECRET`
- `CLOUDINARY_API_SECRET`
- `GMAIL_APP_PASSWORD`
- `PORT`

## Backend CORS

The backend should allow these frontend origins:

- `https://veturocars.com`
- `https://www.veturocars.com`
- `http://localhost:5173`

On Render, set `CLIENT_URLS` to:

```env
CLIENT_URLS=http://localhost:5173,https://veturocars.com,https://www.veturocars.com
```

Keep `CLIENT_URL` pointed at your primary frontend URL if you use email verification or password reset links:

```env
CLIENT_URL=https://veturocars.com
```
