-- generated from react/src/data.json; categories[].items is dropped, being derived and wrong
BEGIN;

INSERT INTO categories (name, icon, img)
VALUES
    ('Elektronik', '💻', '/images/category/electronic.png'),
    ('Fashion', '👗', '/images/category/fashion.png'),
    ('Rumah & Dapur', '🏠', '/images/category/household.png'),
    ('Kecantikan', '💄', '/images/category/beauty.png'),
    ('Olahraga', '⚽', '/images/category/sport.png'),
    ('Buku & Alat Tulis', '📚', '/images/category/stationary.png');

INSERT INTO products (
    id_category, slug, name, brand, img, summary,
    price_idr, original_price_idr, stock, rating, rating_count, tags
)
SELECT
    c.id, v.slug, v.name, v.brand, v.img, v.summary,
    v.price_idr, v.original_price_idr, v.stock, v.rating, v.rating_count, v.tags
FROM (VALUES
    ('headphone-wireless-premium', 'Headphone Wireless Premium', 'SoundWave', 'Elektronik', '/images/product/soundwave-headphone_wireless_premium.png',
     'Headphone nirkabel premium dengan kualitas suara superior, bass yang dalam, dan konektivitas Bluetooth stabil. Cocok untuk musik, gaming, maupun panggilan sehari-hari.',
     450000::BIGINT, 650000::BIGINT, 45::INT, 4.8::NUMERIC(2,1), 512::INT, '{"baru","unggulan","promo"}'::TEXT[]),
    ('smartphone-5g-ultra', 'Smartphone 5G Ultra', 'PhoneX', 'Elektronik', '/images/product/phonex-smartphone_5g_ultra.png',
     'Smartphone flagship dengan jaringan 5G super cepat, layar AMOLED tajam, dan baterai tahan lama. Performa tinggi untuk semua aktivitas digital kamu.',
     4200000, 5000000, 30, 4.6, 890, '{"baru","unggulan","promo"}'),
    ('smartwatch-series-5', 'Smartwatch Series 5', 'WristTech', 'Elektronik', '/images/product/wristtech-smartwatch_series_5.png',
     'Smartwatch canggih dengan fitur pemantauan kesehatan, notifikasi pintar, dan desain elegan. Teman setia di pergelangan tanganmu.',
     2800000, 3500000, 22, 4.4, 324, '{"unggulan","promo"}'),
    ('kaos-polos-premium-cotton', 'Kaos Polos Premium Cotton', 'FashionID', 'Fashion', '/images/product/fashionid-kaos_polos_premium_cotton.png',
     'Kaos polos berbahan katun premium yang lembut, adem, dan tahan lama. Tersedia dalam berbagai pilihan warna untuk tampilan kasual kamu.',
     125000, NULL, 200, 4.3, 678, '{}'),
    ('sneakers-sport-runfast', 'Sneakers Sport Runfast', 'SportPro', 'Fashion', '/images/product/sportpro-sneakers_sport_runfast.png',
     'Sepatu olahraga dengan teknologi sole responsif dan material breathable. Ringan di kaki, maksimal di performa lari maupun aktivitas harian.',
     550000, 750000, 60, 4.6, 445, '{"unggulan","promo"}'),
    ('tas-ransel-laptop-waterproof', 'Tas Ransel Laptop Waterproof', 'UrbanBag', 'Fashion', '/images/product/urbanbag-tas_ransel_laptop_waterproof.png',
     'Ransel laptop anti-air dengan kapasitas besar, desain ergonomis, dan banyak kompartemen. Ideal untuk profesional dan pelajar yang aktif.',
     350000, NULL, 80, 4.5, 234, '{"baru"}'),
    ('coffee-maker-otomatis', 'Coffee Maker Otomatis', 'BrewMaster', 'Rumah & Dapur', '/images/product/brewmaster-coffee_maker_otomatis.png',
     'Mesin kopi otomatis yang menyeduh kopi sempurna setiap saat. Dilengkapi timer, pengatur suhu presisi, dan mudah dibersihkan.',
     875000, 1200000, 25, 4.4, 189, '{"unggulan","promo"}'),
    ('blender-portable-mini', 'Blender Portable Mini', 'BlendPro', 'Rumah & Dapur', '/images/product/blendpro-blender_portable_mini.png',
     'Blender mini yang praktis dan mudah dibawa ke mana saja. Cocok untuk membuat smoothie, jus, dan minuman sehat setiap hari.',
     189000, NULL, 120, 4.2, 567, '{"baru"}'),
    ('set-peralatan-makan-keramik', 'Set Peralatan Makan Keramik', 'HomeDeco', 'Rumah & Dapur', '/images/product/homedeco-set_peralatan_makan_keramik.png',
     'Set peralatan makan keramik berkualitas tinggi dengan desain elegan. Aman untuk microwave dan dishwasher, cocok untuk meja makan modern.',
     450000, NULL, 40, 4.7, 123, '{}'),
    ('tablet-10-5-wifi-4g', 'Tablet 10.5" WiFi + 4G', 'TabTech', 'Elektronik', '/images/product/tabtech-tablet_10_5_wifi_4g.png',
     'Tablet layar luas 10,5 inci dengan konektivitas WiFi dan 4G. Performa andal untuk bekerja, belajar, dan hiburan di mana saja.',
     3200000, 4000000, 18, 4.5, 345, '{"baru","promo"}'),
    ('serum-vitamin-c-brightening', 'Serum Vitamin C Brightening', 'GlowLab', 'Kecantikan', '/images/product/glowlab-serum_vitamin_c_brightening.png',
     'Serum pencerah wajah dengan kandungan Vitamin C tinggi yang membantu meratakan warna kulit dan memudarkan noda hitam. Kulit lebih cerah dan glowing.',
     185000, 250000, 150, 4.6, 892, '{"promo"}'),
    ('sepatu-lari-trail-ultra', 'Sepatu Lari Trail Ultra', 'TrailRunner', 'Olahraga', '/images/product/trailrunner-sepatu_lari_trail_ultra.png',
     'Sepatu lari trail dengan grip kuat dan bantalan empuk untuk medan apapun. Dirancang untuk pelari yang aktif di alam terbuka.',
     780000, NULL, 35, 4.7, 267, '{}'),
    ('buku-atomic-habits', 'Buku "Atomic Habits"', 'Gramedia', 'Buku & Alat Tulis', '/images/product/gramedia-buku_atomic_habits.png',
     'Buku bestseller tentang cara membangun kebiasaan kecil yang membawa perubahan besar dalam hidup. Panduan praktis dari James Clear yang mengubah cara pandangmu.',
     89000, 110000, 500, 4.9, 1245, '{"promo"}'),
    ('speaker-bluetooth-portable', 'Speaker Bluetooth Portable', 'SoundWave', 'Elektronik', '/images/product/soundwave-speaker_bluetooth_portable.png',
     'Speaker Bluetooth portabel dengan suara jernih dan bass kuat. Tahan air, baterai tahan lama, dan mudah dibawa ke mana saja.',
     320000, 450000, 75, 4.4, 389, '{"promo"}'),
    ('dress-floral-midi', 'Dress Floral Midi', 'FashionID', 'Fashion', '/images/product/fashionid-dress_floral_midi.png',
     'Dress midi motif floral yang feminin dan elegan. Bahan ringan dan nyaman dipakai seharian, cocok untuk berbagai kesempatan.',
     295000, 395000, 55, 4.5, 312, '{"baru","unggulan","promo"}'),
    ('minyak-esensial-lavender-set', 'Minyak Esensial Lavender Set', 'AromaWell', 'Kecantikan', '/images/product/aromawell-minyak_esensial_lavender_set.png',
     'Set minyak esensial lavender murni untuk aromaterapi dan relaksasi. Membantu meredakan stres, meningkatkan kualitas tidur, dan menyegarkan ruangan.',
     145000, NULL, 90, 4.8, 456, '{"baru"}'),
    ('matras-yoga-premium', 'Matras Yoga Premium', 'FitLife', 'Olahraga', '/images/product/fitlife-matras_yoga_premium.png',
     'Matras yoga premium dengan permukaan anti-slip dan ketebalan optimal untuk kenyamanan maksimal. Cocok untuk yoga, pilates, dan meditasi.',
     280000, NULL, 65, 4.5, 198, '{}'),
    ('raket-badminton-carbon-pro', 'Raket Badminton Carbon Pro', 'SmashKing', 'Olahraga', '/images/product/smashking-raket_badminton_carbon_pro.png',
     'Raket badminton serat karbon ringan dan kuat untuk kontrol dan power maksimal. Pilihan tepat untuk pemain serius maupun yang ingin meningkatkan permainan.',
     675000, 850000, 30, 4.6, 143, '{"promo"}')
) AS v (
    slug, name, brand, category, img, summary,
    price_idr, original_price_idr, stock, rating, rating_count, tags
)
JOIN categories c ON c.name = v.category;

INSERT INTO shipping_methods (name, cost_idr)
VALUES
    ('JNE Reguler', 15000),
    ('JNE Express', 25000),
    ('Same Day Delivery', 35000);

COMMIT;
