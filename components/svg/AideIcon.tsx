import { Path, Rect, Svg, SvgProps } from 'react-native-svg';

interface AideIconProps extends SvgProps {
    className?: string;
    size?: number;
    fill?: string;
}

const AideIcon = ({ className, size = 24, fill = '#000000', ...props }: AideIconProps) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 324 324" fill="none" {...props}>
            <Path
                d="M322.334 30.9101C322.334 13.027 307.801 -1.63785 290.007 0.147512C258.574 3.30136 227.713 11.0442 198.419 23.1779C159.134 39.4505 123.438 63.3017 93.3698 93.3696C63.3018 123.438 39.4506 159.133 23.1779 198.419C11.0442 227.712 3.30136 258.574 0.147512 290.006C-1.63785 307.8 13.027 322.333 30.9102 322.333C48.7934 322.333 63.0821 307.78 65.3117 290.037C68.1919 267.116 74.1315 244.634 83.0091 223.202C96.0272 191.773 115.108 163.217 139.163 139.162C163.217 115.108 191.774 96.027 223.202 83.0089C244.635 74.1313 267.116 68.1918 290.037 65.3116C307.781 63.082 322.334 48.7933 322.334 30.9101Z"
                fill={fill}
            />
            <Rect
                x="324"
                y="324.008"
                width="64.735"
                height="225.233"
                rx="32.3675"
                transform="rotate(180 324 324.008)"
                fill={fill}
            />
            <Rect
                x="215.283"
                y="243.758"
                width="64.735"
                height="64.7341"
                rx="32.367"
                transform="rotate(180 215.283 243.758)"
                fill={fill}
            />
        </Svg>
    );
};

export default AideIcon;
