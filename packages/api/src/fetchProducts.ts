// packages/api/src/fetchProducts.ts

// Make sure API_URL is properly defined
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';

export async function fetchProductsRaw(): Promise<any[]> {
  try {
    console.log('Fetching from:', `${API_URL}/api/products?populate=*`);
    
    const res = await fetch(`${API_URL}/api/products?populate=*`, {
      // Add headers and options to help with CORS and caching
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Prevent caching issues
    });
    
    if (!res.ok) {
      throw new Error(`Network error: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.error('Failed to fetch products:', err);
    // Return empty array instead of throwing to prevent UI crash
    return [];
  }
}

export async function fetchProductBySlug(slug: string): Promise<any> {
  try {
    const res = await fetch(`${API_URL}/api/products?filters[slug][$eq]=${slug}&populate=*`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!res.ok) {
      throw new Error(`Network error: ${res.status}`);
    }
    
    const data = await res.json();
    return data.data?.[0] || null;
  } catch (err) {
    console.error('Failed to fetch product by slug:', err);
    return null;
  }
}