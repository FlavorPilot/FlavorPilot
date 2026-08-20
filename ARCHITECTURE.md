# Architecture

## System boundary

```text
Browser
  │
  ├── Next.js web (Vercel)
  │     ├── pages / SSR / SEO
  │     ├── English + Ukrainian UI
  │     ├── interactive constructor
  │     └── local fallback
  │
  └── HTTPS
        │
        ▼
      NestJS API (container host)
        ├── AuthModule
        ├── DishesModule
        ├── FlavorModule
        ├── AiModule
        ├── DatabaseModule
        └── HealthModule
              │
              ├── PostgreSQL / Supabase
              └── OpenAI Responses API
```

## Why this split

Next.js is retained for what it does best: React, SSR, public pages, metadata, localization and the rich constructor. It no longer owns product business rules.

NestJS is a modular monolith. It is one deployable API process, not a microservice architecture. Modules create boundaries without introducing queues, service discovery or distributed transactions prematurely.

## Shared packages

### `@tastecraft/contracts`

Owns Zod schemas and shared types for:

- dish items and goals;
- flavor requests and responses;
- AI explanation input/output;
- dish CRUD;
- pagination and health responses.

Every HTTP boundary parses untrusted input through these schemas.

### `@tastecraft/flavor-engine`

Owns:

- the ingredient/preparation catalog;
- pair compatibility;
- sensory balance;
- quantity penalties;
- texture scoring;
- recommendation utility;
- confidence and issues.

It has no dependency on Next.js, NestJS, PostgreSQL or OpenAI.

## Authority rules

- Browser analysis is for instant UX.
- Nest repeats analysis whenever a trusted server result is needed.
- Nest owns visibility, plan limits, authorship and remix lineage.
- PostgreSQL stores durable state and provides defense-in-depth triggers.
- AI receives an immutable analysis object and cannot write scores.

## Scale path

1. One stateless Nest container and managed PostgreSQL.
2. Add API replicas behind the host's load balancer.
3. Add Redis only for measured cache/rate-limit needs.
4. Add a queue only for slow imports, email, bulk analysis or long AI jobs.
5. Add a Python service only when a separately trained model justifies it.

The public API boundary means mobile apps and commercial API clients can be added without extracting Next.js internals later.
