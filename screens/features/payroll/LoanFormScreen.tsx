import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import {
    BottomSheetSelectOption,
    PayrollNavigationList
} from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import {
    Borders,
    Spacing,
    Typography
} from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import BottomSheet, {
    BottomSheetScrollView
} from '@gorhom/bottom-sheet';
import { SocketIO } from '../../../configuration/helpers/main.helpers';
import { formatCurrency } from '../../../utils/constants/Currency';

type TLoanFormScreen =
    NativeStackScreenProps<
        PayrollNavigationList,
        'LoanFormScreen'
    >;

type FormState = {
    loanType: BottomSheetSelectOption | null;
};

type LoanTypeData = {
    id?: string | number;
    businessID?: string | number;
    name?: string;
    minimumAmount?: number;
    maximumAmount?: number;
    defaultInterestRate?: number;
    interestMethod?:
        | 'none'
        | 'flat'
        | 'declining_balance';
    repaymentMethod?:
        | 'equal_installments'
        | 'equal_principal';
    serviceDebtRatio?: number;
    description?: string;
    status?: string;
};

type CompensationData = {
    id?: string | number;
    employeeID?: string | number;

    source?:
        | 'individual'
        | 'role'
        | 'grade';

    sourceID?: string | number | null;

    type?: 'salary' | 'wage';

    salary?: number;
    wageRate?: number;

    wageRateType?:
        | 'fixed'
        | 'percentage';

    wagePeriod?:
        | 'hourly'
        | 'daily'
        | 'weekly'
        | 'monthly'
        | 'per_service';

    currencyID?: string | number;

    effectiveFrom?: string;
    effectiveTo?: string;

    status?: 'active' | 'inactive';

    description?: string;
};

type ExistingLoan = {
    id?: string | number;
    employeeID?: string | number;
    status?: string;
    loanStatus?: string;
    paymentStatus?: string;

    loanBalance?: number;
    outstandingBalance?: number;
    balance?: number;

    installment?: number;
    monthlyInstallment?: number;
    paymentAmount?: number;
    repaymentAmount?: number;
    scheduledPayment?: number;

    amount?: number;
    principal?: number;

    loanTerm?: number;
    loanTermRemaining?: number;

    interestRate?: number;
    interestMethod?: string;
    repaymentMethod?: string;
};

type LoanCalculation = {
    totalInterest: number;
    totalRepayment: number;
    installment: number;
    firstInstallment: number;
    lastInstallment: number;
};

