# Product Requirements Document: Hometown Hub

## 1. Overview
People who move away for work or education lose touch with their hometown, village or local community. General social networks are too broad, and local communication is scattered across WhatsApp groups with no structure for announcements or events. Hometown Hub is a focused, web-based space for hyperlocal interaction.

## 2. Goals
**Primary:** connect people from the same city/village; centralise updates and discussions; support local events and announcements; strengthen community bonding.
**Secondary:** preserve local culture and traditions; enable community-led initiatives; provide a place for local news; encourage collaboration.

## 3. Scope
**Phase 1 (in scope):** responsive web app, community creation and membership, posts/announcements/discussions, events, notifications, moderation tools, platform admin dashboard.
**Out of scope:** native mobile apps, paid ads, AI moderation, government or emergency-alert integration.

## 4. Users and roles
| Role | Description |
|---|---|
| Member | Registers, joins communities, posts, comments, RSVPs |
| Community moderator | Moderates content, pins posts, posts announcements, approves requests |
| Community admin | Moderator powers plus role management and join policy (creator by default) |
| Platform admin | Approves communities, manages users, handles reports, monitors KPIs |

## 5. User flow
Visit → register (with hometown) → search for city/village → join or create a community → view feed → post/share → create or RSVP to events → receive notifications.

## 6. Functional requirements and where they live
| Requirement | Implementation |
|---|---|
| Registration and login | `/register`, `/login`, JWT auth |
| Profile with hometown | `/profile`, `User.hometown` |
| Create/join communities | `/explore`, `/communities/new`, `Membership` model |
| Community feed, text/images/announcements | Community page → Feed |
| Like, comment, share | `PostCard`, `Comments` |
| Events (create, join) | Community → Events, `/events` |
| Notifications | `/notifications`, bell badge polling every 30s |
| Approve/reject member requests | Community → Manage |
| Rules and guidelines | Community → About / Manage |
| Moderate posts and comments | Post menu, comment delete |
| Pin announcements | Post menu → Pin to top |
| Platform: approve communities | Admin → Communities |
| Platform: users and moderators | Admin → Users / Moderators |
| Platform: monitor activity | Admin → Overview |
| Platform: reports and disputes | Admin → Reports |
| Platform: categories and tags | Admin → Categories |

## 7. Non-functional requirements
- **Performance:** paginated queries, indexed collections, lazy-loaded images; target page load under 3 seconds on 4G.
- **Security:** bcrypt password hashing, JWT, Helmet, rate limiting, input sanitisation, role-based access, image type/size validation.
- **Usability:** mobile-first layout with bottom navigation, plain-language copy, keyboard focus states.
- **Scalability:** communities are scoped by city/village; membership is a separate collection so large communities don't bloat documents.

## 8. KPIs (all shown on the admin Overview)
Registered users · active communities · daily active users · post engagement (interactions per post) · event participation rate (RSVPs ÷ community reach) · community growth rate (last 30 days vs the prior 30).

## 9. Assumptions and constraints
Users want local networking; moderators actively manage content; users have internet access. Constraints: moderation load, varied digital literacy, limited Phase 1 scope.

## 10. Open questions
- The source brief mentions a "Pandit onboarding module" and "Sample Pandit Data", plus "concurrent bookings" and "service requests". These look like leftovers from another template and have no counterpart in the hometown-community scope, so they are **not built**. If a local-experts or service-provider onboarding flow is wanted, it can be added as a new module.

## 11. Future phases
Direct messages, polls, verified-hometown badges, multilingual UI (Odia, Hindi, etc.), email/push notifications, cloud image storage, content moderation queue for communities.
