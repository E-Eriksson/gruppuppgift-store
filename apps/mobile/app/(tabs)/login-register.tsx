import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { useAuth } from "../../../../packages/shared/store/auth";
import { useRouter } from "expo-router";
import { API_URL } from "../../../../packages/api/src/fetchProducts";

export default function AuthScreen() {
  const { setAuth } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState(""); 
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    try {
      const endpoint = isLogin ? "/api/auth/local" : "/api/auth/local/register";
      const body = isLogin
        ? { identifier: email, password }
        : { username, email, password };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.jwt) {
        setAuth(data.jwt, data.user);
        Alert.alert("Success", isLogin ? "Logged in!" : "Registered!");
        router.replace("/(tabs)/profile"); // Navigera till profilsidan
      } else {
        // Försök hitta felmeddelande på flera nivåer
        let msg =
          data?.error?.message ||
          data?.error?.details?.errors?.[0]?.message ||
          data?.message ||
          data?.data?.[0]?.messages?.[0]?.message ||
          "Wrong email/username or password.";
        Alert.alert("Error", msg);
      }
    } catch (err) {
      Alert.alert("Error", "Network error");
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{isLogin ? "Login" : "Register"}</Text>
      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Username"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button
        title={loading ? "Please wait..." : isLogin ? "Login" : "Register"}
        onPress={handleAuth}
        disabled={loading}
      />
      <Button
        title={isLogin ? "Create account" : "Already have an account? Login"}
        onPress={() => setIsLogin((v) => !v)}
      />
    </View>
  );
}

export const unstable_settings = {
  tabBarLabel: "Log in/Register",
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 24, textAlign: "center" },
  input: {
    borderWidth: 1, borderColor: "#ccc", borderRadius: 6,
    padding: 12, marginBottom: 12, fontSize: 16,
  },
}); 