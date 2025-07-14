-- Este script actualiza los costos de los productos en la base de datos.
-- Copia y pega este contenido en el Editor de SQL de tu panel de Supabase y ejecútalo.

UPDATE products SET cost = 3000 WHERE name = 'silicone-case';
UPDATE products SET cost = 4500 WHERE name = 'magsafe-de-color';
UPDATE products SET cost = 4500 WHERE name = 'stylish-case';
UPDATE products SET cost = 2300 WHERE name = 'good-case';
UPDATE products SET cost = 4000 WHERE name = 'glass-case';
UPDATE products SET cost = 3000 WHERE name = 'metal-case';
UPDATE products SET cost = 1200 WHERE name = 'transparente-comun';
UPDATE products SET cost = 3000 WHERE name = 'clear-case';
UPDATE products SET cost = 1250 WHERE name = 'protectores-camara';
UPDATE products SET cost = 650 WHERE name = 'vidrio-templado';
UPDATE products SET cost = 650 WHERE name = 'vidrio-templado-16';
UPDATE products SET cost = 27000 WHERE name = 'airpods-max';
UPDATE products SET cost = 7500 WHERE name = 'cable-lightning';
UPDATE products SET cost = 37000 WHERE name = 'cargador-original';
UPDATE products SET cost = 9000 WHERE name = 'cargador-magsafe';
UPDATE products SET cost = 16000 WHERE name = 'battery-pack';
UPDATE products SET cost = 9500 WHERE name = 'auriculares-m10';
UPDATE products SET cost = 8500 WHERE name = 'earpods';
UPDATE products SET cost = 20000 WHERE name = 'airpods-pro';
UPDATE products SET cost = 4500 WHERE name = 'silicone-case-16';
UPDATE products SET cost = 1500 WHERE name = 'transparente-comun-16';
UPDATE products SET cost = 15150 WHERE name = 'auricular-tune-290-jbl';
UPDATE products SET cost = 22000 WHERE name = 'airpods-4ta-generacion';
UPDATE products SET cost = 7500 WHERE name = 'cable-tipo-c';
UPDATE products SET cost = 51500 WHERE name = 'apple-watch-ultra-2';

-- Verificación (opcional): puedes ejecutar esta consulta para ver los costos actualizados.
-- SELECT name, cost, price FROM products ORDER BY name;
