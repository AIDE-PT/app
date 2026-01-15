import React from "react";
import {
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import SearchIcon from "../svg/SearchIcon";

interface SearchBarProps extends TextInputProps {
  variant?: "light" | "dark";
  onSearch?: (text: string) => void;
}

export const SearchBar = ({
  variant = "light",
  onSearch,
  placeholder = "Pesquisar...",
  ...props
}: SearchBarProps) => {
  const isDarkVariant = variant === "dark";

  const handleChangeText = (text: string) => {
    if (props.onChangeText) {
      props.onChangeText(text);
    }
    if (onSearch) {
      onSearch(text);
    }
  };

  return (
    <View className="w-full">
      <View
        className={`w-full flex-row items-center px-4 py-1 rounded-[20px] border border-[#5061FF]/20 shadow
                    ${isDarkVariant ? "bg-black/60" : "bg-white/90"}`}
      >
        <TextInput
          className={`flex-1 h-12 text-base ${isDarkVariant ? "text-white" : "text-black/90"}`}
          placeholderTextColor={
            isDarkVariant ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"
          }
          placeholder={placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onChangeText={handleChangeText}
          {...props}
        />

        <TouchableOpacity className="ml-2" activeOpacity={0.7}>
          <SearchIcon
            size={20}
            color={isDarkVariant ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};
