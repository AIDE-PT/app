import React, { useState } from "react";
// import React, { useState } from 'react';
// import { TextInput, View, StyleSheet, TextInputProps, TouchableOpacity, Platform, Text } from 'react-native';
// import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
// import ArrowIcon from '../svg/ArrowIcon';
// import EyeIcon from '../svg/EyeIcon';
// import CalendarIcon from '../svg/CalendarIcon';

// interface InputDTO extends TextInputProps {
//     variant?: 'light' | 'dark';
//     type?: 'text' | 'password' | 'date' | 'email'; // Adicionado 'email'
//     dateValue?: Date;
//     onDateChange?: (date: Date) => void;
// }

// export const Input = ({ variant = 'light', type = 'text', dateValue, onDateChange, ...props }: InputDTO) => {
//     const [showPassword, setShowPassword] = useState(false);
//     const [showDatePicker, setShowDatePicker] = useState(false);
//     const [currentDate, setCurrentDate] = useState(dateValue || new Date());
//     const [isEmailValid, setIsEmailValid] = useState(true);

//     const isDarkVariant = variant === 'dark';
//     const isPassword = type === 'password';
//     const isDate = type === 'date';
//     const isEmail = type === 'email';

//     const formattedDate = currentDate.toLocaleDateString('pt-PT');

//     // Validação de e-mail simples (Regex)
//     const validateEmail = (email: string) => {
//         const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         const isValid = regex.test(email);
//         setIsEmailValid(isValid || email.length === 0); // Vazio não mostra erro
//         if (props.onChangeText) props.onChangeText(email);
//     };

//     const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
//         setShowDatePicker(Platform.OS === 'ios');
//         if (selectedDate) {
//             setCurrentDate(selectedDate);
//             if (onDateChange) onDateChange(selectedDate);
//         }
//     };

//     return (
//         <View className="w-full">
//             <TouchableOpacity
//                 activeOpacity={1}
//                 onPress={() => isDate && setShowDatePicker(true)}
//                 style={styles.inputShadow}
//                 className={`w-full flex-row items-center px-4 py-1 rounded-[16px] border
//                     ${!isEmailValid ? 'border-red-500/50' : 'border-[#5061FF]/20'}
//                     ${isDarkVariant ? 'bg-black/60' : 'bg-white/90'}`}
//             >
//                 <TextInput
//                     className={`flex-1 h-12 text-base ${isDarkVariant ? 'text-white' : 'text-black/90'}`}
//                     placeholderTextColor={isDarkVariant ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
//                     // Lógica para E-mail
//                     autoCapitalize={isEmail ? "none" : props.autoCapitalize}
//                     autoCorrect={isEmail ? false : props.autoCorrect}
//                     keyboardType={isEmail ? "email-address" : (isDate ? 'numeric' : props.keyboardType)}
//                     onChangeText={isEmail ? validateEmail : props.onChangeText}

//                     secureTextEntry={isPassword && !showPassword}
//                     editable={!isDate}
//                     value={isDate ? formattedDate : props.value}
//                     pointerEvents={isDate ? 'none' : 'auto'}
//                     {...props}
//                 />

//                 {isPassword && (
//                     <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="ml-2">
//                         <EyeIcon variant={showPassword ? 'open' : 'close'} size={20} fill={isDarkVariant ? 'white' : '#111111'} />
//                     </TouchableOpacity>
//                 )}

//                 {isDate && (
//                     <View className="ml-2">
//                         <CalendarIcon />
//                     </View>
//                 )}
//             </TouchableOpacity>

//             {/* Feedback visual de erro */}
//             {isEmail && !isEmailValid && (
//                 <Text className="text-red-500 text-[10px] ml-4 mt-1 font-bold">
//                     E-mail inválido
//                 </Text>
//             )}

//             {showDatePicker && (
//                 <DateTimePicker
//                     value={currentDate}
//                     mode="date"
//                     display={Platform.OS === 'ios' ? 'spinner' : 'default'}
//                     onChange={handleDateChange}
//                 />
//             )}
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     inputShadow: {
//         boxShadow: '0 0 50px -20px #5061FF inset',
//     },
// });
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
  TextInput,
  View,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  Platform,
  Text,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import EyeIcon from "../svg/EyeIcon";
import CalendarIcon from "../svg/CalendarIcon";

interface InputDTO extends TextInputProps {
  variant?: "light" | "dark";
  type?: "text" | "password" | "date" | "email"; // Adicionado 'email'
  dateValue?: Date;
  onDateChange?: (date: Date) => void;
  suffix?: string;
}

export const Input = ({
  variant = "light",
  type = "text",
  dateValue,
  onDateChange,
  suffix,
  ...props
}: InputDTO) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDate, setCurrentDate] = useState(dateValue || new Date());
  const [isEmailValid, setIsEmailValid] = useState(true);

  const isDarkVariant = variant === "dark";
  const isPassword = type === "password";
  const isDate = type === "date";
  const isEmail = type === "email";

  const formattedDate = currentDate.toLocaleDateString("pt-PT");

  // Validação de e-mail simples (Regex)
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = regex.test(email);
    setIsEmailValid(isValid || email.length === 0); // Vazio não mostra erro
    if (props.onChangeText) props.onChangeText(email);
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setCurrentDate(selectedDate);
      if (onDateChange) onDateChange(selectedDate);
    }
  };

  return (
    <View className="w-full">
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => isDate && setShowDatePicker(true)}
        className={`w-full flex-row items-center px-5 py-0.5 rounded-[25px] shadow
                    ${!isEmailValid ? "border border-red-500/50" : ""} 
                    ${isDarkVariant ? "bg-black/60" : "bg-white/75"}`}
      >
        <TextInput
          className={`flex-1 h-11 text-base ${isDarkVariant ? "text-white" : "text-black/90"}`}
          placeholderTextColor={
            isDarkVariant ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"
          }
          // Lógica para E-mail
          autoCapitalize={isEmail ? "none" : props.autoCapitalize}
          autoCorrect={isEmail ? false : props.autoCorrect}
          keyboardType={
            isEmail ? "email-address" : isDate ? "numeric" : props.keyboardType
          }
          onChangeText={isEmail ? validateEmail : props.onChangeText}
          secureTextEntry={isPassword && !showPassword}
          editable={!isDate}
          value={isDate ? formattedDate : props.value}
          pointerEvents={isDate ? "none" : "auto"}
          {...props}
        />

        {suffix && (
          <Text
            className={`ml-2 text-base ${isDarkVariant ? "text-white/60" : "text-black/60"}`}
          >
            {suffix}
          </Text>
        )}

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            className="ml-2"
          >
            <EyeIcon
              variant={showPassword ? "open" : "close"}
              size={20}
              fill={isDarkVariant ? "white" : "#111111"}
            />
          </TouchableOpacity>
        )}

        {isDate && (
          <View className="ml-2">
            <CalendarIcon />
          </View>
        )}
      </TouchableOpacity>
      {/* Feedback visual de erro */}
      {isEmail && !isEmailValid && (
        <Text className="text-red-500 text-[10px] ml-4 mt-1 font-bold">
          E-mail inválido
        </Text>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputShadow: {
    boxShadow: "0 0 50px -20px #5061FF inset",
  },
});
