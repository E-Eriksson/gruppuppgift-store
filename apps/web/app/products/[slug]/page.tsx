'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { fetchProductBySlug, fetchProductsRaw, API_URL } from '../../../../../packages/api/src/fetchProducts';
import { Product } from '../../../../../packages/types/src/product';
import { useCart } from '../../../store/cart';
import styles from './ProductDetail.module.css';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slugOrId = params.slug as string;
  const { items, addToCart } = useCart();

  // Calculate total quantity in cart
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  // Fetch product by slug or ID
  const { data, isLoading, error } = useQuery({
    queryKey: ['product', slugOrId],
    queryFn: async () => {
      // First try to fetch by slug
      const productBySlug = await fetchProductBySlug(slugOrId);
      if (productBySlug) return productBySlug;

      // If slug fails and slugOrId is a number, fetch all products and find by ID
      if (!isNaN(Number(slugOrId))) {
        const allProducts = await fetchProductsRaw();
        return allProducts.find((p: any) => p.id === Number(slugOrId)) || null;
      }

      return null;
    },
    enabled: !!slugOrId,
  });

  // Transform API data to Product type
  const product: Product | null = data
    ? (() => {
        const a = data.attributes ?? data;
        const imgPath = a?.image?.url ?? a?.image?.data?.attributes?.url;
        const imageUrl = imgPath
          ? (imgPath.startsWith('http') ? imgPath : `${API_URL}${imgPath}`)
          : undefined;
        const categoryName =
          Array.isArray(a?.category)
            ? (a.category[0]?.name)
            : (a?.category?.name ?? a?.category?.data?.attributes?.name);
        return {
          id: data.id,
          name: a?.name ?? 'Unknown',
          slug: a?.slug ?? '',
          price: a?.price ?? 0,
          description: a?.description ?? '',
          imageUrl,
          inStock: a?.inStock ?? false,
          category: categoryName ? { name: categoryName } : undefined,
        };
      })()
    : null;

  const handleAddToCart = () => {
    if (product && product.inStock) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
      });
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading product...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Product not found</h2>
          <p>The product you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/products">
            <button className={styles.backBtn}>Back to Products</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Navigation buttons */}
      <div className={styles.navigation}>
        <Link href="/products">
          <button className={styles.backBtn} aria-label="Back to products">
            ← Back to Products
          </button>
        </Link>
        <button
          className={styles.cartIconBtn}
          onClick={() => router.push('/products')}
          aria-label="Go to cart"
        >
          <span className={styles.cartIcon}>🛒</span>
          {totalQuantity > 0 && (
            <span className={styles.cartBadge}>{totalQuantity}</span>
          )}
        </button>
      </div>

      {/* Product detail */}
      <div className={styles.productDetail}>
        <div className={styles.imageContainer}>
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={600}
              height={600}
              className={styles.image}
              priority
            />
          ) : (
            <div className={styles.imagePlaceholder}>No image available</div>
          )}
        </div>

        <div className={styles.info}>
          <h1 className={styles.title}>{product.name}</h1>

          {product.category && (
            <div className={styles.category}>{product.category.name}</div>
          )}

          <div className={styles.price}>{product.price} SEK</div>

          <span className={product.inStock ? styles.inStock : styles.outOfStock}>
            {product.inStock ? '✓ In stock' : '✗ Out of stock'}
          </span>

          {product.description && (
            <div className={styles.description}>
              <h2>Description</h2>
              <p>{product.description}</p>
            </div>
          )}

          <button
            className={styles.addToCartBtn}
            onClick={handleAddToCart}
            disabled={!product.inStock}
            aria-label={`Add ${product.name} to cart`}
          >
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
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
}
