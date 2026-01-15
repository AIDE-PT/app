import { Text, TouchableOpacity } from "react-native";

interface buttonDTO {
  variant: "primary" | "primaryDark" | "list" | "listDark";
  label: string;
  onPress: () => void;
}

export const Button = ({ variant = "primary", label, onPress }: buttonDTO) => {
  const containerVariants = {
    primary: " items-center w-[242px] bg-white/90  ",
    primaryDark: " items-center bg-black/60 w-[242px]",
    list: " items-start bg-white/90  ",
    listDark: "items-start bg-black/60",
  };

  const textVariants = {
    primary: "font-open-sans text-[20px] font-bold text-black/90",
    list: "font-open-sans text-[20px] mx-2 text-black/90",
    primaryDark: "font-open-sans text-[20px] font-bold text-white",
    listDark: "font-open-sans text-[20px] mx-2 text-white",
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`p-3 rounded-[20px] border border-[#5061FF]/20
                 ${containerVariants[variant]}`}
    >
      <Text className={`text-center mx-auto ${textVariants[variant]}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};
