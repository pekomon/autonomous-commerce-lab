import { formatMoney, type Product } from '@autonomous-commerce-lab/shared';

import { filterProducts } from './productFilter';

const mockProducts: Product[] = [
  {
    id: 'p-001',
    name: 'Espresso Beans',
    sku: 'COF-ESP-001',
    active: true,
    price: { amountInCents: 1599, currency: 'USD' },
  },
  {
    id: 'p-002',
    name: 'Ceramic Mug',
    sku: 'MUG-CER-002',
    active: true,
    price: { amountInCents: 1299, currency: 'USD' },
  },
  {
    id: 'p-003',
    name: 'Reusable Bottle',
    sku: 'BOT-REU-003',
    active: false,
    price: { amountInCents: 2199, currency: 'USD' },
  },
];

export default function App() {
  const featuredProducts = filterProducts('cof', mockProducts);

  return (
    <div className="app-shell">
      <header>
        <h1>Autonomous Commerce Lab - Admin Web</h1>
        <p>Bootstrap dashboard for iterative feature delivery.</p>
      </header>

      <main>
        <section>
          <h2>Catalog</h2>
          <p>Placeholder section for catalog listing and filters.</p>
          <ul>
            {featuredProducts.map((product) => (
              <li key={product.id}>
                {product.name} ({product.sku}) - {formatMoney(product.price)}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Orders</h2>
          <p>Placeholder section for order workflow and status updates.</p>
        </section>

        <section>
          <h2>Products (Admin)</h2>
          <p>Placeholder section for admin product CRUD.</p>
        </section>
      </main>
    </div>
  );
}
