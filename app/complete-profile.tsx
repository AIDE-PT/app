import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/buttons/button";
import { GradientBackground } from "../components/GradientBackground";
import { Input } from "../components/input/Input";
import '../global.css';

export default function CompleteProfile() {
    const router = useRouter();
    const [fontsLoaded] = useFonts({
        'Safiro-Medium': require('../assets/fonts/safiro/safiro-medium-webfont.ttf'),
        'OpenSans-Regular': require('../assets/fonts/open-sans/OpenSans-Regular.ttf'),
        'OpenSans-SemiBold': require('../assets/fonts/open-sans/OpenSans-SemiBold.ttf'),
    });

    const [age, setAge] = useState("");
    const [weight, setWeight] = useState("");
    const [height, setHeight] = useState("");
    const [gender, setGender] = useState("");

    if (!fontsLoaded) {
        return null;
    }

    const handleNext = () => {
        // Handle profile completion logic
        console.log("Profile data:", { age, weight, height, gender });
        // Navigate to next screen (e.g., home or dashboard)
        router.push('/');
    };

    return (
        <GradientBackground>
            <SafeAreaView className="flex-1">
                <View className="flex-1 px-6 pt-10">
                    {/* Title */}
                    <Text className="font-safiro text-[32px] text-[#1A1A2E] mb-10">
                        Só mais uma coisa...
                    </Text>

                    {/* Input Fields */}
                    <View className="gap-4 mb-4">
                        <Input
                            variant="light"
                            type="text"
                            placeholder="Idade"
                            value={age}
                            onChangeText={setAge}
                            keyboardType="numeric"
                        />

                        <Input
                            variant="light"
                            type="text"
                            placeholder="Peso"
                            value={weight}
                            onChangeText={setWeight}
                            keyboardType="numeric"
                        />

                        <Input
                            variant="light"
                            type="text"
                            placeholder="Altura"
                            value={height}
                            onChangeText={setHeight}
                            keyboardType="numeric"
                        />

                        <Input
                            variant="light"
                            type="text"
                            placeholder="Género"
                            value={gender}
                            onChangeText={setGender}
                        />
                    </View>

                    {/* Spacer */}
                    <View className="flex-1" />

                    {/* Bottom Section */}
                    <View className="items-center pb-8">
                        {/* Next Button */}
                        <Button
                            variant="primary"
                            label="Avançar"
                            onPress={handleNext}
                        />
                    </View>
                </View>
            </SafeAreaView>
        </GradientBackground>
    );
}
