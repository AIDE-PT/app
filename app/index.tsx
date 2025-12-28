import 'react-native-gesture-handler';
import { Text, TouchableOpacity, View } from "react-native";
import "../global.css";
import { Link } from "expo-router";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
      <TouchableOpacity className="bg-blue-600 rounded-lg m-2 p-2">
        <Link href="/test" className="text-lg text-white">
          Go to Test Screen
        </Link>
      </TouchableOpacity>
    </View>
  );
}
