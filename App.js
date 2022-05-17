import React, { useState, useEffect } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Button,
} from "react-native";
import RNCallKeep from "react-native-callkeep";
import BackgroundTimer from "react-native-background-timer";
import DeviceInfo from "react-native-device-info";
import CallManager from "./src/services/call-manager/CallManager";
import { format, getNewUuid, getRandomNumber } from "./src/utils";

BackgroundTimer.start();

const hitSlop = { top: 10, left: 10, right: 10, bottom: 10 };

// RNCallKeep.setup({
//   ios: {
//     appName: "CallKeepDemo",
//   },
//   android: {
//     alertTitle: "Permissions required",
//     alertDescription: "This application needs to access your phone accounts",
//     cancelButton: "Cancel",
//     okButton: "ok",
//   },
// });

const isIOS = Platform.OS === "ios";
const APP_SECRET = "secret";
const APP_KEY = "key";
const ENVIRONMENT = "ocra.api.sinch.com";

export default function App() {
  const [logText, setLog] = useState("");
  const [heldCalls, setHeldCalls] = useState({}); // callKeep uuid: held
  const [mutedCalls, setMutedCalls] = useState({}); // callKeep uuid: muted
  const [calls, setCalls] = useState({}); // callKeep uuid: number
  const [userName, setUserName] = useState("");
  const [userToCall, setUserToCall] = useState("");
  const [registeredName, setRegisterdName] = useState("Unregistered");

  // const log = (text) => {
  //   console.info(text);
  //   setLog(logText + "\n" + text);
  // };

  // const addCall = (callUUID, number) => {
  //   setHeldCalls({ ...heldCalls, [callUUID]: false });
  //   setCalls({ ...calls, [callUUID]: number });
  // };

  // const removeCall = (callUUID) => {
  //   const { [callUUID]: _, ...updated } = calls;
  //   const { [callUUID]: __, ...updatedHeldCalls } = heldCalls;

  //   setCalls(updated);
  //   setCalls(updatedHeldCalls);
  // };

  // const setCallHeld = (callUUID, held) => {
  //   setHeldCalls({ ...heldCalls, [callUUID]: held });
  // };

  // const setCallMuted = (callUUID, muted) => {
  //   setMutedCalls({ ...mutedCalls, [callUUID]: muted });
  // };

  // const displayIncomingCall = (number) => {
  //   const callUUID = getNewUuid();
  //   addCall(callUUID, number);

  //   log(`[displayIncomingCall] ${format(callUUID)}, number: ${number}`);

  //   RNCallKeep.displayIncomingCall(callUUID, number, number, "number", false);
  // };

  // const displayIncomingCallNow = () => {
  //   displayIncomingCall(getRandomNumber());
  // };

  // const displayIncomingCallDelayed = () => {
  //   BackgroundTimer.setTimeout(() => {
  //     displayIncomingCall(getRandomNumber());
  //   }, 3000);
  // };

  // const didReceiveStartCallAction = ({ handle }) => {
  //   if (!handle) {
  //     // @TODO: sometime we receive `didReceiveStartCallAction` with handle` undefined`
  //     return;
  //   }
  //   const callUUID = getNewUuid();
  //   addCall(callUUID, handle);

  //   log(`[didReceiveStartCallAction] ${callUUID}, number: ${handle}`);

  //   RNCallKeep.startCall(callUUID, handle, handle);

  //   BackgroundTimer.setTimeout(() => {
  //     log(`[setCurrentCallActive] ${format(callUUID)}, number: ${handle}`);
  //     RNCallKeep.setCurrentCallActive(callUUID);
  //   }, 1000);
  // };

  // const didPerformSetMutedCallAction = ({ muted, callUUID }) => {
  //   const number = calls[callUUID];
  //   log(
  //     `[didPerformSetMutedCallAction] ${format(
  //       callUUID
  //     )}, number: ${number} (${muted})`
  //   );

  //   setCallMuted(callUUID, muted);
  // };

  // const didToggleHoldCallAction = ({ hold, callUUID }) => {
  //   const number = calls[callUUID];
  //   log(
  //     `[didToggleHoldCallAction] ${format(
  //       callUUID
  //     )}, number: ${number} (${hold})`
  //   );

  //   setCallHeld(callUUID, hold);
  // };

  // const endCall = ({ callUUID }) => {
  //   const handle = calls[callUUID];
  //   log(`[endCall] ${format(callUUID)}, number: ${handle}`);

  //   removeCall(callUUID);
  // };

  // const hangup = (callUUID) => {
  //   RNCallKeep.endCall(callUUID);
  //   removeCall(callUUID);
  // };

  // const setOnHold = (callUUID, held) => {
  //   const handle = calls[callUUID];
  //   RNCallKeep.setOnHold(callUUID, held);
  //   log(`[setOnHold: ${held}] ${format(callUUID)}, number: ${handle}`);

  //   setCallHeld(callUUID, held);
  // };

  // const setOnMute = (callUUID, muted) => {
  //   const handle = calls[callUUID];
  //   RNCallKeep.setMutedCall(callUUID, muted);
  //   log(`[setMutedCall: ${muted}] ${format(callUUID)}, number: ${handle}`);

  //   setCallMuted(callUUID, muted);
  // };

  // useEffect(() => {

  //   return () => {
  //     RNCallKeep.removeEventListener("answerCall", answerCall);
  //     RNCallKeep.removeEventListener(
  //       "didPerformDTMFAction",
  //       didPerformDTMFAction
  //     );
  //     RNCallKeep.removeEventListener(
  //       "didReceiveStartCallAction",
  //       didReceiveStartCallAction
  //     );
  //     RNCallKeep.removeEventListener(
  //       "didPerformSetMutedCallAction",
  //       didPerformSetMutedCallAction
  //     );
  //     RNCallKeep.removeEventListener(
  //       "didToggleHoldCallAction",
  //       didToggleHoldCallAction
  //     );
  //     RNCallKeep.removeEventListener("endCall", endCall);
  //   };
  // }, []);

  const initSinch = (userId, userDisplayName) => {
    CallManager.setupClient(
      APP_KEY,
      APP_SECRET,
      ENVIRONMENT,
      userId,
      userDisplayName,
      false // use push notification
    );
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
        <Button
          title="Is Started"
          onPress={async () => {
            const isStarted = await CallManager.checkStarted();
            console.log({ isStarted });
          }}
        />
      </View>
      <View style={styles.spacer} />

      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Set User Name"
          value={userName}
          onChangeText={(text) => {
            setUserName(text);
          }}
        />
        <Button
          title="Connect"
          onPress={() => {
            initSinch(userName, userName);
          }}
        />
      </View>
      <View style={styles.spacer} />

      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="call username"
          value={userToCall}
          onChangeText={(text) => {
            setUserToCall(text);
          }}
        />
        <Button
          title="Call"
          onPress={() => {
            CallManager.callUserId(userToCall);
          }}
        />
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
  spacer: {
    height: 10,
  },
});
