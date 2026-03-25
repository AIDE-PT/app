import React, { useState, useEffect } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isAfter,
  isBefore,
  isToday,
} from "date-fns";
import { pt } from "date-fns/locale";
import { useTheme } from "@/hooks/useTheme";

const CELL_SIZE = 44;
const BRIDGE_VERTICAL_INSET = 4;

interface CalendarModalProps {
  isVisible: boolean;
  onClose: () => void;
  mode: "day" | "period";
  onSelectDay: (date: Date) => void;
  onSelectPeriod: (startDate: Date, endDate: Date) => void;
  initialDate?: Date;
}

export const CalendarModal = ({
  isVisible,
  onClose,
  mode,
  onSelectDay,
  onSelectPeriod,
  initialDate = new Date(),
}: CalendarModalProps) => {
  const { isDark } = useTheme();

  const [currentMonth, setCurrentMonth] = useState(initialDate);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // ── Theme-derived colours ─────────────────────────────────────────────────
  const cardBg = isDark ? "#080C1F" : "#FFFFFF";
  const cardBorder = isDark ? "rgba(80, 97, 255, 0.35)" : "transparent";
  const titleColor = isDark ? "#FFFFFF" : "#1C1C1E";
  const arrowColor = isDark ? "#FFFFFF" : "#1C1C1E";
  const weekLabelColor = isDark ? "rgba(255,255,255,0.62)" : "#6B7280";
  const dayTextColor = isDark ? "#FFFFFF" : "#1C1C1E";
  const todayColor = "#3B5BDB";
  const rangeColor = isDark ? "rgba(80, 97, 255, 0.22)" : "#E8EDFF";
  const startCircle = isDark ? "#FFFFFF" : "#1C1C1E";
  const startText = isDark ? "#1C1C1E" : "#FFFFFF";
  const endCircle = "#BBC8FF";
  const endText = "#1C1C1E";
  const hintColor = isDark ? "rgba(255,255,255,0.72)" : "#4B5563";
  const applyActiveBg = isDark ? "#FFFFFF" : "#1C1C1E";
  const applyActiveText = isDark ? "#1C1C1E" : "#FFFFFF";
  const applyDisabledBg = isDark ? "rgba(255,255,255,0.12)" : "#E5E7EB";
  const applyDisabledText = isDark ? "rgba(255,255,255,0.52)" : "#6B7280";
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isVisible) {
      setSelectedDay(null);
      setStartDate(null);
      setEndDate(null);
      setCurrentMonth(initialDate);
    }
  }, [initialDate, isVisible]);

  const nextMonth = () => setCurrentMonth((m) => addMonths(m, 1));
  const prevMonth = () => setCurrentMonth((m) => subMonths(m, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const handleDayPress = (day: Date) => {
    if (!isSameMonth(day, monthStart)) return;

    if (mode === "day") {
      setSelectedDay(day);
      onSelectDay(day);
      onClose();
      return;
    }

    if (!startDate || (startDate && endDate)) {
      setStartDate(day);
      setEndDate(null);
    } else {
      if (isSameDay(day, startDate)) {
        setStartDate(null);
        setEndDate(null);
      } else if (isBefore(day, startDate)) {
        setStartDate(day);
        setEndDate(startDate);
      } else {
        setEndDate(day);
      }
    }
  };

  const handleApply = () => {
    if (startDate && endDate) {
      onSelectPeriod(startDate, endDate);
      onClose();
    }
  };

  const renderDay = (day: Date, index: number) => {
    const inCurrentMonth = isSameMonth(day, monthStart);
    const isSelectedSingle =
      mode === "day" && !!selectedDay && isSameDay(day, selectedDay);
    const isStart = !!startDate && isSameDay(day, startDate);
    const isEnd = !!endDate && isSameDay(day, endDate);
    const hasRange = !!startDate && !!endDate;
    const isBetween =
      hasRange && isAfter(day, startDate!) && isBefore(day, endDate!);

    const leftBridged = hasRange && (isEnd || isBetween);
    const rightBridged = hasRange && (isStart || isBetween);

    const circleColor =
      isSelectedSingle || isStart
        ? startCircle
        : isEnd
          ? endCircle
          : "transparent";

    const textColor =
      isSelectedSingle || isStart ? startText : isEnd ? endText : dayTextColor;

    return (
      <TouchableOpacity
        key={index}
        style={styles.cell}
        onPress={() => handleDayPress(day)}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={format(day, "d 'de' MMMM yyyy", { locale: pt })}
        accessibilityHint={
          mode === "day"
            ? "Seleciona este dia."
            : "Seleciona esta data para o período."
        }
        accessibilityState={{
          disabled: !inCurrentMonth,
          selected: isSelectedSingle || isStart || isEnd,
        }}
      >
        {/* Left-half bridge strip */}
        <View
          style={[
            styles.halfStrip,
            styles.leftStrip,
            { backgroundColor: leftBridged ? rangeColor : "transparent" },
          ]}
        />
        {/* Right-half bridge strip */}
        <View
          style={[
            styles.halfStrip,
            styles.rightStrip,
            { backgroundColor: rightBridged ? rangeColor : "transparent" },
          ]}
        />
        {/* Circle */}
        <View style={[styles.circle, { backgroundColor: circleColor }]}>
          <Text
            style={[
              styles.dayText,
              { color: textColor, opacity: inCurrentMonth ? 1 : 0 },
              (isSelectedSingle || isStart || isEnd) && styles.dayTextBold,
              isToday(day) &&
                !isSelectedSingle &&
                !isStart &&
                !isEnd && { fontWeight: "700", color: todayColor },
            ]}
          >
            {format(day, "d")}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const canApply = mode === "period" && !!startDate && !!endDate;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      {/* ── Blurred backdrop ── */}
      <BlurView
        intensity={55}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Tap-to-dismiss overlay ── */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fechar calendário"
        accessibilityHint="Fecha a janela do calendário."
      >
        {/* ── Card ── */}
        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
              borderWidth: isDark ? 1 : 0,
            },
          ]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Month header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={prevMonth}
              style={styles.arrowBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Mês anterior"
            >
              <Text style={[styles.arrow, { color: arrowColor }]}>‹</Text>
            </TouchableOpacity>
            <Text style={[styles.monthTitle, { color: titleColor }]}>
              {format(currentMonth, "MMMM yyyy", { locale: pt })}
            </Text>
            <TouchableOpacity
              onPress={nextMonth}
              style={styles.arrowBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Mês seguinte"
            >
              <Text style={[styles.arrow, { color: arrowColor }]}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Weekday labels */}
          <View style={styles.weekRow}>
            {DIAS_SEMANA.map((d) => (
              <Text
                key={d}
                style={[styles.weekDayLabel, { color: weekLabelColor }]}
              >
                {d}
              </Text>
            ))}
          </View>

          {/* Day grid */}
          {weeks.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((day, di) => renderDay(day, wi * 7 + di))}
            </View>
          ))}

          {/* Period hint */}
          {mode === "period" && (
            <View style={styles.hintRow}>
              {!startDate ? (
                <Text style={[styles.hintText, { color: hintColor }]}>
                  Selecione a data de início
                </Text>
              ) : !endDate ? (
                <Text style={[styles.hintText, { color: hintColor }]}>
                  Selecione a data de fim
                </Text>
              ) : (
                <Text style={[styles.hintText, { color: hintColor }]}>
                  {format(startDate, "d MMM", { locale: pt })} –{" "}
                  {format(endDate, "d MMM yyyy", { locale: pt })}
                </Text>
              )}
            </View>
          )}

          {/* Apply button */}
          {mode === "period" && (
            <TouchableOpacity
              style={[
                styles.applyBtn,
                { backgroundColor: canApply ? applyActiveBg : applyDisabledBg },
              ]}
              onPress={handleApply}
              disabled={!canApply}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Aplicar período"
              accessibilityHint="Confirma o intervalo de datas selecionado."
            >
              <Text
                style={[
                  styles.applyBtnText,
                  { color: canApply ? applyActiveText : applyDisabledText },
                ]}
              >
                Aplicar Período
              </Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
    width: "92%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  arrow: {
    fontSize: 30,
    lineHeight: 32,
    fontWeight: "300",
    includeFontPadding: false,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "capitalize",
  },
  weekRow: {
    flexDirection: "row",
  },
  weekDayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    paddingBottom: 10,
    letterSpacing: 0.4,
  },
  cell: {
    flex: 1,
    height: CELL_SIZE,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  halfStrip: {
    position: "absolute",
    top: BRIDGE_VERTICAL_INSET,
    bottom: BRIDGE_VERTICAL_INSET,
    width: "50%",
  },
  leftStrip: { left: 0 },
  rightStrip: { right: 0 },
  circle: {
    width: CELL_SIZE - 4,
    height: CELL_SIZE - 4,
    borderRadius: (CELL_SIZE - 4) / 2,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  dayText: {
    fontSize: 15,
    fontWeight: "400",
  },
  dayTextBold: {
    fontWeight: "700",
  },
  hintRow: {
    alignItems: "center",
    marginTop: 14,
    marginBottom: 2,
  },
  hintText: {
    fontSize: 13,
    fontWeight: "500",
  },
  applyBtn: {
    marginTop: 14,
    borderRadius: 100,
    paddingVertical: 15,
    alignItems: "center",
  },
  applyBtnText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
