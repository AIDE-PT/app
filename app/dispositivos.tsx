import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "../components/buttons/backButton";
import AddDeviceModal, { Device } from "../components/modals/AddDeviceModal";
import DeviceConnectionModal from "../components/modals/DeviceConnectionModal";
import DeviceManagementModal, {
  DeviceWithStatus,
} from "../components/modals/DeviceManagementModal";
import AddIcon from "../components/svg/AddIcon";
import LightBackground from "@/components/DotBackground";
import { useTheme } from "@/hooks/useTheme";
import Svg, { Circle, Path } from "react-native-svg";

function DeviceShareStatusIcon({
  enabled,
  color,
  size = 22,
}: {
  enabled: boolean;
  color: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {enabled ? (
        <>
          <Path
            d="M3 9C7 5 17 5 21 9"
            stroke={color}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M6 12C9 9 15 9 18 12"
            stroke={color}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M9 15C10.5 13.7 13.5 13.7 15 15"
            stroke={color}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx={12} cy={18} r={1.8} fill={color} />
        </>
      ) : (
        <>
          <Path
            d="M7 7L17 17"
            stroke={color}
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M17 7L7 17"
            stroke={color}
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </Svg>
  );
}

const ALL_DEVICES: Device[] = [
  { id: "apple-healthkit", name: "Apple Healthkit" },
  { id: "health-connect", name: "Health Connect" },
  { id: "fitbit", name: "Fitbit" },
  { id: "vitalera", name: "Vitalera" },
  { id: "garmin", name: "Garmin" },
];

export default function DispositivosPage() {
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [connectionModalVisible, setConnectionModalVisible] = useState(false);
  const [managementModalVisible, setManagementModalVisible] = useState(false);

  const [pendingDevice, setPendingDevice] = useState<Device | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<DeviceWithStatus | null>(
    null,
  );

  const [addedDevices, setAddedDevices] = useState<DeviceWithStatus[]>([
    {
      id: "apple-healthkit",
      name: "Apple Healthkit",
      isDataSharingEnabled: true,
    },
    {
      id: "health-connect",
      name: "Health Connect",
      isDataSharingEnabled: true,
    },
    { id: "fitbit", name: "Fitbit", isDataSharingEnabled: true },
  ]);

  const availableDevices = ALL_DEVICES.filter(
    (device) => !addedDevices.find((added) => added.id === device.id),
  );

  const { isDark, colors } = useTheme();

  // Handle device selection from AddDeviceModal
  const handleSelectDevice = (device: Device) => {
    setPendingDevice(device);
    setAddModalVisible(false);
    setConnectionModalVisible(true);
  };

  // Handle confirmed connection
  const handleConnectionConfirm = () => {
    if (pendingDevice) {
      setAddedDevices([
        ...addedDevices,
        { ...pendingDevice, isDataSharingEnabled: true },
      ]);
    }
    setConnectionModalVisible(false);
    setPendingDevice(null);
  };

  // Handle clicking on an existing device
  const handleDeviceClick = (device: DeviceWithStatus) => {
    setSelectedDevice(device);
    setManagementModalVisible(true);
  };

  // Handle removing a device
  const handleRemoveDevice = () => {
    if (selectedDevice) {
      setAddedDevices(addedDevices.filter((d) => d.id !== selectedDevice.id));
    }
    setManagementModalVisible(false);
    setSelectedDevice(null);
  };

  // Handle toggling data sharing
  const handleToggleDataSharing = (enabled: boolean) => {
    if (selectedDevice) {
      const updatedDevices = addedDevices.map((d) =>
        d.id === selectedDevice.id
          ? { ...d, isDataSharingEnabled: enabled }
          : d,
      );
      setAddedDevices(updatedDevices);
      setSelectedDevice({ ...selectedDevice, isDataSharingEnabled: enabled });
    }
  };

  return (
    <LightBackground>
      <View className="flex-1 px-4 pt-10">
        <SafeAreaView className="flex-1">
        <View className="mb-4">
          <BackButton label="Gerir Dispositivos" dark={isDark} />
        </View>

        <View className="mb-8">
          <Text className={`font-open-sans text-[18px] mb-8 leading-6 ${isDark ? "text-white/60" : "text-[#00072099]"}`}>
            Adicione uma fonte de dados para aceder a novas metricas
          </Text>

          {/* Grid */}
          <View className="flex-row flex-wrap justify-between">
            {addedDevices.map((device) => {
              return (
                <TouchableOpacity
                  key={device.id}
                  onPress={() => handleDeviceClick(device)}
                  accessibilityRole="button"
                  accessibilityLabel={`${device.name}${device.isDataSharingEnabled ? ", partilha de dados ativa" : ", partilha de dados inativa"}`}
                  accessibilityHint="Abre a gestão deste dispositivo."
                  style={{
                    boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)",
                    borderColor: device.isDataSharingEnabled
                      ? colors.semantic.success
                      : undefined,
                  }}
                  className={`w-[48%] aspect-[1.47] border-2 rounded-[20px] items-start mb-4 ${
                    isDark ? "bg-aide-dark-card" : "bg-white"
                  } ${
                    device.isDataSharingEnabled
                      ? ""
                      : isDark ? "border-white/10" : "border-[#E9E9E9]"
                  }`}
                >
                  <View className="h-full w-full px-4 py-3">
                    <View className="flex-row justify-end">
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: isDark ? "rgba(255,255,255,0.09)" : "#F1F5F9" }}
                      >
                        <DeviceShareStatusIcon
                          enabled={device.isDataSharingEnabled}
                          size={22}
                          color={device.isDataSharingEnabled ? colors.semantic.success : (isDark ? "rgba(255,255,255,0.55)" : "#94A3B8")}
                        />
                      </View>
                    </View>

                    <View className="flex-1 justify-center -mt-1">
                      <View className="flex-row items-center gap-3 flex-1">
                        <View className={`w-11 h-11 rounded-full items-center justify-center ${isDark ? "bg-white/20" : "bg-[#E9E9E9]"}`}>
                          <Text className={`font-open-sans font-bold text-base ${isDark ? "text-white" : "text-black"}`}>
                            {device.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text
                          numberOfLines={2}
                          className={`font-open-sans font-bold text-[15px] leading-5 flex-1 ${isDark ? "text-white" : "text-black"}`}
                        >
                          {device.name}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Add Button */}
            <TouchableOpacity
              onPress={() => setAddModalVisible(true)}
              style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
              className={`w-[48%] aspect-[1.47] rounded-[20px] items-center justify-center mb-4 ${isDark ? "bg-aide-dark-card" : "bg-white"}`}
              accessibilityRole="button"
              accessibilityLabel="Adicionar dispositivo"
              accessibilityHint="Abre a lista de dispositivos disponíveis."
            >
              <View className="items-center justify-center">
                <AddIcon size={32} color={isDark ? "#ffffff" : "#000746"} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Add Device Modal */}
        <AddDeviceModal
          visible={addModalVisible}
          onClose={() => setAddModalVisible(false)}
          availableDevices={availableDevices}
          onSelectDevice={handleSelectDevice}
        />

        {/* Connection Confirmation Modal */}
        <DeviceConnectionModal
          visible={connectionModalVisible}
          onClose={() => {
            setConnectionModalVisible(false);
            setPendingDevice(null);
          }}
          onConfirm={handleConnectionConfirm}
          device={pendingDevice}
        />

        {/* Device Management Modal */}
        <DeviceManagementModal
          visible={managementModalVisible}
          onClose={() => {
            setManagementModalVisible(false);
            setSelectedDevice(null);
          }}
          onRemove={handleRemoveDevice}
          onToggleDataSharing={handleToggleDataSharing}
          device={selectedDevice}
        />
      </SafeAreaView>
    </View>
  </LightBackground>
  );
}
