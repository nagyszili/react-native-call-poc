import { useNavigation } from "@react-navigation/native";
import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TextInput, Button } from "react-native";
import DeviceInfo from "react-native-device-info";
import { useCallContext } from "../context/CallContext";
import CallManager from "../services/call-manager/CallManager";
import { APP_KEY, APP_SECRET, ENVIRONMENT, isIOS } from "../utils/constants";
import Logger from "../utils/logger";

export default function MainScreen() {
  const [userName, setUserName] = useState("");
  const [userToCall, setUserToCall] = useState("");
  const { setCurrentCall, registeredName, setRegisteredName } =
    useCallContext();

  //   const didReceiveStartCallAction = ({ handle }) => {
  //     if (!handle) {
  //       // @TODO: sometime we receive `didReceiveStartCallAction` with handle` undefined`
  //       return;
  //     }
  //     const callUUID = getNewUuid();
  //     addCall(callUUID, handle);

  //     log(`[didReceiveStartCallAction] ${callUUID}, number: ${handle}`);

  //     RNCallKeep.startCall(callUUID, handle, handle);

  //     BackgroundTimer.setTimeout(() => {
  //       log(`[setCurrentCallActive] ${format(callUUID)}, number: ${handle}`);
  //       RNCallKeep.setCurrentCallActive(callUUID);
  //     }, 1000);
  //   };

  useEffect(() => {
    CallManager.initialize()
      .then(() => {
        Logger.info("CallManager initialized");
      })
      .catch((e) => {
        Logger.error("CallManager initialization failed", e);
      });
    return () => {
      CallManager.deinitialize();
    };
  }, []);

  const initSinch = (userId, userDisplayName) => {
    CallManager.setup({
      sinchAppKey: APP_KEY,
      sinchAppSecret: APP_SECRET,
      sinchHostName: ENVIRONMENT,
      userId,
      userDisplayName,
      usePushNotification: false,
    });
  };

  const checkConnection = async () => {
    const userId = await CallManager.getRegisteredName();
    if (userId) {
      setRegisteredName(userId);
    }
    console.log({ userId });
  };

  const terminate = async () => {
    CallManager.terminate();
  };

  const startCall = async () => {
    if (userToCall) {
      const call = await CallManager.startCall({
        userId: userToCall,
        isVideo: true,
      });
      if (call) {
        setCurrentCall(call);
        // navigation.navigate("CallScreen");
      }
    }
  };

  const connect = () => {
    if (userName) {
      initSinch(userName, userName);
    }
    setUserName("");
  };

  if (isIOS && DeviceInfo.isEmulator()) {
    return (
      <Text style={styles.container}>
        CallKeep doesn't work on iOS emulator
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text>{registeredName}</Text>
        <View style={styles.wSpacer} />
        <Button title="Check connection" onPress={checkConnection} />
        <View style={styles.wSpacer} />
        <Button title="Stop" onPress={terminate} />
      </View>
      <View style={styles.hSpacer} />

      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Set User Name"
          value={userName}
          onChangeText={(text) => {
            setUserName(text);
          }}
        />
        <Button title="Connect" onPress={connect} />
      </View>
      <View style={styles.hSpacer} />

      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="call username"
          value={userToCall}
          onChangeText={(text) => {
            setUserToCall(text);
          }}
        />
        <Button title="Call" onPress={startCall} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    marginTop: 20,
    marginBottom: 20,
  },
  callButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
    width: "100%",
  },
  logContainer: {
    flex: 3,
    width: "100%",
    backgroundColor: "#D9D9D9",
  },
  log: {
    fontSize: 10,
  },
  row: {
    flexDirection: "row",
  },
  input: {
    marginHorizontal: 10,
  },
  hSpacer: {
    height: 10,
  },
  wSpacer: {
    width: 10,
  },
});
