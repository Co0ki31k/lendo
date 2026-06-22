INSERT INTO ingredients (name, category, default_unit, waste_percentage)
SELECT seed.name, seed.category, seed.default_unit, seed.waste_percentage
FROM (
    VALUES
        ('Filet z kurczaka', 'MIESO', 'G', 0.08),
        ('Schab', 'MIESO', 'G', 0.10),
        ('Wolowina', 'MIESO', 'G', 0.12),
        ('Losos', 'MIESO', 'G', 0.07),
        ('Maslo', 'NABIAL', 'G', 0.00),
        ('Smietana 30%', 'NABIAL', 'ML', 0.00),
        ('Mleko', 'NABIAL', 'ML', 0.00),
        ('Ser mozzarella', 'NABIAL', 'G', 0.02),
        ('Ziemniaki', 'WARZYWA_OWOCE', 'G', 0.18),
        ('Marchew', 'WARZYWA_OWOCE', 'G', 0.20),
        ('Cebula', 'WARZYWA_OWOCE', 'G', 0.12),
        ('Pieczarki', 'WARZYWA_OWOCE', 'G', 0.06),
        ('Jablka', 'WARZYWA_OWOCE', 'G', 0.10),
        ('Makaron penne', 'SUCHE', 'G', 0.00),
        ('Ryż jasminowy', 'SUCHE', 'G', 0.00),
        ('Maka pszenna', 'SUCHE', 'G', 0.00),
        ('Cukier', 'SUCHE', 'G', 0.00),
        ('Bulka tarta', 'SUCHE', 'G', 0.00)
) AS seed(name, category, default_unit, waste_percentage)
WHERE NOT EXISTS (
    SELECT 1
    FROM ingredients existing
    WHERE existing.name = seed.name
);
