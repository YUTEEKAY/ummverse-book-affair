-- Import 10 real romance books from CSV
-- Heat level mapping: Low → sweet, Medium → warm, High → hot

INSERT INTO public.books (title, author, genre, trope, mood, heat_level) VALUES
('The Duke and I', 'Julia Quinn', 'Historical Romance', 'Marriage of Convenience; Second Chance', 'Regal / Sweet', 'warm'),
('The Viscount Who Loved Me', 'Julia Quinn', 'Historical Romance', 'Second Chance; Slow Burn', 'Regal / Sweet', 'sweet'),
('It Ends with Us', 'Colleen Hoover', 'Contemporary Romance', 'Forbidden Love; Second Chance', 'Tragic / Warm', 'warm'),
('A Court of Thorns and Roses', 'Sarah J. Maas', 'Fantasy Romance', 'Enemies to Lovers; Royal Fantasy', 'Dark / Fantasy', 'hot'),
('Beach Read', 'Emily Henry', 'Contemporary Romance', 'Opposites Attract; Writers', 'Cozy / Sweet', 'sweet'),
('The Hating Game', 'Sally Thorne', 'Contemporary Romance', 'Enemies to Lovers', 'Flirty / Warm', 'warm'),
('It Happened One Autumn', 'Lisa Kleypas', 'Historical Romance', 'Fake Responsibility; Royalty', 'Regal / Sweet', 'sweet'),
('The Wall of Winnipeg and Me', 'Mariana Zapata', 'Contemporary Romance', 'Slow Burn; Boss / Employee', 'Warm / Comforting', 'warm'),
('Kingdom of the Wicked', 'Kerri Maniscalco', 'Fantasy Romance', 'Enemies to Lovers; Dark Royalty', 'Dark / Fantasy', 'hot'),
('The Perfect Hope', 'Nora Roberts', 'Contemporary Romance', 'Second Chance; Small Town', 'Comforting / Sweet', 'sweet')
ON CONFLICT (id) DO NOTHING;