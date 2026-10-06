import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios"
import { API_URL, PAYMENT_VERIFICATION_API_URL } from "../credentials"

export const saveData = async (key:string, value:any) => {
    await AsyncStorage.setItem(key, JSON.stringify(
        {
            dataType: typeof value,
            data: value
        }
    ))
    return true
}

export const getData = async (key:string) => {
    let result:string|null = await AsyncStorage.getItem(key)
    if (result) {
        let data:any = JSON.parse(result)
        return data.data
    }

    return null
}

export const deleteData = async (key:string) => {
    let result = await AsyncStorage.removeItem(key)
    return true
}

export const ApiClient = axios.create({
    baseURL: API_URL,
    headers: {
        Accept: 'application/json'
    }
})

export const validatePassword = (password:string) => {
	let aboveLen = false
	let hasSpecial = false
	let hasNumbers = false
	var format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/
	if ( password.length > 5 ) {
		aboveLen = true
	}
	if( password.match(format) ){
		hasSpecial = true
	}
	if (/[0-9]/.test(password) == true) {
		hasNumbers = true
	}
	return { aboveLen, hasSpecial, hasNumbers}
}

export const titleCase = (str:string) => {
    if (!str) return '';
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}