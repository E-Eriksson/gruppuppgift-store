import { describe, it, expect } from "vitest";
import {
  fetchProductsRaw,
  API_URL,
} from "../../packages/api/src/fetchProducts";

async function makeOrder(orderData) {
  const res = await fetch("http://localhost:1337/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: orderData }),
  });

  if (!res.ok) {
    throw new Error(`Failed to make order: ${res.status}`);
  }

  const data = await res.json();
  return data.data;
}

describe("fetchProducts (integration test)", () => {
  it("should return at least one product object from the API", async () => {
    const result = await fetchProductsRaw();

    expect(Array.isArray(result)).toBe(true);

    expect(result.length).toBeGreaterThan(0);
  });
});

describe("makeOrder (integration test)", () => {
  it("should create and then delete an order", async () => {
    const newOrder = {
      items: [{ id: 1, quantity: 2 }],
      total: 200,
      user: "John Doe",
      isShipped: false,
    };

    const createdOrder = await makeOrder(newOrder);
    expect(createdOrder).toBeDefined();
    expect(createdOrder).toHaveProperty("id");
    expect(createdOrder.total).toBeTypeOf("number");

    const deleteRes = await fetch(
      `http://localhost:1337/api/orders/${createdOrder.id}`,
      { method: "DELETE" }
    );

    expect(deleteRes.ok).toBe(true);

    let deletedData = null;
    const text = await deleteRes.text();
    if (text) {
      deletedData = JSON.parse(text);
      expect(deletedData).toHaveProperty("data");
    } else {
      expect(deleteRes.status).toBe(204);
    }
  }, 10000);
});
