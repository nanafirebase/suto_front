import { Platform } from "react-native"
import { FeatureItem } from "../../utils/types/index.type"

export const employeesProbationList = [
    {
        staffId: 'EMP001',
        firstName: 'Ama',
        lastName: 'Serwaa',
        otherNames: 'Akosua',
        email: 'ama.serwaa@example.com',
        phone: '+233201234567',
        dateOfJoining: '2023-01-15',
        dateOfBirth: '1995-06-21',
        gender: 'Female',
        employeeType: 'Full-time',
        employeeCategory: 'Staff',
        businessName: 'Awos Pub',
        departmentName: 'HR',
        designation: 'HR Officer',
        officeShift: '9AM - 5PM',
        location: 'Accra',
        role: 'Employee',
        image: 'https://randomuser.me/api/portraits/women/1.jpg',
    }
]

export const exEmployeeList = [
    {
        staffId: 'EMP001',
        firstName: 'Sugar',
        lastName: 'Martin',
        otherNames: 'Amoah',
        email: 'sugar@example.com',
        phone: '+233201234567',
        dateOfJoining: '2023-01-15',
        dateOfBirth: '1995-06-21',
        gender: 'Male',
        employeeType: 'Full-time',
        employeeCategory: 'Staff',
        businessName: 'Awos Pub',
        departmentName: 'HR',
        designation: 'HR Officer',
        officeShift: '9AM - 5PM',
        location: 'Accra',
        role: 'Employee',
        image: 'https://randomuser.me/api/portraits/men/1.jpg',
    }
]

export const complainList = [
    {
        staffId: 'EMP001',
        firstName: 'Sugar',
        lastName: 'Martin',
        otherNames: 'Amoah',
        email: 'sugar@example.com',
        phone: '+233201234567',
        image: 'https://randomuser.me/api/portraits/men/1.jpg',
        complainTitle: 'Late Salary Payment',
        complainDescription: 'Salary for the previous month was delayed without prior communication.',
        complainDate: '2025-12-01'
    },
    {
        staffId: 'EMP002',
        firstName: 'Ama',
        lastName: 'Mensah',
        otherNames: 'Serwaa',
        email: 'ama@example.com',
        phone: '+233241234890',
        image: 'https://randomuser.me/api/portraits/women/2.jpg',
        complainTitle: 'Unfair Shift Allocation',
        complainDescription: 'Assigned multiple night shifts consecutively without rotation.',
        complainDate: '2025-12-05',
    },
]


// I would do the next phase like this

// Phase 1 — Payroll processing

// Run Payroll
// Pay Runs
// Payslips

// Phase 2 — Payroll components
// 4. Overtime
// 5. Pay Details
// 6. Loans

// Phase 3 — Employee self-service
// 7. My Payslips
// 8. My Pay Details
// 9. My Overtime

export const abbFull: Record<string, string> = {
    hrm: "Staff & Workforce Management",
    payroll: "Payroll, Wages & Tax Management",
    project: "Tasks & Work Assignments",
    inventory: "Stock & Inventory Control",
    posAndOrders: "Sales & Point of Sale (POS)",
    report: 'Reports & Business Insights',
    user: 'Users, Roles & Access Control',
    default: 'Business Setup'
}

