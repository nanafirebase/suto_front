import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { OperationNavigationList } from '../../../utils/types/index.type';
import { useColorScheme } from 'react-native'
import { Colors } from '../../../utils/constants/Colors';
import OperationMenuScreen from '../../../screens/user_main/OperationScreen';
import EmployeeListScreen from '../../../screens/features/hrm/EmployeeListScreen';
import ProbationListScreen from '../../../screens/features/hrm/ProbationListScreen';
import ExEmployeeListScreen from '../../../screens/features/hrm/ExEmployeeListScreen';
import EmployeeFormScreen from '../../../screens/features/hrm/EmployeeFormScreen';
import MedicalFormScreen from '../../../screens/features/hrm/MedicalFormScreen';
import ComplainListScreen from '../../../screens/features/hrm/ComplainListScreen';
import ComplainFormScreen from '../../../screens/features/hrm/ComplainFormScreen';
import TransferFormScreen from '../../../screens/features/hrm/TransferFormScreen';
import TravelFormScreen from '../../../screens/features/hrm/TravelFormScreen';
import DisciplineFormScreen from '../../../screens/features/hrm/DisciplineFormScreen';
import EmployeeExitFormScreen from '../../../screens/features/hrm/EmployeeExitFormScreen';
import DivisionListScreen from '../../../screens/features/business/DivisionListScreen';
import DivisionFormScreen from '../../../screens/features/business/DivisionFormScreen';
import BusinessFormScreen from '../../../screens/features/business/BusinessFormScreen';
import BusinessListScreen from '../../../screens/features/business/BusinessListScreen';
import DepartmentListScreen from '../../../screens/features/business/DepartmentListScreen';
import DesignationListScreen from '../../../screens/features/business/DesignationListScreen';
import EmployeeCategoryListScreen from '../../../screens/features/hrm/EmployeeCategoryListScreen';
import EmployeeTypeListScreen from '../../../screens/features/hrm/EmployeeTypeListScreen';
import LocationListScreen from '../../../screens/features/business/LocationListScreen';
import SanctionListScreen from '../../../screens/features/business/SanctionListScreen';
import UnitListScreen from '../../../screens/features/business/UnitListScreen';
import DepartmentFormScreen from '../../../screens/features/business/DepartmentFormScreen';
import DesignationFormScreen from '../../../screens/features/business/DesignationFormScreen';
import EmployeeCategoryFormScreen from '../../../screens/features/hrm/EmployeeCategoryFormScreen';
import EmployeeTypeFormScreen from '../../../screens/features/hrm/EmployeeTypeFormScreen';
import LocationFormScreen from '../../../screens/features/business/LocationFormScreen';
import UnitFormScreen from '../../../screens/features/business/UnitFormScreen';
import SanctionFormScreen from '../../../screens/features/business/SanctionFormScreen';
import RoleFormScreen from '../../../screens/features/users/RoleFormScreen';
import RoleListScreen from '../../../screens/features/users/RoleListScreen';
import PermissionScreen from '../../../screens/features/users/PermissionScreen';
import UserListScreen from '../../../screens/features/users/UserListScreen';
import UserAccessScreen from '../../../screens/features/users/UserAccessScreen';
import ProductListScreen from '../../../screens/features/inventory/ProductListScreen';
import ProductCategoryListScreen from '../../../screens/features/inventory/ProductCategoryListScreen';
import ProductFormScreen from '../../../screens/features/inventory/ProductFormScreen';
import ProductCategoryFormScreen from '../../../screens/features/inventory/ProductCategoryFormScreen';
import StockListScreen from '../../../screens/features/inventory/StockListScreen';
import StockFormScreen from '../../../screens/features/inventory/StockFormScreen';
import StockInListScreen from '../../../screens/features/inventory/StockInListScreen';
import StockInFormScreen from '../../../screens/features/inventory/StockInFormScreen';
import TrackExpiryListScreen from '../../../screens/features/inventory/TrackExpiryListScreen';
import ManufacturerListScreen from '../../../screens/features/inventory/ManufacturerListScreen';
import ManufacturerFormScreen from '../../../screens/features/inventory/ManufacturerFormScreen';
import SupplierListScreen from '../../../screens/features/inventory/SupplierListScreen';
import SupplierFormScreen from '../../../screens/features/inventory/SupplierFormScreen';
import CurrencyListScreen from '../../../screens/features/business/CurrencyListScreen';
import CurrencyRateFormScreen from '../../../screens/features/business/CurrencyRateFormScreen';
import CurrencyRateListScreen from '../../../screens/features/business/CurrencyRateListScreen';
import StockInItemsFormScreen from '../../../screens/features/inventory/StockInItemsFormScreen';
import UOMListScreen from '../../../screens/features/inventory/UOMListScreen';
import UOMFormScreen from '../../../screens/features/inventory/UOMFormScreen';
import ProductDetailScreen from '../../../screens/features/inventory/ProductDetailScreen';
import NewSaleScreen from '../../../screens/features/pos/NewSaleScreen';
import TaxScreen from '../../../screens/features/business/TaxScreen';
import InvoiceListScreen from '../../../screens/features/pos/InvoiceListScreen';
import InvoiceFormScreen from '../../../screens/features/pos/InvoiceFormScreen';
import SaleListScreen from '../../../screens/features/pos/SaleListScreen';
import PaymentScreen from '../../../screens/features/pos/PaymentScreen';
import CustomerListScreen from '../../../screens/features/pos/CustomerListScreen';
import CustomerFormScreen from '../../../screens/features/pos/CustomerFormScreen';
import TaxListScreen from '../../../screens/features/business/TaxListScreen';
import TaxFormScreen from '../../../screens/features/business/TaxFormScreen';
import TaxGroupItemsScreen from '../../../screens/features/business/TaxGroupItemsScreen';
import TaxGroupListScreen from '../../../screens/features/business/TaxGroupListScreen';
import TaxGroupFormScreen from '../../../screens/features/business/TaxGroupFormScreen';
import LabelScreen from '../../../screens/features/inventory/LabelScreen';
import PaymentListScreen from '../../../screens/features/pos/PaymentListScreen';
import LowStockScreen from '../../../screens/features/inventory/LowStockScreen';
import RolePermissionScreen from '../../../screens/features/users/RolePermissionScreen';
import UserInfoScreen from '../../../screens/features/users/UserInfoScreen';
import TaxSummaryScreen from '../../../screens/features/pos/TaxSummaryScreen';
import ShiftListScreen from '../../../screens/features/hrm/ShiftListScreen';
import ShiftFormScreen from '../../../screens/features/hrm/ShiftFormScreen';
import ShiftDashboardScreen from '../../../screens/features/hrm/ShiftDashboardScreen';
import EmployeePayrollScreen from '../../../screens/features/payroll/EmployeePayrollScreen';
import PayPeriodListScreen from '../../../screens/features/payroll/PayPeriodListScreen';
import PayPeriodSetupScreen from '../../../screens/features/payroll/PayPeriodSetupScreen';
import PayDeductionListScreen from '../../../screens/features/payroll/PayDeductionListScreen';
import PayDeductionFormScreen from '../../../screens/features/payroll/PayDeductionFormScreen';
import AllowanceListScreen from '../../../screens/features/payroll/AllowanceListScreen';
import AllowanceFormScreen from '../../../screens/features/payroll/AllowanceFormScreen';
import EmployeeDetailScreen from '../../../screens/features/hrm/EmployeeDetailScreen';
import PayrollSettingsScreen from '../../../screens/features/payroll/PayrollSettingsScreen';
import LoanTypeFormScreen from '../../../screens/features/payroll/LoanTypeFormScreen';
import LoanTypeListScreen from '../../../screens/features/payroll/LoanTypeListScreen';
import LoanFormScreen from '../../../screens/features/payroll/LoanFormScreen';
import LoanListScreen from '../../../screens/features/payroll/LoanListScreen';
import EmployeeCompensationListScreen from '../../../screens/features/payroll/EmployeeCompensationListScreen';
import EmployeeCompensationDetailsScreen from '../../../screens/features/payroll/EmployeeCompensationDetailsScreen';
import EmployeeCompensationFormScreen from '../../../screens/features/payroll/EmployeeCompensationFormScreen';
import GradeFormScreen from '../../../screens/features/users/GradeFormScreen';
import GradeListScreen from '../../../screens/features/users/GradeListScreen';
import RunPayrollScreen from '../../../screens/features/payroll/RunPayrollScreen';
import PayrollReviewScreen from '../../../screens/features/payroll/PayrollReviewScreen';
import PayrollRunResultScreen from '../../../screens/features/payroll/PayrollRunResultScreen';
import PayRunScreen from '../../../screens/features/payroll/PayRunScreen';
import PayrollRunDetailsScreen from '../../../screens/features/payroll/PayrollRunDetailsScreen';
import PayslipsScreen from '../../../screens/features/payroll/PayslipsScreen';
import PayslipDetailsScreen from '../../../screens/features/payroll/PayslipDetailsScreen';
import MyPayslipsScreen from '../../../screens/features/payroll/MyPayslipsScreen';
import MyPayDetailsScreen from '../../../screens/features/payroll/MyPayDetailsScreen';
import AdminLoanListScreen from '../../../screens/features/payroll/AdminLoanListScreen';
import StockInItemDetailScreen from '../../../screens/features/inventory/StockInItemDetailScreen';
import PaymentDetailScreen from '../../../screens/features/pos/PaymentDetailScreen';
import SaleDetailScreen from '../../../screens/features/pos/SaleDetailScreen';
import MoveStockScreen from '../../../screens/features/inventory/MoveStockScreen';

