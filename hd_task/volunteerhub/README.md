# VolunteerHub (Group Project)

Monolith MVP: Express + MongoDB backend, static HTML/JS frontend.

## Docker — SIT725 8.2HD (recommended for marking)

From this directory (`volunteerhub/`):

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Web UI | http://localhost:3300 |
| API | http://localhost:5000 |
| Student endpoint | http://localhost:5000/api/student |

Expected `/api/student` response:

```json
{ "name": "Om Jagtap", "studentId": "s225435163" }
```

Demo login: `demo.volunteer@volunteerhub.local` / `Pass@12345`

Full instructions: see the main [README.md](../README.md#docker-sit725-82hd) in the repository root.

## Run locally (without Docker)

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm start

cd ../frontend
cp .env.example .env
npm install
npm start
```

Default API: `http://localhost:5000`  
Frontend: `http://localhost:3300`

## Seed accounts

| Role | Email | Password |
|------|--------|----------|
| Admin | `admin@volunteerhub.local` | `Pass@12345` |
| Organisation manager | `manager@volunteerhub.local` | `Pass@12345` |
| Volunteer | `demo.volunteer@volunteerhub.local` | `Pass@12345` |

## Optional Redis

Copy `backend/.env.example` to `backend/.env` and optionally set:

```env
REDIS_URL=redis://127.0.0.1:6379
```

Without `REDIS_URL`, the app uses in-memory cache (fully functional for HD Docker marking).

## Tests

```bash
cd backend
npm test
```
