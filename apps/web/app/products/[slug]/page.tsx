'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { fetchProductBySlug, fetchProductsRaw, API_URL } from '../../../../../packages/api/src/fetchProducts';
import { Product } from '../../../../../packages/types/src/product';
import { useCart } from '../../../store/cart';
import styles from './ProductDetail.module.css';
import { ecommerceEvent } from '../../../lib/gtag';
import { useEffect } from 'react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slugOrId = params.slug as string;
  const { items, addToCart } = useCart();

  // Calculate total quantity in cart
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  // Transform API data to Product type
  const transformProductData = (productData: any): Product | null => {
    if (!productData) return null;
    
    const a = productData.attributes ?? productData;
    const imgPath = a?.image?.url ?? a?.image?.data?.attributes?.url;
    const imageUrl = imgPath
      ? (imgPath.startsWith('http') ? imgPath : `${API_URL}${imgPath}`)
      : undefined;
    const categoryName =
      Array.isArray(a?.category)
        ? (a.category[0]?.name)
        : (a?.category?.name ?? a?.category?.data?.attributes?.name);
    return {
      id: productData.id,
      name: a?.name ?? 'Unknown',
      slug: a?.slug ?? '',
      price: a?.price ?? 0,
      description: a?.description ?? '',
      imageUrl,
      inStock: a?.inStock ?? false,
      category: categoryName ? { name: categoryName } : undefined,
    };
  };

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

  const product = transformProductData(data);

  // Track product view when product data is loaded - MOVED AFTER data declaration
  useEffect(() => {
    if (product) {
      // Use GA4 recommended view_item event
      ecommerceEvent.viewItem({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category?.name
      });
      
      // Track page view for this product
      ecommerceEvent.pageView(product.name, `/products/${product.slug}`);
    }
  }, [product]); // Use product as dependency

  const handleAddToCart = () => {
    if (product && product.inStock) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
      });
      
      // Track add to cart using GA4 recommended event
      ecommerceEvent.addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category?.name
      });
    }
  };

  const handleBackToProducts = () => {
    // Use select_item event for navigation back to products
    if (product) {
      ecommerceEvent.selectItem({
        id: product.id,
        name: product.name,
        category: product.category?.name
      });
    }
  };

  const handleViewCart = () => {
    // Track cart view from product page
    if (items.length > 0) {
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      ecommerceEvent.beginCheckout(items, total);
    }
    router.push('/products');
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
            <button 
              className={styles.backBtn}
              onClick={handleBackToProducts}
            >
              Back to Products
            </button>
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
          <button 
            className={styles.backBtn} 
            aria-label="Back to products"
            onClick={handleBackToProducts}
          >
            ← Back to Products
          </button>
        </Link>
        <button
          className={styles.cartIconBtn}
          onClick={handleViewCart}
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
            <div className={styles.imagePlaceholder}>
              No image available
            </div>
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
        </div>
      </div>
    </div>
  );
}