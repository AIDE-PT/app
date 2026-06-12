import { useHealthMetric } from "@/hooks/useLatestMetric";
import React, { useEffect } from "react";
import WidgetIcon, { IconType } from "../svg/WidgetIcon";
import { METRIC_STYLES, WidgetWrapper } from "./WidgetWrapper";

interface Props {
  type: IconType;
  endpoint: string;
  variant: "1-1" | "1-2" | "1-3" | "2-3";
  iconSize?: number;
  patientId?: string | null;
}

export default function DashboardMetricWidget({
  type,
  endpoint,
  variant,
  iconSize = 20,
  patientId,
}: Props) {
  const isBP = type === "bloodPressure";
  const { data, isLoading } = useHealthMetric(endpoint, isBP, patientId);
  const isStepsWidget = type === "steps";

  const styles = METRIC_STYLES[type];

  useEffect(() => {
    if (!isStepsWidget) return;

    console.log("[StepsWidget] state", {
      endpoint,
      variant,
      isLoading,
      hasData: Boolean(data),
    });

    if (!data) return;

    console.log("[StepsWidget] payload", {
      displayValue: data.displayValue,
      historyLength: data.history.length,
      latest: data.latest,
      latestBucketsPreview: data.history.slice(0, 6),
    });
  }, [data, endpoint, isLoading, isStepsWidget, variant]);

  // 1. Enquanto carrega
  if (isLoading) {
    return (
      <WidgetWrapper
        title={styles.title}
        icon={<WidgetIcon variant={type} size={iconSize} />}
        variant={variant}
        value="--"
        unit={styles.unit}
        feedback="loading"
        feedbackColor="#E5E7EB"
        history={[]}
        color={styles.color}
      />
    );
  }

  // 2. Se a API falhar ou não houver dados (evita o erro do undefined)
  if (!data) {
    return (
      <WidgetWrapper
        title={styles.title}
        icon={<WidgetIcon variant={type} size={iconSize} />}
        variant={variant}
        value="--"
        unit={styles.unit}
        feedback="offline"
        feedbackColor="#FCA5A5"
        history={[]}
        color={styles.color}
      />
    );
  }

  // 3. RENDERIZAÇÃO FINAL (Ligado às variáveis reais)
  // Calculate sparkline height based on type and variant
  const getSparklineHeight = () => {
    if (type === "temp") {
      return variant === "2-3" ? 160 : 80; // Double height for 2-3 variant
    }
    return 24;
  };

  // Calculate value offset based on type and variant
  const getValueOffset = () => {
    if (type === "temp") {
      return variant === "2-3" ? 150 : 40; // More offset for 2-3 variant
    }
    return 10;
  };

  return (
    <WidgetWrapper
      title={styles.title}
      icon={<WidgetIcon variant={type} size={iconSize} />}
      variant={variant}
      // USAR displayValue (que já trata BP e valores normais)
      value={data.displayValue}
      unit={styles.unit}
      feedback="live"
      feedbackColor={styles.feedbackColor}
      // USAR o history processado (array de números)
      history={data.history}
      metricType={type}
      color={styles.color}
      yMin={type === "temp" ? 35 : undefined}
      yMax={type === "temp" ? 40 : undefined}
      segments={type === "temp" ? 5 : 3}
      sparklineHeight={getSparklineHeight()}
      valueOffsetBottom={getValueOffset()}
    />
  );
}
