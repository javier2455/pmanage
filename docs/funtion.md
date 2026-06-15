# Support Tickets — Frontend integration guide

## Base URL
Relative to your API root, e.g. `/api/v2`. Some clients auto-prefix with `/v2`.

## Auth
Every endpoint requires `Authorization: Bearer <token>` (your app JWT, not `x-ms-authorization-token`).

## Endpoints

### 1. Create ticket
`POST /support-tickets`

Body:
```json
{
  "subject": "No puedo agregar productos",
  "message": "Cuando intento agregar un producto nuevo...",
  "userName": "Maria Lopez"
}
```
- `subject`: 5–255 chars
- `message`: 10–5000 chars
- `userName`: optional

Notes:
- `userEmail` is NOT sent by the client. It comes from the authenticated user (`req.user.email`) on the backend.
- Response: `201` with the created ticket object.

### 2. List my tickets
`GET /support-tickets/my-tickets`

Returns an array of tickets for the logged-in user, ordered by newest first.

### 3. Get my ticket by id
`GET /support-tickets/my-tickets/:id`

Returns one ticket only if it belongs to the logged-in user.

### 4. List all tickets (admin)
`GET /support-tickets?status=open|in_progress|closed`

- Query `status` is optional.
- Role required: `admin`.

### 5. Close ticket (admin)
`PATCH /support-tickets/:id/close`

Body:
```json
{
  "response": "El problema fue corregido."
}
```
- `response` is optional (0–5000 chars).
- Role required: `admin`.

## Ticket fields
```ts
{
  id: string;
  subject: string;
  message: string;
  userEmail: string;
  userName: string | null;
  status: "open" | "in_progress" | "closed";
  response: string | null;
  closedAt: string | null;
  closedBy: string | null;
  createdAt: string;
  updatedAt: string;
}
```

## Example (fetch)
```ts
const res = await fetch('/api/v2/support-tickets/my-tickets', {
  headers: { Authorization: `Bearer ${token}` }
});
const tickets = await res.json();
```