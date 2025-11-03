#!/bin/bash
# Script to update DATABASE_URL on Vercel production

echo "postgresql://postgres:SEnh%40%40kk123@db.gagphauyavcttfngddhl.supabase.co:5432/postgres?sslmode=require" | vercel env add DATABASE_URL production
