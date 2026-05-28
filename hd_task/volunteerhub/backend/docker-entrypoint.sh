#!/bin/sh
set -e

host="${MONGO_HOST:-mongo}"
port="${MONGO_PORT:-27017}"

echo "Waiting for MongoDB at ${host}:${port}..."
tries=0
max=30
while [ "$tries" -lt "$max" ]; do
  if node -e "const n=require('net');const c=n.createConnection(${port},'${host}');c.on('connect',()=>{c.end();process.exit(0)});c.on('error',()=>process.exit(1));"; then
    break
  fi
  tries=$((tries + 1))
  sleep 2
done

if [ "$tries" -eq "$max" ]; then
  echo "MongoDB not available after ${max} attempts."
  exit 1
fi

if [ "${RUN_SEED:-true}" = "true" ]; then
  echo "Seeding database..."
  node scripts/seed.js
fi

echo "Starting backend..."
exec node server.js
