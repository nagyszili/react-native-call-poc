import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect } from "react";
import { TouchableOpacity, Text, View, StyleSheet, Button } from "react-native";
import { LocalCameraView } from "../components/LocalCameraView";
import { RemoteCameraView } from "../components/RemoteCameraView";
import { useCallContext } from "../context/CallContext";
import CallManager from "../services/call-manager/CallManager";

export const CallScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { currentCall } = useCallContext();

  //   useEffect(() => {}, [currentCall]);

  const accept = () => {
    CallManager.answer();
  };
  const hangup = () => {
    CallManager.hangup();
  };

  const switchCamera = () => {
    CallManager.switchCamera();
  };

  const renderPhoneBtn = (type) => (
    <TouchableOpacity
      style={[
        styles.rounded,
        { backgroundColor: type === "answer" ? "#4CD964" : "red" },
      ]}
      onPress={type === "answer" ? answer : hangup}
    >
      <Text>{type}</Text>
    </TouchableOpacity>
  );

  const renderActionBtn = (type, isActive, callback, enabled = true) => (
    <TouchableOpacity
      style={[
        styles.rounded,
        { backgroundColor: isActive ? "#fff" : "#1d1d1d" },
      ]}
      onPress={callback}
      disabled={!enabled}
    >
      <Text>{type}</Text>
    </TouchableOpacity>
  );

  //   const actionsBtns = React.useMemo(() => {
  //     if (!didPickUp && incoming) {
  //       return (
  //         <View style={[styles.actions, styles.receiveCallActions]}>
  //           {renderPhoneBtn("hangup")}
  //           {renderPhoneBtn("answer")}
  //         </View>
  //       )
  //     }

  //     return (
  //       <View style={[styles.actions, styles.receiveCallActions]}>
  //         {renderActionBtn("micro", isMuted, toggleMute)}
  //         {renderActionBtn("volume", isUsingSpeakers, toggleSpeaker)}
  //         {renderPhoneBtn("hangup")}
  //         {renderActionBtn("camera", isUsingVideo, toggleCamera)}
  //       </View>
  //     )
  //   }, [didPickUp, incoming, isMuted, isUsingSpeakers, isUsingVideo])
  return (
    <View style={styles.container}>
      {currentCall?.isVideo && (
        <>
          <RemoteCameraView
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
              top: 0,
              right: 0,
              overflow: "hidden",
            }}
          />
          <TouchableOpacity
            onPress={switchCamera}
            style={{
              width: 110,
              height: 156,
              position: "absolute",
              top: 40,
              right: 16,
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <LocalCameraView
              style={{
                flex: 1,
              }}
            />
          </TouchableOpacity>
        </>
      )}

      <View style={styles.buttons}>
        <Button onPress={hangup} title="Hangup" />
        <View style={styles.wSpacer} />
        <Button onPress={accept} title="Accept" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#181818",
    opacity: 0.8,
  },
  callStatusText: {
    color: "white",
    fontSize: 17,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 4,
  },
  rounded: {
    height: 60,
    width: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    position: "absolute",
    bottom: 40,
    left: 0,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  receiveCallActions: {
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  meta: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  buttons: {
    width: "100%",
    flexDirection: "row",
  },
  wSpacer: {
    width: 10,
  },
});