export const features: Record<string, FeatureItem[]> = {
    hrm: [
        { name: 'Staff', icon: 'people', color: '#2563EB', screen: 'EmployeeListScreen', requires: ['hrm.employee.view'] },
        // { name: 'Medicals', icon: 'medical', color: '#F59E0B', screen: 'MedicalFormScreen' },
        // { name: 'Complaints', icon: 'mail', color: '#10B981', screen: 'ComplainListScreen' },
        // { name: 'Transfer', icon: 'repeat', color: '#F97316', screen: 'TransferFormScreen' },
        // { name: 'Discipline', icon: 'shield', color: '#EF4444', screen: 'DisciplineFormScreen' },
        // { name: 'Travel', icon: 'plane', color: '#A52A2A', screen: 'TravelFormScreen' },
        { name: 'Staff. Exit', icon: 'xmark', color: '#A52A2A', screen: 'EmployeeExitFormScreen' },
        // { name: 'Sanction Types', icon: 'alert-circle', color: '#b93311', screen: 'SanctionListScreen' },
        { name: 'Staff Types', icon: 'list', color: '#10B981', screen: 'EmployeeTypeListScreen', requires: ['hrm.employee_type.view'] },
        { name: 'Staff Category', icon: 'list', color: '#06B6D4', screen: 'EmployeeCategoryListScreen', requires: ['hrm.employee_category.view'] },
        { name: 'Divisions', icon: 'division', color: '#2563EB', screen: 'DivisionListScreen', requires: ['default.division.view'] },
        { name: 'Departments', icon: 'list', color: '#A19C0A', screen: 'DepartmentListScreen', requires: ['default.department.view'] },
        { name: 'Designations', icon: 'alert-circle', color: '#F59E0B', screen: 'DesignationListScreen', requires: ['default.designation.view'] },
        // { name: 'Former Staff', icon: 'people', color: '#A52A2A', screen: 'ExEmployeeListScreen', requires: ['hrm.employee.view'] },
        // { name: 'TimeSheets', icon: 'clock', color: '#E26D2E', screen: 'ShiftDashboardScreen', requires: ['hrm.employee.view'] },
        // { name: 'Filed Reports', icon: 'document-outline', color: '#29B6A2', screen: undefined },
        // { name: 'Job Vacancies', icon: 'briefcase', color: '#F262F2', screen: undefined },
        // { name: 'Job Candidates', icon: 'people', color: '#E26D2E', screen: undefined },
        // { name: 'Job Interviews', icon: 'clock', color: '#C7A62F', screen: undefined },
        // { name: 'Job Category', icon: 'list', color: '#A1AFC7', screen: undefined },
    ],
    payroll: [
        { name: 'Periods', icon: 'chart', color: '#482BC3', screen: 'PayPeriodListScreen', requires: ['hrm.employee.view'] },
        { name: 'Run Payroll', icon: 'play', color: '#10B981', screen: 'RunPayrollScreen', requires: ['hrm.employee.view'] },
        { name: 'Pay Runs', icon: 'calendar', color: '#F59E0B', screen: 'PayRunScreen', requires: ['hrm.employee.view'] },
        { name: 'Payslips', icon: 'document-outline', color: '#C7A62F', screen: 'PayslipsScreen', requires: ['hrm.employee.view'] },
        { name: 'Wages & Salary', icon: 'swap', color: '#F59E0B', screen: 'EmployeeCompensationListScreen', requires: ['hrm.employee.view'] },
        // { name: 'Overtime', icon: 'clock', color: '#A19C0A', screen: undefined, requires: ['hrm.employee.view'] },
        { name: 'Allowances', icon: 'plus.circle', color: '#10B981', screen: 'AllowanceListScreen', requires: ['hrm.employee.view'] },
        { name: 'Deductions', icon: 'remove.circle', color: '#EF4444', screen: 'PayDeductionListScreen', requires: ['hrm.employee.view'] },
        // { name: 'Pay Details', icon: 'file-text', color: '#482BC3', screen: undefined, requires: ['hrm.employee.view'] },
        { name: 'Loans', icon: 'credit-card', color: '#F97316', screen: 'AdminLoanListScreen', requires: ['hrm.employee.view'] },
        { name: 'Loan Types', icon: 'list', color: '#E267CE', screen: 'LoanTypeListScreen', requires: ['hrm.employee.view'] },

        { name: 'My Payslips', icon: 'document-outline', color: '#C7A62F', screen: 'MyPayslipsScreen', requires: ['hrm.employee.view'] },
        { name: 'My Pay Details', icon: 'file-text', color: '#482BC3', screen: 'MyPayDetailsScreen', requires: ['hrm.employee.view'] },
        // { name: 'My Overtime', icon: 'clock', color: '#A19C0A', screen: undefined, requires: ['hrm.employee.view'] },
        { name: 'My Loans', icon: 'credit-card', color: '#F97316', screen: 'LoanListScreen', requires: ['hrm.employee.view'] },
        { name: 'Payroll Settings', icon: 'cog', color: '#64748B', screen: 'PayrollSettingsScreen', requires: ['hrm.employee.view'] },
        //  // --- Payroll Processing ---
        //  { name: 'Periods', icon: 'check', color: '#F59E0B', screen: undefined },\
        //  // --- Salary Structure ---
        //  { name: 'Bsc Salary', icon: 'check', color: '#F59E0B', screen: undefined },
        //  { name: 'Grade Pays', icon: 'check', color: '#482BC3', screen: undefined },
        //  // --- Employee Financials ---
        //  { name: 'Emp. Banks', icon: 'check', color: '#10B981', screen: undefined },
        //  { name: 'Loan Calc', icon: 'check', color: '#10B981', screen: undefined },
        //  { name: 'All Loans', icon: 'check', color: '#F97316', screen: undefined }
    ],
    // project: [
    //     { name: 'Boards', icon: 'grid', color: '#6366F1', screen: undefined },
    //     { name: 'My Work', icon: 'person', color: '#0EA5E9', screen: undefined },
    //     { name: 'Inbox', icon: 'inbox', color: '#F59E0B', screen: undefined },
    //     { name: 'Timeline', icon: 'calendar', color: '#F97316', screen: undefined }
    // ],
    inventory: [
        { name: 'Products', icon: 'cube', color: '#2563EB', screen: 'ProductListScreen', requires: ['inventory.product.view'] },
        { name: 'Prd. Category', icon: 'list', color: '#10B981', screen: 'ProductCategoryListScreen', requires: ['inventory.product_category.view'] },
        { name: 'Stock Loc.', icon: 'layers', color: '#F59E0B', screen: 'StockListScreen', requires: ['inventory.stock_location.view'] },
        { name: 'Stock In', icon: 'download', color: '#52DC12', screen: 'StockInListScreen', requires: ['inventory.stock.view'] },
        { name: 'Track Expiry', icon: 'alarm', color: '#A52A2A', screen: 'TrackExpiryListScreen', requires: ['inventory.expiry.view'] },
        { name: 'Supplier', icon: 'people', color: '#2563EB', screen: 'SupplierListScreen', requires: ['inventory.supplier.view'] },
        { name: 'Manufacturer', icon: 'building', color: '#2563EB', screen: 'ManufacturerListScreen', requires: ['inventory.manufacturer.view'] },
        { name: 'UOM', icon: 'scale', color: '#0EA5E9', screen: 'UOMListScreen', requires: ['inventory.uom.view'] },
        { name: 'Taxes', icon: 'percent', color: '#8E52F0', screen: 'TaxListScreen', requires: ['inventory.product.view'] },
        { name: 'Tax Groups', icon: 'layers', color: '#F59E0B', screen: 'TaxGroupListScreen', requires: ['inventory.product.view'] },
        { name: 'Low Stock', icon: 'low', color: '#482BC3', screen: 'LowStockScreen', requires: ['inventory.product.view'] },
        // { name: 'Labels', icon: 'print', color: '#F97316', screen: 'LabelScreen', requires: [] },
        { name: 'Transfer STKs', icon: 'enter', color: '#F97316', screen: 'MoveStockScreen', requires: ['inventory.product.view'] },
        
    ],
    posAndOrders: [
        { name: 'Orders', icon: 'list', color: '#2563EB', screen: undefined, requires: ['pos.order.view'] },
        { name: 'New Sale', icon: 'shopping-cart', color: '#E53BC4', screen: 'NewSaleScreen', requires: ['pos.sale.new'] },
        { name: 'Create Order', icon: 'plus', color: '#2563EB', screen: undefined, requires: ['pos.order.create_update'] },
        // { name: 'Fulfillment', icon: 'cube', color: '#2563EB', screen: undefined, requires: ['pos.order.fulfill'] },
        // { name: 'Returns', icon: 'rotate-ccw', color: '#2563EB', screen: undefined, requires: ['pos.order.return'] },
        { name: 'Payments', icon: 'credit-card', color: '#F59E0B', screen: 'PaymentListScreen', requires: ['pos.payments.view'] },
        { name: 'Customers', icon: 'users', color: '#0EA5E9', screen: 'CustomerListScreen', requires: ['pos.customer.view'] },
        // { name: 'Refunds', icon: 'rotate-ccw', color: '#EF4444', screen: undefined, requires: ['pos.payments.view'] },
        { name: 'Sales History', icon: 'chart', color: '#ABA1BA', screen: 'SaleListScreen', requires: ['pos.sale.new'] },
        // { name: 'Invoices', icon: 'file-text', color: '#2563EB', screen: 'InvoiceListScreen', requires: ['pos.invoice.view'] },
        // { name: 'Pro Forma', icon: 'document-outline', color: '#F34ADE', screen: undefined, requires: ['pos.invoice.view'] },
        // { name: 'Reg. Closure', icon: 'check.circle', color: '#22B2C3', screen: undefined, requires: ['pos.payments.view'] },
        { name: 'Tax Centre', icon: 'percent', color: '#8E52F0', screen: 'TaxSummaryScreen', requires: ['pos.payments.view'] },
    ],
    user: [
        { name: 'Users', icon: 'people', color: '#F97316', screen: 'UserListScreen', requires: ['user.user.view'] },
        { name: 'User Access', icon: 'key', color: '#2563EB', screen: 'UserAccessScreen', requires: ['user.user.create_update'] },
        { name: 'Roles', icon: 'ribbon', color: '#10B981', screen: 'RoleListScreen', requires: ['user.role.view'] },
        { name: 'Grades', icon: 'ribbon', color: '#11EF2C', screen: 'GradeListScreen', requires: ['user.role.view'] },
        { name: 'Permissions', icon: 'shield', color: '#F59E0B', screen: 'PermissionScreen', requires: ['user.permissions.create_update'] }
    ],
    default: [
        { name: 'Branches', icon: 'location', color: '#bca54b', screen: 'LocationListScreen', requires: ['default.location.view'] },
        { name: 'Currency', icon: 'dollar', color: '#22C55E', screen: 'CurrencyListScreen', requires: ['pos.sale.new', 'pos.invoice.view', 'pos.payments.view', 'inventory.product.view', 'inventory.stock.view', 'inventory.uom.view'] },
        { name: 'Ex. Rates', icon: 'trending-up', color: '#0EA5E9', screen: 'CurrencyRateListScreen', requires: ['pos.sale.new', 'pos.invoice.view', 'pos.payments.view', 'inventory.product.view', 'inventory.stock.view', 'inventory.uom.view'] },
    ],
    // report: [
    //     { name: 'HRM', icon: 'receipt'   , color: '#2563EB', screen: undefined },
    //     // { name: 'Payroll', icon: 'receipt', color: '#9f813d', screen: undefined },
    //     // { name: 'Projects', icon: 'receipt', color: '#F59E0B', screen: undefined },
    //     { name: 'Inventory', icon: 'receipt', color: '#b12ca2', screen: undefined },
    //     { name: 'Sales', icon: 'receipt', color: '#F97316', screen: undefined },
    //     { name: 'Business', icon: 'receipt', color: '#bba3fe', screen: undefined },
    //     // { name: 'Access', icon: 'receipt', color: '#bca54b', screen: undefined },
    //     // { name: 'subscription', icon: 'receipt', color: '#ca6728', screen: undefined },
    // ]
}

