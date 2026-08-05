-- generated from react/src/data.json; categories[].items is dropped, being derived and wrong.
-- rating and ratingCount are dropped too: ratings are per user per variant now, and there are
-- no users to attribute 18 products worth of scores to
BEGIN;

INSERT INTO categories (name, icon, img)
VALUES
    ('Elektronik', '💻', '/images/category/electronic.png'),
    ('Fashion', '👗', '/images/category/fashion.png'),
    ('Rumah & Dapur', '🏠', '/images/category/household.png'),
    ('Kecantikan', '💄', '/images/category/beauty.png'),
    ('Olahraga', '⚽', '/images/category/sport.png'),
    ('Buku & Alat Tulis', '📚', '/images/category/stationary.png');

INSERT INTO brands (name)
VALUES
    ('AromaWell'),
    ('BlendPro'),
    ('BrewMaster'),
    ('FashionID'),
    ('FitLife'),
    ('GlowLab'),
    ('Gramedia'),
    ('HomeDeco'),
    ('PhoneX'),
    ('SmashKing'),
    ('SoundWave'),
    ('SportPro'),
    ('TabTech'),
    ('TrailRunner'),
    ('UrbanBag'),
    ('WristTech');

INSERT INTO products (id_category, id_brand, name, description)
SELECT c.id, b.id, v.name, v.description
FROM (VALUES
    ('Elektronik', 'SoundWave', 'Headphone Wireless Premium', 'Headphone nirkabel premium dengan kualitas suara superior, bass yang dalam, dan konektivitas Bluetooth stabil. Cocok untuk musik, gaming, maupun panggilan sehari-hari.'),
    ('Elektronik', 'PhoneX', 'Smartphone 5G Ultra', 'Smartphone flagship dengan jaringan 5G super cepat, layar AMOLED tajam, dan baterai tahan lama. Performa tinggi untuk semua aktivitas digital kamu.'),
    ('Elektronik', 'WristTech', 'Smartwatch Series 5', 'Smartwatch canggih dengan fitur pemantauan kesehatan, notifikasi pintar, dan desain elegan. Teman setia di pergelangan tanganmu.'),
    ('Fashion', 'FashionID', 'Kaos Polos Premium Cotton', 'Kaos polos berbahan katun premium yang lembut, adem, dan tahan lama. Tersedia dalam berbagai pilihan warna untuk tampilan kasual kamu.'),
    ('Fashion', 'SportPro', 'Sneakers Sport Runfast', 'Sepatu olahraga dengan teknologi sole responsif dan material breathable. Ringan di kaki, maksimal di performa lari maupun aktivitas harian.'),
    ('Fashion', 'UrbanBag', 'Tas Ransel Laptop Waterproof', 'Ransel laptop anti-air dengan kapasitas besar, desain ergonomis, dan banyak kompartemen. Ideal untuk profesional dan pelajar yang aktif.'),
    ('Rumah & Dapur', 'BrewMaster', 'Coffee Maker Otomatis', 'Mesin kopi otomatis yang menyeduh kopi sempurna setiap saat. Dilengkapi timer, pengatur suhu presisi, dan mudah dibersihkan.'),
    ('Rumah & Dapur', 'BlendPro', 'Blender Portable Mini', 'Blender mini yang praktis dan mudah dibawa ke mana saja. Cocok untuk membuat smoothie, jus, dan minuman sehat setiap hari.'),
    ('Rumah & Dapur', 'HomeDeco', 'Set Peralatan Makan Keramik', 'Set peralatan makan keramik berkualitas tinggi dengan desain elegan. Aman untuk microwave dan dishwasher, cocok untuk meja makan modern.'),
    ('Elektronik', 'TabTech', 'Tablet 10.5" WiFi + 4G', 'Tablet layar luas 10,5 inci dengan konektivitas WiFi dan 4G. Performa andal untuk bekerja, belajar, dan hiburan di mana saja.'),
    ('Kecantikan', 'GlowLab', 'Serum Vitamin C Brightening', 'Serum pencerah wajah dengan kandungan Vitamin C tinggi yang membantu meratakan warna kulit dan memudarkan noda hitam. Kulit lebih cerah dan glowing.'),
    ('Olahraga', 'TrailRunner', 'Sepatu Lari Trail Ultra', 'Sepatu lari trail dengan grip kuat dan bantalan empuk untuk medan apapun. Dirancang untuk pelari yang aktif di alam terbuka.'),
    ('Buku & Alat Tulis', 'Gramedia', 'Buku "Atomic Habits"', 'Buku bestseller tentang cara membangun kebiasaan kecil yang membawa perubahan besar dalam hidup. Panduan praktis dari James Clear yang mengubah cara pandangmu.'),
    ('Elektronik', 'SoundWave', 'Speaker Bluetooth Portable', 'Speaker Bluetooth portabel dengan suara jernih dan bass kuat. Tahan air, baterai tahan lama, dan mudah dibawa ke mana saja.'),
    ('Fashion', 'FashionID', 'Dress Floral Midi', 'Dress midi motif floral yang feminin dan elegan. Bahan ringan dan nyaman dipakai seharian, cocok untuk berbagai kesempatan.'),
    ('Kecantikan', 'AromaWell', 'Minyak Esensial Lavender Set', 'Set minyak esensial lavender murni untuk aromaterapi dan relaksasi. Membantu meredakan stres, meningkatkan kualitas tidur, dan menyegarkan ruangan.'),
    ('Olahraga', 'FitLife', 'Matras Yoga Premium', 'Matras yoga premium dengan permukaan anti-slip dan ketebalan optimal untuk kenyamanan maksimal. Cocok untuk yoga, pilates, dan meditasi.'),
    ('Olahraga', 'SmashKing', 'Raket Badminton Carbon Pro', 'Raket badminton serat karbon ringan dan kuat untuk kontrol dan power maksimal. Pilihan tepat untuk pemain serius maupun yang ingin meningkatkan permainan.')
) AS v (category, brand, name, description)
JOIN categories c ON c.name = v.category
JOIN brands b ON b.name = v.brand;

