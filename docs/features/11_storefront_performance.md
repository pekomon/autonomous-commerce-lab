# Feature 11: Storefront performance improvements

## What changed

- Added a reusable `useDebouncedValue` hook and applied it to the `/products` search input to reduce request churn while typing.
- Added paginated product loading with a `DEFAULT_PRODUCTS_PAGE_SIZE` of `20` and a `Load more` flow.
- Added simple in-memory caches in `storefrontApi`:
  - Categories cache
  - Product result cache by stable key (`query + category + sort + page + pageSize`)
- Replaced loading text with product and category skeleton placeholders.

## Pagination behavior

- Product fetch now accepts `page` and `pageSize`.
- `/products` starts from page 1 and requests additional pages only when the user clicks `Load more`.
- Search query, category, and sort changes preserve filter state and reset results back to page 1.
- The UI shows a terminal message when no more results are available.

## Caching approach and limitations

- Caching uses in-memory `Map` instances inside the storefront data module.
- Product page results are cached per stable key generated from normalized query and filter parameters.
- Categories are cached after first successful load.
- Limitations:
  - No TTL or invalidation strategy.
  - Cache is scoped to a single browser tab/runtime and is cleared on refresh.
  - Data can become stale until reload.

## Manual test checklist

- Open `/products` and type quickly in the search input; confirm results update after a short delay and typing remains responsive.
- Change category and sort filters; confirm page resets and results match active filters.
- Click `Load more`; confirm new items append and existing items remain visible.
- Continue loading until the end; confirm end-of-results message is shown and `Load more` is hidden.
- Refresh page and verify categories/products still load correctly when cache is cold.
- Trigger a failed product request (for example via temporary API failure in test setup) and confirm retry still works.
