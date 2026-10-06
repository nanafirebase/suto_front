
import React, { createContext, JSX, useContext, useEffect, useRef, useState } from 'react'
import { AppContainerUse, Branch, iCurrency, IOTPAlert, IShowAlert, IShowAlertJSX, IShowPaymentModal, Session, User } from '../../utils/types/store.type';
import CustomAlert from '../../components/CustomAlert';
import CustomAlertJSX from '../../components/CustomAlertJSX';
import { SocketIO } from '../helpers/main.helpers';
import PaymentModal from '../../components/PaymentModal';
import { PermissionEngine } from '../data/PermissionEngine';
import { deleteData, getData, saveData } from '../helpers/auth.helpers';
import { Alert } from 'react-native';
import OTPAlert from '../../components/OTPAlert';

const MainContainer = createContext<AppContainerUse>({
    isLoggedIn: false,
    setIsLoggedIn: () => {},
    session: null,
    setSession: () => {},
    openAlert: null,
    showAlert: () => {},
    otpAlert: null,
    showOTPAlert: () => {},
    openAlertJSX: null,
    showAlertJSX: () => {},
    openPaymentModal: null,
    showPaymentModal: () => {},
    userData: null,
    setUserData: () => {},
    selectedBusiness: null,
    setSelectedBusiness: () => {},
    notification: [],
    setNotification: () => {},
    isLoading: false,
    setIsLoading: () => {},
    isLoadingSplash: false,
    setIsLoadingSplash: () => {},
    businessCurrency: null,
    setBusinessCurrency: () => {},
    userBranch: null,
    setUserBranch: () => {},
    userGrade: null,
    setUserGrade: () => {},
    permission: null,
    packageName: null,
    can: () => false,
})

interface Props {
    children: JSX.Element
}

