import { View, StyleSheet } from "react-native";
// Adjust the path below if you renamed 'imput' to 'input'
import RegisterForm from "../components/input/RegisterForm";

export default function PlaygroundScreen() {
  return (
    <View style={styles.screen} className="bg-blue-100 ">
      {/* This is where you see your component! */}
      <RegisterForm />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
  },
});
