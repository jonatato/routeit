-- Add color column to tags table
ALTER TABLE tags ADD COLUMN IF NOT EXISTS color text DEFAULT '#6366f1';

-- Update existing tags with default colors based on common types
UPDATE tags SET color = '#10b981' WHERE slug = 'comida' AND color IS NULL;
UPDATE tags SET color = '#3b82f6' WHERE slug = 'transporte' AND color IS NULL;
UPDATE tags SET color = '#f59e0b' WHERE slug = 'cultura' AND color IS NULL;
UPDATE tags SET color = '#22c55e' WHERE slug = 'naturaleza' AND color IS NULL;
UPDATE tags SET color = '#ec4899' WHERE slug = 'compras' AND color IS NULL;
UPDATE tags SET color = '#8b5cf6' WHERE slug = 'ciudad' AND color IS NULL;
UPDATE tags SET color = '#6366f1' WHERE slug = 'city' AND color IS NULL;
UPDATE tags SET color = '#f97316' WHERE slug = 'traslado' AND color IS NULL;
UPDATE tags SET color = '#f97316' WHERE slug = 'travel' AND color IS NULL;
UPDATE tags SET color = '#0ea5e9' WHERE slug = 'vuelo' AND color IS NULL;
UPDATE tags SET color = '#0ea5e9' WHERE slug = 'flight' AND color IS NULL;
