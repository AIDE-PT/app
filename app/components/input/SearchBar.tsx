import React, { useEffect, useState } from "react";
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
  const [searchValue, setSearchValue] = useState(
    typeof props.value === "string" ? props.value : "",
  );

  useEffect(() => {
    if (typeof props.value === "string") {
      setSearchValue(props.value);
    }
  }, [props.value]);

  const handleChangeText = (text: string) => {
    setSearchValue(text);
    if (props.onChangeText) {
      props.onChangeText(text);
    }
    if (onSearch) {
      onSearch(text);
    }
  };

  const handleSearchPress = () => {
    onSearch?.(searchValue);
  };

  return (
    <View className="w-full">
      <View
        className={`w-full flex-row items-center px-4 py-1 rounded-[20px] border border-[#5061FF]/20
                    ${isDarkVariant ? "bg-black/60" : "bg-white/90"}`}
        style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
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
          accessibilityLabel={props.accessibilityLabel ?? placeholder}
          accessibilityHint={props.accessibilityHint ?? "Introduza um termo para pesquisar."}
          accessibilityLanguage="pt-PT"
          {...props}
        />

        <TouchableOpacity
          className="ml-2"
          activeOpacity={0.7}
          onPress={handleSearchPress}
          accessibilityRole="button"
          accessibilityLabel="Pesquisar"
          accessibilityHint="Executa a pesquisa com o texto introduzido."
          accessibilityLanguage="pt-PT"
        >
          <SearchIcon
            size={20}
            color={isDarkVariant ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};
