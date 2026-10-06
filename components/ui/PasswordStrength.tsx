import React from "react"
import { Text, View, StyleSheet } from "react-native"

type Props = {
	password: string
	themeColors: {
		success: string
		warning: string
		error: string
	}
}

const getStrength = (password: string) => {
	const hasLetter = /[A-Za-z]/.test(password)
	const hasNumber = /[0-9]/.test(password)
	const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
	if (password.length >= 8 && hasLetter && hasNumber && hasSpecial) {
		return "strong"
	}
	if (password.length >= 6 && hasLetter && hasNumber) {
		return "fair"
	}
	return "weak"
}

export const PasswordStrength: React.FC<Props> = ({ password, themeColors }) => {
	// if (!password) return null // hide when empty

	const strength = getStrength(password)

	const strengthMap = {
		strong: { label: "Strong", color: themeColors.success },
		fair: { label: "Fair", color: themeColors.warning },
		weak: { label: "Weak", color: themeColors.error },
	}

	const { label, color } = strengthMap[strength]

	return (
		<>
			{password ? <Text style={[styles.text, { color }]}>{label}</Text> : null}
		</>
	)
}

const styles = StyleSheet.create({
	text: {
		fontSize: 12,
		fontWeight: "600",
	}
})
