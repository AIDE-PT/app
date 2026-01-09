import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Button } from "../components/buttons/button";
import { Input } from "../components/input/Input";
import { LightBackground } from "../components/LightBackground";
import "../global.css";

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <Svg 
    width={20} 
    height={20} 
    viewBox="0 0 24 24" 
    fill="none"
    style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
  >
    <Path
      d="M6 9l6 6 6-6"
      stroke="rgba(0,0,0,0.4)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const GenderSelector = ({ selected, onSelect }: { selected: string; onSelect: (gender: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const options = ["Feminino", "Masculino", "Outro"];
  const dropdownHeight = useSharedValue(0);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    dropdownHeight.value = withTiming(isOpen ? 0 : options.length * 48, { duration: 200 });
  };

  const selectOption = (option: string) => {
    onSelect(option);
    setIsOpen(false);
    dropdownHeight.value = withTiming(0, { duration: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    height: dropdownHeight.value,
    overflow: 'hidden',
  }));

  return (
    <View className="w-full">
      <TouchableOpacity
        onPress={toggleDropdown}
        style={styles.inputShadow}
        className={`w-full flex-row items-center justify-between px-4 py-1 rounded-[16px] border border-[#5061FF]/20 bg-white/90 ${
          isOpen ? 'rounded-b-none border-b-0' : ''
        }`}
      >
        <Text className={`h-12 leading-[48px] text-base ${selected ? 'text-black/90' : 'text-black/40'}`}>
          {selected || "Género"}
        </Text>
        <ChevronIcon isOpen={isOpen} />
      </TouchableOpacity>

      <Animated.View 
        style={[animatedStyle, styles.dropdownShadow]}
        className="bg-white/90 rounded-b-[16px] border border-t-0 border-[#5061FF]/20 overflow-hidden"
      >
        {options.map((option, index) => (
          <TouchableOpacity
            key={option}
            onPress={() => selectOption(option)}
            className={`px-4 py-3 ${
              index < options.length - 1 ? 'border-b border-[#5061FF]/10' : ''
            } ${selected === option ? 'bg-[#5061FF]/10' : ''}`}
          >
            <Text className={`text-base ${
              selected === option ? 'text-[#5061FF] font-semibold' : 'text-black/90'
            }`}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  inputShadow: {
    boxShadow: "0 0 50px -20px #5061FF inset",
  },
  dropdownShadow: {
    boxShadow: "0 0 50px -20px #5061FF inset",
  },
});

export default function ExtraData() {
  const router = useRouter();
  const [idade, setIdade] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [genero, setGenero] = useState("");
  const [selectedConditions, setSelectConditions] = useState<string[]>([]);

  const handleAdvance = () => {
    router.push({
      pathname: "/selectConditions",
    });
  };

  return (
    <LightBackground>
      <SafeAreaView className="flex-1 px-6">
        {/* Title */}
        <View className="mt-12 mb-8">
          <Text className="text-3xl font-bold text-black/90">
            Só mais uma coisa...
          </Text>
        </View>

        {/* Form Inputs */}
        <View className="gap-4">
          <Input
            placeholder="Idade"
            value={idade}
            onChangeText={setIdade}
            keyboardType="numeric"
          />

          <Input
            placeholder="Peso"
            value={peso}
            onChangeText={setPeso}
            keyboardType="numeric"
            suffix="kg"
          />

          <Input
            placeholder="Altura"
            value={altura}
            onChangeText={setAltura}
            keyboardType="numeric"
            suffix="m"
          />

          <GenderSelector 
            selected={genero}
            onSelect={setGenero}
          />
        </View>

        {/* Spacer to push button to bottom */}
        <View className="flex-1" />

        {/* Bottom Button */}
        <View className="items-center mb-8">
          <Button
            variant="primary"
            label="Avançar"
            onPress={handleAdvance}
          />
        </View>
      </SafeAreaView>
    </LightBackground>
  );
}