export const messageList = [
//     {
//         id: 1,
//         text: `👋 Hello Joseph Owusu! Suto AI here.

// I can help you with:
// - Sales insights and revenue trends
// - Inventory and stock tracking
// - Customer engagement and behavior analysis
// - Staff performance and payroll
// - Generating reports and actionable recommendations

// I noticed that your sales dropped by 15% this week. Would you like me to analyze this and suggest ways to fix it?`,
//         isOwn: false,
//         timestamp: '10:30 AM',
//         avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
//     },
//     {
//         id: 2,
//         text: "Thank you, please do",
//         isOwn: true,
//         timestamp: '10:32 AM',
//     }
]

export const trueOrFalse = [
    {key: 'true', value: "True"},
    {key: 'false', value: "False"},
]


export const divisionList = [
    { id: 1, name: "Permanent", businessID: 1, businessName: "Awo's Pub", headedBy: 1 }
]

export const paymentsList = [
    {
      id: 'p1',
      reference: 'INV-2026-0001',
      saleId: 'S-1001',
      amount: 200,
      paidAmount: 200,
      dueAmount: 0,
      status: 'full',
      createdAt: '2026-04-23T10:15:00Z',
      customer: 'Ama Mensah',
    },
    {
        id: 'p0',
        reference: 'INV-2026-0002',
        saleId: 'S-1001',
        amount: 200,
        paidAmount: 200,
        dueAmount: 0,
        status: 'full',
        createdAt: '2026-04-23T10:15:00Z',
        customer: 'Ama Mensah',
      },
    {
      id: 'p2',
      reference: 'INV-2026-0002',
      saleId: 'S-1002',
      amount: 320,
      paidAmount: 150,
      dueAmount: 200,
      status: 'partial',
      createdAt: '2026-04-23T12:40:00Z',
      customer: 'Kojo Mensah',
    },
    {
      id: 'p3',
      reference: 'INV-2026-0003',
      saleId: 'S-1003',
      amount: 120,
      paidAmount: 120,
      dueAmount: 0,
      status: 'full',
      createdAt: '2026-04-22T09:10:00Z',
      customer: 'Akosua Boateng',
    },
    {
      id: 'p4',
      reference: 'INV-2026-0004',
      saleId: 'S-1004',
      amount: 500,
      paidAmount: 300,
      dueAmount: 200,
      status: 'partial',
      createdAt: '2026-04-22T16:30:00Z',
      customer: 'Yaw Kofi',
    },
    {
      id: 'p5',
      reference: 'INV-2026-0005',
      saleId: 'S-1005',
      amount: 80,
      paidAmount: 80,
      dueAmount: 0,
      status: 'full',
      createdAt: '2026-04-21T11:05:00Z',
      customer: 'Esi Adjei',
    },
    {
      id: 'p6',
      reference: 'INV-2026-0006',
      saleId: 'S-1006',
      amount: 1000,
      paidAmount: 400,
      dueAmount: 600,
      status: 'partial',
      createdAt: '2026-04-21T14:45:00Z',
      customer: 'Kweku Darko',
    },
    {
      id: 'p7',
      reference: 'INV-2026-0007',
      saleId: 'S-1007',
      amount: 60,
      paidAmount: 60,
      dueAmount: 0,
      status: 'full',
      createdAt: '2026-04-20T08:20:00Z',
      customer: 'Linda Owusu',
    },
    {
      id: 'p8',
      reference: 'INV-2026-0008',
      saleId: 'S-1008',
      amount: 450,
      paidAmount: 200,
      dueAmount: 250,
      status: 'partial',
      createdAt: '2026-04-20T18:10:00Z',
      customer: 'Josephine Asante',
    },
];

