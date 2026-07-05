-- FY2025 and H1 FY2026 are both consolidated, but with different scope
-- (FY2025 includes the UK subsidiary but predates the Loamin acquisition;
-- H1 FY2026 includes Loamin, acquired November 2025). A binary
-- standalone/consolidated flag can't express that difference honestly, so
-- consolidation_basis becomes a free-text scope description instead of a
-- fixed two-value enum. NULL remains allowed for rows with no consolidation
-- basis (e.g. press-release-only metrics with no period attached).

ALTER TABLE disclosures DROP CONSTRAINT IF EXISTS disclosures_consolidation_basis_check;
ALTER TABLE disclosures_staging DROP CONSTRAINT IF EXISTS disclosures_staging_consolidation_basis_check;
