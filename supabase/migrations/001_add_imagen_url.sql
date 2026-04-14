-- Run this in Supabase SQL Editor to add cover image support
ALTER TABLE public.anime ADD COLUMN IF NOT EXISTS imagen_url text;
