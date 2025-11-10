const LOCAL_IP = "192.168.1.103"; // ändra till din dators lokala IP-adress

export const API_URL =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:1337"
    : `http://${LOCAL_IP}:1337`;

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