INSERT INTO products_variants (id_product, position, inventory, name)
SELECT p.id, 0, v.inventory, 'Standar'
FROM (VALUES
    ('Headphone Wireless Premium', 45),
    ('Smartphone 5G Ultra', 30),
    ('Smartwatch Series 5', 22),
    ('Kaos Polos Premium Cotton', 200),
    ('Sneakers Sport Runfast', 60),
    ('Tas Ransel Laptop Waterproof', 80),
    ('Coffee Maker Otomatis', 25),
    ('Blender Portable Mini', 120),
    ('Set Peralatan Makan Keramik', 40),
    ('Tablet 10.5" WiFi + 4G', 18),
    ('Serum Vitamin C Brightening', 150),
    ('Sepatu Lari Trail Ultra', 35),
    ('Buku "Atomic Habits"', 500),
    ('Speaker Bluetooth Portable', 75),
    ('Dress Floral Midi', 55),
    ('Minyak Esensial Lavender Set', 90),
    ('Matras Yoga Premium', 65),
    ('Raket Badminton Carbon Pro', 30)
) AS v (name, inventory)
JOIN products p ON p.name = v.name;

INSERT INTO products_price (id_variant, original_price_idr, discount_price_idr)
SELECT pv.id, v.original_price_idr, v.discount_price_idr
FROM (VALUES
    ('Headphone Wireless Premium', 650000::BIGINT, 450000::BIGINT),
    ('Smartphone 5G Ultra', 5000000::BIGINT, 4200000::BIGINT),
    ('Smartwatch Series 5', 3500000::BIGINT, 2800000::BIGINT),
    ('Kaos Polos Premium Cotton', 125000::BIGINT, NULL::BIGINT),
    ('Sneakers Sport Runfast', 750000::BIGINT, 550000::BIGINT),
    ('Tas Ransel Laptop Waterproof', 350000::BIGINT, NULL::BIGINT),
    ('Coffee Maker Otomatis', 1200000::BIGINT, 875000::BIGINT),
    ('Blender Portable Mini', 189000::BIGINT, NULL::BIGINT),
    ('Set Peralatan Makan Keramik', 450000::BIGINT, NULL::BIGINT),
    ('Tablet 10.5" WiFi + 4G', 4000000::BIGINT, 3200000::BIGINT),
    ('Serum Vitamin C Brightening', 250000::BIGINT, 185000::BIGINT),
    ('Sepatu Lari Trail Ultra', 780000::BIGINT, NULL::BIGINT),
    ('Buku "Atomic Habits"', 110000::BIGINT, 89000::BIGINT),
    ('Speaker Bluetooth Portable', 450000::BIGINT, 320000::BIGINT),
    ('Dress Floral Midi', 395000::BIGINT, 295000::BIGINT),
    ('Minyak Esensial Lavender Set', 145000::BIGINT, NULL::BIGINT),
    ('Matras Yoga Premium', 280000::BIGINT, NULL::BIGINT),
    ('Raket Badminton Carbon Pro', 850000::BIGINT, 675000::BIGINT)
) AS v (name, original_price_idr, discount_price_idr)
JOIN products p ON p.name = v.name
JOIN products_variants pv ON pv.id_product = p.id;

