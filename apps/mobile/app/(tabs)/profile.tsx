import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useAuth } from "../../../../packages/shared/store/auth";
import { API_URL } from "../../../../packages/api/src/fetchProducts";

export default function Profile() {
  const { user, jwt, logout } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jwt || !user) return;
    const fetchOrders = async () => {
      try {
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

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Not logged in</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Profile</Text>
      <Text style={styles.info}>Username: {user.username}</Text>
      <Text style={styles.info}>Email: {user.email}</Text>
      <Button title="Logout" onPress={logout} />
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

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  info: { fontSize: 16, marginBottom: 8 },
  orderItem: { padding: 12, borderBottomWidth: 1, borderColor: "#eee" },
});