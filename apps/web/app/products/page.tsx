'use client';
// Importerar React hooks och nödvändiga bibliotek
import { useState } from 'react';
import { useCart } from '../../store/cart';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import styles from './ProductList.module.css';
import { Product } from "../../../../packages/types/src/product";
import { fetchProductsRaw, API_URL } from "../../../../packages/api/src/fetchProducts";
import { useRouter } from "next/navigation";

// Funktion för att spara order till Strapi-API
async function saveOrderToStrapi(items: any[], total: number) {
  try {
    const res = await fetch(`${API_URL}/api/orders`, {
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

export default function ProductsPage() {
  // State och hooks för varukorg, kategori och navigation
  const { items, addToCart, removeFromCart, clearCart } = useCart();
  const [showCart, setShowCart] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const router = useRouter();

  // Hämta produkter asynkront med React Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProductsRaw,
  });

  // Omvandla API-data till produktobjekt
  // ============== SEO & CRO ================
  const products: Product[] =
    data?.map((p: any) => {
      const a = p.attributes ?? p;
      const imgPath = a?.image?.url ?? a?.image?.data?.attributes?.url;
      const imageUrl = imgPath
        ? (imgPath.startsWith('http') ? imgPath : `${API_URL}${imgPath}`)
        : undefined;
      const categoryName =
        Array.isArray(a?.category)
          ? (a.category[0]?.name)
          : (a?.category?.name ?? a?.category?.data?.attributes?.name);
      return {
        id: p.id,
        name: a?.name ?? 'Unknown',
        slug: a?.slug ?? '',
        price: a?.price ?? 0,
        description: a?.description ?? '',
        imageUrl,
        inStock: a?.inStock ?? false,
        category: categoryName ? { name: categoryName } : undefined,
      };
    }) ?? [];

  // Skapa lista av unika kategorier
  const categories = Array.from(
    new Set(products.map((p) => p.category?.name).filter((cat): cat is string => !!cat))
  );

  // Filtrera produkter på vald kategori
  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((p) => p.category?.name === selectedCategory);

  // Beräkna totalsumma och antal produkter i varukorgen
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  // Öka antal av en produkt i varukorgen
  const increaseQuantity = (id: number) => {
    const item = items.find((i) => i.id === id);
    if (item) addToCart({ id: item.id, name: item.name, price: item.price, imageUrl: item.imageUrl });
  };

  // Minska antal av en produkt i varukorgen
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

  // Visa laddningsmeddelande om produkter hämtas
  if (isLoading) return <div>Loading...</div>;
  // Visa felmeddelande om något gick fel vid hämtning
  if (error) return <div>An error occurred while fetching products.</div>;

  return (
    <div>
      {/* Tillbaka-knapp */}
      <div className={styles.backBtnWrapper}>
        <Link href="/">
          <button className={styles.backBtn} aria-label="Go to homepage">
            ←
          </button>
        </Link>
      </div>

      {/* Ikoner för profil och varukorg */}
      <div className={styles.iconRow}>
        <button
          className={styles.profileIconBtn}
          onClick={() => router.push("/profile")}
          aria-label="Go to profile"
        >
          <span className={styles.profileIcon}>👤</span>
        </button>
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

      {/* Rubrik */}
      {/* ======================== SEO & CRO ======================== */}
      <h1 className={styles.heading}>Products</h1>

      {/* Kategorival */}
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

      {/* Produktlista */}
      <div className={
        filteredProducts.length === 1
          ? styles.singleProduct
          : filteredProducts.length <= 2
            ? styles.twoProducts
            : styles.grid
      }>
        {filteredProducts.map((product) => (
          <div key={product.id} className={styles.card}>
            <Link href={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={800}
                  height={800}
                  className={styles.image}
                />
              ) : (
                <div className={styles.image} />
              )}
            </Link>
            <div className={styles.cardtext}>
              <Link href={`/products/${product.slug}`} className={styles.title}>
                {product.name}
              </Link>
              <div className={styles.price}>{product.price} SEK</div>
              <span className={product.inStock ? styles.inStock : styles.outOfStock}>
                {product.inStock ? 'In stock' : 'Out of stock'}
              </span>
              {product.category && <div className={styles.category}>{product.category.name}</div>}
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

      {/* Popup för varukorg */}
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
              {/* PayPal-integration */}
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