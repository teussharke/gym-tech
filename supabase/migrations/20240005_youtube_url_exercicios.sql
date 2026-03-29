-- MIGRATION: Adiciona youtube_url à tabela exercicios
-- Execute no Supabase SQL Editor

-- 1. Adicionar coluna youtube_url na tabela exercicios
ALTER TABLE public.exercicios
  ADD COLUMN IF NOT EXISTS youtube_url TEXT;

-- 2. Comentário descritivo
COMMENT ON COLUMN public.exercicios.youtube_url IS
  'URL do vídeo do YouTube demonstrando a execução correta do exercício. Ex: https://www.youtube.com/watch?v=XXXX';