INSERT INTO products_images (id_product, url, alt)
SELECT p.id, v.url, v.alt
FROM (VALUES
    ('Headphone Wireless Premium', '/images/product/soundwave-headphone_wireless_premium.png', 'Headphone Wireless Premium'),
    ('Smartphone 5G Ultra', '/images/product/phonex-smartphone_5g_ultra.png', 'Smartphone 5G Ultra'),
    ('Smartwatch Series 5', '/images/product/wristtech-smartwatch_series_5.png', 'Smartwatch Series 5'),
    ('Kaos Polos Premium Cotton', '/images/product/fashionid-kaos_polos_premium_cotton.png', 'Kaos Polos Premium Cotton'),
    ('Sneakers Sport Runfast', '/images/product/sportpro-sneakers_sport_runfast.png', 'Sneakers Sport Runfast'),
    ('Tas Ransel Laptop Waterproof', '/images/product/urbanbag-tas_ransel_laptop_waterproof.png', 'Tas Ransel Laptop Waterproof'),
    ('Coffee Maker Otomatis', '/images/product/brewmaster-coffee_maker_otomatis.png', 'Coffee Maker Otomatis'),
    ('Blender Portable Mini', '/images/product/blendpro-blender_portable_mini.png', 'Blender Portable Mini'),
    ('Set Peralatan Makan Keramik', '/images/product/homedeco-set_peralatan_makan_keramik.png', 'Set Peralatan Makan Keramik'),
    ('Tablet 10.5" WiFi + 4G', '/images/product/tabtech-tablet_10_5_wifi_4g.png', 'Tablet 10.5" WiFi + 4G'),
    ('Serum Vitamin C Brightening', '/images/product/glowlab-serum_vitamin_c_brightening.png', 'Serum Vitamin C Brightening'),
    ('Sepatu Lari Trail Ultra', '/images/product/trailrunner-sepatu_lari_trail_ultra.png', 'Sepatu Lari Trail Ultra'),
    ('Buku "Atomic Habits"', '/images/product/gramedia-buku_atomic_habits.png', 'Buku "Atomic Habits"'),
    ('Speaker Bluetooth Portable', '/images/product/soundwave-speaker_bluetooth_portable.png', 'Speaker Bluetooth Portable'),
    ('Dress Floral Midi', '/images/product/fashionid-dress_floral_midi.png', 'Dress Floral Midi'),
    ('Minyak Esensial Lavender Set', '/images/product/aromawell-minyak_esensial_lavender_set.png', 'Minyak Esensial Lavender Set'),
    ('Matras Yoga Premium', '/images/product/fitlife-matras_yoga_premium.png', 'Matras Yoga Premium'),
    ('Raket Badminton Carbon Pro', '/images/product/smashking-raket_badminton_carbon_pro.png', 'Raket Badminton Carbon Pro')
) AS v (name, url, alt)
JOIN products p ON p.name = v.name;

INSERT INTO shipping_methods (name, cost_idr)
VALUES
    ('JNE Reguler', 15000),
    ('JNE Express', 25000),
    ('Same Day Delivery', 35000);

COMMIT;
