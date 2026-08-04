-- Platter — M1 seed (context/foundation.md §12 #5: reconstruct from the PRD now; full scrape at M5).
-- One tenant (De Geogold Hotel) → one restaurant (Jīn Cāntīng) → 3 categories → 10 published items.
-- Uses a DO block with local vars so FKs wire by returned id (no hardcoded UUIDs).

do $$
declare
  v_tenant uuid;
  v_rest   uuid;
  g_chinese uuid;
  c_app uuid; c_soup uuid; c_noodle uuid;
  it uuid;
begin
  insert into public.tenants (name, slug)
    values ('De Geogold Hotel', 'de-geogold') returning id into v_tenant;

  insert into public.restaurants
    (tenant_id, name, name_zh, slug, currency, locale, timezone, phone, whatsapp, address)
    values (v_tenant, 'Jīn Cāntīng', '金餐厅', 'jin-canting', 'NGN', 'en-NG', 'Africa/Lagos',
            '+2340000000000', '+2340000000000', 'De Geogold Hotel')
    returning id into v_rest;

  insert into public.opening_hours (tenant_id, restaurant_id, weekday, opens, closes)
    select v_tenant, v_rest, gs, time '11:00', time '22:00' from generate_series(0, 6) gs;

  -- groups (§5.1) — only Chinese Kitchen carries seeded categories in M1
  insert into public.menu_groups (tenant_id, restaurant_id, name, slug, sort_order)
    values (v_tenant, v_rest, 'Chinese Kitchen', 'chinese-kitchen', 1000) returning id into g_chinese;
  insert into public.menu_groups (tenant_id, restaurant_id, name, slug, sort_order) values
    (v_tenant, v_rest, 'Local Kitchen', 'local-kitchen', 2000),
    (v_tenant, v_rest, 'Grill & Fast', 'grill-and-fast', 3000),
    (v_tenant, v_rest, 'Drinks', 'drinks', 4000);

  insert into public.categories (tenant_id, restaurant_id, group_id, name, slug, sort_order)
    values (v_tenant, v_rest, g_chinese, 'Appetizers', 'appetizers', 1000) returning id into c_app;
  insert into public.categories (tenant_id, restaurant_id, group_id, name, slug, sort_order)
    values (v_tenant, v_rest, g_chinese, 'Soup', 'soup', 2000) returning id into c_soup;
  insert into public.categories (tenant_id, restaurant_id, group_id, name, slug, sort_order)
    values (v_tenant, v_rest, g_chinese, 'Noodles', 'noodles', 3000) returning id into c_noodle;

  -- ── Appetizers ──
  insert into public.items (tenant_id, restaurant_id, category_id, name, slug, description,
                            base_price, status, published_at, sort_order, dietary_tags, allergens, spice_level, is_featured)
    values (v_tenant, v_rest, c_app, 'Chicken Samosa', 'chicken-samosa',
      'Golden parcels filled with spiced minced chicken and crisp vegetables, fried until shatteringly crisp.',
      6000, 'published', now(), 1000, '{}', '{gluten}', 0, false);

  insert into public.items (tenant_id, restaurant_id, category_id, name, slug, description,
                            base_price, status, published_at, sort_order, dietary_tags, allergens, spice_level, is_featured)
    values (v_tenant, v_rest, c_app, 'Hot Chicken Wings', 'hot-chicken-wings',
      'Turn up the heat — wings tossed in a fiery house glaze with a slow, building warmth.',
      6000, 'published', now(), 2000, '{}', '{}', 2, false)
    returning id into it;
  insert into public.item_variants (tenant_id, item_id, label, price, sort_order) values
    (v_tenant, it, '6 pieces', 6000, 1000),
    (v_tenant, it, '12 pieces', 11000, 2000);

  insert into public.items (tenant_id, restaurant_id, category_id, name, slug, description,
                            base_price, status, published_at, sort_order, dietary_tags, allergens, spice_level, is_featured)
    values (v_tenant, v_rest, c_app, 'Vegetable Spring Rolls', 'vegetable-spring-rolls',
      'Delicate hand-rolled pastry packed with julienned garden vegetables and glass noodles.',
      5500, 'published', now(), 3000, '{vegetarian}', '{gluten,soy}', 0, false);

  insert into public.items (tenant_id, restaurant_id, category_id, name, slug, description,
                            base_price, status, published_at, sort_order, dietary_tags, allergens, spice_level, is_featured)
    values (v_tenant, v_rest, c_app, 'Fried Jumbo Shrimp', 'fried-jumbo-shrimp',
      'Plump jumbo shrimp in a light, crackling batter — a house favourite selected for size and sweetness.',
      8000, 'published', now(), 4000, '{seafood}', '{shellfish,gluten}', 0, true)
    returning id into it;
  insert into public.item_variants (tenant_id, item_id, label, price, sort_order) values
    (v_tenant, it, '6 pieces', 8000, 1000),
    (v_tenant, it, '12 pieces', 15000, 2000);

  -- ── Soup ──
  insert into public.items (tenant_id, restaurant_id, category_id, name, slug, description,
                            base_price, status, published_at, sort_order, dietary_tags, allergens, spice_level, is_featured)
    values (v_tenant, v_rest, c_soup, 'Hot & Sour Soup', 'hot-and-sour-soup',
      'The classic balance of chilli heat and vinegar tang, thick with tofu, bamboo and egg ribbons.',
      4500, 'published', now(), 1000, '{}', '{soy,egg}', 1, false);

  insert into public.items (tenant_id, restaurant_id, category_id, name, slug, description,
                            base_price, status, published_at, sort_order, dietary_tags, allergens, spice_level, is_featured)
    values (v_tenant, v_rest, c_soup, 'Sweet Corn Chicken Soup', 'sweet-corn-chicken-soup',
      'Silky and comforting — sweet corn and shredded chicken in a delicate egg-flower broth.',
      4500, 'published', now(), 2000, '{}', '{egg}', 0, false);

  insert into public.items (tenant_id, restaurant_id, category_id, name, slug, description,
                            base_price, status, published_at, sort_order, dietary_tags, allergens, spice_level, is_featured)
    values (v_tenant, v_rest, c_soup, 'Wonton Soup', 'wonton-soup',
      'Hand-folded pork-and-prawn wontons drifting in a clear, long-simmered chicken broth.',
      5000, 'published', now(), 3000, '{contains_pork,seafood}', '{shellfish,gluten,egg}', 0, false);

  -- ── Noodles ──
  insert into public.items (tenant_id, restaurant_id, category_id, name, slug, description,
                            base_price, status, published_at, sort_order, dietary_tags, allergens, spice_level, is_featured)
    values (v_tenant, v_rest, c_noodle, 'Chicken Chow Mein', 'chicken-chow-mein',
      'Wok-tossed egg noodles with tender chicken, crisp beansprouts and spring onion.',
      7500, 'published', now(), 1000, '{}', '{gluten,soy,egg}', 0, false);

  insert into public.items (tenant_id, restaurant_id, category_id, name, slug, description,
                            base_price, status, published_at, sort_order, dietary_tags, allergens, spice_level, is_featured)
    values (v_tenant, v_rest, c_noodle, 'Singapore Fried Noodles', 'singapore-fried-noodles',
      'Fine rice vermicelli fired with curry spice, prawns, char siu and peppers.',
      8500, 'published', now(), 2000, '{contains_pork,seafood}', '{shellfish,soy,egg}', 2, true)
    returning id into it;

  insert into public.items (tenant_id, restaurant_id, category_id, name, slug, description,
                            base_price, status, published_at, sort_order, dietary_tags, allergens, spice_level, is_featured)
    values (v_tenant, v_rest, c_noodle, 'Vegetable Lo Mein', 'vegetable-lo-mein',
      'Soft lo mein noodles tossed with seasonal greens, mushrooms and a light soy-sesame dressing.',
      6500, 'published', now(), 3000, '{vegetarian}', '{gluten,soy,sesame}', 0, false);
end $$;

-- M2: dish photos for the items that have one (the rest use the seal-mark fallback,
-- the realistic ~20%-have-photos mix from Assumption 3). Real photos arrive via the
-- manager's upload pipeline (M3); these local /images seeds are placeholders.
update public.items set image_url = '/images/' || slug || '.jpg'
where slug in (
  'chicken-samosa', 'hot-chicken-wings', 'fried-jumbo-shrimp',
  'hot-and-sour-soup', 'singapore-fried-noodles'
);
