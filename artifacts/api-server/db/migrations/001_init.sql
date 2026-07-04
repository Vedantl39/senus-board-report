-- Phase 1: Database Schema (schema-on-read design)
-- Exactly two tables. Do not add per-metric columns or additional tables
-- without checking with the user first — see attached_assets/replit-build-prompt_1783199322997.md

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS source_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  period_covered TEXT,
  audited BOOLEAN,
  in_scope BOOLEAN NOT NULL DEFAULT true,
  uploaded_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS disclosures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id UUID REFERENCES source_documents(id),
  record_type TEXT NOT NULL CHECK (record_type IN ('metric', 'risk', 'event')),
  category TEXT NOT NULL,
  period_label TEXT,
  consolidation_basis TEXT CHECK (consolidation_basis IN ('standalone', 'consolidated') OR consolidation_basis IS NULL),
  product_line TEXT CHECK (product_line IN ('Soil', 'ERA', 'Terrain') OR product_line IS NULL),
  materiality_rank INTEGER,
  status TEXT CHECK (status IN ('New', 'Updated', 'Unchanged') OR status IS NULL),
  payload JSONB NOT NULL,
  extracted_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_disclosures_record_type ON disclosures(record_type);
CREATE INDEX IF NOT EXISTS idx_disclosures_category ON disclosures(category);
CREATE INDEX IF NOT EXISTS idx_disclosures_period ON disclosures(period_label);
