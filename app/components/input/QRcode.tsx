import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import QrcodeIcon from "../svg/qrcode";

interface QRcodeProps {
  onScan: (data: string) => void;
  paused?: boolean;
  size?: number;
  className?: string;
  onPermissionResult?: (granted: boolean) => void;
}

const SCAN_THROTTLE_MS = 1200;

export function QRcode({
  onScan,
  paused = false,
  size = 176,
  className = "",
  onPermissionResult,
}: QRcodeProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [requesting, setRequesting] = useState(false);
  const [active, setActive] = useState(true);
  const scanningLock = useRef(false);

  // On mount (mobile), attempt a one-time permission request to streamline UX.
  useEffect(() => {
    if (!permission && !requesting && Platform.OS !== "web") {
      setRequesting(true);
      requestPermission().finally(() => setRequesting(false));
    }
  }, [permission, requesting, requestPermission]);

  useEffect(() => {
    if (permission && onPermissionResult) {
      onPermissionResult(!!permission.granted);
    }
  }, [permission, onPermissionResult]);

  const handleRequestPermission = useCallback(async () => {
    try {
      setRequesting(true);
      await requestPermission();
    } finally {
      setRequesting(false);
    }
  }, [requestPermission]);

  const handleScan = useCallback(
    (result: BarcodeScanningResult) => {
      if (paused) return;
      if (scanningLock.current) return;

      scanningLock.current = true;
      const value = result?.data ?? "";
      if (value) {
        console.log("QR scanned:", value);
        onScan(value);
        setActive(false); // hide camera and show placeholder after a successful scan
      }

      setTimeout(() => {
        scanningLock.current = false;
      }, SCAN_THROTTLE_MS);
    },
    [onScan, paused],
  );

  const showCamera = permission?.granted;
  const containerStyle = { width: size, height: size };

  const showScanner = showCamera && active;
  const placeholderSize = size * 1.12; // slightly oversize to visually fill the card

  const handlePlaceholderPress = async () => {
    if (!permission?.granted) {
      await handleRequestPermission();
      return;
    }
    scanningLock.current = false;
    setActive(true);
  };

  return (
    <View
      style={[containerStyle, { boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }]}
      className={`overflow-hidden rounded-3xl bg-white items-center justify-center ${className}`}
    >
      {!permission ? (
        <View
          className="items-center justify-center h-full w-full"
          accessibilityLabel="A verificar permissão da câmara"
        >
          <ActivityIndicator accessibilityLabel="A verificar permissão da câmara" />
        </View>
      ) : !permission.granted ? (
        <View className="items-center justify-center h-full w-full px-4">
          <Text className="text-center text-sm text-black/70 mb-2">
            Precisamos da câmara para ler o QR Code.
          </Text>
          <TouchableOpacity
            onPress={handleRequestPermission}
            disabled={requesting}
            className="px-4 py-2 bg-[#5061FF] rounded-full"
            accessibilityRole="button"
            accessibilityLabel={requesting ? "A pedir permissão da câmara" : "Permitir acesso à câmara"}
            accessibilityHint="Permite ler o QR code com a câmara."
          >
            <Text className="text-white font-semibold">
              {requesting ? "A pedir..." : "Permitir"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : !showScanner ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handlePlaceholderPress}
          className="items-center justify-center h-full w-full"
          accessibilityRole="button"
          accessibilityLabel="Ler QR code"
          accessibilityHint="Toque para ativar a câmara e digitalizar um QR code."
        >
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <QrcodeIcon size={placeholderSize} />
          </View>
        </TouchableOpacity>
      ) : (
        <CameraView
          style={{ flex: 1, width: "100%", height: "100%" }}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={paused ? undefined : handleScan}
          facing="back"
          accessibilityLabel="Leitor de QR code ativo"
          accessibilityHint="Aponte a câmara para o QR code."
        >
          <View className="flex-1 items-center justify-center">
            <View
              pointerEvents="none"
              style={{
                opacity: 0.1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <QrcodeIcon size={placeholderSize} />
            </View>
          </View>
        </CameraView>
      )}
    </View>
  );
}

export default QRcode;
