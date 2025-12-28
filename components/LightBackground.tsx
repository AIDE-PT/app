import { LinearGradient } from "expo-linear-gradient";
import { Dimensions, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Dot Pattern Component
const DotPattern = () => {
    const dotSpacing = 24;
    const dotSize = 3;
    const cols = Math.ceil(SCREEN_WIDTH / dotSpacing) + 1;
    const rows = Math.ceil(SCREEN_HEIGHT / dotSpacing) + 1;

    const dots = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            dots.push(
                <Circle
                    key={`${row}-${col}`}
                    cx={col * dotSpacing + dotSpacing / 2}
                    cy={row * dotSpacing + dotSpacing / 2}
                    r={dotSize / 2}
                    fill="white"
                    opacity={0.5}
                />
            );
        }
    }

    return (
        <View
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
            }}
        >
            <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
                {dots}
            </Svg>
        </View>
    );
};

interface LightBackgroundProps {
    children?: React.ReactNode;
}

export const LightBackground = ({ children }: LightBackgroundProps) => {
    return (
        <View style={{ flex: 1 }}>
            {/* Background Gradient - Light at top, lavender-blue at bottom */}
            <LinearGradient
                colors={['#FFFFFF', '#919cfeff']}
                locations={[0,1]}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                }}
            />

            {/* Dot Pattern Overlay */}
            <DotPattern />

            {/* Content */}
            {children}
        </View>
    );
};

export default LightBackground;
