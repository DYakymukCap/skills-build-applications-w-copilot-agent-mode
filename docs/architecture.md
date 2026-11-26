# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: React pages load through the shared API client and expose accessible loading, error, empty, and populated states.
- Logic tier decision: Keep Express routes thin and put input validation and business behavior in service functions with deliberate 4xx errors.
- Data tier decision: Enforce required fields and valid ranges in Mongoose schemas; use idempotent upserts for stable demo records.
- Activity tracking approach: Validate user/team IDs and their existence, store the activity, and calculate points from submitted minutes.
- Team management approach: Require a team name and mascot, preserve member references, and reject malformed or unknown member IDs.
- Leaderboard approach: Sum activity points per team, sort descending, and assign ranks after sorting.
- Workout suggestions approach: Find the user by email, prioritize workouts matching their fitness goal or recent activity, and explain the recommendation.

## Test plan

- Initial baseline: `npm test --prefix octofit-tracker/backend` had 8 failures and 1 pass; `npm test --prefix octofit-tracker/frontend` had 15 failures. These failures showed missing Mongoose validation and API behavior, plus frontend pages that did not fetch or present API data and states.
- Data tier: `npm run test:data --prefix octofit-tracker/backend` — passed 5/5. A failure indicates a missing model constraint or a seed operation that is not idempotent or does not preserve unrelated records.
- API: `npm run test:api --prefix octofit-tracker/backend` — passed 4/4. A failure indicates incorrect request validation/status codes, activity creation, team behavior, leaderboard ordering, or workout recommendations.
- Backend suite: `npm test --prefix octofit-tracker/backend` — passed 9/9. A failure indicates a regression in either data or API contracts.
- Frontend: `npm test --prefix octofit-tracker/frontend` — passed 15/15. A failure indicates broken API rendering or missing accessible loading, empty, or error states.
- Backend build: `npm run build --prefix octofit-tracker/backend` — passed. A failure indicates backend TypeScript errors.
- Frontend build: `npm run build --prefix octofit-tracker/frontend` — passed. A failure indicates frontend TypeScript or production bundling errors.
- Final composition: `node .github/scripts/grade-step.mjs step5-final` — passed. A failure indicates a tier contract, protected test, or build check needs attention.
