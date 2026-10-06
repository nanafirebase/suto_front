import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useColorScheme } from "react-native";
import { Colors } from "../../../utils/constants/Colors";
import { BusinessStackList } from "../../../utils/types/index.type";
import SelectBusinessScreen from "../../../screens/authentication/SelectBusinessScreen";
import BusinessFormScreen from "../../../screens/features/business/BusinessFormScreen";
import SelectPackageScreen from "../../../screens/features/business/SelectPackageScreen";

const Stack = createNativeStackNavigator<BusinessStackList>()

export default function BusinessStack() {
    const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'
	
    return (
        <Stack.Navigator {...({} as any)} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }, animation: 'slide_from_right' }} initialRouteName={"SelectBusinessScreen"}>
            <Stack.Screen name="SelectBusinessScreen"  component={SelectBusinessScreen}  options={{ headerShown: false, presentation: 'card' }}  />
            <Stack.Screen name="BusinessFormScreen" component={BusinessFormScreen} options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="SelectPackageScreen" component={SelectPackageScreen} options={{ headerShown: false, presentation: 'card' }} />
        </Stack.Navigator>
    )
}
