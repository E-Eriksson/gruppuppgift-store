import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Platform,
  ScrollView,
  Linking,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { WebView } from "react-native-webview";
import { Product } from "../../../../packages/types/src/product";
import { fetchProductsRaw, API_URL } from "../../../../packages/api/src/fetchProducts";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Funktion för att hämta kategorinamn
function getCategoryName(category?: { name: string } | string): string {
  if (!category) return "Uncategorized";
  return typeof category === "string" ? category : category.name;
}

export default function ProductsScreen() {
  // State för varukorg, visning av varukorg, checkout, vald kategori och checkout-url
  const [cart, setCart] = useState<Product[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const router = useRouter();

  // Hämta produkter med React Query
  const { data: rawProducts = [], isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProductsRaw,
  });

  // Omvandla API-data till Product-objekt
  const products: Product[] = Array.isArray(rawProducts)
    ? rawProducts.map((p: any) => {
        const attrs = p.attributes ?? p ?? {};
        const imageUrl =
          attrs.image?.data?.attributes?.url
            ? `${API_URL}${attrs.image.data.attributes.url}`
            : attrs.image?.url
            ? `${API_URL}${attrs.image.url}`
            : undefined;

        return {
          id: p.id ?? attrs.id ?? 0,
          name: attrs.name ?? "Unknown product",
          price: attrs.price ?? 0,
          description: attrs.description ?? "",
          imageUrl,
          inStock: attrs.inStock ?? false,
          category:
            attrs.category?.data?.attributes?.name ??
            attrs.category?.name ??
            "Uncategorized",
        };
      })
    : [];

  // Lägg till produkt i varukorgen
  const addToCart = (product: Product) => setCart((prev) => [...prev, product]);
  // Töm varukorgen
  const clearCart = () => {
    setCart([]);
    setShowCart(false);
  };
  // Beräkna totalsumma
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  // Lista av kategorier
  const categories = [
    "All",
    ...Array.from(new Set(products.map((p) => getCategoryName(p.category)))),
  ];

  // Filtrera produkter på vald kategori
  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter(
          (p) => getCategoryName(p.category) === selectedCategory
        );

  // Hantera checkout (öppna webbläsare eller länk)
  const handleCheckout = () => {
    const cartParam = encodeURIComponent(
      JSON.stringify(
        cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
        }))
      )
    );
    const url = `http://192.168.1.25:3000/checkout?cart=${cartParam}`;
    if (Platform.OS === "web") {
      window.open(url, "_blank");
    } else {
      Linking.openURL(url); 
    }
  };

  // Visa laddningsmeddelande
  if (isLoading)
    return <Text style={styles.center}>Loading products...</Text>;
  // Visa felmeddelande
  if (error)
    return <Text style={styles.center}>Error fetching products.</Text>;

  return (
    <View style={styles.container}>
      {/* Profilknapp */}
      <View style={{ flexDirection: "row", justifyContent: "flex-end", padding: 12 }}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
          <Ionicons name="person-circle-outline" size={32} color="#0070ba" />
        </TouchableOpacity>
      </View>

      {/* Rubrik */}
      <Text style={styles.header}>🛍️ Products</Text>

      {/* Kategorival */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                selectedCategory === cat && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(cat ?? "All")}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat && styles.categoryTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Produktlista */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.productGrid}
        columnWrapperStyle={styles.productRow}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text>No image</Text>
              </View>
            )}
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.price}>{item.price} SEK</Text>
            <Text
              style={[
                styles.stockText,
                { color: item.inStock ? "green" : "red" },
              ]}
            >
              {item.inStock ? "In stock" : "Out of stock"}
            </Text>
            <Text style={styles.categoryLabel}>
              {getCategoryName(item.category)}
            </Text>
            <TouchableOpacity
              style={[
                styles.addButton,
                !item.inStock && styles.disabledButton,
              ]}
              onPress={() => addToCart(item)}
              disabled={!item.inStock}
            >
              <Text style={styles.addButtonText}>
                {item.inStock ? "Add to cart" : "Unavailable"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Knapp för att visa varukorg */}
      <TouchableOpacity
        style={styles.cartButton}
        onPress={() => setShowCart(true)}
      >
        <Text style={styles.cartButtonText}>🛒 Cart ({cart.length})</Text>
      </TouchableOpacity>

      {/* Modal för varukorg */}
      <Modal visible={showCart} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.header}>Your Cart</Text>
          {cart.length === 0 ? (
            <Text>Your cart is empty.</Text>
          ) : (
            <>
              {cart.map((item) => (
                <Text key={item.id}>
                  {item.name} – {item.price} SEK
                </Text>
              ))}
              <Text style={styles.total}>Total: {total} SEK</Text>
              <TouchableOpacity
                style={styles.checkoutButton}
                onPress={handleCheckout}
              >
                <Text style={styles.checkoutText}>Proceed to Payment</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearCart}
              >
                <Text style={styles.clearButtonText}>Clear Cart</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            onPress={() => setShowCart(false)}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

// STYLES
const styles = StyleSheet.create({
  center: { marginTop: 50, textAlign: "center" },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fc",
    paddingTop: 40,
  },
  header: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    color: "#111",
  },
  categoryContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryScroll: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 25,
    marginHorizontal: 6,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: "#0070ba",
    borderColor: "#0070ba",
  },
  categoryText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "#fff",
  },
  productGrid: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100,
  },
  productRow: {
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#fff",
    margin: 10,
    paddingBottom: 15,
    borderRadius: 15,
    width: 160,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 120,
    borderRadius: 15,
    resizeMode: "contain",
    borderWidth: 10,
    borderColor: "#fff"
  },
  imagePlaceholder: {
    width: "100%",
    height: 120,
    borderRadius: 15,
    borderWidth: 10,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
  },
  name: { fontSize: 16, fontWeight: "600", marginTop: 8, textAlign: "center" },
  description: {
    textAlign: "center",
    marginVertical: 5,
    color: "#636262",
    paddingHorizontal: 5

  },
  price: { fontSize: 15, color: "#0070ba" },
  stockText: { marginTop: 4, fontSize: 13 },
  categoryLabel: { fontSize: 12, color: "#888", marginBottom: 8 },
  addButton: {
    backgroundColor: "#0070ba",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  disabledButton: { backgroundColor: "#ccc" },
  addButtonText: { color: "#fff", textAlign: "center", fontSize: 13 },
  cartButton: {
    backgroundColor: "#111",
    padding: 15,
    margin: 15,
    borderRadius: 10,
  },
  cartButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 18,
  },
  modalContainer: { flex: 1, padding: 20, marginTop: 40 },
  total: { fontWeight: "bold", marginTop: 10 },
  checkoutButton: {
    backgroundColor: "#0070ba",
    padding: 10,
    borderRadius: 6,
    marginTop: 15,
  },
  checkoutText: { color: "#fff", textAlign: "center" },
  clearButton: {
    backgroundColor: "#999",
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  clearButtonText: { color: "#fff", textAlign: "center" },
  closeButton: {
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 6,
    marginTop: 20,
  },
  closeButtonText: { color: "#fff", textAlign: "center" },
});