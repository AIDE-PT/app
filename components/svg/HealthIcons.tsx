import React from "react";
import { Path, Svg, SvgProps } from "react-native-svg";

export const PressaoIcon = ({
  size = 40,
  color = "#1A1F36",
  ...props
}: SvgProps & { size?: number; color?: string }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      accessible={props.accessible ?? false}
      focusable={false}
      {...props}
    >
      <Path
        d="M20 5C14.477 5 10 9.477 10 15C10 22.5 20 35 20 35C20 35 30 22.5 30 15C30 9.477 25.523 5 20 5Z"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 15H25M20 10V20"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const GlicoseIcon = ({
  size = 40,
  color = "#1A1F36",
  ...props
}: SvgProps & { size?: number; color?: string }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      accessible={props.accessible ?? false}
      focusable={false}
      {...props}
    >
      <Path
        d="M20 5L20 8M20 8C15 14 12 18 12 23C12 28.523 15.477 33 20 33C24.523 33 28 28.523 28 23C28 18 25 14 20 8Z"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17 22H23M20 19V25"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const BpmIcon = ({
  size = 40,
  color = "#1A1F36",
  ...props
}: SvgProps & { size?: number; color?: string }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      accessible={props.accessible ?? false}
      focusable={false}
      {...props}
    >
      <Path
        d="M20 35C20 35 6 26 6 16C6 12.134 9.134 9 13 9C15.591 9 17.873 10.404 19.129 12.5C19.429 12.988 19.698 13.487 20 14C20.302 13.487 20.571 12.988 20.871 12.5C22.127 10.404 24.409 9 27 9C30.866 9 34 12.134 34 16C34 26 20 35 20 35Z"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 21H16L18 17L22 25L24 21H28"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const CalIcon = ({
  size = 40,
  color = "#1A1F36",
  ...props
}: SvgProps & { size?: number; color?: string }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      accessible={props.accessible ?? false}
      focusable={false}
      {...props}
    >
      <Path
        d="M20 6L20 10M20 10C14 16 10 20 10 26C10 32 14.477 36 20 36C25.523 36 30 32 30 26C30 20 26 16 20 10Z"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 28C22 28 24 26.5 24 24C24 21 20 18 20 18C20 18 16 21 16 24C16 26.5 18 28 20 28Z"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const PassosIcon = ({
  size = 40,
  color = "#1A1F36",
  ...props
}: SvgProps & { size?: number; color?: string }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      accessible={props.accessible ?? false}
      focusable={false}
      {...props}
    >
      <Path
        d="M12 28C12 28 8 24 8 20C8 16 10 14 14 12C18 10 16 6 16 6"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M28 34C28 34 24 30 24 26C24 22 26 20 30 18C34 16 32 12 32 12"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const StressIcon = ({
  size = 40,
  color = "#1A1F36",
  ...props
}: SvgProps & { size?: number; color?: string }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      accessible={props.accessible ?? false}
      focusable={false}
      {...props}
    >
      <Path
        d="M20 8C14 8 9 12 9 17C9 22 14 24 20 24C26 24 31 22 31 17C31 12 26 8 20 8Z"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 26C12 26 14 32 20 32C26 32 28 26 28 26"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 30H26"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const SonoIcon = ({
  size = 40,
  color = "#1A1F36",
  ...props
}: SvgProps & { size?: number; color?: string }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      accessible={props.accessible ?? false}
      focusable={false}
      {...props}
    >
      <Path
        d="M28 20C28 24.418 24.418 28 20 28C15.582 28 12 24.418 12 20C12 15.582 15.582 12 20 12"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M24 8C24 8 20 10 20 14C20 18 24 20 28 20C28 12 24 8 24 8Z"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const O2Icon = ({
  size = 40,
  color = "#1A1F36",
  ...props
}: SvgProps & { size?: number; color?: string }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      accessible={props.accessible ?? false}
      focusable={false}
      {...props}
    >
      <Path
        d="M16 6L16 10M16 10C11 16 8 20 8 25C8 30.523 11.477 34 16 34C20.523 34 24 30.523 24 25C24 20 21 16 16 10Z"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M28 22C30.209 22 32 24.239 32 27C32 29.761 30.209 32 28 32C25.791 32 24 29.761 24 27C24 24.239 25.791 22 28 22Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M32 20L32 22"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const TempIcon = ({
  size = 40,
  color = "#1A1F36",
  ...props
}: SvgProps & { size?: number; color?: string }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      accessible={props.accessible ?? false}
      focusable={false}
      {...props}
    >
      <Path
        d="M20 6V24M20 6C18.343 6 17 7.343 17 9V24.535C15.191 25.592 14 27.547 14 29.773C14 33.223 16.686 36 20 36C23.314 36 26 33.223 26 29.773C26 27.547 24.809 25.592 23 24.535V9C23 7.343 21.657 6 20 6Z"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 30C21.105 30 22 29.105 22 28C22 26.895 21.105 26 20 26C18.895 26 18 26.895 18 28C18 29.105 18.895 30 20 30Z"
        fill={color}
      />
    </Svg>
  );
};
