-- Living Kitchen Vote System - Database Schema
-- Run this in Supabase SQL Editor to create the tables

CREATE TABLE IF NOT EXISTS dishes (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    ingredients TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    user_name TEXT NOT NULL,
    dish_id INTEGER NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('accept', 'dislike', 'neutral')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_dish ON votes(user_name, dish_id);

CREATE TABLE IF NOT EXISTS user_dietary (
    user_name TEXT PRIMARY KEY,
    disliked_ingredients TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
