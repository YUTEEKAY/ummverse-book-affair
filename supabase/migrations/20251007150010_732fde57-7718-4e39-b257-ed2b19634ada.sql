-- Standardize heat_level values from numeric to text categories
-- First, update existing numeric values to text equivalents
UPDATE books 
SET heat_level = CASE 
  WHEN heat_level = '2' THEN 'sweet'
  WHEN heat_level = '3' THEN 'warm'
  WHEN heat_level = '4' THEN 'hot'
  WHEN heat_level = '5' THEN 'scorching'
  ELSE heat_level
END
WHERE heat_level IN ('2', '3', '4', '5');

-- Add a check constraint to ensure only valid heat levels
ALTER TABLE books 
ADD CONSTRAINT check_heat_level 
CHECK (heat_level IN ('sweet', 'warm', 'hot', 'scorching') OR heat_level IS NULL);