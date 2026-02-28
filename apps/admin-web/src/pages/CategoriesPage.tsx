import {
  normalizeCategorySlug,
  validateCategorySlug,
  type Category,
} from '@autonomous-commerce-lab/shared';
import { FormEvent, useEffect, useState } from 'react';

import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from '../categories/categoriesApi';
import {
  toCategoryReadErrorMessage,
  toCategoryWriteErrorMessage,
} from '../categories/categoryErrors';
import { AdminHeader } from '../components/AdminHeader';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';

interface CategoryFormValues {
  slug: string;
  name: string;
}

const EMPTY_FORM: CategoryFormValues = {
  slug: '',
  name: '',
};

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [createValues, setCreateValues] = useState<CategoryFormValues>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<CategoryFormValues>(EMPTY_FORM);
  const [savingEdit, setSavingEdit] = useState(false);
  const [activeDeleteId, setActiveDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      setLoading(true);
      setLoadError(null);

      try {
        const data = await fetchCategories();

        if (!isMounted) {
          return;
        }

        setCategories(data);
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        setLoadError(
          fetchError instanceof Error
            ? toCategoryReadErrorMessage(fetchError)
            : 'Unable to load categories.',
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  function validateForm(values: CategoryFormValues): string | null {
    const normalizedSlug = normalizeCategorySlug(values.slug);

    if (!validateCategorySlug(normalizedSlug)) {
      return 'Slug must use lowercase letters, numbers, and hyphens only.';
    }

    if (values.name.trim().length === 0) {
      return 'Category name is required.';
    }

    return null;
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const validationError = validateForm(createValues);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setCreating(true);

    try {
      const createdCategory = await createCategory(createValues);
      setCategories((current) => [createdCategory, ...current]);
      setCreateValues(EMPTY_FORM);
    } catch (createError) {
      setFormError(
        createError instanceof Error
          ? toCategoryWriteErrorMessage(createError)
          : 'Unable to create category.',
      );
    } finally {
      setCreating(false);
    }
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditValues({
      slug: category.slug,
      name: category.name,
    });
    setFormError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues(EMPTY_FORM);
  }

  async function handleSaveEdit(categoryId: string) {
    setFormError(null);

    const validationError = validateForm(editValues);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSavingEdit(true);

    try {
      const updatedCategory = await updateCategory(categoryId, editValues);

      setCategories((current) =>
        current.map((category) =>
          category.id === updatedCategory.id ? updatedCategory : category,
        ),
      );
      cancelEdit();
    } catch (updateError) {
      setFormError(
        updateError instanceof Error
          ? toCategoryWriteErrorMessage(updateError)
          : 'Unable to save category changes.',
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(categoryId: string) {
    setActiveDeleteId(categoryId);
    setFormError(null);

    try {
      await deleteCategory(categoryId);
      setCategories((current) => current.filter((category) => category.id !== categoryId));

      if (editingId === categoryId) {
        cancelEdit();
      }
    } catch (deleteError) {
      setFormError(
        deleteError instanceof Error
          ? toCategoryWriteErrorMessage(deleteError)
          : 'Unable to delete category.',
      );
    } finally {
      setActiveDeleteId(null);
    }
  }

  return (
    <div className="app-shell">
      <AdminHeader subtitle="Create and manage product categories." title="Categories" />

      <section>
        <h2>Create Category</h2>

        <form className="form-grid" onSubmit={handleCreate}>
          <label>
            Slug
            <input
              onChange={(event) =>
                setCreateValues((current) => ({ ...current, slug: event.target.value }))
              }
              placeholder="coffee-beans"
              required
              type="text"
              value={createValues.slug}
            />
          </label>

          <label>
            Name
            <input
              onChange={(event) =>
                setCreateValues((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Coffee Beans"
              required
              type="text"
              value={createValues.name}
            />
          </label>

          {formError ? <ErrorState message={formError} title="Category update failed" /> : null}

          <div className="inline-actions">
            <button className="primary-button" disabled={creating} type="submit">
              {creating ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2>Category List</h2>

        {loading ? <LoadingState label="Loading categories..." /> : null}

        {!loading && loadError ? (
          <ErrorState
            message={loadError}
            onRetry={() => setReloadKey((current) => current + 1)}
            retryLabel="Retry"
            title="Unable to load categories"
          />
        ) : null}

        {!loading && !loadError && categories.length === 0 ? (
          <EmptyState
            description="Create your first category to organize products."
            title="No categories yet."
          />
        ) : null}

        {!loading && !loadError && categories.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => {
                const isEditing = editingId === category.id;
                const isDeleting = activeDeleteId === category.id;

                return (
                  <tr key={category.id}>
                    <td>
                      {isEditing ? (
                        <input
                          onChange={(event) =>
                            setEditValues((current) => ({ ...current, name: event.target.value }))
                          }
                          type="text"
                          value={editValues.name}
                        />
                      ) : (
                        category.name
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          onChange={(event) =>
                            setEditValues((current) => ({ ...current, slug: event.target.value }))
                          }
                          type="text"
                          value={editValues.slug}
                        />
                      ) : (
                        category.slug
                      )}
                    </td>
                    <td>{new Date(category.createdAt).toLocaleDateString('en-US')}</td>
                    <td>
                      <div className="inline-actions">
                        {isEditing ? (
                          <>
                            <button
                              className="primary-button"
                              disabled={savingEdit || isDeleting}
                              onClick={() => void handleSaveEdit(category.id)}
                              type="button"
                            >
                              {savingEdit ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              className="secondary-button"
                              disabled={savingEdit || isDeleting}
                              onClick={cancelEdit}
                              type="button"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            className="secondary-button"
                            disabled={isDeleting}
                            onClick={() => startEdit(category)}
                            type="button"
                          >
                            Edit
                          </button>
                        )}

                        <button
                          className="danger-button"
                          disabled={savingEdit || isDeleting}
                          onClick={() => void handleDelete(category.id)}
                          type="button"
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
      </section>
    </div>
  );
}
