-- BKKARI TECH V44 — editable storefront media
-- Run once in Supabase SQL Editor.
-- The storefront reads this public setting; the existing admin can manage site_settings.

insert into public.site_settings(key, value)
values (
  'storefront_media',
  jsonb_build_object(
    'hero', jsonb_build_array(
      '/catalog/hero-laptop.png',
      '/catalog/hero-gaming.png',
      '/catalog/hero-playstation.png',
      '/catalog/hero-laptop.png'
    ),
    'categories', jsonb_build_object(
      'business','/catalog/cat-business.png',
      'gaming','/catalog/cat-gaming.png',
      'desktop','/catalog/cat-desktop.png',
      'playstation','/catalog/cat-playstation.png',
      'digital','/catalog/cat-digital.png',
      'accessories','/catalog/cat-accessories.png',
      'web','/catalog/cat-web.png',
      'offers','/catalog/cat-offers.png'
    ),
    'promos', jsonb_build_object(
      'playstation','/catalog/hero-playstation.png',
      'digital','/catalog/cat-digital.png',
      'web','/catalog/cat-web.png',
      'desktop','/catalog/cat-desktop.png'
    ),
    'playstation','/catalog/hero-playstation.png',
    'pc_builder','/catalog/cat-desktop.png'
  )
)
on conflict (key) do nothing;

-- site_settings already has an admin-only management policy in the Bkkari Tech schema.
