import { useEffect, useMemo, useState } from 'react';

import { supabase } from '../lib/supabaseClient';
import {
  buildProductImagePath,
  getProductImagePublicUrl,
  mapProductImageRowToViewModel,
  PRODUCT_IMAGES_BUCKET,
  toProductImageErrorMessage,
  type ProductImageDbRow,
  type ProductImageViewModel,
} from '../products/productImages';

interface ProductImagesManagerProps {
  productId: string;
  allowManage: boolean;
}

const PRODUCT_IMAGE_SELECT = 'id,product_id,path,sort_order,created_at';

export function ProductImagesManager({ productId, allowManage }: ProductImagesManagerProps) {
  const [images, setImages] = useState<ProductImageViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDeleteId, setActiveDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadImages() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('product_images')
        .select(PRODUCT_IMAGE_SELECT)
        .eq('product_id', productId)
        .order('sort_order', { ascending: true });

      if (!isMounted) {
        return;
      }

      if (fetchError) {
        setError('Failed to load product images.');
        setImages([]);
      } else {
        const mapped = (data ?? []).map((row) =>
          mapProductImageRowToViewModel(
            row as ProductImageDbRow,
            getProductImagePublicUrl(supabase, (row as ProductImageDbRow).path),
          ),
        );

        setImages(mapped);
      }

      setLoading(false);
    }

    void loadImages();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  const nextSortOrder = useMemo(() => {
    if (images.length === 0) {
      return 0;
    }

    return Math.max(...images.map((image) => image.sortOrder)) + 1;
  }, [images]);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    setUploading(true);
    setError(null);

    let currentSortOrder = nextSortOrder;

    for (const file of Array.from(files)) {
      const token = crypto.randomUUID();
      const path = buildProductImagePath(productId, file.name, token);

      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(path, file, {
          upsert: false,
          contentType: file.type || undefined,
        });

      if (uploadError) {
        setError(toProductImageErrorMessage(uploadError));
        setUploading(false);
        return;
      }

      const { data: inserted, error: insertError } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          path,
          sort_order: currentSortOrder,
        })
        .select(PRODUCT_IMAGE_SELECT)
        .single();

      if (insertError) {
        await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
        setError(toProductImageErrorMessage(insertError));
        setUploading(false);
        return;
      }

      const row = inserted as ProductImageDbRow;
      setImages((current) => [
        ...current,
        mapProductImageRowToViewModel(row, getProductImagePublicUrl(supabase, row.path)),
      ]);

      currentSortOrder += 1;
    }

    setUploading(false);
  }

  async function handleDelete(image: ProductImageViewModel) {
    setActiveDeleteId(image.id);
    setError(null);

    const { data: deletedRow, error: rowDeleteError } = await supabase
      .from('product_images')
      .delete()
      .eq('id', image.id)
      .select(PRODUCT_IMAGE_SELECT)
      .maybeSingle();

    if (rowDeleteError) {
      setError(toProductImageErrorMessage(rowDeleteError));
      setActiveDeleteId(null);
      return;
    }

    if (!deletedRow) {
      setImages((current) => current.filter((item) => item.id !== image.id));
      setActiveDeleteId(null);
      return;
    }

    const row = deletedRow as ProductImageDbRow;
    const { error: storageDeleteError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove([row.path]);

    if (storageDeleteError) {
      const { error: rollbackError } = await supabase.from('product_images').insert({
        id: row.id,
        product_id: row.product_id,
        path: row.path,
        sort_order: row.sort_order,
        created_at: row.created_at,
      });

      if (rollbackError) {
        setError(
          `${toProductImageErrorMessage(storageDeleteError)} Metadata rollback failed. Refresh and retry.`,
        );
      } else {
        setError(`${toProductImageErrorMessage(storageDeleteError)} Metadata was restored.`);
      }

      setActiveDeleteId(null);
      return;
    }

    setImages((current) => current.filter((item) => item.id !== image.id));
    setActiveDeleteId(null);
  }

  return (
    <section>
      <h2>Product Images</h2>

      {allowManage ? (
        <label>
          Upload images
          <input
            accept="image/*"
            disabled={uploading}
            multiple
            onChange={(event) => {
              void handleUpload(event.target.files);
              event.currentTarget.value = '';
            }}
            type="file"
          />
        </label>
      ) : null}

      {loading ? <p>Loading images...</p> : null}
      {uploading ? <p>Uploading image(s)...</p> : null}
      {error ? <p className="error-message">{error}</p> : null}

      {!loading && images.length === 0 ? <p>No images uploaded yet.</p> : null}

      <div className="image-grid">
        {images.map((image) => (
          <article className="image-card" key={image.id}>
            <img alt="Product" src={image.publicUrl} />
            <p>Sort order: {image.sortOrder}</p>

            {allowManage ? (
              <button
                className="danger-button"
                disabled={activeDeleteId === image.id}
                onClick={() => void handleDelete(image)}
                type="button"
              >
                {activeDeleteId === image.id ? 'Deleting...' : 'Delete'}
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
