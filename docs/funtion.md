# Support Tickets — Frontend integration guide

## Base URL

Relative to your API root, e.g. `/api/v2`. Some clients auto-prefix with `/v2`.

## Auth

Every endpoint requires `Authorization: Bearer <token>` with the app JWT.

## Endpoints

### 1. Create ticket

`POST /support-tickets`

Body:

```json
{
  "subject": "No puedo agregar productos",
  "message": "Cuando intento agregar producto nuevo...",
  "userName": "Maria Lopez"
}
```

- `subject`: 5–255 chars
- `message`: 10–5000 chars
- `userName`: optional

Notes:

- `userEmail` and `userId` are NOT sent by the client. They come from the authenticated user on the backend.
- Response: `201` with the created ticket object.
- Creates the initial conversation message.

### 2. List my tickets

`GET /support-tickets/my-tickets?page=1&limit=10`

Returns paginated tickets for the logged-in user, ordered by newest first.

### 3. Get my ticket by id

`GET /support-tickets/my-tickets/:id`

Returns one ticket only if it belongs to the logged-in user. Includes `messages` ordered by creation date.

### 4. List all tickets (admin)

`GET /support-tickets?status=open|in_progress|closed&page=1&limit=10`

- Query `status` is optional.
- Role required: `admin`.

### 5. User reply

`POST /support-tickets/:id/messages`

Body:

```json
{
  "message": "Sigo teniendo el mismo problema..."
}
```

- `message`: 10–5000 chars.
- Allowed only for the ticket owner.
- If the ticket is closed, it is reopened automatically.
- Admins receive email notification.

### 6. Admin reply

`POST /support-tickets/:id/admin-messages`

Body:

```json
{
  "message": "Revisamos el caso y aplicamos una corrección."
}
```

- `message`: 10–5000 chars.
- Role required: `admin`.
- If the ticket is closed, it is reopened automatically.
- User receives in-app + email notification.

### 7. Close or reopen ticket

`PATCH /support-tickets/:id/status`

Body:

```json
{
  "status": "closed",
  "message": "El problema fue corregido."
}
```

or:

```json
{
  "status": "open",
  "message": "Necesito más información."
}
```

- `status`: `closed` or `open`.
- `message`: optional, 0–5000 chars.
- Users can update only their own tickets.
- Admins can update any ticket.
- If `message` is sent, it is stored as a conversation message.
- Closing/reopening sends the required notifications.

### 8. Close ticket compatibility endpoint (admin)

`PATCH /support-tickets/:id/close`

Body:

```json
{
  "response": "El problema fue corregido."
}
```

- Kept for backward compatibility.
- Role required: `admin`.

### 9. List my support in-app notifications

`GET /support-tickets/my-notifications?page=1&limit=20&unreadOnly=false`

Returns only support-ticket in-app notifications for the logged-in user.

### 10. Count unread support in-app notifications

`GET /support-tickets/my-notifications/unread-count`

Returns:

```json
{
  "unreadCount": 3
}
```

### 11. Mark one support in-app notification as read

`PATCH /support-tickets/my-notifications/:id/read`

### 12. Mark all support in-app notifications as read

`PATCH /support-tickets/my-notifications/read-all`

Returns:

```json
{
  "unreadCount": 0
}
```

## Ticket fields

```ts
{
  id: string;
  subject: string;
  message: string;
  userEmail: string;
  userId: string | null;
  userName: string | null;
  status: "open" | "in_progress" | "closed";
  response: string | null;
  closedAt: string | null;
  closedBy: string | null;
  reopenedAt: string | null;
  reopenedBy: string | null;
  lastMessageAt: string | null;
  lastMessageBy: "user" | "admin" | null;
  createdAt: string;
  updatedAt: string;
}
```

## Message fields

```ts
{
  id: string;
  ticketId: string;
  senderType: "user" | "admin";
  senderUserId: string | null;
  senderName: string | null;
  senderEmail: string | null;
  message: string;
  createdAt: string;
}
```

## Support notification fields

```ts
{
  id: string;
  ticketId: string;
  messageId: string | null;
  recipientType: "user" | "admin";
  recipientUserId: string | null;
  recipientEmail: string | null;
  eventType: "ticket_created" | "user_replied" | "admin_replied" | "ticket_closed" | "ticket_reopened";
  channel: "in_app" | "email";
  content: string;
  metadata: Record<string, unknown> | null;
  isSent: boolean;
  sendError: string | null;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
}
```

## Example

```ts
const res = await fetch('/api/v2/support-tickets/my-tickets', {
  headers: { Authorization: `Bearer ${token}` }
});
const tickets = await res.json();
```