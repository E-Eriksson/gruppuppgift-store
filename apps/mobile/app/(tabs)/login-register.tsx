import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { useAuth } from "../../../../packages/shared/store/auth";
import { useRouter } from "expo-router";
import { API_URL } from "../../../../packages/api/src/fetchProducts";

// Huvudkomponent för inloggning och registrering
export default function AuthScreen() {
  // Hooks för auth, navigation och state
  const { setAuth } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true); // Växla mellan login och register
  const [email, setEmail] = useState(""); // State för e-post
  const [username, setUsername] = useState(""); // State för användarnamn
  const [password, setPassword] = useState(""); // State för lösenord
  const [loading, setLoading] = useState(false); // State för laddning

  // Funktion för att hantera login/registrering
  const handleAuth = async () => {
    setLoading(true);
    try {
      // Välj endpoint och request-body beroende på login/register
      const endpoint = isLogin ? "/api/auth/local" : "/api/auth/local/register";
      const body = isLogin
        ? { identifier: email, password }
        : { username, email, password };

      // Skicka POST-request till Strapi API
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.jwt) {
        // Spara JWT-token och användare i auth-store
        setAuth(data.jwt, data.user);
        Alert.alert("Success", isLogin ? "Logged in!" : "Registered!");
        router.replace("/(tabs)/profile"); // Navigera till profilsidan
      } else {
        // Visa felmeddelande från API eller fallback
        let msg =
          data?.error?.message ||
          data?.error?.details?.errors?.[0]?.message ||
          data?.message ||
          data?.data?.[0]?.messages?.[0]?.message ||
          "Wrong email/username or password.";
        Alert.alert("Error", msg);
      }
    } catch (err) {
      // Visa nätverksfel
      Alert.alert("Error", "Network error");
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Rubrik för login/register */}
      <Text style={styles.header}>{isLogin ? "Login" : "Register"}</Text>
      {/* Visa användarnamn bara vid registrering */}
      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Username"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
      )}
      {/* Fält för e-post */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      {/* Fält för lösenord */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {/* Knapp för login/register */}
      <Button
        title={loading ? "Please wait..." : isLogin ? "Login" : "Register"}
        onPress={handleAuth}
        disabled={loading}
      />
      {/* Växla mellan login och register */}
      <Button
        title={isLogin ? "Create account" : "Already have an account? Login"}
        onPress={() => setIsLogin((v) => !v)}
      />
    </View>
  );
}

// Inställning för tabBar-label
export const unstable_settings = {
  tabBarLabel: "Log in/Register",
};

// Stilar för komponenten
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 24, textAlign: "center" },
  input: {
    borderWidth: 1, borderColor: "#ccc", borderRadius: 6,
    padding: 12, marginBottom: 12, fontSize: 16,
  },
});