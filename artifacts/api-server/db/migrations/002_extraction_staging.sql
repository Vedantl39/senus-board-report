-- Extraction validation staging tables (temporary, for validating the real
-- AI extraction pipeline against real source documents before ever touching
-- the live `disclosures` table). Mirrors the production schema exactly.
-- See attached_assets/replit-extraction-audit-prompt_1783253634341.md —
-- user explicitly asked extraction output go somewhere separate from the
-- live disclosures table until every figure is verified against the golden
-- test set. Drop these once validation is complete and the live swap (or
-- honest "not swapped" decision) has been made.

CREATE TABLE IF NOT EXISTS source_documents_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  period_covered TEXT,
  audited BOOLEAN,
  in_scope BOOLEAN NOT NULL DEFAULT true,
  uploaded_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS disclosures_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id UUID REFERENCES source_documents_staging(id),
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
