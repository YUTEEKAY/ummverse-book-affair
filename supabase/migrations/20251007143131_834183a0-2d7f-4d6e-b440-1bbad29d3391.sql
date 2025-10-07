-- Add color_theme to genres table
ALTER TABLE genres
ADD COLUMN color_theme TEXT;

-- Add color_theme to tropes table
ALTER TABLE tropes
ADD COLUMN color_theme TEXT;

-- Populate genres with default themes based on name
UPDATE genres SET color_theme = CASE
  WHEN name ILIKE '%historical%' THEN 'historical'
  WHEN name ILIKE '%contemporary%' THEN 'contemporary'
  WHEN name ILIKE '%fantasy%' THEN 'fantasy'
  WHEN name ILIKE '%paranormal%' THEN 'mystical'
  WHEN name ILIKE '%crime%' THEN 'crime'
  ELSE 'default'
END;

-- Populate tropes with default themes based on name
UPDATE tropes SET color_theme = CASE
  WHEN name ILIKE '%enemies%' THEN 'hot'
  WHEN name ILIKE '%friends%' THEN 'warm'
  WHEN name ILIKE '%forbidden%' THEN 'regal'
  WHEN name ILIKE '%fake%' THEN 'contemporary'
  WHEN name ILIKE '%second%chance%' THEN 'warm'
  ELSE 'default'
END;