const AppContainer = ({ children }: Props) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingSplash, setIsLoadingSplash] = useState<boolean>(true)
    const [session, setSession] = useState<Session | null>(null)
    const [openAlert, showAlert] = useState<IShowAlert | null>(null)
    const [otpAlert, showOTPAlert] = useState<IOTPAlert | null>(null)
    const [openAlertJSX, showAlertJSX] = useState<IShowAlertJSX | null>(null)
    const [openPaymentModal, showPaymentModal] = useState<IShowPaymentModal | null>(null)
    const [notification, setNotification] = useState<any[]>([])
    const [userData, setUserData] = useState<User | null>(null)
    const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null)
    const [businessCurrency, setBusinessCurrency] = useState<iCurrency | null>(null)
    const [userBranch, setUserBranch] = useState<Branch | null>(null)
    const [userGrade, setUserGrade] = useState<Branch | null>(null)
    const [permission, setPermission] = useState<PermissionEngine | null>(null)
    const [packageName, setPackageName] = useState<'Micro'|'Small'|'Medium'|null>(null)

    const signOut = async () => {
        if (!session) {
            setUserData(null)
            setSession(null)
            setIsLoading(false)
            setIsLoggedIn(false)
            setSelectedBusiness(null)
            deleteData('myPrivileges')
            deleteData('packageName')
            return
        }
        SocketIO.emit('logout-account', { sessionID: session, logoutType: 'user' }, (res: any) => {
            if (res.status === 'success') {
                setUserData(null)
                setSession(null)
                setIsLoading(false)
                setIsLoggedIn(false)
                setSelectedBusiness(null)
                deleteData('myPrivileges')
                deleteData('packageName')
            } else {
                setUserData(null)
                setSession(null)
                setIsLoading(false)
                setIsLoggedIn(false)
                setSelectedBusiness(null)
                deleteData('myPrivileges')
                deleteData('packageName')
            }
        })
    }

    const fetchBusinessCurrency = async () => {
        if (!selectedBusiness?.id || userBranch?.id) return
        SocketIO.emit('fetch-business-currency' , {sessionID: session, businessID: selectedBusiness.id, branchID: userBranch?.id}, (response: any) => {
            if (response.status === "success") {
                let data = response.data
                setBusinessCurrency({
                    code: data[0].code,
                    currencyID: data[0].currencyID,
                    name: data[0].name,
                    symbol: data[0].symbol
                })
            } else {
                signOut()
            }
        })
    }

    useEffect(()=> {
        fetchBusinessCurrency()
    }, [])
    
    const refreshAppSession = (business: any) => {
        if (!business?.id) {
            Alert.alert("Error", "Missing business data")
            return
        }
        SocketIO.emit('validate-business' , {sessionID: session, businessID: business.id}, (response: any) => {
            if (response.status === "success") {
                if (!response.subscriptionName) {
                    return
                }
                setSelectedBusiness(business)
                setUserBranch(business.branch)
                setUserGrade(business.grade)
                saveData('myPrivileges', response.privileges || {})
                saveData('packageName', response.subscriptionName || undefined)
            } else {
                setSelectedBusiness(null)
                setUserBranch(null)
                setUserGrade(null)
                deleteData('myPrivileges')
                deleteData('packageName')
            }
        })
    }

    const getPrivileges = () => {
        if (!selectedBusiness?.id) {
            setPermission(null)
            return
        }
        (async () => {
            const raw = await getData('myPrivileges')
            setPermission(new PermissionEngine(raw))
        })()
    }

    const getPackageName = async () => {
        const name = await getData('packageName')
        if (name) {
            setPackageName(name)
        } else {
            setSelectedBusiness(null)
            setPackageName(null)
            setSession(null)
            setNotification([])
        }
    }

    useEffect(()=> {
        if (!selectedBusiness?.id) {
            setBusinessCurrency(null)
            return
        }
        fetchBusinessCurrency()
        getPrivileges()
        getPackageName()
        const interval = setInterval(() => {
            refreshAppSession(selectedBusiness)
        }, 50000)
        return () => {
            clearInterval(interval)
        }
    }, [selectedBusiness?.id])

    const can = (perm: string) => {
        if (!permission) return false
        return permission.can(perm)
    }

    return (
        <MainContainer.Provider value={{ isLoggedIn, setIsLoggedIn, session, setSession, openAlert, showAlert, openPaymentModal, showPaymentModal, openAlertJSX, showAlertJSX, userData, setUserData, notification, setNotification, isLoading, setIsLoading, isLoadingSplash, setIsLoadingSplash, selectedBusiness, setSelectedBusiness, businessCurrency, setBusinessCurrency, permission, can, otpAlert, showOTPAlert, packageName, userBranch, setUserBranch, userGrade, setUserGrade}}>
            {children}
            {
                openAlert && openAlert.visibility ?
                    <CustomAlert
                        setShowAlert={showAlert}
                        type={openAlert.type}
                        message={openAlert.message}
                        title={openAlert.title}
                    /> : openAlertJSX && openAlertJSX.visibility ?
                    <CustomAlertJSX
                        setShowAlertJSX={showAlertJSX}
                        message={openAlertJSX.message}
                        title={openAlertJSX.title}
                    /> : openPaymentModal && openPaymentModal.visibility ?
                    <PaymentModal
                        setShowModal={showPaymentModal}
                        refNumber={openPaymentModal.refNumber}
                        businessID={openPaymentModal.businessID}
                        sessionID={openPaymentModal.sessionID}
                    /> : otpAlert && otpAlert.visibility ? (
                    <OTPAlert
                        setShowAlert={showOTPAlert}
                        refNumber={otpAlert.refNumber}
                        businessID={otpAlert.businessID}
                        sessionID={otpAlert.sessionID}
                        onSubmit={otpAlert.onSubmit}
                    />
                ) : null
            }
        </MainContainer.Provider>
    )
}

export const useAppContainer = () => useContext(MainContainer)

export default AppContainer