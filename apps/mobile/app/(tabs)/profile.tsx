import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useAuth } from "../../../../packages/shared/store/auth";
import { API_URL } from "../../../../packages/api/src/fetchProducts";

// Profilkomponent för användaren
export default function Profile() {
  // Hämta användare, jwt-token och logout-funktion från auth-store
  const { user, jwt, logout } = useAuth();
  // State för ordrar och laddningsstatus
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Hämta ordrar när jwt och user finns
  useEffect(() => {
    if (!jwt || !user) return;
    const fetchOrders = async () => {
      try {
        // Hämta ordrar från API med användarens id och JWT-token
        const res = await fetch(`${API_URL}/api/orders?filters[user][$eq]=${user.id}&populate=*`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        const data = await res.json();
        setOrders(data.data || []);
      } catch (err) {
        setOrders([]);
      }
      setLoading(false);
    };
    fetchOrders();
  }, [jwt, user]);

  // Om användaren inte är inloggad, visa meddelande
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Not logged in</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Profilinformation */}
      <Text style={styles.header}>Profile</Text>
      <Text style={styles.info}>Username: {user.username}</Text>
      <Text style={styles.info}>Email: {user.email}</Text>
      <Button title="Logout" onPress={logout} />
      {/* Lista med användarens ordrar */}
      <Text style={styles.header}>Your Orders</Text>
      {loading ? (
        <ActivityIndicator />
      ) : orders.length === 0 ? (
        <Text>No orders found.</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.orderItem}>
              <Text>Order #{item.id}</Text>
              <Text>Total: {item.attributes.total} SEK</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

// Stilar för komponenten
const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  info: { fontSize: 16, marginBottom: 8 },
  orderItem: { padding: 12, borderBottomWidth: 1, borderColor: "#eee" },
});