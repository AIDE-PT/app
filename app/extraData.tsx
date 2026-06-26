import LightBackground from "@/components/DotBackground";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabaseClient } from "@/utils/supabase/client";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { z, ZodError } from "zod";
import { Button } from "../components/buttons/button";
import { Input } from "../components/input/Input";
import { KeyboardAwareScrollView } from "../components/layout/KeyboardAwareScrollView";
import "../global.css";

const extraDataSchema = z.object({
  idade: z.coerce
    .number()
    .min(1, "Idade deve ser maior que 0")
    .max(120, "Idade invalida"),
  peso: z.coerce.number().min(1, "Peso deve ser maior que 0"),
  altura: z.coerce
    .number()
    .min(0.5, "Altura deve ser maior que 0.5")
    .max(3, "Altura invalida"),
  genero: z.string().min(1, "Selecione um genero"),
});

const ChevronIcon = ({
  isOpen,
  isDark,
}: {
  isOpen: boolean;
  isDark: boolean;
}) => (
  <Svg
    width={20}
    height={20}
    viewBox="0 0 24 24"
    fill="none"
    style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}
  >
    <Path
      d="M6 9l6 6 6-6"
      stroke={isDark ? "rgba(255,255,255,0.65)" : "rgba(17,24,39,0.55)"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const GenderSelector = ({
  selected,
  onSelect,
  isDark,
}: {
  selected: string;
  onSelect: (gender: string) => void;
  isDark: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const options = ["Feminino", "Masculino", "Outro"];
  const dropdownHeight = useSharedValue(0);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    dropdownHeight.value = withTiming(isOpen ? 0 : options.length * 48, {
      duration: 200,
    });
  };

  const selectOption = (option: string) => {
    onSelect(option);
    setIsOpen(false);
    dropdownHeight.value = withTiming(0, { duration: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    height: dropdownHeight.value,
    overflow: "hidden",
  }));

  return (
    <View
      className="w-full rounded-[25px]"
      style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
    >
      <View
        className={
          isDark
            ? "overflow-hidden rounded-[25px] bg-aide-dark-card"
            : "overflow-hidden rounded-[25px] bg-white/75"
        }
      >
        <TouchableOpacity
          onPress={toggleDropdown}
          className="w-full flex-row items-center justify-between px-5 py-0.5"
          accessibilityRole="button"
          accessibilityLabel={selected || "Selecionar género"}
          accessibilityHint={
            isOpen
              ? "Fecha a lista de géneros."
              : "Abre a lista de géneros disponíveis."
          }
          accessibilityState={{ expanded: isOpen }}
        >
          <Text
            className={`h-11 leading-[44px] text-base ${
              selected
                ? isDark
                  ? "text-white/90"
                  : "text-black/90"
                : isDark
                  ? "text-white/65"
                  : "text-black/55"
            }`}
          >
            {selected || "Genero"}
          </Text>
          <ChevronIcon isOpen={isOpen} isDark={isDark} />
        </TouchableOpacity>

        <Animated.View style={animatedStyle}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={option}
              onPress={() => selectOption(option)}
              className={`px-5 py-3 ${
                index < options.length - 1 ? "border-b border-[#5061FF]/10" : ""
              } ${selected === option ? "bg-[#5061FF]/10" : ""}`}
              accessibilityRole="button"
              accessibilityLabel={option}
              accessibilityHint="Seleciona este género."
              accessibilityState={{ selected: selected === option }}
            >
              <Text
                className={`text-base ${
                  selected === option
                    ? "font-semibold text-[#5061FF]"
                    : isDark
                      ? "text-white/90"
                      : "text-black/90"
                }`}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>
    </View>
  );
};

export default function ExtraData() {
  const router = useRouter();
  const { user } = useAuth();
  const isDark = false;
  const [idade, setIdade] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [genero, setGenero] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleAdvance = async () => {
    try {
      const parsed = extraDataSchema.parse({
        idade,
        peso,
        altura,
        genero,
      });

      if (!user?.id) {
        Alert.alert("Erro", "Sessao invalida. Inicie sessao novamente.");
        return;
      }

      setIsSaving(true);

      const { error } = await getSupabaseClient()
        .from("users")
        .update({
          age: parsed.idade,
          weight: parsed.peso,
          height: parsed.altura,
          gender: parsed.genero,
          profile_completed_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw new Error(error.message);
      }

      setErrors({});
      router.replace("/testDashboard" as any);
    } catch (err) {
      if (err instanceof ZodError) {
        const newErrors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          if (issue.path[0]) {
            newErrors[issue.path[0] as string] = issue.message;
          }
        });
        setErrors(newErrors);
        return;
      }

      console.error("Erro ao guardar dados adicionais:", err);
      Alert.alert(
        "Erro",
        "Nao foi possivel guardar os dados adicionais. Tente novamente.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LightBackground forceLight>
      <View className="flex-1 bg-transparent px-4 pt-10">
        <SafeAreaView className="flex-1">
          <KeyboardAwareScrollView bottomPadding={40}>
            <View className="mb-8 mt-12">
              <Text
                className={`font-safiro text-3xl ${
                  isDark ? "text-white/90" : "text-black/90"
                }`}
              >
                So mais uma coisa...
              </Text>
            </View>

            <View className="gap-4">
              <Input
                variant="light"
                forceLight
                label="Idade"
                placeholder="Idade"
                value={idade}
                onChangeText={setIdade}
                keyboardType="numeric"
                helperText="Indique a idade em anos."
                errorText={errors.idade}
              />

              <Input
                variant="light"
                forceLight
                label="Peso"
                placeholder="Peso"
                value={peso}
                onChangeText={setPeso}
                keyboardType="numeric"
                suffix="kg"
                helperText="Introduza o peso atual."
                errorText={errors.peso}
              />

              <Input
                variant="light"
                forceLight
                label="Altura"
                placeholder="Altura"
                value={altura}
                onChangeText={setAltura}
                keyboardType="numeric"
                suffix="m"
                helperText="Introduza a altura em metros."
                errorText={errors.altura}
              />

              <View>
                <Text
                  className={`mb-2 ml-1 text-sm font-semibold ${
                    isDark ? "text-white" : "text-black/80"
                  }`}
                >
                  Genero
                </Text>
                <GenderSelector
                  selected={genero}
                  onSelect={setGenero}
                  isDark={isDark}
                />
                {errors.genero ? (
                  <View
                    className={`mt-2 rounded-2xl px-3 py-3 ${
                      isDark ? "bg-[#4A1D24]" : "bg-[#FFF1F2]"
                    }`}
                  >
                    <Text
                      className={`text-xs ${
                        isDark ? "text-red-100" : "text-red-700"
                      }`}
                    >
                      Corrija este campo: {errors.genero}. Selecione uma opcao
                      para continuar.
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View className="flex-1" />

            <View className="mb-8 items-center">
              <Button
                variant="primary"
                forceLight
                label={isSaving ? "A guardar..." : "Avancar"}
                onPress={() => {
                  void handleAdvance();
                }}
                loading={isSaving}
              />
            </View>
          </KeyboardAwareScrollView>
        </SafeAreaView>
      </View>
    </LightBackground>
  );
}
