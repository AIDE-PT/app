import React from "react";
import { Svg, Path, SvgProps } from "react-native-svg";

const ProfileIcon = ({
  className,
  size = 24,
  color = "#191915",
  ...props
}: SvgProps & { className?: string; size?: number; color?: string }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 17 20" fill="none">
      <Path
        d="M8.33333 10C12.9358 10 16.6667 13.7308 16.6667 18.3333V20H0V18.3333C0 13.7308 3.73083 10 8.33333 10ZM8.33333 9.16667C7.11776 9.16667 5.95197 8.68378 5.09243 7.82424C4.23289 6.9647 3.75 5.79891 3.75 4.58333C3.75 3.36776 4.23289 2.20197 5.09243 1.34243C5.95197 0.482886 7.11776 0 8.33333 0C9.54891 0 10.7147 0.482886 11.5742 1.34243C12.4338 2.20197 12.9167 3.36776 12.9167 4.58333C12.9167 5.79891 12.4338 6.9647 11.5742 7.82424C10.7147 8.68378 9.54891 9.16667 8.33333 9.16667Z"
        fill={color}
      />
    </Svg>
  );
};

export default ProfileIcon;
