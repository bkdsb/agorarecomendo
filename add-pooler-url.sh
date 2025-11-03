#!/bin/bash
# Add Transaction Pooler DATABASE_URL to Vercel production
echo "postgresql://postgres.gagphauyavcttfngddhl:SEnh%40%40kk123@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1" | vercel env add DATABASE_URL production
