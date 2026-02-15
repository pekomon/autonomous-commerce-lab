import type { Category } from '@autonomous-commerce-lab/shared';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { fetchCategories } from '../categories/categoriesApi';
import {
  toCategoryWriteErrorMessage,
  toProductCategoryErrorMessage,
} from '../categories/categoryErrors';
import {
  fetchAssignedCategoryIds,
  syncProductCategoryAssignments,
} from '../categories/productCategoriesApi';

interface ProductCategoryAssignmentProps {
  productId: string;
}

export function ProductCategoryAssignment({ productId }: ProductCategoryAssignmentProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCategoryData() {
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const [availableCategories, assignedIds] = await Promise.all([
          fetchCategories(),
          fetchAssignedCategoryIds(productId),
        ]);

        if (!isMounted) {
          return;
        }

        setCategories(availableCategories);
        setSelectedCategoryIds(assignedIds);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? toCategoryWriteErrorMessage(loadError)
            : 'Unable to load categories.',
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadCategoryData();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  const selectedSet = useMemo(() => new Set(selectedCategoryIds), [selectedCategoryIds]);

  function toggleCategory(categoryId: string) {
    setSuccess(null);
    setSelectedCategoryIds((current) => {
      if (current.includes(categoryId)) {
        return current.filter((id) => id !== categoryId);
      }

      return [...current, categoryId];
    });
  }

  async function handleSaveAssignments() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await syncProductCategoryAssignments(productId, selectedCategoryIds);
      setSuccess('Product categories updated.');
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? toProductCategoryErrorMessage(saveError)
          : 'Unable to save product category assignments.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h2>Product Categories</h2>

      {loading ? <p>Loading categories...</p> : null}
      {error ? <p className="error-message">{error}</p> : null}
      {success ? <p className="success-message">{success}</p> : null}

      {!loading && categories.length === 0 ? (
        <p>
          No categories found. <Link to="/categories">Create categories first</Link>.
        </p>
      ) : null}

      {!loading && categories.length > 0 ? (
        <>
          <div className="checkbox-list">
            {categories.map((category) => (
              <label className="checkbox-item" key={category.id}>
                <input
                  checked={selectedSet.has(category.id)}
                  disabled={saving}
                  onChange={() => toggleCategory(category.id)}
                  type="checkbox"
                />
                <span>
                  {category.name} <small>({category.slug})</small>
                </span>
              </label>
            ))}
          </div>

          <div className="inline-actions">
            <button
              className="primary-button"
              disabled={saving}
              onClick={() => void handleSaveAssignments()}
              type="button"
            >
              {saving ? 'Saving categories...' : 'Save Categories'}
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
