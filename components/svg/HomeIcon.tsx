import React from "react";
import { Path, Svg, SvgProps } from "react-native-svg";

const HomeIcon = ({
  className,
  size = 24,
  ...props
}: SvgProps & { className?: string; size?: number }) => {
  return (
    <Svg width="19" height="20" viewBox="0 0 19 20" fill="none">
      <Path
        d="M9.16667 0L0 8.33333V20H6.66667V14.1667C6.66667 13.5036 6.93006 12.8677 7.3989 12.3989C7.86774 11.9301 8.50363 11.6667 9.16667 11.6667C9.82971 11.6667 10.4656 11.9301 10.9344 12.3989C11.4033 12.8677 11.6667 13.5036 11.6667 14.1667V20H18.3333V8.33333L9.16667 0Z"
        fill="#191919"
      />
    </Svg>
  );
};

export default HomeIcon;
