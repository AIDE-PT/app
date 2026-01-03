import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface buttonDTO {
    variant: 'primary' | 'primaryDark' | 'list' | 'listDark'
    label: string,
    onPress: () => void
}

export const Button = ({ variant = 'primary', label, onPress }: buttonDTO) => {
    const containerVariants = {
        primary: ' items-center w-[242px] bg-white/90  ',
        primaryDark: ' items-center bg-black/60 w-[242px]',
        list: ' items-start bg-white/90  ',
        listDark: 'items-start bg-black/60',
    };

    const textVariants = {
        primary: ' font-open-sans-semibold text-aide-text/90',
        list: 'mx-2 font-open-sans text-aide-text/90',
        primaryDark: 'font-open-sans-semibold text-aide-white',
        listDark: 'mx-2 font-open-sans text-aide-white',

    };

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.buttonShadow,]}
            className={`p-3 rounded-[16px] border border-aide-normal-blue/20
                 ${containerVariants[variant]}`}
        >
            <Text className={` ${textVariants[variant]}`}>
                {label}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    buttonShadow: {
        // Using aide-normal-blue (#5061FF) for shadow
        boxShadow: '0 0 50px -20px #5061FF inset',
    },
});