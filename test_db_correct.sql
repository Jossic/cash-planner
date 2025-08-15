-- Test data with proper UUID format
INSERT INTO operations (
    id, 
    invoice_date, 
    payment_date, 
    type, 
    amount_ht_cents, 
    vat_amount_cents, 
    amount_ttc_cents, 
    vat_on_payments, 
    label, 
    receipt_url, 
    created_at, 
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',  -- Valid UUID v4
    '2025-08-01',
    '2025-08-15',
    'sale',
    700000,  -- €7,000 HT (the ADEO invoice mentioned by user)
    140000,  -- €1,400 TVA (20%)
    840000,  -- €8,400 TTC
    1,       -- vat_on_payments = true
    'Facture ADEO - Prestations développement',
    'http://localhost:9000/documents/2025-08/adeo-facture.pdf',
    datetime('now'),
    datetime('now')
);

INSERT INTO operations (
    id,
    invoice_date,
    payment_date,
    type,
    amount_ht_cents,
    vat_amount_cents,
    amount_ttc_cents,
    vat_on_payments,
    label,
    receipt_url,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002',  -- Valid UUID v4
    '2025-08-05',
    '2025-08-10',
    'purchase',
    50000,   -- €500 HT
    10000,   -- €100 TVA
    60000,   -- €600 TTC
    1,
    'Matériel informatique',
    'http://localhost:9000/documents/2025-08/materiel.pdf',
    datetime('now'),
    datetime('now')
);