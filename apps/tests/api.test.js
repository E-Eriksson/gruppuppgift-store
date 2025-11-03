import { describe, it, expect } from "vitest";
import { fetchProducts } from "../web/app/products/page";

describe("fetchProducts (integration test)", () => {
  it("should return at least one product object from the API", async () => {
    const result = await fetchProducts();

    expect(Array.isArray(result)).toBe(true);

    expect(result.length).toBeGreaterThan(0);
  });
});
