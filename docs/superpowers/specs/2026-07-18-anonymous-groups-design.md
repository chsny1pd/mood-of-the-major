# Anonymous Interest Groups — Design

> **Status:** Approved for implementation  
> **Date:** 2026-07-18

## Summary

Students can create open interest/support groups for anonymous mood posts scoped to that group. Membership is open (join instantly). Public UI never lists member identities; owners may manage (kick) members privately.

## Product rules

| Rule | Value |
|------|--------|
| Join | Open — immediate |
| Create limit | 3 groups owned per user |
| Join limit | Unlimited |
| Non-member preview | Name, description, cover, member count only |
| Posts | Members only; visible only inside the group |
| Member list (public) | Count only |
| Owner powers | Kick members; delete own group posts via existing mood ownership |
| Anonymity | Mood posts remain anonymous; owner member list uses displayName for moderation only |

## Data model

- `groups` — catalog + cover URL + denormalized `memberCount`
- `groupmembers` — `(groupId, userId)` unique; roles `owner` \| `member`
- `moods.groupId` — optional FK; group moods excluded from global/faculty/major feeds

## API (auth required)

- `GET /groups?q=&limit=&cursor=` — search by name
- `POST /groups` — create (enforce create limit 3)
- `GET /groups/:groupId` — detail + `isMember` / `isOwner`
- `POST /groups/:groupId/join` / `DELETE .../leave`
- `GET /groups/:groupId/members` — owner only
- `DELETE /groups/:groupId/members/:userId` — owner kick (cannot kick self/owner)
- `GET /groups/:groupId/moods` / `POST /groups/:groupId/moods` — members only

## UI

- Navbar **Groups** → list page: search + cover cards → detail
- Detail: join/leave, member feed when joined, owner member management
