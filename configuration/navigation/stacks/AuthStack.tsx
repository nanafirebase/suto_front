import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WelcomeScreen from "../../../screens/authentication/WelcomeScreen";
import { useColorScheme } from "react-native";
import { Colors } from "../../../utils/constants/Colors";
import { RootStackParamList } from "../../../utils/types/index.type";
import RegisterScreen from "../../../screens/authentication/RegisterScreen";
import LoginScreen from "../../../screens/authentication/LoginScreen";
import TermsScreen from "../../../screens/authentication/TermsScreen";
import OnboardingScreen from "../../../screens/authentication/OnboardingScreen";
import ResetPasswordScreen from "../../../screens/authentication/ResetPasswordScreen";
import ConditionScreen from "../../../screens/authentication/ConditionScreen";
import PolicyScreen from "../../../screens/authentication/PolicyScreen";

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function AuthStack() {
    const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'
	
    return (
        <Stack.Navigator {...({} as any)} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }, animation: 'slide_from_right', }} initialRouteName="WelcomeScreen">
            <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} options={{ headerShown: false }} />
            <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="RegisterScreen" component={RegisterScreen} options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="TermsScreen" component={TermsScreen} options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="PolicyScreen" component={PolicyScreen} options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="ConditionScreen" component={ConditionScreen} options={{ headerShown: false, presentation: 'card' }} />
            
        </Stack.Navigator>
    );
}
