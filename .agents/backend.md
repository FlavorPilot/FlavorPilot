# Backend changes

Read AGENT.md, docs/API.md and docs/DATABASE.md. Preserve the /v1 contracts unless a change is
documented with web adapters/tests. Use parseInput then catalogue validation. Guard every private
endpoint. public and unlisted serializers do not expose shareToken. AI receives composition, not
browser-supplied scores. Credentials stay in the API environment.

Test non-owner reads/updates/deletes, absent/expired tokens, invalid UUIDs, empty mutations,
unknown preparations, concurrent limits and downgrade behavior. Check Postgres error.cause
rather than leaking SQL messages to clients. Use no-store for sensitive or capability responses.
Do not claim RLS automatically applies to a trusted direct database connection.
