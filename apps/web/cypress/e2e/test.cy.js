describe("Homepage", () => {
  it("should load successfully", () => {
    cy.visit("localhost:3000/");
    cy.contains("Welcome to our store");

    cy.contains("Start shopping").click();
    cy.url().should("include", "/products");

    cy.contains("Add to cart").click();

    cy.contains("🛒").click();
    cy.contains("Your cart");
  });
});
