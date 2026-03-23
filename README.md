# Home Planner

This repository is a Next.js 16 app with a standard production build for running the full app, including API routes.

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

Use this when you want the full Next.js app, including server-rendered API routes under `src/app/api`.

```bash
npm run build
```

This runs `next build` and produces the normal Next.js production output in `.next/`.

To run the built app:

```bash
npm run start
```

## Notes

## Lint

Run lint checks with:

```bash
npm run lint
```
