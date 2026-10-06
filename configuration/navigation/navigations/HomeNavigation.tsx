import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { HomeNavigationList } from '../../../utils/types/index.type';
import { useColorScheme } from 'react-native'
import { Colors } from '../../../utils/constants/Colors';
import HomeScreen from '../../../screens/user_main/HomeScreen';
import EmployeeListScreen from '../../../screens/features/hrm/EmployeeListScreen';
import ProbationListScreen from '../../../screens/features/hrm/ProbationListScreen';
import ExEmployeeListScreen from '../../../screens/features/hrm/ExEmployeeListScreen';
import AllAlertScreen from '../../../screens/features/alerts/AllAlertScreen';
import ProductListScreen from '../../../screens/features/inventory/ProductListScreen';
import TrackExpiryListScreen from '../../../screens/features/inventory/TrackExpiryListScreen';
import LowStockScreen from '../../../screens/features/inventory/LowStockScreen';
import SaleListScreen from '../../../screens/features/pos/SaleListScreen';
import PaymentListScreen from '../../../screens/features/pos/PaymentListScreen';
import TaxSummaryScreen from '../../../screens/features/pos/TaxSummaryScreen';
import ProductFormScreen from '../../../screens/features/inventory/ProductFormScreen';
import ProductDetailScreen from '../../../screens/features/inventory/ProductDetailScreen';

const Stack = createStackNavigator<HomeNavigationList>();


const HomeNavigation = () => {
    const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'

    return (
        <Stack.Navigator {...({} as any)} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }, animation: 'slide_from_right' }} initialRouteName='HomeScreen'>
            <Stack.Screen name="HomeScreen" component={HomeScreen} />
            <Stack.Screen name="AllAlertScreen" component={AllAlertScreen} />

            <Stack.Screen name="EmployeeListScreen" component={EmployeeListScreen} />
            <Stack.Screen name="ProbationListScreen" component={ProbationListScreen} />
            <Stack.Screen name="ExEmployeeListScreen" component={ExEmployeeListScreen} />

            <Stack.Screen name="ProductListScreen" component={ProductListScreen} />
            <Stack.Screen name="ProductFormScreen" component={ProductFormScreen} />
            <Stack.Screen name="ProductDetailScreen" component={ProductDetailScreen} />
            <Stack.Screen name="TrackExpiryListScreen" component={TrackExpiryListScreen} />
            <Stack.Screen name="LowStockScreen" component={LowStockScreen} />
            <Stack.Screen name="SaleListScreen" component={SaleListScreen} />
            <Stack.Screen name="PaymentListScreen" component={PaymentListScreen} />

            <Stack.Screen name="TaxSummaryScreen" component={TaxSummaryScreen} />
        </Stack.Navigator>
    )
}

export default HomeNavigation
