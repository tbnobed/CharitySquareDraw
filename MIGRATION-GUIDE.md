# Docker Migration Guide

## Overview

The Docker deployment now includes **automatic database migrations** that run on container startup. This ensures the `winner_percentage` column is added to your database without manual intervention.

## How It Works

1. **Container Starts** → Docker entrypoint script begins
2. **Waits for Database** → Uses `pg_isready` with credentials from `DATABASE_URL`
3. **Runs Migrations** → Executes `node dist/run-migrations.js` to apply SQL migrations
4. **Starts Server** → Launches the application server

## Files Involved

- **migrations/0000_flawless_cerebro.sql** - Generated SQL migration (includes winner_percentage column)
- **server/run-migrations.ts** - Migration runner using drizzle-orm
- **docker-entrypoint.sh** - Startup script that orchestrates the process
- **Dockerfile** - Builds migration runner and copies all necessary files

## Testing the Migration

### Build and Start Docker

```bash
docker-compose down
docker-compose up --build
```

### Expected Startup Logs

You should see output similar to:

```
Starting Chicken Poop Bingo application...
Waiting for database to be ready...
Database is ready!
Running database migrations...
Migrations completed successfully
Starting application server...
[Express] Serving on port 5000
```

### Verify Migration Success

1. **Check Database Schema:**
   ```bash
   docker-compose exec database psql -U app_user -d chicken_poop_bingo -c "\d game_rounds"
   ```
   
   You should see `winner_percentage` column with `integer DEFAULT 50`

2. **Check Application:**
   - Visit the admin dashboard
   - Verify winner percentage controls are working
   - Create a game round and set custom winner percentage
   - Draw a winner and verify split amounts display correctly

## Troubleshooting

### Container Won't Start

**Symptom:** Container keeps restarting or shows "Database is unavailable - sleeping"

**Solution:** Verify `DATABASE_URL` is correctly set in `.env` file and matches your database service

### Migration Fails

**Symptom:** "Migration failed" error in logs

**Solution:** 
1. Check migration files exist in `migrations/` folder
2. Verify DATABASE_URL has correct permissions
3. Check database logs: `docker-compose logs database`

### Data Safety

The migration adds a new column with a default value - **no data is deleted or modified**. All existing game rounds will have `winner_percentage = 50` automatically.

## Manual Migration (If Needed)

If automatic migration fails, you can manually add the column:

```sql
ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS winner_percentage INTEGER DEFAULT 50;
```

## Rollback

To revert to previous version without migrations:

1. Remove docker-entrypoint.sh from Dockerfile CMD
2. Change CMD back to: `CMD ["node", "dist/server-bundle.js"]`
3. Rebuild container
