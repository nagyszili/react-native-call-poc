import React from "react";

import {
  createNavigationContainerRef,
  NavigationContainer,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { CallScreen } from "./src/screens/CallScreen";
import MainScreen from "./src/screens/MainScreen";
import { CallProvider } from "./src/context/CallContext";

const Stack = createStackNavigator();
const navigationRef = createNavigationContainerRef();
export const navigate = (name, params) => {
  const routeNames = navigationRef?.current?.getRootState()?.routeNames || [];
  if (navigationRef?.current?.isReady() && routeNames.includes(name)) {
    navigationRef?.current?.navigate(name, params);
  }
};

export const setParams = (params) => {
  if (navigationRef?.current?.isReady()) {
    navigationRef?.current?.setParams(params);
  }
};

export const goBack = () => {
  if (navigationRef?.current?.canGoBack()) {
    navigationRef?.current?.goBack();
  }
};

export default function App() {
  return (
    <CallProvider>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName="MainScreen"
        >
          <Stack.Screen
            component={MainScreen}
            name="MainScreen"
            options={{ animationEnabled: false }}
          />
          <Stack.Screen
            component={CallScreen}
            name="CallScreen"
            options={{ animationEnabled: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </CallProvider>
  );
}
