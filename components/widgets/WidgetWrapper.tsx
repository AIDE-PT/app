import React, { ReactNode } from 'react';
import { View, Text, Dimensions, ViewStyle } from 'react-native';
import SimpleLineChart from '../charts/LineChartSlim';
import MiniSparkline from '../charts/MiniSparkline';

const { width: screenWidth } = Dimensions.get('window');

const GRID_PADDING = 16;
const GRID_GAP = 12;

const availableWidth = screenWidth - (GRID_PADDING * 2);
const COLUMN_WIDTH = (availableWidth - (GRID_GAP * 2)) / 3;

type WidgetVariant = "1-1" | "1-2" | "1-3" | "2-3";

interface WidgetWrapperProps {
  title: string;
  variant: WidgetVariant;
  children?: React.ReactNode;
  bg?: string;
  style?: ViewStyle;
  icon: ReactNode
  unit: string,
  feedback: string,
  feedbackColor: string,
  value: string,

}

export function WidgetWrapper({ title, icon, variant,feedback, feedbackColor, unit, value, bg = "bg-white", style }: WidgetWrapperProps) {

  const u1 = COLUMN_WIDTH - GRID_GAP;
  const u2 = (u1 * 2) + GRID_GAP;
  const u3 = (u1 * 3) + (GRID_GAP * 2);
  const getDims = () => {

    switch (variant) {
      case "1-1": return { width: u1, height: u1 };
      case "1-2": return { width: u2, height: u1 };
      case "1-3": return { width: u3, height: u1 };
      case "2-3": return { width: u3, height: u2 };
      default: return { width: u1, height: u1 };
    }
  };

  const { width, height } = getDims();

  return (
    <View
      style={[{ width, height, boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.12)' }, style]}
      className={`${bg} rounded-[16px] p-2  w-full justify-between border border-gray-100 overflow-hidden`}
    >
      {/* Header */}
      <View className='flex flex-row gap-2 '>
        {icon}
        <Text className="text-[#7C89FF] text-sm font-semibold gap-2 uppercase tracking-widest ">
          {title}
        </Text>
      </View>

      {(variant === "1-1") &&
        <>
          <Text className="text-3xl font-bold text-red-500">
            {value}
          </Text>

          <Text
            className="text-xs text-gray-400 font-semibold"
          >
            {unit}

          </Text>
        </>
      }
      {(variant === "1-3" || variant === "1-2") && <View className="flex-row w-full justify-between items-center ml-2">

        {/* ESQUERDA */}
        <View className='flex flex-row items-end'>
          <Text className="text-3xl font-bold text-red-500">
            {value}
          </Text>

          <Text
            className="text-xs text-gray-400 font-semibold"
          >
            {unit}
          </Text>
        </View>
        {/* DIREITA */}
        <View
          className="text-xs text-gray-400 mr-2 font-semibold"
        >
          <Text
            className={`text-sm bg-[${feedbackColor}] p-2 rounded-[20px] font-normal text-black`}
          >
            {feedback}
          </Text>
        </View>

      </View>}



      {variant === "2-3" && <SimpleLineChart style={{ padding: 4 }} height={u2 - 16} width={u3 - 16} />
      }
      {(variant === "1-3" || variant === "1-2") &&

        <MiniSparkline
          data={[100, 102, 101, 103, 103, 102, 104, 105, 103, 106, 108]}
          width={variant === "1-3" ? u3 - (2 * GRID_GAP) : u2 - (2 * GRID_GAP)}
          height={20}
          color="#5C6CFF"
        />
      }


    </View>
  );
}