
#!/bin/bash

# Wait for database to be ready
echo "Waiting for database..."
while ! pg_isready -h postgres -p 5432 -U ${POSTGRES_USER:-postgres}; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

echo "Database is ready!"

# Run database migrations
echo "Running database migrations..."
npm run db:push

# Start the application
echo "Starting application..."
exec npm start