const Stack = createStackNavigator<OperationNavigationList>();


const OperationNavigation = () => {
    const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'

    return (
        <Stack.Navigator {...({} as any)} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }, animation: 'slide_from_right' }} initialRouteName='OperationMenuScreen'>
            <Stack.Screen name="OperationMenuScreen" component={OperationMenuScreen} />

            {/* hrm */}
            <Stack.Screen name="EmployeeListScreen" component={EmployeeListScreen} />
            <Stack.Screen name="EmployeeFormScreen" component={EmployeeFormScreen} />
            <Stack.Screen name="EmployeeDetailScreen" component={EmployeeDetailScreen} />
            <Stack.Screen name="MedicalFormScreen" component={MedicalFormScreen} />
            <Stack.Screen name="ComplainListScreen" component={ComplainListScreen} />
            <Stack.Screen name="ComplainFormScreen" component={ComplainFormScreen} />
            <Stack.Screen name="TransferFormScreen" component={TransferFormScreen} />
            <Stack.Screen name="TravelFormScreen" component={TravelFormScreen} />
            <Stack.Screen name="DisciplineFormScreen" component={DisciplineFormScreen} />
            <Stack.Screen name="EmployeeExitFormScreen" component={EmployeeExitFormScreen} />
            <Stack.Screen name="ProbationListScreen" component={ProbationListScreen} />
            <Stack.Screen name="ExEmployeeListScreen" component={ExEmployeeListScreen} />
            <Stack.Screen name="ShiftListScreen" component={ShiftListScreen} />
            <Stack.Screen name="ShiftFormScreen" component={ShiftFormScreen} />
            <Stack.Screen name="ShiftDashboardScreen" component={ShiftDashboardScreen} />

            {/* business */}
            <Stack.Screen name="BusinessFormScreen" component={BusinessFormScreen} />
            <Stack.Screen name="BusinessListScreen" component={BusinessListScreen} />
            <Stack.Screen name="DivisionFormScreen" component={DivisionFormScreen} />
            <Stack.Screen name="DivisionListScreen" component={DivisionListScreen} />
            <Stack.Screen name="DepartmentFormScreen" component={DepartmentFormScreen} />
            <Stack.Screen name="DepartmentListScreen" component={DepartmentListScreen} />
            <Stack.Screen name="DesignationFormScreen" component={DesignationFormScreen} />
            <Stack.Screen name="DesignationListScreen" component={DesignationListScreen} />
            <Stack.Screen name="EmployeeCategoryFormScreen" component={EmployeeCategoryFormScreen} />
            <Stack.Screen name="EmployeeCategoryListScreen" component={EmployeeCategoryListScreen} />
            <Stack.Screen name="EmployeeTypeFormScreen" component={EmployeeTypeFormScreen} />
            <Stack.Screen name="EmployeeTypeListScreen" component={EmployeeTypeListScreen} />
            <Stack.Screen name="LocationFormScreen" component={LocationFormScreen} />
            <Stack.Screen name="LocationListScreen" component={LocationListScreen} />
            <Stack.Screen name="SanctionFormScreen" component={SanctionFormScreen} />
            <Stack.Screen name="SanctionListScreen" component={SanctionListScreen} />
            <Stack.Screen name="UnitFormScreen" component={UnitFormScreen} />
            <Stack.Screen name="UnitListScreen" component={UnitListScreen} />
            <Stack.Screen name="CurrencyListScreen" component={CurrencyListScreen} />
            <Stack.Screen name="CurrencyRateFormScreen" component={CurrencyRateFormScreen} />
            <Stack.Screen name="CurrencyRateListScreen" component={CurrencyRateListScreen} />
            {/* <Stack.Screen name="TaxScreen" component={TaxScreen} /> */}

            <Stack.Screen name="TaxListScreen" component={TaxListScreen} />
            <Stack.Screen name="TaxFormScreen" component={TaxFormScreen} />
            <Stack.Screen name="TaxGroupListScreen" component={TaxGroupListScreen} />
            <Stack.Screen name="TaxGroupFormScreen" component={TaxGroupFormScreen} />
            <Stack.Screen name="TaxGroupItemsScreen" component={TaxGroupItemsScreen} />

            {/* users */}
            <Stack.Screen name="RoleFormScreen" component={RoleFormScreen} />
            <Stack.Screen name="RoleListScreen" component={RoleListScreen} />
            <Stack.Screen name="GradeFormScreen" component={GradeFormScreen} />
            <Stack.Screen name="GradeListScreen" component={GradeListScreen} />
            <Stack.Screen name="PermissionScreen" component={PermissionScreen} />
            <Stack.Screen name="UserAccessScreen" component={UserAccessScreen} />
            <Stack.Screen name="UserListScreen" component={UserListScreen} />
            <Stack.Screen name="RolePermissionScreen" component={RolePermissionScreen} />
            <Stack.Screen name="UserInfoScreen" component={UserInfoScreen} />
            
            {/* inventory */}
            <Stack.Screen name="ProductListScreen" component={ProductListScreen} />
            <Stack.Screen name="ProductFormScreen" component={ProductFormScreen} />
            <Stack.Screen name="ProductCategoryListScreen" component={ProductCategoryListScreen} />
            <Stack.Screen name="ProductCategoryFormScreen" component={ProductCategoryFormScreen} />
            <Stack.Screen name="StockListScreen" component={StockListScreen} />
            <Stack.Screen name="StockFormScreen" component={StockFormScreen} />
            <Stack.Screen name="StockInListScreen" component={StockInListScreen} />
            <Stack.Screen name="StockInFormScreen" component={StockInFormScreen} />
            <Stack.Screen name="ManufacturerListScreen" component={ManufacturerListScreen} />
            <Stack.Screen name="ManufacturerFormScreen" component={ManufacturerFormScreen} />
            <Stack.Screen name="SupplierListScreen" component={SupplierListScreen} />
            <Stack.Screen name="SupplierFormScreen" component={SupplierFormScreen} />
            <Stack.Screen name="TrackExpiryListScreen" component={TrackExpiryListScreen} />
            <Stack.Screen name="StockInItemsFormScreen" component={StockInItemsFormScreen} />
            <Stack.Screen name="UOMListScreen" component={UOMListScreen} />
            <Stack.Screen name="UOMFormScreen" component={UOMFormScreen} />
            <Stack.Screen name="ProductDetailScreen" component={ProductDetailScreen} />
            <Stack.Screen name="LabelScreen" component={LabelScreen} />
            <Stack.Screen name="LowStockScreen" component={LowStockScreen} />
            <Stack.Screen name="StockInItemDetailScreen" component={StockInItemDetailScreen} />
            <Stack.Screen name="MoveStockScreen" component={MoveStockScreen} />
            
            {/* pos */}
            <Stack.Screen name="NewSaleScreen" component={NewSaleScreen} />
            <Stack.Screen name="InvoiceListScreen" component={InvoiceListScreen} />
            <Stack.Screen name="InvoiceFormScreen" component={InvoiceFormScreen} />
            <Stack.Screen name="SaleListScreen" component={SaleListScreen} />
            <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
            <Stack.Screen name="PaymentListScreen" component={PaymentListScreen} />
            <Stack.Screen name="CustomerListScreen" component={CustomerListScreen} />
            <Stack.Screen name="CustomerFormScreen" component={CustomerFormScreen} />
            <Stack.Screen name="TaxSummaryScreen" component={TaxSummaryScreen} />
            <Stack.Screen name="PaymentDetailScreen" component={PaymentDetailScreen} />
            <Stack.Screen name="SaleDetailScreen" component={SaleDetailScreen} />
            
            

            {/* payroll */}
            <Stack.Screen name="EmployeePayrollScreen" component={EmployeePayrollScreen} />
            <Stack.Screen name="PayPeriodListScreen" component={PayPeriodListScreen} />
            <Stack.Screen name="PayPeriodSetupScreen" component={PayPeriodSetupScreen} />
            <Stack.Screen name="PayDeductionListScreen" component={PayDeductionListScreen} />
            <Stack.Screen name="PayDeductionFormScreen" component={PayDeductionFormScreen} />
            <Stack.Screen name="AllowanceListScreen" component={AllowanceListScreen} />
            <Stack.Screen name="AllowanceFormScreen" component={AllowanceFormScreen} />
            <Stack.Screen name="PayrollSettingsScreen" component={PayrollSettingsScreen} />
            <Stack.Screen name="LoanTypeFormScreen" component={LoanTypeFormScreen} />
            <Stack.Screen name="LoanTypeListScreen" component={LoanTypeListScreen} />
            <Stack.Screen name="EmployeeCompensationListScreen" component={EmployeeCompensationListScreen} />
            <Stack.Screen name="EmployeeCompensationFormScreen" component={EmployeeCompensationFormScreen} />
            <Stack.Screen name="EmployeeCompensationDetailsScreen" component={EmployeeCompensationDetailsScreen} />
            <Stack.Screen name="RunPayrollScreen" component={RunPayrollScreen} />
            <Stack.Screen name="PayrollReviewScreen" component={PayrollReviewScreen} />
            <Stack.Screen name="PayrollRunResultScreen" component={PayrollRunResultScreen} />
            <Stack.Screen name="PayRunScreen" component={PayRunScreen} />
            <Stack.Screen name="PayrollRunDetailsScreen" component={PayrollRunDetailsScreen} />
            <Stack.Screen name="PayslipsScreen" component={PayslipsScreen} />
            <Stack.Screen name="PayslipDetailsScreen" component={PayslipDetailsScreen} />
            <Stack.Screen name="AdminLoanListScreen" component={AdminLoanListScreen} />

            {/* employeeScreens */}
            <Stack.Screen name="MyPayslipsScreen" component={MyPayslipsScreen} />
            <Stack.Screen name="MyPayDetailsScreen" component={MyPayDetailsScreen} />
            <Stack.Screen name="LoanFormScreen" component={LoanFormScreen} />
            <Stack.Screen name="LoanListScreen" component={LoanListScreen} />

        </Stack.Navigator>
    )
}

export default OperationNavigation