export const SAMPLE_ALERTS = [
    // ================= INVENTORY =================
    {
      id: 'inv-1',
      title: 'Low Stock Alert',
      message: 'Rice 5kg is below reorder level (3 left).',
      type: 'warning',
      module: 'inventory',
      time: '5m ago',
      requiresAction: true,
      details: {
        product: 'Rice 5kg',
        currentStock: 3,
        reorderLevel: 20,
      },
    },
    {
      id: 'inv-2',
      title: 'Stock Out',
      message: 'Indomie Chicken is out of stock.',
      type: 'warning',
      module: 'inventory',
      time: '20m ago',
      requiresAction: true,
    },
    {
      id: 'inv-3',
      title: 'Stock Replenished',
      message: 'Coca Cola stock updated from supplier delivery.',
      type: 'info',
      module: 'inventory',
      time: '1h ago',
      requiresAction: false,
    },
  
    // ================= POS =================
    {
      id: 'pos-1',
      title: 'High Sales Alert',
      message: 'You made GHS 2,400 in sales today.',
      type: 'info',
      module: 'pos',
      time: '10m ago',
      requiresAction: false,
    },
    {
      id: 'pos-2',
      title: 'Suspicious Refund',
      message: 'Large refund issued without manager approval.',
      type: 'warning',
      module: 'pos',
      time: '2h ago',
      requiresAction: true,
      details: {
        amount: 450,
        cashier: 'John Doe',
      },
    },
    {
      id: 'pos-3',
      title: 'End of Day Report Ready',
      message: 'Daily sales report is ready for review.',
      type: 'info',
      module: 'pos',
      time: 'Today',
      requiresAction: false,
    },
  
    // ================= USER MANAGEMENT =================
    {
      id: 'user-1',
      title: 'New Staff Login',
      message: 'Ama Mensah logged in from a new device.',
      type: 'warning',
      module: 'user',
      time: '5m ago',
      requiresAction: false,
      details: {
        device: 'Samsung Galaxy A14',
        location: 'Accra',
      },
    },
    {
      id: 'user-2',
      title: 'Role Change Request',
      message: 'John requested promotion to Manager role.',
      type: 'approval_request',
      module: 'user',
      time: '1h ago',
      requiresAction: true,
      status: 'pending',
    },
    {
      id: 'user-3',
      title: 'Account Suspended',
      message: 'User Kofi has been temporarily suspended.',
      type: 'warning',
      module: 'user',
      time: 'Yesterday',
      requiresAction: false,
    },
  
    // ================= SYSTEM / SECURITY =================
    {
      id: 'sys-1',
      title: 'Multiple Failed Logins',
      message: '3 failed login attempts detected.',
      type: 'warning',
      module: 'system',
      time: '2m ago',
      requiresAction: true,
      details: {
        ip: '102.88.12.44',
      },
    },
    {
      id: 'sys-2',
      title: 'Backup Completed',
      message: 'Daily system backup completed successfully.',
      type: 'info',
      module: 'system',
      time: '1d ago',
      requiresAction: false,
    },
    {
      id: 'sys-3',
      title: 'Permission Change Approval',
      message: 'Approve admin access for new branch manager.',
      type: 'approval_request',
      module: 'system',
      time: '3h ago',
      requiresAction: true,
      status: 'pending',
    },
  ]



//   He’s been trapped in the same day for years… until one girl breaks the loop
