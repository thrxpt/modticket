# modticket

## Run locally

Install [Bun](https://bun.sh/) first.

```bash
bun install
```

Create local environment files from the examples:

```bash
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
```

Update `apps/server/.env` with your PostgreSQL connection details, then apply the database schema:

```bash
bun run db:start
bun run db:push
bun run db:seed   # generate sample data
```

Start the app:

```bash
bun run dev
```

Open the web app at [http://localhost:3001](http://localhost:3001).

The API runs at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
modticket/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Router)
│   └── server/      # Backend API (Elysia, ORPC)
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
│   ├── api/         # API layer / business logic
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Useful commands

```bash
bun run dev:web      # start only the web app
bun run dev:server   # start only the API server
bun run db:start     # start PostgreSQL in Docker
bun run db:stop      # stop PostgreSQL Docker container
bun run db:seed      # generate sample data
bun run build        # build all apps
bun run check        # lint and format check
bun run fix          # auto-fix lint and format issues
```
