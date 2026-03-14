import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';

const PRODUCT_IMAGES_BUCKET = 'product-images';

const SEEDED_PRODUCT_IMAGES = [
  {
    accent: '#d97706',
    background: '#f6e7c8',
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb001',
    productId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    slug: 'house-blend-beans',
    subtitle: 'Coffee Beans',
    title: 'House Blend Beans',
  },
  {
    accent: '#0f766e',
    background: '#d7f2ee',
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb002',
    productId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    slug: 'single-origin-colombia',
    subtitle: 'Single Origin',
    title: 'Single Origin Colombia',
  },
  {
    accent: '#7c2d12',
    background: '#f5ddd4',
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb003',
    productId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    slug: 'espresso-roast',
    subtitle: 'Espresso',
    title: 'Espresso Roast',
  },
  {
    accent: '#1d4ed8',
    background: '#dbe8ff',
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb004',
    productId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
    slug: 'stainless-pour-over-kettle',
    subtitle: 'Brewing Gear',
    title: 'Stainless Pour Over Kettle',
  },
  {
    accent: '#7c3aed',
    background: '#ece4ff',
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb005',
    productId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5',
    slug: 'ceramic-dripper-set',
    subtitle: 'Starter Kit',
    title: 'Ceramic Dripper Set',
  },
  {
    accent: '#be123c',
    background: '#ffdce6',
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb006',
    productId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6',
    slug: 'monthly-roaster-subscription',
    subtitle: 'Subscription',
    title: 'Monthly Roaster Subscription',
  },
  {
    accent: '#166534',
    background: '#daf0db',
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb007',
    productId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7',
    slug: 'decaf-evening-blend',
    subtitle: 'Decaf',
    title: 'Decaf Evening Blend',
  },
  {
    accent: '#9a3412',
    background: '#fde4d3',
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb008',
    productId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8',
    slug: 'experimental-nano-lot',
    subtitle: 'Draft Example',
    title: 'Experimental Nano Lot',
  },
];

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  return readFileSync(filePath, 'utf8')
    .split('\n')
    .reduce((variables, line) => {
      const trimmed = line.trim();

      if (trimmed.length === 0 || trimmed.startsWith('#')) {
        return variables;
      }

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        return variables;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      const value = rawValue.replace(/^['"]|['"]$/g, '');

      if (key.length === 0) {
        return variables;
      }

      return {
        ...variables,
        [key]: value,
      };
    }, {});
}

function loadLocalEnv() {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const appDir = resolve(scriptDir, '..');
  const repoRoot = resolve(appDir, '..', '..');

  return {
    ...parseEnvFile(resolve(repoRoot, '.env.local')),
    ...parseEnvFile(resolve(appDir, '.env.local')),
    ...process.env,
  };
}

function buildSeedSvg({ title, subtitle, background, accent }) {
  const escapedTitle = title.replace(/&/g, '&amp;');
  const escapedSubtitle = subtitle.replace(/&/g, '&amp;');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900" role="img" aria-label="${escapedTitle}">
  <rect width="1200" height="900" fill="${background}" rx="48" />
  <circle cx="930" cy="230" r="180" fill="${accent}" fill-opacity="0.15" />
  <circle cx="250" cy="720" r="220" fill="${accent}" fill-opacity="0.12" />
  <rect x="110" y="120" width="980" height="660" rx="36" fill="#ffffff" fill-opacity="0.7" />
  <text x="150" y="250" fill="${accent}" font-family="Helvetica, Arial, sans-serif" font-size="42" font-weight="700" letter-spacing="6">${escapedSubtitle.toUpperCase()}</text>
  <text x="150" y="390" fill="#111827" font-family="Helvetica, Arial, sans-serif" font-size="86" font-weight="700">${escapedTitle}</text>
  <text x="150" y="485" fill="#374151" font-family="Helvetica, Arial, sans-serif" font-size="34">Seeded demo product image</text>
  <rect x="150" y="560" width="240" height="18" rx="9" fill="${accent}" fill-opacity="0.3" />
  <rect x="150" y="605" width="420" height="18" rx="9" fill="${accent}" fill-opacity="0.2" />
  <rect x="150" y="650" width="360" height="18" rx="9" fill="${accent}" fill-opacity="0.2" />
</svg>`;
}

async function listBuckets(client) {
  const { data, error } = await client.storage.listBuckets();

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function ensureBucket(client) {
  const existingBucket = (await listBuckets(client)).find(
    (bucket) => bucket.id === PRODUCT_IMAGES_BUCKET || bucket.name === PRODUCT_IMAGES_BUCKET,
  );

  if (!existingBucket) {
    const { error } = await client.storage.createBucket(PRODUCT_IMAGES_BUCKET, {
      public: true,
    });

    if (
      error &&
      !error.message.toLowerCase().includes('already exists') &&
      !error.message.toLowerCase().includes('duplicate')
    ) {
      throw error;
    }
  }

  const resolvedBucket = (await listBuckets(client)).find(
    (bucket) => bucket.id === PRODUCT_IMAGES_BUCKET || bucket.name === PRODUCT_IMAGES_BUCKET,
  );

  if (!resolvedBucket) {
    throw new Error(`Unable to resolve storage bucket ${PRODUCT_IMAGES_BUCKET}.`);
  }

  if (!resolvedBucket.public) {
    const { error } = await client.storage.updateBucket(PRODUCT_IMAGES_BUCKET, {
      public: true,
    });

    if (error) {
      throw error;
    }
  }
}

async function ensureSeedProductsExist(client) {
  const productIds = SEEDED_PRODUCT_IMAGES.map((image) => image.productId);
  const { data, error } = await client.from('products').select('id').in('id', productIds);

  if (error) {
    throw error;
  }

  const existingIds = new Set((data ?? []).map((row) => row.id));
  const missingIds = productIds.filter((productId) => !existingIds.has(productId));

  if (missingIds.length > 0) {
    throw new Error(
      `Missing seeded products. Apply supabase/seed.sql before seeding images. Missing product IDs: ${missingIds.join(', ')}`,
    );
  }
}

async function main() {
  const env = loadLocalEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL ?? env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase seed-image configuration. Set VITE_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in local env.',
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  await ensureBucket(supabase);
  await ensureSeedProductsExist(supabase);

  for (const image of SEEDED_PRODUCT_IMAGES) {
    const path = `${image.productId}/seed-${image.slug}.svg`;
    const contents = Buffer.from(buildSeedSvg(image), 'utf8');

    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(path, contents, {
        contentType: 'image/svg+xml',
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { error: metadataError } = await supabase.from('product_images').upsert(
      {
        id: image.id,
        product_id: image.productId,
        path,
        sort_order: 0,
      },
      { onConflict: 'id' },
    );

    if (metadataError) {
      const { error: rollbackError } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .remove([path]);

      if (rollbackError) {
        throw new Error(
          `Failed to insert image metadata for ${image.title}, and failed to remove the uploaded object at ${path}: ${rollbackError.message}`,
        );
      }

      throw metadataError;
    }

    console.log(`Seeded image for ${image.title}`);
  }
}

main().catch((error) => {
  console.error('Failed to seed product images.', error);
  process.exitCode = 1;
});
