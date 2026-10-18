# Administration and support

The first implementation of [the CRM concept](CRM_CONCEPT.md) provides an owner workspace
at `/{locale}/admin` and authenticated support at `/{locale}/support`. Account pages link to
support; an owner assignment also exposes the administration link. All new interface copy
uses EN/UK dictionaries. No billing, campaign delivery, model training or catalogue editing
is enabled by this delivery.

## Available operations

| Section | Implemented behavior |
|---|---|
| Overview | Stored profile/recipe counts, visible/restricted publications, explicitly shared feedback, review backlog, open support tickets and bundled catalogue size |
| Users | Bounded search by username/display name/ID, profile card, aggregate counts, stored subscription state and up to 20 public recipe records |
| Recipes | Search public publications; restrict/restore distribution with a reason and optimistic moderation revision |
| Catalogue | Search the bundled 620-food catalogue; inspect preparations, sensory hypotheses, working shares, published per-100-g amounts and source links |
| Feedback | Read only explicitly opted-in snapshots; set review state and internal note, protected by feedback timestamp and review revision |
| Support | Read user requests, reply, set state/priority, assign to self or clear assignment; concurrent changes return a conflict |
| Activity log | Paginated successful administrative reads/writes and operator role assignments; reasons and IDs, without recipe or message bodies |
| Service | Current database probe, environment, versions and configuration flags; billing and backup monitoring explicitly shown as not connected |

The workspace intentionally does not expose private/unlisted recipe content, share tokens,
account emails, device drafts, arbitrary SQL, environment secrets or a second score editor.
Profile cards show counts for private cloud records without retrieving their content.
Auth configuration is not represented as a successful live sign-in probe.

## Database and owner assignment

Existing installations apply `supabase/migrations/0010_administration.sql` after 0009.
It adds owner assignments, an audit table, review state, support tickets/messages,
`dishes.moderation_hidden` and its independent revision, and an opt-in flag on feedback.
It preserves current recipe visibility, content, versions and existing feedback privacy.
The migration is repeatable; fresh `schema.sql` includes the same changes.
New tables enable RLS and revoke direct public/anon/authenticated access. Nest checks rights
even when its database connection bypasses RLS. Migration does not assign any owner.

After confirming the intended Supabase account UUID and environment, an operator uses Node 22
with `scripts/admin-owner.mjs`. It defaults to a dry run without opening a database connection:

```powershell
& .\.local\node-v22.23.3-win-x64\node.exe scripts/admin-owner.mjs grant USER_UUID "Initial site owner"
```

Replace `USER_UUID` with an existing profile ID. Add `--apply` only after reviewing the target
environment. The script takes `DATABASE_URL` from its process or `apps/api/.env`; it never
prints credentials. `revoke` disables the assignment. Operator grants/revocations are audited
with a null staff actor and an explicit operator action. There is no HTTP grant endpoint,
automatic first-user promotion or email-based owner shortcut. The script can recover access
after revoking the last owner; it requires trusted server/database access.

## Authentication and MFA

Every admin endpoint first verifies the bearer token through Supabase's `/auth/v1/user`,
then reads the active `owner` assignment from the database. Revocation takes effect on the
next request. Client state, `user_metadata` and the generic Supabase role grant no access.

`GET /v1/admin/access` returns only the assigned user's owner/MFA state. All data and mutation
routes additionally require `aal2` by default. The UI lists verified TOTP factors, supports
enrollment with a QR/manual secret, and challenges the authenticator. Secrets are displayed
only during setup and are not logged or stored by the application.

Session assurance is extracted from the exact token only after the trusted Auth server has
accepted that token. Subject, expected issuer and expiry must match; opaque/malformed tokens
produce `unknown`, never `aal2`. This helper is not an independent JWT verifier and must not
be called before the provider verification. This retains the existing remote-verification
architecture without introducing a decode-only authentication path.

`ADMIN_REQUIRE_MFA=true` is the default. A local opaque-token auth stub explicitly sets it to
false for integration/E2E. Production startup rejects false. A real Supabase TOTP enrollment,
challenge and refreshed-session pass is still required on staging; the local stub does not
establish provider interoperability. There is one owner capability set in this phase;
separate support/editor/finance roles remain part of later CRM stages.

## Privacy and review

Existing and legacy-client feedback has `allow_team_review=false`. The feedback form adds
an unchecked, optional permission describing team access to that exact snapshot. Admin list
and review writes require the flag to remain true. Reads lock selected feedback rows during
their transaction; withdrawal/update and review also serialize on the row.

