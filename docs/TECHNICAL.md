# Technical documentation

## Architecture
React SPA (Vite) → REST/JSON → Express → Mongoose → MongoDB. In development Vite proxies `/api` and `/uploads` to port 5000. In production Express serves `client/dist` and the API from one origin.

## Data model (MongoDB collections)
| Collection | Key fields |
|---|---|
| User | name, email (unique), password (bcrypt), role (`user`/`admin`), hometown {village, city, state}, currentCity, bio, avatar, isBanned, lastActiveAt |
| Community | name, type (`city`/`town`/`village`), city, state, description, rules, joinPolicy, status (`pending`/`approved`/`rejected`), createdBy, memberCount |
| Membership | user, community, role (`member`/`moderator`/`admin`), status (`pending`/`active`/`rejected`); unique (user, community) |
| Post | community, author, type (`post`/`announcement`/`discussion`), title, content, images, category, tags, pinned, likes[], commentCount, shareCount, isRemoved |
| Comment | post, author, content, isRemoved |
| Event | community, creator, title, description, location, startsAt, endsAt, attendees[], status |
| Notification | user, type, message, link, read |
| Report | reporter, targetType, targetId, reason, details, status, resolutionNote |
| Category | name (unique), kind (`category`/`tag`) |

Content is soft-deleted (`isRemoved`) so reports and moderation history stay intact.

## Authorisation model
- `protect`: valid JWT, account exists and is not suspended.
- `adminOnly`: platform admin.
- `memberOf(minRole)`: active membership with at least that community role; platform admins pass automatically.
- Posts, comments, events are readable only by active members of the community.
- Unapproved communities are visible only to their staff and platform admins; posting/events unlock once approved.

## API reference (all under `/api`, JSON, `Authorization: Bearer <token>`)
**Auth**: `POST /auth/register` · `POST /auth/login` · `GET /auth/me` · `PUT /auth/me` · `PUT /auth/password`

**Communities**: `GET /communities?q=&type=&page=` · `POST /communities` · `GET /communities/mine` · `GET /communities/:id` · `PUT /communities/:id` (mod) · `POST /communities/:id/join` · `DELETE /communities/:id/leave` · `GET /communities/:id/members` · `GET /communities/:id/requests` (mod) · `PUT /communities/:id/requests/:membershipId` `{action: approve|reject}` (mod) · `PUT /communities/:id/members/:membershipId/role` (admin) · `DELETE /communities/:id/members/:membershipId` (mod)

**Posts**: `GET /communities/:id/posts` · `POST /communities/:id/posts` · `GET /posts/feed` · `GET /posts/:id` · `DELETE /posts/:id` · `PUT /posts/:id/like` · `POST /posts/:id/share` · `PUT /posts/:id/pin` (mod) · `GET|POST /posts/:id/comments` · `DELETE /posts/comments/:commentId`

**Events**: `GET|POST /communities/:id/events` · `GET /events/mine` · `PUT /events/:id/rsvp` · `PUT /events/:id` · `DELETE /events/:id`

**Notifications**: `GET /notifications` · `GET /notifications/unread-count` · `PUT /notifications/read-all` · `PUT /notifications/:id/read`

**Other**: `POST /upload` (multipart field `image`, 3 MB, JPG/PNG/WEBP/GIF) · `POST /reports` · `GET /categories` · `GET /health`

**Platform admin**: `GET /admin/stats` · `GET /admin/communities?status=` · `PUT /admin/communities/:id/status` · `GET /admin/users` · `PUT /admin/users/:id` · `GET /admin/moderators` · `GET /admin/reports` · `PUT /admin/reports/:id` · `GET|POST /admin/categories` · `DELETE /admin/categories/:id`

## Security measures
bcrypt (12 rounds) · JWT with expiry · Helmet · CORS allow-list from `CLIENT_URL` · rate limits (auth: 50 per 15 min, API: 300 per min) · `$`/`.` key stripping against NoSQL operator injection · server-side validation and length caps · upload type/size whitelist with random filenames · React escapes all rendered text.

## Performance notes
Compound indexes on posts (community, pinned, createdAt), memberships, notifications. All lists are paginated or capped. Counters (`memberCount`, `commentCount`) avoid expensive counts. Images are lazy-loaded.

## Deployment
1. Provision MongoDB (Atlas free tier works).
2. Set env vars: `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET` (long random string), `CLIENT_URL`, admin seed vars.
3. `npm run build && npm start`, or build the Dockerfile.
4. Run `npm run seed` once to create the admin and starter data.
5. Put it behind HTTPS (reverse proxy or the host's TLS). `trust proxy` is already enabled.

## Known limitations / next steps
- Uploaded images live on local disk; use object storage for multi-instance hosting.
- Notifications are polled (30s), not pushed. Socket.IO or SSE would make them real time.
- No email verification or password reset flow yet.
- No automated tests yet (suggested: Jest + Supertest for the API, Vitest + Testing Library for the client).
- The code was written without being run end to end; expect to fix small issues on first launch.
