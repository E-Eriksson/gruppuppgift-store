const LOCAL_IP =
  process.env.NEXT_PUBLIC_LOCAL_IP ||
  process.env.EXPO_PUBLIC_LOCAL_IP 

const PORT =
  process.env.NEXT_PUBLIC_PORT ||
  process.env.EXPO_PUBLIC_PORT 

export const API_URL =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? `http://localhost:${PORT}`
    : `http://${LOCAL_IP}:${PORT}`;

export async function fetchProductsRaw(): Promise<any[]> {
  try {
    const res = await fetch(`${API_URL}/api/products?populate=*`);
    if (!res.ok) {
      throw new Error(`Network error: ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data.data) ? data.data : [];
  } catch (err) {
    console.error("fetchProductsRaw error:", err);
    return [];
  }
}

export async function fetchProductBySlug(slug: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_URL}/api/products?filters[slug][$eq]=${slug}&populate=*`);
    if (!res.ok) {
      throw new Error(`Network error: ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data.data) && data.data.length > 0 ? data.data[0] : null;
  } catch (err) {
    console.error("fetchProductBySlug error:", err);
    return null;
  }
}
