'use client';
// Importerar React hooks och nödvändiga bibliotek
import { useState, useEffect } from 'react';
import { useCart } from '../../store/cart';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import styles from './ProductList.module.css';
import { Product } from "../../../../packages/types/src/product";
import { fetchProductsRaw, API_URL } from "../../../../packages/api/src/fetchProducts";
import { useRouter } from "next/navigation";
import { ecommerceEvent } from '../../lib/gtag';

// Funktion för att spara order till Strapi-API
async function saveOrderToStrapi(items: any[], total: number) {
  try {
    console.log('Saving order to Strapi:', { items, total });
    
    const orderData = {
      data: {
        total: total,
        status: 'completed',
        items: items.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl
        }))
      }
    };

    console.log('Order data being sent:', orderData);

    const res = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    console.log('Response status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Strapi API error:', errorText);
      throw new Error(`Order could not be saved: ${res.status} ${res.statusText}`);
    }

    const result = await res.json();
    console.log('Order saved successfully:', result);
    return result;
    
  } catch (err) {
    console.error('Order save error:', err);
    // Don't throw the error, just log it so the payment can still complete
    return null;
  }
}

export default function ProductsPage() {
  // State och hooks för varukorg, kategori och navigation
  const { items, addToCart, removeFromCart, clearCart } = useCart();
  const [showCart, setShowCart] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [paypalError, setPaypalError] = useState(false);
  const router = useRouter();

  // Track category changes with GA4
  useEffect(() => {
    if (selectedCategory !== 'All') {
      ecommerceEvent.viewItemList(selectedCategory);
    }
  }, [selectedCategory]);

  // Hämta produkter asynkront med React Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProductsRaw,
  });

  // Enhanced add to cart with tracking
  const handleAddToCart = (product: Product) => {
    addToCart(product);
    ecommerceEvent.addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category?.name
    });
  };

  // Enhanced remove from cart with tracking
  const handleRemoveFromCart = (productId: number) => {
    const item = items.find(i => i.id === productId);
    if (item) {
      removeFromCart(productId);
      ecommerceEvent.removeFromCart({
        id: item.id,
        name: item.name,
        price: item.price
      });
    }
  };

  // Enhanced clear cart with tracking
  const handleClearCart = () => {
    // Track each removed item
    items.forEach(item => {
      ecommerceEvent.removeFromCart({
        id: item.id,
        name: item.name,
        price: item.price
      });
    });
    clearCart();
  };

  // Track cart view
  const handleShowCart = () => {
    setShowCart(true);
    if (items.length > 0) {
      ecommerceEvent.beginCheckout(items, total);
    }
  };

  // Enhanced PayPal success with tracking and better error handling
  const handlePaymentSuccess = async () => {
    try {
      // Generate a simple transaction ID
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Track purchase
      ecommerceEvent.purchase(transactionId, total, items);
      
      // Try to save order to Strapi (but don't block if it fails)
      const saveResult = await saveOrderToStrapi(items, total);
      
      if (saveResult) {
        console.log('Order successfully saved to Strapi');
      } else {
        console.warn('Order could not be saved to Strapi, but payment was completed');
      }
      
      alert('Payment completed successfully! Thank you for your order.');
      clearCart();
      setShowCart(false);
      
    } catch (err) {
      console.error('Error in payment success handler:', err);
      alert('Payment completed! There was an issue saving your order details, but your payment was successful.');
      clearCart();
      setShowCart(false);
    }
  };

  // Omvandla API-data till produktobjekt
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

  // Stats for header
  const totalProducts = products.length;
  const inStockProducts = products.filter(p => p.inStock).length;
  const categoriesCount = categories.length;

  // Öka antal av en produkt i varukorgen
  const increaseQuantity = (id: number) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      addToCart({ id: item.id, name: item.name, price: item.price, imageUrl: item.imageUrl });
      ecommerceEvent.addToCart({
        id: item.id,
        name: item.name,
        price: item.price
      });
    }
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
      handleRemoveFromCart(id);
    }
  };

  // Visa laddningsmeddelande om produkter hämtas
  if (isLoading) return <div className={styles.loading}>Loading products...</div>;
  
  // Visa felmeddelande om något gick fel vid hämtning
  if (error) {
    return (
      <div className={styles.error}>
        <h2>Unable to load products</h2>
        <p>Please check your connection and try again.</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  // Determine which layout class to use based on product count
  const getLayoutClass = () => {
    const productCount = filteredProducts.length;
    
    if (productCount === 1) {
      return styles.singleProduct;
    } else if (productCount === 2) {
      return styles.twoProducts;
    } else {
      return styles.grid;
    }
  };

  return (
    <div className={styles.productsWrapper}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.heading}>Premium Collection</h1>
          <p className={styles.subtitle}>
            Discover our curated selection of high-quality products. 
            Each item is carefully selected for excellence and value.
          </p>
          <div className={styles.headerStats}>
            <div className={styles.stat}>
              <div className={styles.statNumber}>{totalProducts}</div>
              <div className={styles.statLabel}>Total Products</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>{inStockProducts}</div>
              <div className={styles.statLabel}>In Stock</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>{categoriesCount}</div>
              <div className={styles.statLabel}>Categories</div>
            </div>
          </div>
        </div>
        
        {/* Navigation buttons */}
        <div className={styles.backBtnWrapper}>
          <Link href="/">
            <button className={styles.backBtn} aria-label="Go to homepage">
              ← Home
            </button>
          </Link>
        </div>

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
            onClick={handleShowCart}
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
      </div>

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

      {/* Produktlista med dynamisk layout */}
      {filteredProducts.length === 0 ? (
        <div className={styles.noProducts}>
          <p>No products found{selectedCategory !== 'All' ? ` in category "${selectedCategory}"` : ''}.</p>
        </div>
      ) : (
        <div className={getLayoutClass()}>
          {filteredProducts.map((product) => (
            <div key={product.id} className={styles.card}>
              <Link 
                href={`/products/${product.slug}`} 
                aria-label={`View ${product.name}`}
                onClick={() => ecommerceEvent.viewItem({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  category: product.category?.name
                })}
              >
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
                <Link 
                  href={`/products/${product.slug}`} 
                  className={styles.title}
                  onClick={() => ecommerceEvent.viewItem({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    category: product.category?.name
                  })}
                >
                  {product.name}
                </Link>
                <div className={styles.price}>{product.price} SEK</div>
                <span className={product.inStock ? styles.inStock : styles.outOfStock}>
                  {product.inStock ? 'In stock' : 'Out of stock'}
                </span>
                {product.category && <div className={styles.category}>{product.category.name}</div>}
                <button
                  className={styles.addToCartBtn}
                  onClick={() => handleAddToCart(product)}
                  disabled={!product.inStock}
                >
                  Add to cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
              <div className={styles.quantitySection}>
                <button className={styles.quantityBtn} onClick={() => decreaseQuantity(item.id)}>-</button>
                <span className={styles.quantityDisplay}>x {item.quantity}</span>
                <button className={`${styles.quantityBtn} ${styles.plus}`} onClick={() => increaseQuantity(item.id)}>+</button>
              </div>
      
              <span className={styles.itemName}>{item.name}</span>
      
              <span className={styles.itemPrice}>{item.price * item.quantity} SEK</span>
      
              <button
                className={styles.removeBtn}
                onClick={() => handleRemoveFromCart(item.id)}
                >
                Remove
                </button>
              </div>
              ))}
              <hr />
              <div className={styles.total}>Total: {total} SEK</div>
              {/* PayPal-integration - FIXED VERSION */}
              {paypalError ? (
                <div className={styles.paypalError}>
                  <p>PayPal loading failed - please disable ad blockers</p>
                  <button onClick={() => setPaypalError(false)}>Retry</button>
                </div>
              ) : (
                <PayPalScriptProvider 
                  options={{ 
                    clientId: "sb", 
                    currency: "SEK"
                  }}
                >
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
                      return actions.order.capture().then(handlePaymentSuccess);
                    }}
                    onError={(err) => {
                      console.error('PayPal error:', err);
                      setPaypalError(true);
                    }}
                  />
                </PayPalScriptProvider>
              )}
              <button
                className={styles.clearCartBtn}
                onClick={handleClearCart}
              >Clear cart</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}