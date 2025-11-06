'use client';
import { useState } from 'react';
import { useCart } from '../../store/cart';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import styles from './ProductList.module.css';
import { type Product } from "types-package/product";

// type Product = {
//   id: number;
//   name: string;
//   price: number;
//   image?: { url: string };
//   description?: string;
//   imageUrl?: string;
//   inStock?: boolean;
//   category?: { name: string };
// };

// Spara order i Strapi
async function saveOrderToStrapi(items: any[], total: number) {
  try {
    const res = await fetch('http://localhost:1338/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          items: items.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          total,
        }
      }),
    });
    if (!res.ok) throw new Error('Order could not be saved');
    return await res.json();
  } catch (err) {
    console.error('Order save error:', err);
  }
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch('http://localhost:1338/api/products?populate=*');
  const data = await res.json();
  return Array.isArray(data.data) ? data.data : [];
}

export default function ProductsPage() {
  const { items, addToCart, removeFromCart, clearCart } = useCart();
  const [showCart, setShowCart] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const { data, isLoading, error } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const products: Product[] =
    data?.map((p: any) => ({
      id: p.id,
      name: p.name ?? 'Unknown',
      price: p.price ?? 0,
      description: p.description ?? '',
      imageUrl: p.image?.url ? `http://localhost:1338${p.image.url}` : undefined,
      inStock: p.inStock ?? false,
      category: Array.isArray(p.category)
        ? (p.category[0] ? { name: p.category[0].name } : undefined)
        : (p.category ? { name: p.category.name } : undefined),
    })) ?? [];

  const categories = Array.from(
    new Set(products.map((p) => p.category?.name).filter((cat): cat is string => !!cat))
  );

  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((p) => p.category?.name === selectedCategory);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const increaseQuantity = (id: number) => {
    const item = items.find((i) => i.id === id);
    if (item) addToCart({ id: item.id, name: item.name, price: item.price, imageUrl: item.imageUrl });
  };

  const decreaseQuantity = (id: number) => {
    const item = items.find((i) => i.id === id);
    if (item && item.quantity > 1) {
      const newItems = items.map((i) =>
        i.id === id ? { ...i, quantity: i.quantity - 1 } : i
      );
      useCart.setState({ items: newItems });
    } else if (item && item.quantity === 1) {
      removeFromCart(id);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error occurred while fetching products.</div>;

  return (
    <div>
      <div className={styles.backBtnWrapper}>
        <Link href="/">
          <button className={styles.backBtn} aria-label="Go to homepage">
            ←
          </button>
        </Link>
      </div>

      <h2 className={styles.heading}>Products</h2>

      <div className={styles.categoryBar}>
        <button
          onClick={() => setSelectedCategory('All')}
          disabled={selectedCategory === 'All'}
          className={styles.categoryBtn}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            disabled={selectedCategory === cat}
            className={styles.categoryBtn}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className={styles.productsWrapper}>
        {filteredProducts.length === 1 ? (
          <div className={styles.singleProduct}>
            {filteredProducts[0] && (
              <div className={styles.card}>
                <img src={filteredProducts[0].imageUrl} alt={filteredProducts[0].name} className={styles.image} />
                <div className={styles.cardtext}>
                  <div className={styles.title}>{filteredProducts[0].name}</div>
                  <div className={styles.price}>{filteredProducts[0].price} SEK</div>
                  <span className={filteredProducts[0].inStock ? styles.inStock : styles.outOfStock}>
                    {filteredProducts[0].inStock ? 'In stock' : 'Out of stock'}
                  </span>
                  {filteredProducts[0].category && (
                    <div>Category: {filteredProducts[0].category.name}</div>
                  )}
                  <button
                    className={styles.addToCartBtn}
                    onClick={() => addToCart(filteredProducts[0]!)}
                    disabled={!filteredProducts[0].inStock}
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredProducts.map((product) => (
              <div key={product.id} className={styles.card}>
                <img src={product.imageUrl} alt={product.name} className={styles.image} />
                <div className={styles.cardtext}>
                  <div className={styles.title}>{product.name}</div>
                  <div className={styles.price}>{product.price} SEK</div>
                  <span className={product.inStock ? styles.inStock : styles.outOfStock}>
                    {product.inStock ? 'In stock' : 'Out of stock'}
                  </span>
                  {product.category && (
                    <div>Category: {product.category.name}</div>
                  )}
                  <button
                    className={styles.addToCartBtn}
                    onClick={() => addToCart(product)}
                    disabled={!product.inStock}
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.cartIconWrapper}>
        <button
          className={styles.cartIconBtn}
          onClick={() => setShowCart(true)}
          aria-label="Show cart"
        >
          <span className={styles.cartIcon}>🛒</span>
          {totalQuantity > 0 && (
            <span className={styles.cartBadge}>
              {totalQuantity}
            </span>
          )}
        </button>
      </div>

      {showCart && (
        <div className={styles.cartPopup}>
          <button
            className={styles.closeBtn}
            onClick={() => setShowCart(false)}
            aria-label="Close"
          >✖</button>
          <h3 className={styles.cartTitle}>Your cart</h3>
          {items.length === 0 ? (
            <div>Your cart is empty</div>
          ) : (
            <div>
              {items.map((item) => (
                <div key={item.id} className={styles.cartItem}>
                  <span>
                    {item.name} x {item.quantity}
                    <button className={styles.quantityBtn} onClick={() => decreaseQuantity(item.id)}>-</button>
                    <button className={`${styles.quantityBtn} ${styles.plus}`} onClick={() => increaseQuantity(item.id)}>+</button>
                  </span>
                  <span>{item.price * item.quantity} SEK</span>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeFromCart(item.id)}
                  >Remove</button>
                </div>
              ))}
              <hr />
              <div className={styles.total}>Total: {total} SEK</div>
              <PayPalScriptProvider options={{ clientId: "sb", currency: "SEK" }}>
                <PayPalButtons
                  style={{ layout: "vertical" }}
                  createOrder={(data, actions) => {
                    return actions.order.create({
                      intent: "CAPTURE",
                      purchase_units: [{
                        amount: {
                          value: total.toString(),
                          currency_code: "SEK"
                        }
                      }]
                    });
                  }}
                  onApprove={async (data, actions) => {
                    if (!actions.order) return Promise.resolve();
                    return actions.order.capture().then(async () => {
                      // Spara ordern i Strapi
                      await saveOrderToStrapi(items, total);
                      alert('Payment completed!');
                      clearCart();
                    });
                  }}
                />
              </PayPalScriptProvider>
              <button
                className={styles.clearCartBtn}
                onClick={clearCart}
              >Clear cart</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}