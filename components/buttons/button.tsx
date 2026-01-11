import { StyleSheet, Text, TouchableOpacity } from "react-native";

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
    primary: " font-bold text-black/90",
    list: "mx-2 text-black/90",
    primaryDark: "font-bold text-white",
    listDark: "mx-2 text-white",
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.buttonShadow]}
      className={`p-3 rounded-[16px] border border-[#5061FF]/20
                 ${containerVariants[variant]}`}
    >
      <Text className={` ${textVariants[variant]}`}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonShadow: {
    boxShadow: " 0 0 50px -20px #5061FF inset",
  },
});
