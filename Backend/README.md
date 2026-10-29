# Dairy Finder backend

The backend is organized by feature under `src/modules`. Vendors, products, users,
and reservations are persisted in MongoDB. The application does not seed data on
startup; create vendors through `POST /api/vendors` with an admin bearer token.

## Run

```powershell
npm install
npm start
```

To add development records explicitly, without seeding on server startup:

```powershell
npm run seed
```

Copy `.env.example` to `.env` and set a reachable MongoDB connection string,
`JWT_SECRET`, and admin credentials before starting the API.

## Main endpoints

- `POST /api/auth/login` - admin or registered user login
- `GET /api/vendors` - live vendor data from MongoDB
- `GET /api/vendors/:id/products` - live product stock
- `POST /api/vendors` - create a vendor (admin)
- `POST /api/stock/update` - compatibility stock update (admin)
- `POST /api/reserve` - reserve live stock
- `GET /api/reservations` - reservation history (admin)
