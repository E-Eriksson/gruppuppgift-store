'use client';
import { useState, useEffect } from 'react';
import { useCart } from '../../../store/cart';      // Uppdaterad med tracking
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './ProductDetail.module.css';
// Lägg till imports för tracking
import { trackPageView, trackProductView, trackAddToCart } from '../../../lib/events';

// Mock-funktion för att hämta produktdata baserat på slug
async function fetchProductBySlug(slug: string) {
  // Ersätt med din faktiska API-anrop
  const res = await fetch(`/api/products/${slug}`);
  if (!res.ok) throw new Error('Product not found');
  return res.json();
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { addToCart } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Track page view när produkt-sidan laddas
  useEffect(() => {
    if (product) {
      trackPageView(`Product: ${product.name}`, window.location.pathname);
      
      // Track produkt-view
      trackProductView({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category?.name
      });
    }
  }, [product]);

  // Hämta produktdata
  useEffect(() => {
    async function loadProduct() {
      try {
        setIsLoading(true);
        const productData = await fetchProductBySlug(slug);
        setProduct(productData);
      } catch (err) {
        setError('Product not found');
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      loadProduct();
    }
  }, [slug]);

  // Enhanced add to cart med tracking
  const handleAddToCart = () => {
    if (!product) return;

    for (let i = 0; i < selectedQuantity; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl
      });
    }

    // Track add to cart event
    trackAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category?.name
    });

    // Visa bekräftelse
    alert(`${selectedQuantity} ${product.name} added to cart!`);
  };

  if (isLoading) return <div className={styles.loading}>Loading product...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!product) return <div className={styles.error}>Product not found</div>;

  return (
    <div className={styles.container}>
      {/* Tillbaka-knapp */}
      <div className={styles.backBtnWrapper}>
        <Link href="/products">
          <button className={styles.backBtn} aria-label="Back to products">
            ← Back to Products
          </button>
        </Link>
      </div>

      {/* Produkt-detaljer */}
      <div className={styles.productDetail}>
        {/* Produktbild */}
        <div className={styles.imageSection}>
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={600}
              height={600}
              className={styles.productImage}
              priority
            />
          ) : (
            <div className={styles.placeholderImage}>No Image</div>
          )}
        </div>

        {/* Produktinformation - ALL DIN EXISTERANDE KOD FORTSÄTTER HÄR */}
        <div className={styles.infoSection}>
          <h1 className={styles.productTitle}>{product.name}</h1>
          
          <div className={styles.price}>{product.price} SEK</div>
          
          <div className={styles.stockStatus}>
            <span className={product.inStock ? styles.inStock : styles.outOfStock}>
              {product.inStock ? 'In stock' : 'Out of stock'}
            </span>
          </div>

          {product.category && (
            <div className={styles.category}>
              Category: <span>{product.category.name}</span>
            </div>
          )}

          {product.description && (
            <div className={styles.description}>
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>
          )}

          {/* Quantity selector */}
          <div className={styles.quantitySelector}>
            <label htmlFor="quantity">Quantity:</label>
            <select
              id="quantity"
              value={selectedQuantity}
              onChange={(e) => setSelectedQuantity(Number(e.target.value))}
              className={styles.quantitySelect}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          {/* Add to cart button - Uppdaterad med tracking */}
          <button
            className={styles.addToCartBtn}
            onClick={handleAddToCart} // Använder den nya funktionen med tracking
            disabled={!product.inStock}
          >
            {product.inStock ? `Add ${selectedQuantity} to Cart` : 'Out of Stock'}
          </button>

          {/* Ytterligare knappar kan läggas till här om needed */}
        </div>
      </div>
    </div>
  );
}