Account pages list the user's own feedback metadata and allow withdrawal after reload or
later recipe edits. `PATCH /v1/feedback/:id/permission` accepts only `allowTeamReview:false`
and verifies ownership. It prevents subsequent team-workspace access; it cannot recall data
already read. A previously loaded browser page is not remotely wiped. New opt-in is available
through the explicit snapshot submission form, not the permission endpoint.

Review notes/status are separate from immutable inputs and server-recomputed analysis. They
are not included in the author's feedback response or treated as model-training instructions.
Changing/withdrawing a submission makes stale review writes fail. Existing feedback deletion
also deletes its review by FK cascade. Internal review notes are not duplicated into audit.

## Distribution moderation

Restriction sets a separate flag and increments its revision under a recipe row lock. It
requires the observed state/revision and a 5–500-character reason; mutation and audit commit
together. Restriction does not rewrite the recipe, create a content version or alter the
author's private/unlisted/public setting. Owners still read/edit their own records and see
a restriction notice in their cloud library.

Public listing, public lookup, share-token lookup, discussion reads/posts, remix and foreign
parent selection enforce the flag. Restoring distribution is available only while the author
still marks the recipe public. It never publishes an author's private recipe. General comment
moderation, complaint submission, appeals and account restrictions remain later work; only
recipe distribution moderation is implemented in this phase.

## Support workflow

Users can submit a category, subject and message, list their requests and reply. Only their
own conversations are available on user endpoints. Staff uses separately guarded admin paths;
the browser cannot set owner, staff identity, message direction, assignment or revision.
No private recipe is automatically attached. The text form explains what is sent.

States are new, working, waiting_user, waiting_fix, resolved and closed. Staff replies set
waiting_user; user replies set new. Resolved/closed threads reject new messages until staff
explicitly reopens them. Priority and assignment changes require a reason and the observed
revision. Every message increments the revision, so stale staff edits fail rather than
overwriting a newer reply. There are no hidden staff-only messages in this first conversation
UI; replies are visibly user-facing. Internal notes, deadlines, attachments, email delivery
and incident grouping belong to subsequent stages.

Limits: at most five open tickets, ten new tickets per rolling 24 hours and 100 messages per
conversation. Creation serializes on the owner's profile; replies serialize on the ticket.
UUID request IDs deduplicate repeated creation/reply requests; reusing an ID for different
content returns a conflict. The mounted form retains its request ID for an unchanged retry,
including a server success followed by a lost response. Reload does not persist a pending
form or its ID. Refreshing a conversation preserves unsent reply text. User messages render
as escaped plain text, including line breaks.

## Routes and architecture

All routes use `/v1`, Bearer verification, strict contracts and no-store responses:

- `GET /admin/access`, `/admin/overview`, `/admin/users`, `/admin/users/:id`.
- `GET /admin/recipes`, `PATCH /admin/recipes/:id/moderation`.
- `GET /admin/catalogue`, `/admin/feedback`, `/admin/audit`, `/admin/service`.
- `PATCH /admin/feedback/:id/review`.
- `GET /admin/support`, `/admin/support/:id`; `PATCH /admin/support/:id`;
  `POST /admin/support/:id/messages`.
- `GET /support`, `/support/:id`; `POST /support`, `/support/:id/messages`.
- `GET /feedback/mine`; `PATCH /feedback/:id/permission` (author only).

List queries accept `search`, page 1–10,000 and limit 1–50. Feedback history is owner-scoped
and currently does not apply its optional search field. Lists have deterministic tie-break
ordering and total/page/limit metadata. Offset pagination is intended for a small operator
workspace; concurrent inserts can shift pages, unlike immutable cursor traversal. Snapshot
content remains bounded by the existing recipe contracts.

Nest's AdminModule owns guards, administration and support services. Domain schemas are in
contracts. Web entities own repositories; `administration`, `support-desk` and `model-feedback`
features own operations. Screens compose the pure `admin-workspace` and `support-desk` widgets.
Protected views remount by account and ignore stale asynchronous responses. All new routes
have noindex metadata; no protected data is included in their static HTML.

## Verification

See [VALIDATION.md](VALIDATION.md) for executed results. API tests cover revoked/absent rights,
MFA denial, bounded metadata, private-data exclusion, visibility bypasses, feedback consent,
review conflicts, support isolation, idempotent retries, creation limits, direct-role denial
and migration reapplication. Browser cases exercise the real forms, two users, response loss,
permission withdrawal, UK/mobile catalogue, review and distribution controls.

For Windows installations reserving the usual test auth port, set
`FLAVORPILOT_E2E_AUTH_PORT=45421` before running the isolated E2E suite. This affects the local
stub only. Migration, owner assignment and deployment to hosted services are separate
operator actions; application startup and builds do not perform them.
