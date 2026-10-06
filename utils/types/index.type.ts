import { IconSymbolName } from "../../components/ui/icon-symbol"

export type RootStackParamList = {
    WelcomeScreen: undefined
    LoginScreen: undefined
    RegisterScreen: undefined
    TermsScreen: undefined
    ConditionScreen: undefined
    OnboardingScreen: undefined
    ResetPasswordScreen: undefined
    PolicyScreen: undefined
}

export type BusinessStackList = {
    SelectBusinessScreen: undefined
    BusinessFormScreen: undefined
    SelectPackageScreen: {formOneData: any}
}

export type HomeNavigationList = {
    HomeScreen: undefined
    SearchScreen: undefined
    AllAlertScreen: undefined
} & HRMNavigationList & InventoryNavigationList & POSNavigationList

export type HRMNavigationList = {
    EmployeeListScreen: undefined
    EmployeeFormScreen: { data: any }
    EmployeeDetailScreen: { data: any }

    EmployeeMedicalScreen: undefined
    DesignationChangeScreen: undefined
    ProbationListScreen: undefined
    ExEmployeeListScreen: undefined

    MedicalFormScreen: undefined
    ComplainListScreen: undefined
    ComplainFormScreen: undefined
    TransferFormScreen: undefined
    TravelFormScreen: undefined

    DisciplineFormScreen: undefined
    EmployeeExitFormScreen: undefined

    ShiftFormScreen: { hiddenID?: number; shiftData?: any };
    ShiftListScreen: undefined
    ShiftDashboardScreen: undefined
}

export type PayrollNavigationList = {
    EmployeePayrollScreen: { employeeData: any }
    PayPeriodListScreen: undefined
    PayPeriodSetupScreen: undefined
    PayDeductionListScreen: undefined
    PayDeductionFormScreen: { hiddenID?: number | string}
    AllowanceListScreen: undefined
    AllowanceFormScreen: { data: any }
    LoanTypeListScreen: undefined
    LoanTypeFormScreen: { data: any }

    PayrollSettingsScreen: undefined

    LoanListScreen: undefined
    LoanFormScreen: {data?: any}

    EmployeeCompensationListScreen: undefined
    EmployeeCompensationFormScreen: {data: any}
    EmployeeCompensationDetailsScreen: {data: any}

    RunPayrollScreen: undefined

    PayrollReviewScreen: {
        payrollData: {
            businessID: number
            branchID?: number
            departmentID?: number
            employeeCategory?: string
            payPeriodID: string | number
            payPeriodName?: string | number
            payDate: string | Date
            sessionID?: string | number
            employees: any[]
        }
    }
    PayrollRunResultScreen: {
        payrollRunID: string | number
        employeeCount: number
        grossAmount: number
        allowanceAmount: number
        overtimeAmount: number
        deductionAmount: number
        taxAmount: number
        netAmount: number
    }
    PayRunScreen: undefined
    PayrollRunDetailsScreen: {payrollRunData?: any}
    PayslipsScreen: undefined
    PayslipDetailsScreen: {payslipData?:any}
    MyPayslipsScreen: undefined
    MyPayDetailsScreen: undefined
    AdminLoanListScreen: undefined
}

export type ProfileNavigationList = {
    ProfileScreen: undefined
    PermissionScreen: undefined
    ChangePasswordScreen: undefined
    SupportScreen: undefined
    BusinessSettingScreen: undefined
}

export type StoreNavigationList = {
    ProfileScreen: undefined
}

export type ChatNavigationList = {
    AISchatScreen: undefined
}

type roleType = {
    id: string|number
    name: string
}

export type UserNavigationList = {
    RoleListScreen: undefined
    RoleFormScreen: {data: any}
    UserAccessListScreen: undefined
    PermissionScreen: undefined
    UserListScreen: undefined
    UserAccessScreen: undefined
    RolePermissionScreen: { data: roleType }
    OperationMenuScreen: undefined
    UserInfoScreen: {data: any}

    GradeListScreen: undefined
    GradeFormScreen: {data: any}
}

export type InventoryNavigationList = {
    ProductListScreen: undefined
    ProductFormScreen: {data: any}
    ProductCategoryListScreen: undefined
    ProductCategoryFormScreen: {data: any}
    StockListScreen: undefined
    StockFormScreen:  {data: any}
    StockInListScreen: undefined
    StockInFormScreen:  {data: any}
    ManufacturerListScreen: undefined
    ManufacturerFormScreen: {data: any}
    SupplierListScreen: undefined
    SupplierFormScreen: {data: any}
    TrackExpiryListScreen: undefined
    StockInItemsFormScreen: {data: any}
    UOMListScreen: undefined
    UOMFormScreen: {data: any}
    ProductDetailScreen: {data: any}
    LabelScreen: {data?: any|null}
    LowStockScreen: undefined
    StockInItemDetailScreen: {data: any}
    MoveStockScreen: undefined
}

export type POSNavigationList = {
    CustomerListScreen: undefined
    CustomerFormScreen: {data: any}
    NewSaleScreen: undefined
    InvoiceListScreen: undefined
    InvoiceFormScreen: {data: any}
    SaleListScreen:undefined
    PaymentScreen: {data?: any}
    PaymentListScreen: undefined
    TaxSummaryScreen: undefined
    PaymentDetailScreen: {data?: any}
    SaleDetailScreen: {data?:any}
}

export type OperationNavigationList = {
    OperationMenuScreen: undefined
} & HRMNavigationList & BusinessNavigationList & UserNavigationList & InventoryNavigationList & POSNavigationList & PayrollNavigationList


export type BusinessNavigationList = {
    DivisionFormScreen: {data: any}
    DivisionListScreen: undefined
    BusinessFormScreen: undefined
    BusinessListScreen: undefined
    DepartmentFormScreen: {data: any}
    DepartmentListScreen: undefined
    DesignationFormScreen: {data: any}
    DesignationListScreen: undefined
    EmployeeCategoryFormScreen: {data: any}
    EmployeeCategoryListScreen: undefined
    EmployeeTypeFormScreen: {data: any}
    EmployeeTypeListScreen: undefined
    GradeFormScreen: undefined
    GradeListScreen: undefined
    LocationFormScreen: {data: any}
    LocationListScreen: undefined
    SanctionFormScreen: undefined
    SanctionListScreen: undefined
    UnitFormScreen: undefined
    UnitListScreen: undefined
    CurrencyListScreen: undefined
    CurrencyRateListScreen: undefined
    CurrencyRateFormScreen: {data: any}
    TaxScreen: undefined

    TaxListScreen: undefined
    TaxFormScreen: {data: any}
    TaxGroupListScreen: undefined
    TaxGroupFormScreen: {data: any}
    TaxGroupItemsScreen: {data: any}
}

export type ScreenName = keyof OperationNavigationList;

export type FeatureItem = {
    name: string;
    icon: IconSymbolName;
    color: string;
    screen?: ScreenName;
    requires?: string[]
}

export type BottomSheetSelectOption = {
    key: string | number;
    value: string | number;
    dependantValue?: string | number | number | Date | null
}