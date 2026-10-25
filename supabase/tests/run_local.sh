#!/usr/bin/env bash
# Runs migrations + policy tests against a throw-away local Postgres (no Supabase account needed).
# usage: sudo bash supabase/tests/run_local.sh      (needs postgresql-16 installed)
set -e
HERE="$(cd "$(dirname "$0")/.." && pwd)"; PGBIN=$(ls -d /usr/lib/postgresql/*/bin | tail -1); D=/tmp/devx_pg; PORT=5544
if ! su postgres -c "$PGBIN/pg_isready -h $D -p $PORT" >/dev/null 2>&1; then
  rm -rf $D; mkdir -p $D; chown postgres $D
  su postgres -c "$PGBIN/initdb -D $D/data -E UTF8 --locale=C.UTF-8 >/dev/null && $PGBIN/pg_ctl -D $D/data -o '-p $PORT -k $D' -l $D/log -w start >/dev/null"
fi
P="$PGBIN/psql -h $D -p $PORT -v ON_ERROR_STOP=1 -q"
su postgres -c "$P -c 'drop database if exists devx_test' -c 'create database devx_test'" 2>&1 | grep -v NOTICE || true
chmod -R a+rX "$HERE"
for f in tests/mock_supabase.sql migrations/0001_schema.sql migrations/0002_rls.sql migrations/0003_functions.sql migrations/0004_seed.sql; do
  out=$(cd "$HERE" && su postgres -c "$P -d devx_test -f $f" 2>&1) || { echo "$out" | grep -v NOTICE; echo "migration failed: $f"; exit 1; }
done
(cd "$HERE" && su postgres -c "$P -d devx_test -f tests/policy_tests.sql" 2>&1) | grep -E 'PASS|FAIL|ERROR|CONTEXT|ALL CHECKS|^---' | grep -vE '^-+$' | sed 's/^psql:[^ ]* NOTICE:  //;s/^NOTICE:  //'
