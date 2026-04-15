import { NativeModules, Platform } from "react-native";

export const HEALTH_CONNECT_SDK_UNAVAILABLE = 1;
export const HEALTH_CONNECT_SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED = 2;
export const HEALTH_CONNECT_SDK_AVAILABLE = 3;

type NativeHealthConnectModule = {
  getHealthConnectStatus: () => Promise<NativeHealthConnectStatus>;
  requestPermissions: () => Promise<NativeHealthConnectPermissionResult>;
  readSteps: (
    startEpochMs: number,
    endEpochMs: number,
  ) => Promise<NativeStepRecord[]>;
};

type NativeHealthConnectStatus = {
  available: boolean;
  installed: boolean;
  needsUpdate: boolean;
  permissionsGranted?: boolean;
  grantedPermissionsCount?: number;
  providerPackageName: string;
  sdkStatus: number;
};

type NativeStepRecord = {
  id: string;
  startTime: number;
  endTime: number;
  count: number;
  zoneOffset?: string | null;
};

type NativeHealthConnectPermissionResult = {
  granted: boolean;
  denied: boolean;
  grantedPermissions: string[];
  opened?: boolean;
};

const { HealthConnectModule } = NativeModules as {
  HealthConnectModule?: NativeHealthConnectModule;
};

export interface HealthConnectStatus {
  available: boolean;
  installed: boolean;
  needsUpdate: boolean;
  permissionsGranted: boolean;
  grantedPermissionsCount: number;
  providerPackageName: string;
  sdkStatus: number;
}

export interface StepRecord {
  id: string;
  startTime: number;
  endTime: number;
  count: number;
  zoneOffset: string | null;
}

export interface HealthConnectPermissionResult {
  granted: boolean;
  denied: boolean;
  grantedPermissions: string[];
  opened: boolean;
}

export class HealthConnectError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "HealthConnectError";
    this.code = code;
  }
}

function getNativeModule(): NativeHealthConnectModule {
  if (Platform.OS !== "android") {
    throw new HealthConnectError(
      "Health Connect is only supported on Android development builds.",
      "PLATFORM_NOT_SUPPORTED",
    );
  }

  if (!HealthConnectModule) {
    throw new HealthConnectError(
      "HealthConnectModule is not available. Rebuild the Android development client.",
      "MODULE_NOT_LINKED",
    );
  }

  return HealthConnectModule;
}

function getNativeMethod<K extends keyof NativeHealthConnectModule>(
  methodName: K,
): NonNullable<NativeHealthConnectModule[K]> {
  const module = getNativeModule();
  const method = module[methodName];

  if (typeof method !== "function") {
    throw new HealthConnectError(
      `HealthConnectModule.${String(methodName)} is not available. Rebuild the Android development client so the latest native module is loaded.`,
      "METHOD_NOT_LINKED",
    );
  }

  return method as NonNullable<NativeHealthConnectModule[K]>;
}

function toHealthConnectError(error: unknown, fallbackCode: string): HealthConnectError {
  if (typeof error === "object" && error !== null) {
    const nativeError = error as { code?: string; message?: string };
    return new HealthConnectError(
      nativeError.message ?? "Unexpected Health Connect bridge error.",
      nativeError.code ?? fallbackCode,
    );
  }

  if (error instanceof Error) {
    return new HealthConnectError(error.message, fallbackCode);
  }

  return new HealthConnectError(String(error), fallbackCode);
}

export async function getHealthConnectStatus(): Promise<HealthConnectStatus> {
  try {
    console.log("[HealthConnect] getHealthConnectStatus -> calling native bridge");
    const getStatus = getNativeMethod("getHealthConnectStatus");
    const status = await getStatus();
    console.log("[HealthConnect] getHealthConnectStatus <- native result", status);
    return {
      ...status,
      permissionsGranted: Boolean(status.permissionsGranted),
      grantedPermissionsCount: Number(status.grantedPermissionsCount ?? 0),
    };
  } catch (error) {
    throw toHealthConnectError(error, "HC_STATUS_ERROR");
  }
}

export async function readSteps(
  startEpochMs: number,
  endEpochMs: number,
): Promise<StepRecord[]> {
  if (!Number.isFinite(startEpochMs) || !Number.isFinite(endEpochMs)) {
    throw new HealthConnectError(
      "startEpochMs and endEpochMs must be valid epoch timestamps.",
      "INVALID_ARGUMENTS",
    );
  }

  if (startEpochMs >= endEpochMs) {
    throw new HealthConnectError(
      "startEpochMs must be smaller than endEpochMs.",
      "INVALID_RANGE",
    );
  }

  try {
    const readNativeSteps = getNativeMethod("readSteps");
    const records = await readNativeSteps(startEpochMs, endEpochMs);
    return records.map((record) => ({
      id: String(record.id),
      startTime: Number(record.startTime),
      endTime: Number(record.endTime),
      count: Number(record.count),
      zoneOffset: record.zoneOffset ?? null,
    }));
  } catch (error) {
    throw toHealthConnectError(error, "HC_READ_ERROR");
  }
}

export async function requestHealthConnectPermissions(): Promise<HealthConnectPermissionResult> {
  try {
    console.log("[HealthConnect] requestHealthConnectPermissions -> calling native bridge");
    const requestPermissions = getNativeMethod("requestPermissions");
    const result = await requestPermissions();
    console.log("[HealthConnect] requestHealthConnectPermissions <- native result", result);

    if (typeof result === "boolean") {
      return {
        granted: false,
        denied: false,
        grantedPermissions: [],
        opened: result,
      };
    }

    return {
      granted: Boolean(result.granted),
      denied: Boolean(result.denied),
      grantedPermissions: Array.isArray(result.grantedPermissions)
        ? result.grantedPermissions.map(String)
        : [],
      opened: Boolean(result.opened),
    };
  } catch (error) {
    throw toHealthConnectError(error, "HC_PERMISSION_ERROR");
  }
}
