# Home Planner

This repository is a Next.js 16 app with two supported build modes:

- A normal production build for running the full app, including API routes.
- A static export build for generating a deployable `out/` directory with only the static gallery flow.

## Requirements

- Node `25.8.0` via [mise.toml](./mise.toml)
- npm

Install dependencies with:

```bash
npm install
```

## Development

Run the local dev server:

```bash
npm run dev
```

The app starts on `http://localhost:3000`.

## Build Modes

### Standard Production Build

Use this when you want the full Next.js app, including server-rendered API routes under `src/app/api`.

```bash
npm run build
```

This runs `next build` and produces the normal Next.js production output in `.next/`.

To run the built app:

```bash
npm run start
```

### Static Export Build

Use this when you want a static site export in `out/`.

```bash
npm run build:static
```

This runs [`scripts/static-build.sh`](./scripts/static-build.sh), which:

1. Temporarily moves `src/app/api` out of the app tree.
2. Temporarily moves these pages out of the app tree if they exist:
   `browse`, `ignored`, `furniture`, `playground`.
3. Sets `STATIC_EXPORT=1` and runs `next build`.
4. Restores the moved directories after the build finishes.

The `STATIC_EXPORT` flag is handled in [`next.config.ts`](./next.config.ts):

- `output` is switched to `"export"`.
- Next image optimization is disabled with `images.unoptimized`.
- `NEXT_PUBLIC_STATIC=1` is exposed to the client.

Successful output is written to:

```text
out/
```

## Notes

- `npm run build` and `npm run build:static` should not be run at the same time because Next.js uses a shared `.next` lock.
- The static export script temporarily moves files in the working tree. If the script is interrupted, verify that `src/app/api` and the moved pages were restored before committing.

## Lint

Run lint checks with:

```bash
npm run lint
```
