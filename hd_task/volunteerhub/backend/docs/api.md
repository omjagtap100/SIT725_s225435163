# VolunteerHub API

Base URL: `[http://localhost:5000`]( "http://localhost:5000`") (development)

Authentication: `Authorization: Bearer <JWT>` on protected routes.

## Privacy (NFR-13–NFR-16)

- Passwords are stored as `passwordHash` only; never returned by any endpoint.
- `GET /auth/profile` returns `_id`, `name`, `email`, `role`, `phone`, `bio`, `skills` — no internal fields.
- Volunteer email addresses are included only in manager CSV export (`FR-22`) for approved organisation managers/admins of that event.
- Profile updates reject unknown fields (`assertOnlyKeys`).

## Auth

| Method | Path | Role | Description |

|--------|------|------|-------------|

| POST | `/auth/register` | Public | Register (FR-01, FR-02) |

| POST | `/auth/login` | Public | Login, returns JWT (FR-03) |

| POST | `/auth/forgot-password` | Public | Request password reset token by email (FR-04) |
 
| POST | `/auth/reset-password` | Public | Reset password with token (FR-04) |
| GET | `/auth/profile` | Authenticated | Current user profile (FR-05) |

| PATCH | `/auth/profile` | Authenticated | Update profile (FR-05) |

| POST | `/auth/organizations` | OrganisationManager | Register organisation (FR-06) |

| GET | `/auth/organizations` | Admin | List organisations |

| GET | `/auth/organizations/me` | OrganisationManager | Own organisation |

| PATCH | `/auth/organizations/:id/review` | Admin | Approve/reject (FR-07) |

| PUT | `/auth/organizations/:id` | OrganisationManager | Edit approved org (FR-08) |

| PATCH | `/auth/users/:id/active` | Admin | Activate/deactivate user (FR-23) |

 
| DELETE | `/auth/organizations/:id` | Admin | Permanently delete organisation and its events (FR-24) |
 
## Events

| Method | Path | Role | Description |

|--------|------|------|-------------|

| GET | `/events` | Authenticated | Paginated list; query: `page`, `limit`, `category`, `location`, `startDate`, `endDate` (FR-12, FR-13) |

| GET | `/events/:id` | Authenticated | Event detail with role capacity (FR-14) |

| POST | `/events` | OrganisationManager, Admin | Create event (FR-09) |

| PUT | `/events/:id` | OrganisationManager, Admin | Update event (FR-11) |

| PATCH | `/events/:id/cancel` | OrganisationManager, Admin | Cancel event + notify (FR-11) |

| DELETE | `/events/:id` | Admin | Permanently delete event and applications (FR-24) |
## Applications

| Method | Path | Role | Description |

|--------|------|------|-------------|

| POST | `/applications` | Volunteer | Apply for role (FR-15) |

| GET | `/applications/me` | Volunteer | Own applications |

| GET | `/applications/me/history` | Volunteer | Participation history with summary (FR-21) |

| PATCH | `/applications/:id/check-in` | Volunteer | Check in on event day (FR-19) |

| PATCH | `/applications/:id/status` | OrganisationManager, Admin | Accept/decline (FR-17, FR-18) |

| GET | `/applications/event/:eventId` | OrganisationManager, Admin | List applications for event (FR-17) |

| GET | `/applications/event/:eventId/export` | OrganisationManager, Admin | CSV participation export (FR-22) |

## Notifications (SSE)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/notifications/stream?token=<JWT>` | Authenticated | Server-Sent Events for in-app alerts (application updates, event cancel) |

## Health

| Method | Path | Description |

|--------|------|-------------|

| GET | `/health` | Health + uptime, cache mode, email metrics, request timings (NFR-11, NFR-12) |

## Optional Redis

Set `REDIS_URL=redis://127.0.0.1:6379` for Redis-backed cache and SSE pub/sub. Without it, memory cache and local SSE are used.

## JWT (NFR-04, NFR-05)
 
- Default expiry: `JWT_EXPIRES_IN=24h` (optional env override).
- `401` responses distinguish **missing**, **invalid**, and **expired** tokens.

