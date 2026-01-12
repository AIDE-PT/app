import { useFonts } from "expo-font";
import { router } from "expo-router";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AddDeviceModal, { Device } from "../components/modals/AddDeviceModal";
import DeviceConnectionModal from "../components/modals/DeviceConnectionModal";
import DeviceManagementModal, {
  DeviceWithStatus,
} from "../components/modals/DeviceManagementModal";
import AddIcon from "../components/svg/AddIcon";
import ArrowIcon from "../components/svg/ArrowIcon";

const ALL_DEVICES: Device[] = [
  { id: "apple-healthkit", name: "Apple Healthkit" },
  { id: "health-connect", name: "Health Connect" },
  { id: "fitbit", name: "Fitbit" },
  { id: "vitalera", name: "Vitalera" },
  { id: "garmin", name: "Garmin" },
];

export default function DispositivosPage() {
  const [fontsLoaded] = useFonts({
    "Safiro-Medium": require("../assets/fonts/safiro/safiro-medium-webfont.ttf"),
    "OpenSans-Regular": require("../assets/fonts/open-sans/OpenSans-Regular.ttf"),
    "OpenSans-SemiBold": require("../assets/fonts/open-sans/OpenSans-SemiBold.ttf"),
  });

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [connectionModalVisible, setConnectionModalVisible] = useState(false);
  const [managementModalVisible, setManagementModalVisible] = useState(false);

  const [pendingDevice, setPendingDevice] = useState<Device | null>(null);
  const [selectedDevice, setSelectedDevice] =
    useState<DeviceWithStatus | null>(null);

  const [addedDevices, setAddedDevices] = useState<DeviceWithStatus[]>([
    { id: "apple-healthkit", name: "Apple Healthkit", isDataSharingEnabled: true },
    { id: "health-connect", name: "Health Connect", isDataSharingEnabled: true },
    { id: "fitbit", name: "Fitbit", isDataSharingEnabled: true },
  ]);

  const availableDevices = ALL_DEVICES.filter(
    (device) => !addedDevices.find((added) => added.id === device.id)
  );

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
      setAddedDevices(
        addedDevices.filter((d) => d.id !== selectedDevice.id)
      );
    }
    setManagementModalVisible(false);
    setSelectedDevice(null);
  };

  // Handle toggling data sharing
  const handleToggleDataSharing = (enabled: boolean) => {
    if (selectedDevice) {
      const updatedDevices = addedDevices.map((d) =>
        d.id === selectedDevice.id ? { ...d, isDataSharingEnabled: enabled } : d
      );
      setAddedDevices(updatedDevices);
      setSelectedDevice({ ...selectedDevice, isDataSharingEnabled: enabled });
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-[#ECF5FF]">
      <View className="flex-1">
        {/* Header - Consistent with associar.tsx */}
        <View className="px-6 pt-12 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ArrowIcon variant="LEFT" dark size={24} />
          </TouchableOpacity>
          <Text className="font-safiro text-2xl text-black ml-2">
            Gerir Dispositivos
          </Text>
        </View>

        <View className="flex-1 px-8 pt-10">
          <Text className="font-open-sans text-[18px] text-[#00072099] mb-8 leading-6">
            Adicione uma fonte de dados para aceder a novas metricas
          </Text>

          {/* Grid */}
          <View className="flex-row flex-wrap justify-between">
            {addedDevices.map((device) => {
              const nameWords = device.name.split(" ");
              return (
                <TouchableOpacity
                  key={device.id}
                  onPress={() => handleDeviceClick(device)}
                  className={`w-[48%] aspect-[1.47] bg-white border-2 rounded-[20px] items-center justify-center shadow-sm mb-4 ${
                    device.isDataSharingEnabled
                      ? "border-[#4cd964]"
                      : "border-[#E9E9E9]"
                  }`}
                >
                  <View className="flex-row items-center gap-2">
                    <View className="w-12 h-12 bg-[#E9E9E9] rounded-full items-center justify-center">
                      <Text className="font-open-sans font-bold text-xl text-black">
                        {device.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      {nameWords.length > 1 ? (
                        nameWords.map((word, index) => (
                          <Text
                            key={index}
                            className="font-open-sans font-bold text-sm text-black leading-4"
                          >
                            {word}
                          </Text>
                        ))
                      ) : (
                        <Text className="font-open-sans font-bold text-base text-black">
                          {device.name}
                        </Text>
                      )}
                    </View>
                  </View>
                  {!device.isDataSharingEnabled && (
                    <View className="absolute top-2 right-2">
                      <View className="w-3 h-3 rounded-full bg-[#E9E9E9]" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Add Button */}
            <TouchableOpacity
              onPress={() => setAddModalVisible(true)}
              className="w-[48%] aspect-[1.47] bg-white rounded-[20px] items-center justify-center shadow-sm mb-4"
            >
              <View className="items-center justify-center">
                <AddIcon size={32} color="#000746" />
              </View>
            </TouchableOpacity>
          </View>
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
  );
}
