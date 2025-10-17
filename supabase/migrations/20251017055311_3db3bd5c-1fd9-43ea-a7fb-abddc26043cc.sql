-- Clean up non-English summaries for re-enrichment
UPDATE books 
SET summary = NULL, api_source = NULL
WHERE language = 'en' 
  AND summary IS NOT NULL
  AND (
    summary LIKE '%université%' 
    OR summary LIKE '%de la%' 
    OR summary LIKE '% à %'
    OR summary LIKE '%étudiant%'
    OR summary LIKE '%loin%'
    OR summary LIKE '%après%'
  );

-- Reset books marked as attempted or not_found so they can be retried with improved logic
UPDATE books 
SET api_source = NULL
WHERE api_source IN ('attempted', 'not_found');