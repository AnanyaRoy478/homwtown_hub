# Hometown Hub

A digital community platform where people from the same city, town or village connect, share updates, organise events and keep local culture alive. Built with the **MERN** stack (MongoDB, Express, React, Node) and Tailwind CSS.

## Features

**Members**
- Register / log in (JWT), profile with hometown details and photo
- Browse, search, create and join city / town / village communities
- Community feed with posts, discussions, announcements, images, categories
- Like, comment and share (copy link / native share sheet)
- Create events and RSVP; upcoming events across all your communities
- In-app notifications (announcements, events, replies, join decisions, moderation)
- Report posts and communities

**Community admins and moderators**
- Approve or decline join requests
- Edit community description, rules and join policy (open or approval)
- Pin posts, delete posts and comments, post announcements
- Manage events, promote or remove members

**Platform admin dashboard** (`/admin`)
- KPI overview: users, active communities, DAU/WAU, posts today, engagement, event participation, community growth
- Approve or reject new community requests
- Manage users (suspend, promote), view moderators across communities
- Review abuse reports (remove content, suspend user, dismiss)
- Manage content categories and tags

## Project structure

```
hometown-hub/
├── client/            React + Vite + Tailwind
│   └── src/ (components, pages, context, api.js)
├── server/            Express + Mongoose API
│   └── src/ (models, controllers, routes, middleware, utils, seed.js)
├── docs/              PRD.md, TECHNICAL.md
├── Dockerfile
└── package.json       root scripts
```

## Getting started

Requirements: Node.js 18+ and MongoDB (local, or a free MongoDB Atlas cluster).

```bash
# 1. install everything
npm run install:all

# 2. configure the API
cp server/.env.example server/.env      # Windows: copy server\.env.example server\.env
#    then edit MONGO_URI and set a long random JWT_SECRET

# 3. create the platform admin, categories and 3 sample communities
npm run seed

# 4. run API (http://localhost:5000) and client (http://localhost:5173)
npm run dev
```

Default admin (from `server/.env`): `admin@hometownhub.test` / `Admin@12345`. **Change this before deploying.**

## Production build

```bash
npm run build     # builds client/dist
npm start         # Express serves the API and the built client on PORT (default 5000)
```
Set `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET` and `CLIENT_URL` (your public site URL, used for share links and CORS).
Or use Docker: `docker build -t hometown-hub . && docker run -p 5000:5000 --env-file server/.env hometown-hub`.

## Notes

- Image uploads are stored on local disk (`server/uploads`). For multi-server or ephemeral hosting (Render, Heroku, etc.) swap `middleware/upload.js` for S3 / Cloudinary.
- See `docs/TECHNICAL.md` for the API reference, data model and known limitations.
