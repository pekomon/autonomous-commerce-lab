import type { CurrencyCode, ProductStatus } from '@autonomous-commerce-lab/shared';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { AdminHeader } from '../components/AdminHeader';
import { ProductCategoryAssignment } from '../components/ProductCategoryAssignment';
import { ProductImagesManager } from '../components/ProductImagesManager';
import { supabase } from '../lib/supabaseClient';
import { toProductWriteErrorMessage } from '../products/productErrors';
import {
  isNonEmptyTitle,
  mapWriteInputToPayload,
  type ProductDbRow,
  type ProductWriteInput,
} from '../products/productMappers';

const PRODUCT_SELECT =
  'id,title,description,price_amount,currency,status,tags,created_at,updated_at';

interface ProductFormValues {
  title: string;
  description: string;
  priceAmount: string;
  currency: CurrencyCode;
  status: ProductStatus;
  tagsInput: string;
}

const EMPTY_FORM: ProductFormValues = {
  title: '',
  description: '',
  priceAmount: '0',
  currency: 'EUR',
  status: 'draft',
  tagsInput: '',
};

export function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [values, setValues] = useState<ProductFormValues>(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProductForEdit(productId: string) {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('id', productId)
        .single();

      if (!isMounted) {
        return;
      }

      if (fetchError) {
        setError('Unable to load product for editing.');
      } else {
        const row = data as ProductDbRow;
        setValues({
          title: row.title,
          description: row.description ?? '',
          priceAmount: String(row.price_amount),
          currency: row.currency === 'USD' ? 'USD' : 'EUR',
          status:
            row.status === 'active' || row.status === 'archived' || row.status === 'draft'
              ? row.status
              : 'draft',
          tagsInput: (row.tags ?? []).join(', '),
        });
      }

      setLoading(false);
    }

    if (id) {
      void loadProductForEdit(id);
    } else {
      setLoading(false);
      setValues(EMPTY_FORM);
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const title = useMemo(() => (isEdit ? 'Edit Product' : 'Create Product'), [isEdit]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    if (!isNonEmptyTitle(values.title)) {
      setError('Title is required and cannot be empty.');
      setSaving(false);
      return;
    }

    const parsedPriceAmount = Number(values.priceAmount);

    if (!Number.isInteger(parsedPriceAmount) || parsedPriceAmount < 0) {
      setError('Price amount must be a non-negative integer.');
      setSaving(false);
      return;
    }

    const writeInput: ProductWriteInput = {
      title: values.title,
      description: values.description,
      priceAmount: parsedPriceAmount,
      currency: values.currency,
      status: values.status,
      tagsInput: values.tagsInput,
    };

    const payload = mapWriteInputToPayload(writeInput);

    if (isEdit && id) {
      const { error: updateError } = await supabase.from('products').update(payload).eq('id', id);

      if (updateError) {
        setError(toProductWriteErrorMessage(updateError));
      } else {
        navigate(`/products/${id}`);
      }
    } else {
      const { data, error: insertError } = await supabase
        .from('products')
        .insert(payload)
        .select('id')
        .single();

      if (insertError) {
        setError(toProductWriteErrorMessage(insertError));
      } else {
        navigate(`/products/${data.id}`);
      }
    }

    setSaving(false);
  }

  async function handleArchive() {
    if (!id) {
      return;
    }

    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('products')
      .update({ status: 'archived' })
      .eq('id', id);

    if (updateError) {
      setError(toProductWriteErrorMessage(updateError));
      setSaving(false);
      return;
    }

    navigate(`/products/${id}`);
  }

  if (loading) {
    return (
      <div className="app-shell">
        <p>Loading form...</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <AdminHeader subtitle="Manage product data in Supabase." title={title} />

      <section>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Title
            <input
              onChange={(event) =>
                setValues((current) => ({ ...current, title: event.target.value }))
              }
              required
              type="text"
              value={values.title}
            />
          </label>

          <label>
            Description
            <textarea
              onChange={(event) =>
                setValues((current) => ({ ...current, description: event.target.value }))
              }
              rows={4}
              value={values.description}
            />
          </label>

          <label>
            Price Amount (minor units)
            <input
              min={0}
              onChange={(event) =>
                setValues((current) => ({ ...current, priceAmount: event.target.value }))
              }
              required
              type="number"
              value={values.priceAmount}
            />
          </label>

          <label>
            Currency
            <select
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  currency: event.target.value === 'USD' ? 'USD' : 'EUR',
                }))
              }
              value={values.currency}
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </label>

          <label>
            Status
            <select
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  status:
                    event.target.value === 'active' ||
                    event.target.value === 'archived' ||
                    event.target.value === 'draft'
                      ? event.target.value
                      : 'draft',
                }))
              }
              value={values.status}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          <label>
            Tags (comma-separated)
            <input
              onChange={(event) =>
                setValues((current) => ({ ...current, tagsInput: event.target.value }))
              }
              type="text"
              value={values.tagsInput}
            />
          </label>

          {error ? <p className="error-message">{error}</p> : null}

          <div className="inline-actions">
            <button className="primary-button" disabled={saving} type="submit">
              {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create product'}
            </button>
            {isEdit ? (
              <button
                className="danger-button"
                disabled={saving}
                onClick={() => void handleArchive()}
                type="button"
              >
                Archive
              </button>
            ) : null}
            <Link className="secondary-button" to={isEdit && id ? `/products/${id}` : '/products'}>
              Cancel
            </Link>
          </div>
        </form>
      </section>

      {isEdit && id ? <ProductCategoryAssignment productId={id} /> : null}

      {isEdit && id ? (
        <ProductImagesManager allowManage={true} productId={id} />
      ) : (
        <section>
          <h2>Product Images</h2>
          <p>Create the product first to upload images.</p>
        </section>
      )}
    </div>
  );
}
