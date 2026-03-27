-- Full-text search index for wiki title + content
-- Improves ranking queries used by websearch_to_tsquery('portuguese', ...)
CREATE INDEX IF NOT EXISTS "wiki_pages_full_text_idx"
ON "wiki_pages"
USING GIN (
  to_tsvector('portuguese', coalesce("title", '') || ' ' || coalesce("content", ''))
);
