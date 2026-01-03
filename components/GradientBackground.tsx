import { LinearGradient } from "expo-linear-gradient";
import { createContext, useContext, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { SharedValue, useSharedValue } from "react-native-reanimated";

// Context to share scroll position (kept for compatibility)
interface GradientContextType {
    scrollY: SharedValue<number>;
    contentHeight: SharedValue<number>;
}

const GradientContext = createContext<GradientContextType | null>(null);

// Hook to access scroll values
export const useGradientScroll = () => {
    const context = useContext(GradientContext);
    if (!context) {
        throw new Error("useGradientScroll must be used within GradientBackground");
    }
    return context;
};

interface GradientBackgroundProps {
    children?: React.ReactNode;
}

export const GradientBackground = ({ children }: GradientBackgroundProps) => {
    const scrollY = useSharedValue(0);
    const contentHeight = useSharedValue(0);

    // Create context value (kept for compatibility with scroll tracking)
    const contextValue = useMemo(() => ({
        scrollY,
        contentHeight,
    }), [scrollY, contentHeight]);

    return (
        <GradientContext.Provider value={contextValue}>
            <View style={styles.container}>
                {/* Static gradient from aide-white to aide-navbar */}
                <LinearGradient
                    colors={['#FFFFFF', '#ECF5FF']} // aide-white to aide-background
                    locations={[0, 1]}
                    style={StyleSheet.absoluteFillObject}
                />

                {/* Content */}
                {children}
            </View>
        </GradientContext.Provider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default GradientBackground;

