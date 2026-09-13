# Acceptance scenarios to run on the actual app

These are required checks, not results from this build environment. Browser E2E should automate
them after dependencies and test infrastructure are installed; there is no claimed E2E pass here.

## Local EN and UK

- [ ] Open each locale; html lang, labels, errors and navigation match the locale.
- [ ] Start empty. Add an ingredient, change grams using point and comma, change preparation.
- [ ] Reject zero, negative, NaN, blank-final and >5000 g; do not silently change to 0.1 g.
- [ ] Reject the same ingredient/method twice; allow two distinct supported methods.
- [ ] Preview a recommendation: original item list unchanged; apply exact candidate data.
- [ ] Undo restores the prior composition, redo reapplies; new edit clears redo.
- [ ] New dish asks confirmation; cancel keeps work. Confirm creates an empty private draft.
- [ ] Reload restores the draft. Changing language does not lose ingredients.
- [ ] Save locally, reload, edit without creating an unwanted duplicate, export and import JSON.
- [ ] Invalid JSON/storage is reported without deleting previous recipes.
- [ ] Local public-looking legacy records do not appear as real published community content.
- [ ] Keyboard search, Escape, dialog focus, close/return focus and mobile navigation are usable.
- [ ] API failure leaves draft and local analysis usable; no false success toast or fake feed.

## Supabase + two real users on staging

- [ ] Register, confirm email, sign in/out, recover password, refresh session on both locales.
- [ ] Saving as A persists after a fresh browser session; B cannot read/edit/delete A's private dish.
- [ ] Public/shared exact amounts require confirmation. Invalid share links are unavailable.
- [ ] Making a shared recipe private blocks its token. No sensitive token in referrer/logs.
- [ ] Delete confirmation and failure preserve accurate library state.
- [ ] Remixes preserve original attribution; create/update snapshots are transactionally valid.
- [ ] Simultaneous Free private creates cannot bypass capacity; downgraded private data stays private.
- [ ] Guest-to-account transition does not silently upload or lose guest recipes.
- [ ] Direct anon/authenticated product Data API is denied after migration; Nest paths still work.

## Native / release

- [ ] Install succeeded and lockfile was committed; typecheck, Vitest and Next/Nest builds passed.
- [ ] Docker was built, started and health/persistence exercised with correct network settings.
- [ ] Database backup restored in a separate environment. Request logs have no recipe secrets.
- [ ] Culinary outputs reviewed by domain experts; model confidence never sold as proof of safety.
- [ ] Known limitations triaged; payments/AI/community moderation are gated until implemented.