const LoanFormScreen = ({
    navigation,
    route
}: TLoanFormScreen) => {
    const colorScheme = useColorScheme();
    const themeColors =
        Colors[colorScheme ?? 'light'];

    const insets =
        useSafeAreaInsets();

    const {
        session,
        selectedBusiness,
        userData,
        userBranch,
        userGrade,
        businessCurrency
    } = useAppContainer();

    const { data } = route.params;

    const [principal, setPrincipal] =
        useState(
            data?.principal !== undefined
                ? String(data.principal)
                : ''
        );

    const [loanTerm, setLoanTerm] =
        useState(
            data?.loanTerm !== undefined
                ? String(data.loanTerm)
                : ''
        );

    const [interestRate, setInterestRate] =
        useState(
            data?.interestRate !== undefined
                ? String(data.interestRate)
                : ''
        );

    const [
        serviceDebtRatio,
        setServiceDebtRatio
    ] = useState(
        data?.serviceDebtRatio !== undefined
            ? String(data.serviceDebtRatio)
            : ''
    );

    const [
        interestMethod,
        setInterestMethod
    ] = useState('');

    const [
        repaymentMethod,
        setRepaymentMethod
    ] = useState('');

    const [
        minimumAmount,
        setMinimumAmount
    ] = useState('');

    const [
        maximumAmount,
        setMaximumAmount
    ] = useState('');

    const [
        loanTypeDescription,
        setLoanTypeDescription
    ] = useState('');

    const [description, setDescription] =
        useState(
            data?.description || ''
        );

    const [
        loanTypeList,
        setLoanTypeList
    ] = useState<
        BottomSheetSelectOption[]
    >([]);

    const [loanTypes, setLoanTypes] =
        useState<LoanTypeData[]>([]);

    const [form, setForm] =
        useState<FormState>({
            loanType: null
        });

    const [
        sheetOptions,
        setSheetOptions
    ] = useState<
        BottomSheetSelectOption[]
    >([]);

    const [sheetTitle, setSheetTitle] =
        useState('');

    const [
        activeField,
        setActiveField
    ] =
        useState<keyof FormState | null>(
            null
        );

    const [isSaving, setIsSaving] =
        useState(false);

    /*
     * ============================================================
     * AFFORDABILITY DATA
     * ============================================================
     */

    const [
        compensation,
        setCompensation
    ] =
        useState<CompensationData | null>(
            null
        );

    const [
        existingLoans,
        setExistingLoans
    ] =
        useState<ExistingLoan[]>([]);

    const [
        loadingAffordability,
        setLoadingAffordability
    ] = useState(true);

    const bottomSheetRef =
        useRef<BottomSheet>(null);

    const snapPoints = useMemo(
        () => ['40%', '50%', '75%'],
        []
    );

    /*
     * ============================================================
     * HELPERS
     * ============================================================
     */

    const currency = (
        value: number
    ) =>
        formatCurrency(
            Number(value || 0),
            {
                symbol:
                    businessCurrency.symbol
            }
        );

    const formatInterestMethod = (
        value: string
    ) => {
        if (
            value ===
            'declining_balance'
        ) {
            return 'Declining Balance';
        }

        if (value === 'flat') {
            return 'Flat';
        }

        if (value === 'none') {
            return 'None';
        }

        return value;
    };

    const formatRepaymentMethod = (
        value: string
    ) => {
        if (
            value ===
            'equal_installments'
        ) {
            return 'Equal Installments';
        }

        if (
            value ===
            'equal_principal'
        ) {
            return 'Equal Principal';
        }

        return value;
    };

    /*
     * ============================================================
     * LOAN TYPE
     * ============================================================
     */

    const fillLoanTypeData = (
        loanType: LoanTypeData
    ) => {
        setInterestRate(
            String(
                loanType.defaultInterestRate ??
                    0
            )
        );

        setServiceDebtRatio(
            String(
                loanType.serviceDebtRatio ??
                    0
            )
        );

        setInterestMethod(
            loanType.interestMethod
                ? formatInterestMethod(
                      loanType.interestMethod
                  )
                : ''
        );

        setRepaymentMethod(
            loanType.repaymentMethod
                ? formatRepaymentMethod(
                      loanType.repaymentMethod
                  )
                : ''
        );

        setMinimumAmount(
            loanType.minimumAmount !==
                undefined
                ? String(
                      loanType.minimumAmount
                  )
                : ''
        );

        setMaximumAmount(
            loanType.maximumAmount !==
                undefined
                ? String(
                      loanType.maximumAmount
                  )
                : ''
        );

        setLoanTypeDescription(
            loanType.description || ''
        );
    };

    const openBottomSheet = (
        field: keyof FormState,
        options: BottomSheetSelectOption[],
        title: string
    ) => {
        if (!options.length) {
            Alert.alert(
                'Note',
                `No ${title.toLowerCase()} available`
            );
            return;
        }

        setActiveField(field);
        setSheetOptions(options);
        setSheetTitle(title);

        bottomSheetRef.current?.snapToIndex(
            0
        );
    };

    const selectOption = (
        option: BottomSheetSelectOption
    ) => {
        if (activeField) {
            setForm(prev => ({
                ...prev,
                [activeField]: option
            }));
        }

        if (
            activeField ===
            'loanType'
        ) {
            const selectedLoanType =
                loanTypes.find(
                    item =>
                        String(item.id) ===
                        String(option.key)
                );

            if (selectedLoanType) {
                fillLoanTypeData(
                    selectedLoanType
                );

                if (
                    !description &&
                    selectedLoanType.description
                ) {
                    setDescription(
                        selectedLoanType.description
                    );
                }
            }
        }

        bottomSheetRef.current?.close();
    };

    /*
     * ============================================================
     * FETCH LOAN TYPES
     * ============================================================
     */

    const fetchLoanTypes = () => {
        SocketIO.emit(
            'fetch-loan-types',
            {
                sessionID: session,
                businessID:
                    selectedBusiness.id
            },
            (response: any) => {
                if (
                    response.status !==
                    'success'
                ) {
                    Alert.alert(
                        'Error',
                        response.message ||
                            'Error fetching loan types'
                    );
                    return;
                }

                const activeLoanTypes =
                    (
                        response.data ||
                        []
                    ).filter(
                        (
                            item: LoanTypeData
                        ) =>
                            item.status ===
                            'active'
                    );

                const simplified =
                    activeLoanTypes.map(
                        (
                            item: LoanTypeData
                        ) => ({
                            key: item.id,
                            value:
                                item.name ||
                                ''
                        })
                    );

                setLoanTypes(
                    activeLoanTypes
                );

                setLoanTypeList(
                    simplified
                );

                if (data?.loanTypeID) {
                    const selected =
                        simplified.find(
                            (item:any) =>
                                String(
                                    item.key
                                ) ===
                                String(
                                    data.loanTypeID
                                )
                        );

                    const selectedLoanType =
                        activeLoanTypes.find(
                            (item:any) =>
                                String(
                                    item.id
                                ) ===
                                String(
                                    data.loanTypeID
                                )
                        );

                    if (selected) {
                        setForm(prev => ({
                            ...prev,
                            loanType:
                                selected
                        }));
                    }

                    if (
                        selectedLoanType
                    ) {
                        fillLoanTypeData(
                            selectedLoanType
                        );
                    }
                }
            }
        );
    };

    /*
     * ============================================================
     * COMPENSATION FETCH
     *
     * IMPORTANT:
     *
     * We do NOT immediately choose the first result.
     *
     * We collect the available compensation records first.
     *
     * Priority is then:
     *
     *      individual
     *          ↓
     *        role
     *          ↓
     *        grade
     *
     * This means that if there is no individual compensation,
     * we can still use role compensation. If there is no role
     * compensation, we can use grade compensation.
     * ============================================================
     */

    const fetchCompensation = () => {
        const employeeID = selectedBusiness?.employee_id;
        console.log({employeeID})
// 
        if (
            !selectedBusiness?.id ||
            !employeeID
        ) {
            setCompensation(null);
            setLoadingAffordability(false);
            return;
        }

        setLoadingAffordability(true);

        const requests: Promise<any>[] =
            [];

        /*
         * --------------------------------------------------------
         * INDIVIDUAL
         * --------------------------------------------------------
         */

        requests.push(
            new Promise(resolve => {
                SocketIO.emit(
                    'fetch-employee-compensations',
                    {
                        businessID:
                            selectedBusiness.id,

                        employeeID,

                        source:
                            'individual',

                        sourceID:
                            null,

                        status:
                            'active',

                        sessionID:
                            session,

                        limit: 50,

                        offset: 0
                    },
                    (response: any) => {
                        resolve({
                            requestedSource:
                                'individual',
                            response
                        });
                    }
                );
            })
        );

        /*
         * --------------------------------------------------------
         * ROLE
         *
         * Try to get the role ID from the available
         * employee/container objects.
         * --------------------------------------------------------
         */

        const roleID = selectedBusiness?.role_id
        // console.log({roleID})

        if (roleID) {
            requests.push(
                new Promise(
                    resolve => {
                        SocketIO.emit(
                            'fetch-employee-compensations',
                            {
                                businessID:
                                    selectedBusiness.id,

                                employeeID: null,

                                source:
                                    'role',

                                sourceID:
                                    roleID,

                                roleID,

                                status:
                                    'active',

                                sessionID:
                                    session,

                                limit: 50,

                                offset: 0
                            },
                            (
                                response: any
                            ) => {
                                resolve(
                                    {
                                        requestedSource:
                                            'role',
                                        response
                                    }
                                );
                            }
                        );
                    }
                )
            );
        }

        /*
         * --------------------------------------------------------
         * GRADE
         * --------------------------------------------------------
         */

        const gradeID = userGrade?.id
        // console.log({gradeID})

        if (gradeID) {
            requests.push(
                new Promise(
                    resolve => {
                        SocketIO.emit(
                            'fetch-employee-compensations',
                            {
                                businessID:
                                    selectedBusiness.id,

                                employeeID: null,

                                source:
                                    'grade',

                                sourceID:
                                    gradeID,

                                gradeID,

                                status:
                                    'active',

                                sessionID:
                                    session,

                                limit: 50,

                                offset: 0
                            },
                            (
                                response: any
                            ) => {
                                resolve(
                                    {
                                        requestedSource:
                                            'grade',
                                        response
                                    }
                                );
                            }
                        );
                    }
                )
            );
        }

        /*
         * --------------------------------------------------------
         * WAIT FOR ALL LOOKUPS
         * --------------------------------------------------------
         */

        Promise.all(requests)
            .then(results => {
                const allRows: CompensationData[] =
                    [];

                results.forEach(
                    ({
                        requestedSource,
                        response
                    }: any) => {
                        if (
                            !response ||
                            response.status !==
                                'success'
                        ) {
                            return;
                        }

                        const rows =
                            Array.isArray(
                                response.data
                            )
                                ? response.data
                                : response.data
                                ? [
                                        response.data
                                    ]
                                : [];

                        rows.forEach(
                            (
                                row: CompensationData
                            ) => {
                                allRows.push(
                                    {
                                        ...row,

                                        /*
                                         * If the backend didn't
                                         * tell us the source,
                                         * use the source from
                                         * the request.
                                         */
                                        source:
                                            row.source ??
                                            requestedSource
                                    }
                                );
                            }
                        );
                    }
                );

                /*
                 * ------------------------------------------------
                 * ONLY ACTIVE COMPENSATION
                 * ------------------------------------------------
                 */

                const activeRows =
                    allRows.filter(
                        row =>
                            !row.status ||
                            row.status ===
                                'active'
                    );

                /*
                 * ------------------------------------------------
                 * REMOVE DUPLICATES
                 * ------------------------------------------------
                 */

                const uniqueRows =
                    activeRows.filter(
                        (
                            row,
                            index,
                            array
                        ) => {
                            return (
                                index ===
                                array.findIndex(
                                    item =>
                                        String(
                                            item.id ??
                                                ''
                                        ) ===
                                            String(
                                                row.id ??
                                                    ''
                                            ) &&
                                        String(
                                            item.source ??
                                                ''
                                        ) ===
                                            String(
                                                row.source ??
                                                    ''
                                            )
                                )
                            );
                        }
                    );

                /*
                 * ------------------------------------------------
                 * PRIORITY
                 *
                 * individual = 3
                 * role       = 2
                 * grade      = 1
                 * ------------------------------------------------
                 */

                const sourceWeight = (
                    source?: string
                ) => {
                    switch (
                        source
                    ) {
                        case 'individual':
                            return 3;

                        case 'role':
                            return 2;

                        case 'grade':
                            return 1;

                        default:
                            return 0;
                    }
                };

                const sorted =
                    uniqueRows.sort(
                        (
                            a,
                            b
                        ) =>
                            sourceWeight(
                                b.source
                            ) -
                            sourceWeight(
                                a.source
                            )
                    );

                /*
                 * ------------------------------------------------
                 * FINAL COMPENSATION
                 * ------------------------------------------------
                 */

                const selected =
                    sorted[0] || null;

                // console.log(
                //     'Loan compensation lookup:',
                //     {
                //         employeeID,
                //         roleID,
                //         gradeID,
                //         recordsFound:
                //             uniqueRows.length,
                //         records:
                //             uniqueRows,
                //         selected
                //     }
                // );

                setCompensation(
                    selected
                );

                setLoadingAffordability(
                    false
                );
            })
            .catch(error => {
                // console.log(
                //     'fetch compensation error:',
                //     error
                // );

                setCompensation(null);

                setLoadingAffordability(
                    false
                );
            });
    };

    /*
     * ============================================================
     * FETCH EXISTING LOANS
     * ============================================================
     */

    const fetchExistingLoans = () => {
        const employeeID =
            userData?.employeeID ??
            selectedBusiness?.employee_id;

        if (
            !selectedBusiness?.id ||
            !employeeID
        ) {
            return;
        }

        SocketIO.emit(
            'fetch-employee-loans',
            {
                businessID:
                    selectedBusiness.id,

                employeeID,

                sessionID: session,

                limit: 100,

                offset: 0,

                status: 'active'
            },
            (response: any) => {
                if (
                    response.status !==
                    'success'
                ) {
                    setExistingLoans([]);
                    return;
                }

                const rows =
                    Array.isArray(
                        response.data
                    )
                        ? response.data
                        : response.data
                          ? [
                                response.data
                            ]
                          : [];

                const unpaid =
                    rows.filter(
                        (
                            loan: ExistingLoan
                        ) => {
                            /*
                             * Exclude current loan
                             * when editing.
                             */
                            if (
                                data?.id &&
                                String(
                                    loan.id
                                ) ===
                                    String(
                                        data.id
                                    )
                            ) {
                                return false;
                            }

                            const status =
                                String(
                                    loan.status ||
                                        loan.loanStatus ||
                                        loan.paymentStatus ||
                                        ''
                                ).toLowerCase();

                            if (
                                status ===
                                    'paid' ||
                                status ===
                                    'completed' ||
                                status ===
                                    'closed' ||
                                status ===
                                    'settled'
                            ) {
                                return false;
                            }

                            return true;
                        }
                    );

                setExistingLoans(
                    unpaid
                );
            }
        );
    };

    /*
     * ============================================================
     * INITIAL LOAD
     * ============================================================
     */

    useEffect(() => {
        fetchLoanTypes();
        fetchCompensation();
        fetchExistingLoans();
    }, [
        session,
        selectedBusiness?.id,
        userData?.employeeID,
        selectedBusiness?.employee_id,
        userGrade?.id
    ]);

    /*
     * ============================================================
     * LOAN CALCULATION
     * ============================================================
     */

    const calculation =
        useMemo<LoanCalculation>(() => {
            const amount =
                Number(principal);

            const term =
                Number(loanTerm);

            const annualRate =
                Number(
                    interestRate || 0
                );

            if (
                !amount ||
                amount <= 0 ||
                !term ||
                term <= 0
            ) {
                return {
                    totalInterest: 0,
                    totalRepayment: 0,
                    installment: 0,
                    firstInstallment: 0,
                    lastInstallment: 0
                };
            }

            const selectedLoanType =
                loanTypes.find(
                    item =>
                        String(item.id) ===
                        String(
                            form.loanType?.key
                        )
                );

            const interestType =
                selectedLoanType
                    ?.interestMethod ||
                'none';

            const repaymentType =
                selectedLoanType
                    ?.repaymentMethod ||
                'equal_installments';

            /*
             * NO INTEREST
             */

            if (
                interestType ===
                'none'
            ) {
                const installment =
                    amount / term;

                return {
                    totalInterest: 0,
                    totalRepayment:
                        amount,
                    installment,
                    firstInstallment:
                        installment,
                    lastInstallment:
                        installment
                };
            }

            /*
             * FLAT INTEREST
             */

            if (
                interestType ===
                'flat'
            ) {
                const totalInterest =
                    amount *
                    (annualRate / 100) *
                    (term / 12);

                const totalRepayment =
                    amount +
                    totalInterest;

                const installment =
                    totalRepayment /
                    term;

                return {
                    totalInterest,
                    totalRepayment,
                    installment,
                    firstInstallment:
                        installment,
                    lastInstallment:
                        installment
                };
            }

            /*
             * DECLINING BALANCE
             */

            const monthlyRate =
                annualRate /
                100 /
                12;

            /*
             * EQUAL PRINCIPAL
             */

            if (
                repaymentType ===
                'equal_principal'
            ) {
                const principalPart =
                    amount / term;

                let totalInterest = 0;
                let firstInstallment = 0;
                let lastInstallment = 0;

                for (
                    let period = 0;
                    period < term;
                    period++
                ) {
                    const balance =
                        amount -
                        principalPart *
                            period;

                    const interest =
                        balance *
                        monthlyRate;

                    const installment =
                        principalPart +
                        interest;

                    totalInterest +=
                        interest;

                    if (
                        period === 0
                    ) {
                        firstInstallment =
                            installment;
                    }

                    if (
                        period ===
                        term - 1
                    ) {
                        lastInstallment =
                            installment;
                    }
                }

                const totalRepayment =
                    amount +
                    totalInterest;

                return {
                    totalInterest,
                    totalRepayment,
                    installment:
                        totalRepayment /
                        term,
                    firstInstallment,
                    lastInstallment
                };
            }

            /*
             * ZERO RATE
             */

            if (
                monthlyRate === 0
            ) {
                const installment =
                    amount / term;

                return {
                    totalInterest: 0,
                    totalRepayment:
                        amount,
                    installment,
                    firstInstallment:
                        installment,
                    lastInstallment:
                        installment
                };
            }

            /*
             * EQUAL INSTALLMENTS
             */

            const power =
                Math.pow(
                    1 + monthlyRate,
                    term
                );

            const installment =
                amount *
                (monthlyRate * power) /
                (power - 1);

            const totalRepayment =
                installment * term;

            const totalInterest =
                totalRepayment -
                amount;

            return {
                totalInterest,
                totalRepayment,
                installment,
                firstInstallment:
                    installment,
                lastInstallment:
                    installment
            };
        }, [
            principal,
            loanTerm,
            interestRate,
            form.loanType,
            loanTypes
        ]);

    /*
     * ============================================================
     * MONTHLY INCOME
     * ============================================================
     */

    const monthlyIncome =
        useMemo(() => {
            if (!compensation) {
                return 0;
            }

            let value = 0;

            /*
             * Salary compensation
             */

            if (
                compensation.type ===
                'salary'
            ) {
                value = Number(
                    compensation.salary ??
                        0
                );
            }

            /*
             * Wage compensation
             */

            else if (
                compensation.type ===
                'wage'
            ) {
                value = Number(
                    compensation.wageRate ??
                        0
                );
            }

            /*
             * Fallback
             */

            else {
                value = Number(
                    compensation.salary ??
                        compensation.wageRate ??
                        0
                );
            }

            if (
                !value ||
                value <= 0
            ) {
                return 0;
            }

            /*
             * Salary is already monthly.
             */

            if (
                compensation.type ===
                'salary'
            ) {
                return value;
            }

            /*
             * Wage conversion.
             */

            switch (
                compensation.wagePeriod
            ) {
                case 'hourly':
                    return (
                        value * 173.33
                    );

                case 'daily':
                    return (
                        value * 21.67
                    );

                case 'weekly':
                    return (
                        value * 4.333
                    );

                case 'monthly':
                    return value;

                /*
                 * No safe conversion is
                 * possible without knowing
                 * the expected services.
                 */
                case 'per_service':
                    return value;

                default:
                    return value;
            }
        }, [compensation]);

    /*
     * ============================================================
     * EXISTING MONTHLY DEBT
     * ============================================================
     */

    const existingMonthlyDebt =
        useMemo(() => {
            return existingLoans.reduce(
                (
                    total,
                    loan
                ) => {
                    const installment =
                        Number(
                            loan.installment ??
                                loan.monthlyInstallment ??
                                loan.paymentAmount ??
                                loan.repaymentAmount ??
                                loan.scheduledPayment ??
                                0
                        );

                    return (
                        total +
                        (installment >
                        0
                            ? installment
                            : 0)
                    );
                },
                0
            );
        }, [existingLoans]);

    /*
     * ============================================================
     * AFFORDABILITY
     * ============================================================
     */

    const affordability =
        useMemo(() => {
            const newInstallment =
                calculation.installment;

            const totalMonthlyDebt =
                existingMonthlyDebt +
                newInstallment;

            const allowedRatio =
                Number(
                    serviceDebtRatio ||
                        0
                );

            const debtRatio =
                monthlyIncome > 0
                    ? (totalMonthlyDebt /
                          monthlyIncome) *
                      100
                    : 0;

            const availableDebt =
                monthlyIncome *
                (allowedRatio / 100);

            const remainingCapacity =
                availableDebt -
                existingMonthlyDebt;

            const affordable =
                allowedRatio > 0 &&
                monthlyIncome > 0
                    ? debtRatio <=
                      allowedRatio
                    : true;

            return {
                newInstallment,
                totalMonthlyDebt,
                allowedRatio,
                debtRatio,
                availableDebt,
                remainingCapacity,
                affordable
            };
        }, [
            calculation.installment,
            existingMonthlyDebt,
            monthlyIncome,
            serviceDebtRatio
        ]);

    const isEqualPrincipal =
        repaymentMethod ===
        'Equal Principal';

    /*
     * ============================================================
     * READ ONLY INPUT
     * ============================================================
     */

    const readOnlyInput = (
        value: string,
        placeholder: string
    ) => (
        <TextInput
            style={[
                styles.input,
                {
                    backgroundColor:
                        themeColors.subtleBackground,
                    borderColor:
                        themeColors.border,
                    color:
                        themeColors.text
                }
            ]}
            placeholder={
                placeholder
            }
            placeholderTextColor={
                themeColors.subtleText
            }
            value={value}
            editable={false}
        />
    );

    /*
     * ============================================================
     * SAVE
     * ============================================================
     */

    const handleSave = () => {
        const employeeID = selectedBusiness?.employee_id;

        if (
            !selectedBusiness.id || !employeeID
        ) {
            Alert.alert(
                'Note',
                'Unable to identify the employee'
            );
            return;
        }

        if (!userBranch?.id) {
            Alert.alert(
                'Note',
                'Unable to identify your branch'
            );
            return;
        }

        if (!form.loanType) {
            Alert.alert(
                'Note',
                'Loan type is required'
            );
            return;
        }

        if (
            !principal ||
            !loanTerm
        ) {
            Alert.alert(
                'Note',
                'Principal and loan term are required'
            );
            return;
        }

        const principalValue =
            Number(principal);

        const loanTermValue =
            Number(loanTerm);

        if (
            principalValue <= 0
        ) {
            Alert.alert(
                'Note',
                'Principal must be greater than zero'
            );
            return;
        }

        if (
            loanTermValue <= 0
        ) {
            Alert.alert(
                'Note',
                'Loan term must be greater than zero'
            );
            return;
        }

        if (
            minimumAmount &&
            principalValue <
                Number(minimumAmount)
        ) {
            Alert.alert(
                'Note',
                `Principal cannot be below the minimum loan amount of ${currency(
                    Number(
                        minimumAmount
                    )
                )}`
            );
            return;
        }

        if (
            maximumAmount &&
            principalValue >
                Number(maximumAmount)
        ) {
            Alert.alert(
                'Note',
                `Principal cannot exceed the maximum loan amount of ${currency(
                    Number(
                        maximumAmount
                    )
                )}`
            );
            return;
        }

        /*
         * FRONTEND AFFORDABILITY CHECK
         */

        if (
            !loadingAffordability &&
            serviceDebtRatio &&
            monthlyIncome > 0 &&
            !affordability.affordable
        ) {
            Alert.alert(
                'Loan Not Affordable',
                `The proposed loan would take ${affordability.debtRatio.toFixed(
                    1
                )}% of monthly income. The maximum allowed is ${affordability.allowedRatio.toFixed(
                    1
                )}%.`,
                [
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    }
                ]
            );

            return;
        }

        setIsSaving(true);

        const formData = {
            businessID:
                selectedBusiness.id,

            branchID:
                userBranch.id,

            employeeID,

            loanTypeID:
                form.loanType.key,

            principal:
                principalValue,

            loanTerm:
                loanTermValue,

            interestRate:
                interestRate === ''
                    ? undefined
                    : Number(
                          interestRate
                      ),

            serviceDebtRatio:
                serviceDebtRatio === ''
                    ? undefined
                    : Number(
                          serviceDebtRatio
                      ),

            loanBalance:
                principalValue,

            description,

            loanID: data?.id,

            sessionID:
                session
        };

        SocketIO.emit(
            'add-update-loan',
            formData,
            (response: any) => {
                setIsSaving(false);

                if (
                    response.status ===
                    'success'
                ) {
                    Alert.alert(
                        'Success',
                        response.message,
                        [
                            {
                                text: 'OK',
                                onPress:
                                    () =>
                                        navigation.goBack()
                            }
                        ]
                    ); 
                } else {
                    Alert.alert(
                        'Error',
                        response.message ||
                            'Failed to save loan'
                    );
                }
            }
        );
    };

    /*
     * ============================================================
     * UI
     * ============================================================
     */

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor:
                        themeColors.background
                }
            ]}
        >
            {Platform.OS ===
                'android' && (
                <View
                    style={[
                        styles.statusBarSpacer,
                        {
                            height: 10,
                            backgroundColor:
                                themeColors.background
                        }
                    ]}
                />
            )}

            <View
                style={[
                    styles.safeArea,
                    {
                        backgroundColor:
                            themeColors.background,
                        paddingTop:
                            Platform.OS ===
                            'ios'
                                ? insets.top
                                : 0,
                        paddingBottom:
                            Platform.OS ===
                            'ios'
                                ? 85
                                : 0
                    }
                ]}
            >
                <ThemedView
                    style={[
                        styles.header,
                        {
                            backgroundColor:
                                themeColors.background,
                            borderBottomColor:
                                themeColors.border
                        }
                    ]}
                >
                    <TouchableOpacity
                        onPress={() =>
                            navigation.goBack()
                        }
                        style={[
                            styles.backButtonMain,
                            {
                                backgroundColor:
                                    themeColors.subtleBackground
                            }
                        ]}
                    >
                        <IconSymbol
                            name="arrow.left"
                            size={20}
                            color={
                                themeColors.icon
                            }
                        />
                    </TouchableOpacity>

                    <ThemedText
                        style={
                            styles.headerTitle
                        }
                    >
                        {data?.id
                            ? 'Edit Loan'
                            : 'New Loan'}
                    </ThemedText>

                    <View
                        style={{
                            width: 36
                        }}
                    />
                </ThemedView>

                <KeyboardAvoidingView
                    style={{
                        flex: 1
                    }}
                    behavior={
                        Platform.OS ===
                        'ios'
                            ? 'padding'
                            : 'height'
                    }
                >
                    <ScrollView
                        style={
                            styles.scrollContainer
                        }
                        contentContainerStyle={[
                            styles.contentContainer,
                            {
                                paddingBottom:
                                    insets.bottom +
                                    100,
                                paddingTop: 10
                            }
                        ]}
                        showsVerticalScrollIndicator={
                            false
                        }
                        bounces={false}
                    >
                        {/* LOAN TYPE */}

                        <View
                            style={
                                styles.section
                            }
                        >
                            <ThemedText
                                style={[
                                    styles.sectionTitle,
                                    {
                                        color:
                                            themeColors.subtleText
                                    }
                                ]}
                            >
                                Loan Type (
                                <Text
                                    style={
                                        styles.required
                                    }
                                >
                                    Required
                                </Text>
                                )
                            </ThemedText>

                            <TouchableOpacity
                                style={[
                                    styles.input,
                                    {
                                        justifyContent:
                                            'center',
                                        backgroundColor:
                                            themeColors.inputBackground,
                                        borderColor:
                                            themeColors.border
                                    }
                                ]}
                                onPress={() =>
                                    openBottomSheet(
                                        'loanType',
                                        loanTypeList,
                                        'Select Loan Type'
                                    )
                                }
                            >
                                <Text
                                    style={{
                                        color:
                                            form.loanType
                                                ? themeColors.text
                                                : themeColors.subtleText,
                                        fontSize:
                                            Typography.small
                                    }}
                                >
                                    {form.loanType?.value ||
                                        'Select loan type'}
                                </Text>
                            </TouchableOpacity>

                            {form.loanType && (
                                <Text
                                    style={[
                                        styles.limitText,
                                        {
                                            color:
                                                themeColors.warning
                                        }
                                    ]}
                                >
                                    {currency(
                                        Number(
                                            minimumAmount ||
                                                0
                                        )
                                    )}
                                    {' - '}
                                    {currency(
                                        Number(
                                            maximumAmount ||
                                                0
                                        )
                                    )}
                                </Text>
                            )}
                        </View>

                        {/* PRINCIPAL / TERM */}

                        <View
                            style={
                                styles.row
                            }
                        >
                            <View
                                style={[
                                    styles.section,
                                    styles.half
                                ]}
                            >
                                <ThemedText
                                    style={[
                                        styles.sectionTitle,
                                        {
                                            color:
                                                themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Principal (
                                    <Text
                                        style={
                                            styles.required
                                        }
                                    >
                                        Required
                                    </Text>
                                    )
                                </ThemedText>

                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor:
                                                themeColors.inputBackground,
                                            borderColor:
                                                themeColors.border,
                                            color:
                                                themeColors.text
                                        }
                                    ]}
                                    placeholder="Amount"
                                    placeholderTextColor={
                                        themeColors.subtleText
                                    }
                                    keyboardType="decimal-pad"
                                    value={
                                        principal
                                    }
                                    onChangeText={
                                        setPrincipal
                                    }
                                />
                            </View>

                            <View
                                style={[
                                    styles.section,
                                    styles.half
                                ]}
                            >
                                <ThemedText
                                    style={[
                                        styles.sectionTitle,
                                        {
                                            color:
                                                themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Term (
                                    <Text
                                        style={
                                            styles.required
                                        }
                                    >
                                        Required
                                    </Text>
                                    )
                                </ThemedText>

                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor:
                                                themeColors.inputBackground,
                                            borderColor:
                                                themeColors.border,
                                            color:
                                                themeColors.text
                                        }
                                    ]}
                                    placeholder="Months"
                                    placeholderTextColor={
                                        themeColors.subtleText
                                    }
                                    keyboardType="number-pad"
                                    value={
                                        loanTerm
                                    }
                                    onChangeText={
                                        setLoanTerm
                                    }
                                />
                            </View>
                        </View>

                        {/* RATE / RATIO */}

                        <View
                            style={
                                styles.row
                            }
                        >
                            <View
                                style={[
                                    styles.section,
                                    styles.half
                                ]}
                            >
                                <ThemedText
                                    style={[
                                        styles.sectionTitle,
                                        {
                                            color:
                                                themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Interest Rate
                                </ThemedText>

                                {readOnlyInput(
                                    interestRate
                                        ? `${interestRate}%`
                                        : '',
                                    'Not specified'
                                )}
                            </View>

                            <View
                                style={[
                                    styles.section,
                                    styles.half
                                ]}
                            >
                                <ThemedText
                                    style={[
                                        styles.sectionTitle,
                                        {
                                            color:
                                                themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Debt Ratio
                                </ThemedText>

                                {readOnlyInput(
                                    serviceDebtRatio
                                        ? `${serviceDebtRatio}%`
                                        : '',
                                    'Not specified'
                                )}
                            </View>
                        </View>

                        {/* METHODS */}

                        <View
                            style={
                                styles.section
                            }
                        >
                            <ThemedText
                                style={[
                                    styles.sectionTitle,
                                    {
                                        color:
                                            themeColors.subtleText
                                    }
                                ]}
                            >
                                Interest Method
                            </ThemedText>

                            {readOnlyInput(
                                interestMethod,
                                'Not specified'
                            )}
                        </View>

                        <View
                            style={
                                styles.section
                            }
                        >
                            <ThemedText
                                style={[
                                    styles.sectionTitle,
                                    {
                                        color:
                                            themeColors.subtleText
                                    }
                                ]}
                            >
                                Repayment Method
                            </ThemedText>

                            {readOnlyInput(
                                repaymentMethod,
                                'Not specified'
                            )}
                        </View>

                        {/* REPAYMENT */}

                        <View
                            style={[
                                styles.box,
                                {
                                    backgroundColor:
                                        themeColors.card,
                                    borderColor:
                                        themeColors.border
                                }
                            ]}
                        >
                            <ThemedText
                                style={[
                                    styles.boxTitle,
                                    {
                                        color:
                                            themeColors.text
                                    }
                                ]}
                            >
                                Estimated Repayment
                            </ThemedText>

                            <View
                                style={
                                    styles.calcRow
                                }
                            >
                                <Text
                                    style={[
                                        styles.label,
                                        {
                                            color:
                                                themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Principal
                                </Text>

                                <Text
                                    style={[
                                        styles.value,
                                        {
                                            color:
                                                themeColors.text
                                        }
                                    ]}
                                >
                                    {currency(
                                        Number(
                                            principal ||
                                                0
                                        )
                                    )}
                                </Text>
                            </View>

                            <View
                                style={
                                    styles.calcRow
                                }
                            >
                                <Text
                                    style={[
                                        styles.label,
                                        {
                                            color:
                                                themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Total Interest
                                </Text>

                                <Text
                                    style={[
                                        styles.value,
                                        {
                                            color:
                                                themeColors.text
                                        }
                                    ]}
                                >
                                    {currency(
                                        calculation.totalInterest
                                    )}
                                </Text>
                            </View>

                            <View
                                style={
                                    styles.calcRow
                                }
                            >
                                <Text
                                    style={[
                                        styles.label,
                                        {
                                            color:
                                                themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Total Repayment
                                </Text>

                                <Text
                                    style={[
                                        styles.value,
                                        {
                                            color:
                                                themeColors.text
                                        }
                                    ]}
                                >
                                    {currency(
                                        calculation.totalRepayment
                                    )}
                                </Text>
                            </View>

                            <View
                                style={[
                                    styles.calcRow,
                                    styles.highlight,
                                    {
                                        borderTopColor:
                                            themeColors.border
                                    }
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.label,
                                        {
                                            color:
                                                themeColors.text
                                        }
                                    ]}
                                >
                                    Installment
                                </Text>

                                <Text
                                    style={[
                                        styles.installment,
                                        {
                                            color:
                                                themeColors.primary
                                        }
                                    ]}
                                >
                                    {currency(
                                        calculation.installment
                                    )}
                                </Text>
                            </View>

                            {isEqualPrincipal && (
                                <>
                                    <View
                                        style={
                                            styles.calcRow
                                        }
                                    >
                                        <Text
                                            style={[
                                                styles.label,
                                                {
                                                    color:
                                                        themeColors.subtleText
                                                }
                                            ]}
                                        >
                                            First Installment
                                        </Text>

                                        <Text
                                            style={[
                                                styles.value,
                                                {
                                                    color:
                                                        themeColors.text
                                                }
                                            ]}
                                        >
                                            {currency(
                                                calculation.firstInstallment
                                            )}
                                        </Text>
                                    </View>

                                    <View
                                        style={
                                            styles.calcRow
                                        }
                                    >
                                        <Text
                                            style={[
                                                styles.label,
                                                {
                                                    color:
                                                        themeColors.subtleText
                                                }
                                            ]}
                                        >
                                            Last Installment
                                        </Text>

                                        <Text
                                            style={[
                                                styles.value,
                                                {
                                                    color:
                                                        themeColors.text
                                                }
                                            ]}
                                        >
                                            {currency(
                                                calculation.lastInstallment
                                            )}
                                        </Text>
                                    </View>
                                </>
                            )}
                        </View>

                        {/* AFFORDABILITY */}

                        <View
                            style={[
                                styles.box,
                                {
                                    backgroundColor:
                                        affordability.affordable
                                            ? themeColors.card
                                            : colorScheme ===
                                                'dark'
                                              ? '#3A1717'
                                              : '#FEF2F2',
                                    borderColor:
                                        affordability.affordable
                                            ? themeColors.border
                                            : '#EF4444'
                                }
                            ]}
                        >
                            <View
                                style={
                                    styles.affordabilityHeader
                                }
                            >
                                <ThemedText
                                    style={[
                                        styles.boxTitle,
                                        {
                                            color:
                                                themeColors.text
                                        }
                                    ]}
                                >
                                    Affordability Check
                                </ThemedText>

                                <Text
                                    style={[
                                        styles.status,
                                        {
                                            color:
                                                affordability.affordable
                                                    ? '#16A34A'
                                                    : '#DC2626'
                                        }
                                    ]}
                                >
                                    {loadingAffordability
                                        ? 'Checking...'
                                        : affordability.affordable
                                          ? 'Affordable'
                                          : 'Not Affordable'}
                                </Text>
                            </View>

                            <View
                                style={
                                    styles.calcRow
                                }
                            >
                                <Text
                                    style={[
                                        styles.label,
                                        {
                                            color:
                                                themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Monthly Income
                                </Text>

                                <Text
                                    style={[
                                        styles.value,
                                        {
                                            color:
                                                themeColors.text
                                        }
                                    ]}
                                >
                                    {currency(
                                        monthlyIncome
                                    )}
                                </Text>
                            </View>

                            <View
                                style={
                                    styles.calcRow
                                }
                            >
                                <Text
                                    style={[
                                        styles.label,
                                        {
                                            color:
                                                themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Existing Debt
                                </Text>

                                <Text
                                    style={[
                                        styles.value,
                                        {
                                            color:
                                                themeColors.text
                                        }
                                    ]}
                                >
                                    {currency(
                                        existingMonthlyDebt
                                    )}
                                </Text>
                            </View>

                            <View
                                style={
                                    styles.calcRow
                                }
                            >
                                <Text
                                    style={[
                                        styles.label,
                                        {
                                            color:
                                                themeColors.subtleText
                                        }
                                    ]}
                                >
                                    New Installment
                                </Text>

                                <Text
                                    style={[
                                        styles.value,
                                        {
                                            color:
                                                themeColors.text
                                        }
                                    ]}
                                >
                                    {currency(
                                        calculation.installment
                                    )}
                                </Text>
                            </View>

                            <View
                                style={
                                    styles.calcRow
                                }
                            >
                                <Text
                                    style={[
                                        styles.label,
                                        {
                                            color:
                                                themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Total Debt
                                </Text>

                                <Text
                                    style={[
                                        styles.value,
                                        {
                                            color:
                                                themeColors.text
                                        }
                                    ]}
                                >
                                    {currency(
                                        affordability.totalMonthlyDebt
                                    )}
                                </Text>
                            </View>

                            <View
                                style={
                                    styles.calcRow
                                }
                            >
                                <Text
                                    style={[
                                        styles.label,
                                        {
                                            color:
                                                themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Debt Ratio
                                </Text>

                                <Text
                                    style={[
                                        styles.value,
                                        {
                                            color:
                                                affordability.affordable
                                                    ? '#16A34A'
                                                    : '#DC2626'
                                        }
                                    ]}
                                >
                                    {affordability.debtRatio.toFixed(
                                        1
                                    )}
                                    %
                                    {' / '}
                                    {affordability.allowedRatio.toFixed(
                                        1
                                    )}
                                    %
                                </Text>
                            </View>

                            {compensation && (
                                <Text
                                    style={[
                                        styles.note,
                                        {
                                            color:
                                                themeColors.subtleText
                                        }
                                    ]}
                                >
                                    Compensation source:{' '}
                                    {compensation.source ||
                                        'unknown'}
                                </Text>
                            )}

                            {monthlyIncome ===
                                0 && (
                                <Text
                                    style={[
                                        styles.note,
                                        {
                                            color:
                                                themeColors.warning
                                        }
                                    ]}
                                >
                                    Employee compensation could
                                    not be determined. The
                                    affordability check cannot
                                    calculate a reliable debt ratio.
                                </Text>
                            )}

                            {existingLoans.length >
                                0 && (
                                <Text
                                    style={[
                                        styles.note,
                                        {
                                            color:
                                                themeColors.subtleText
                                        }
                                    ]}
                                >
                                    {
                                        existingLoans.length
                                    }{' '}
                                    existing unpaid loan
                                    {existingLoans.length >
                                    1
                                        ? 's'
                                        : ''}{' '}
                                    included.
                                </Text>
                            )}

                            {!loadingAffordability &&
                                !affordability.affordable && (
                                    <Text
                                        style={[
                                            styles.note,
                                            {
                                                color:
                                                    '#DC2626'
                                            }
                                        ]}
                                    >
                                        This loan exceeds the
                                        employee's allowed debt
                                        service ratio.
                                    </Text>
                                )}
                        </View>

                        {/* DESCRIPTION */}

                        <View
                            style={
                                styles.section
                            }
                        >
                            <ThemedText
                                style={[
                                    styles.sectionTitle,
                                    {
                                        color:
                                            themeColors.subtleText
                                    }
                                ]}
                            >
                                Description
                            </ThemedText>

                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor:
                                            themeColors.inputBackground,
                                        borderColor:
                                            themeColors.border,
                                        color:
                                            themeColors.text,
                                        height: 110,
                                        textAlignVertical:
                                            'top'
                                    }
                                ]}
                                multiline
                                placeholder={
                                    loanTypeDescription ||
                                    'Description'
                                }
                                placeholderTextColor={
                                    themeColors.subtleText
                                }
                                value={
                                    description
                                }
                                onChangeText={
                                    setDescription
                                }
                            />
                        </View>
                    </ScrollView>

                    {/* FOOTER */}

                    <View
                        style={[
                            styles.footer,
                            {
                                backgroundColor:
                                    themeColors.background,
                                borderTopColor:
                                    themeColors.border
                            }
                        ]}
                    >
                        <TouchableOpacity
                            style={[
                                styles.button,
                                {
                                    backgroundColor:
                                        !form.loanType ||
                                        !principal ||
                                        !loanTerm ||
                                        isSaving ||
                                        (!loadingAffordability &&
                                            monthlyIncome >
                                                0 &&
                                            !!serviceDebtRatio &&
                                            !affordability.affordable)
                                            ? themeColors.border
                                            : themeColors.primary
                                }
                            ]}
                            onPress={
                                handleSave
                            }
                            disabled={
                                !form.loanType ||
                                !principal ||
                                !loanTerm ||
                                isSaving ||
                                (!loadingAffordability &&
                                    monthlyIncome >
                                        0 &&
                                    !!serviceDebtRatio &&
                                    !affordability.affordable)
                            }
                            activeOpacity={0.8}
                        >
                            <ThemedText
                                style={
                                    styles.buttonText
                                }
                            >
                                {isSaving
                                    ? 'Saving...'
                                    : data?.id
                                      ? 'Update Loan'
                                      : 'Submit Loan'}
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>

                {/* BOTTOM SHEET */}

                <BottomSheet
                    ref={
                        bottomSheetRef
                    }
                    index={-1}
                    snapPoints={
                        snapPoints
                    }
                    enablePanDownToClose
                    enableContentPanningGesture
                    enableHandlePanningGesture
                    enableDynamicSizing={
                        false
                    }
                    handleIndicatorStyle={{
                        backgroundColor:
                            themeColors.icon,
                        marginTop: 10
                    }}
                    backgroundStyle={{
                        backgroundColor:
                            themeColors.background,
                        borderTopWidth: 1,
                        borderTopColor:
                            themeColors.info
                    }}
                >
                    <ThemedText
                        style={
                            styles.sheetTitle
                        }
                    >
                        {sheetTitle ||
                            'Select Option'}
                    </ThemedText>

                    <BottomSheetScrollView
                        contentContainerStyle={{
                            paddingHorizontal: 16
                        }}
                    >
                        {sheetOptions.map(
                            option => (
                                <TouchableOpacity
                                    key={
                                        option.key
                                    }
                                    style={[
                                        styles.sheetOption,
                                        {
                                            backgroundColor:
                                                themeColors.card
                                        }
                                    ]}
                                    onPress={() =>
                                        selectOption(
                                            option
                                        )
                                    }
                                >
                                    <Text
                                        style={{
                                            fontSize:
                                                Typography.body,
                                            color:
                                                themeColors.text,
                                            fontFamily:
                                                'Medium'
                                        }}
                                    >
                                        {
                                            option.value
                                        }
                                    </Text>
                                </TouchableOpacity>
                            )
                        )}
                    </BottomSheetScrollView>
                </BottomSheet>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1
    },

    statusBarSpacer: {
        width: '100%'
    },

    safeArea: {
        flex: 1
    },

    scrollContainer: {
        flex: 1
    },

    contentContainer: {
        padding:
            Spacing.screenPadding,
        paddingTop: 0
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent:
            'space-between',
        paddingHorizontal:
            Spacing.screenPadding,
        paddingVertical:
            Spacing.medium,
        borderBottomWidth: 1
    },

    backButtonMain: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center'
    },

    headerTitle: {
        fontSize:
            Typography.heading2,
        fontFamily: 'SemiBold'
    },

    section: {
        marginBottom: 2
    },

    row: {
        flexDirection: 'row',
        justifyContent:
            'space-between'
    },

    half: {
        width: '49%'
    },

    sectionTitle: {
        fontSize:
            Typography.body,
        fontFamily: 'Medium',
        marginBottom: 3
    },

    required: {
        fontFamily: 'Italic',
        fontSize: 12,
        color: '#EF4444'
    },

    input: {
        borderWidth: 1,
        borderRadius:
            Borders.radiusSmall,
        paddingHorizontal:
            Spacing.medium,
        paddingVertical:
            Spacing.large,
        fontSize:
            Typography.small,
        marginBottom:
            Spacing.small,
        fontFamily: 'Regular'
    },

    limitText: {
        fontSize: 11,
        fontFamily: 'Italic',
        marginBottom: 5
    },

    box: {
        borderWidth: 1,
        borderRadius:
            Borders.radiusSmall,
        padding:
            Spacing.medium,
        marginTop: 5,
        marginBottom:
            Spacing.medium
    },

    boxTitle: {
        fontSize:
            Typography.body,
        fontFamily: 'SemiBold'
    },

    calcRow: {
        flexDirection: 'row',
        justifyContent:
            'space-between',
        alignItems: 'center',
        paddingVertical: 5
    },

    label: {
        fontSize:
            Typography.small,
        fontFamily: 'Regular'
    },

    value: {
        fontSize:
            Typography.small,
        fontFamily: 'Medium'
    },

    highlight: {
        borderTopWidth: 1,
        marginTop: 5,
        paddingTop: 10
    },

    installment: {
        fontSize:
            Typography.body,
        fontFamily: 'Bold'
    },

    affordabilityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent:
            'space-between',
        marginBottom: 5
    },

    status: {
        fontSize: 12,
        fontFamily: 'SemiBold'
    },

    note: {
        fontSize: 11,
        fontFamily: 'Regular',
        lineHeight: 15,
        marginTop: 7
    },

    footer: {
        padding:
            Spacing.screenPadding,
        borderTopWidth: 1
    },

    button: {
        paddingVertical:
            Spacing.large,
        borderRadius:
            Borders.radiusSmall,
        alignItems: 'center'
    },

    buttonText: {
        color: '#FFFFFF',
        fontSize:
            Typography.body,
        fontFamily: 'SemiBold'
    },

    sheetTitle: {
        fontFamily: 'SemiBold',
        fontSize: 20,
        marginBottom: 20,
        textAlign: 'center',
        marginTop: 10
    },

    sheetOption: {
        padding: 20,
        borderRadius: 5,
        marginBottom: 5
    }
});

export default LoanFormScreen;