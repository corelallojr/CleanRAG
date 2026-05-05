from app.services.ingestion_service import enrich_structured_row
from app.models.schemas import NormalizedStructuredRow


def test_structured_row_enrichment_includes_required_fields():
    row = NormalizedStructuredRow(
        source_id="source_1",
        source_version_id="version_1",
        sheet_name="Sheet1",
        row_number=1,
        row_identity="identity_1",
        row_hash="hash_1",
        columns={"customer": "Acme", "amount": "42.5", "date": "2026-01-01"},
        display_text="customer: Acme; amount: 42.5; date: 2026-01-01",
        metadata={}
    )

    enriched = enrich_structured_row(row, "Revenue Upload", "2026-05-05T00:00:00Z")

    assert "Revenue Upload" in enriched
    assert "row_identity" in enriched
    assert "detected_numeric_columns" in enriched
    assert "detected_date_columns" in enriched

