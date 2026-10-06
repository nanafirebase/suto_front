import React, { useState } from 'react'
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native'
import * as Linking from 'expo-linking'
import { IconSymbol } from '../../../components/ui/icon-symbol'
import { Borders, Spacing, Typography } from '../../../utils/constants/Design'

type Supplier = {
	supplierID: number
	supplierName: string
	phone?: string
	email?: string
}

type Props = {
	visible: boolean
	onClose: () => void
	item: any
	themeColors: any
}

export const SupplierSelectorModal = ({
	visible,
	onClose,
	item,
	themeColors
}: Props) => {

	const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

	const buildMessage = (supplier: Supplier) => {
		return `Hello ${supplier.supplierName},

We are running low on ${item.productName}.

Current stock: ${item.baseQuantity}
Estimated stockout: ${item.estimatedDaysRemaining ?? 'Unknown'} days
Suggested reorder quantity: ${item.suggestedReorderQuantity}

Please confirm availability and pricing.

Thank you.`
	}

	const sendWhatsApp = async (supplier: Supplier) => {
		try {

			if (!supplier.phone) {
				Alert.alert('Missing phone number')
				return
			}

			const message = buildMessage(supplier)

			const phone = supplier.phone
				.replace(/\+/g, '')
				.replace(/\s/g, '')

			const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

			await Linking.openURL(url)

		} catch {
			Alert.alert('Error', 'Failed to open WhatsApp')
		}
	}

	const callSupplier = async (supplier: Supplier) => {
		try {

			if (!supplier.phone) {
				Alert.alert('Missing phone number')
				return
			}

			await Linking.openURL(`tel:${supplier.phone}`)

		} catch {
			Alert.alert('Error', 'Failed to call supplier')
		}
	}

	const sendSMS = async (supplier: Supplier) => {
		try {

			if (!supplier.phone) {
				Alert.alert('Missing phone number')
				return
			}

			const message = buildMessage(supplier)

			await Linking.openURL(
				`sms:${supplier.phone}?body=${encodeURIComponent(message)}`
			)

		} catch {
			Alert.alert('Error', 'Failed to send SMS')
		}
	}

	return (
		<Modal visible={visible} animationType='slide' transparent>
			<View style={styles.overlay}>
				<View style={[styles.container, { backgroundColor: themeColors.card }]}>

					<View style={styles.header}>
						<Text style={[styles.title, { color: themeColors.text }]}>
							Suppliers
						</Text>

						<TouchableOpacity onPress={onClose}>
							<IconSymbol
								name='close'
								size={22}
								color={themeColors.icon}
							/>
						</TouchableOpacity>
					</View>

					<Text style={[styles.productName, { color: themeColors.text }]}>
						{item?.productName}
					</Text>

					<ScrollView showsVerticalScrollIndicator={false}>

						{item?.suppliers?.map((supplier: Supplier, index: number) => {

							const active =
								selectedSupplier?.supplierID === supplier.supplierID

							return (
								<TouchableOpacity
									key={index}
									activeOpacity={0.8}
									onPress={() => setSelectedSupplier(supplier)}
									style={[
										styles.supplierCard,
										{
											borderColor: active
												? themeColors.primary
												: themeColors.border,

											backgroundColor: active
												? `${themeColors.primary}15`
												: themeColors.background
										}
									]}
								>

									<View>
										<Text style={[styles.supplierName, { color: themeColors.text }]}>
											{supplier.supplierName}
										</Text>

										<Text style={[styles.phone, { color: themeColors.subtleText }]}>
											{supplier.phone || 'No phone'}
										</Text>
									</View>

									{active && (
										<IconSymbol
											name='check.circle'
											size={20}
											color={themeColors.primary}
										/>
									)}

								</TouchableOpacity>
							)
						})}

					</ScrollView>

					{selectedSupplier && (
						<View style={styles.actions}>

							<TouchableOpacity
								style={[styles.actionButton, { backgroundColor: '#25D366' }]}
								onPress={() => sendWhatsApp(selectedSupplier)}
							>
								<IconSymbol name='message.fill' size={14} color='#fff' />
								<Text style={styles.actionText}>WhatsApp</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.actionButton, { backgroundColor: '#1976D2' }]}
								onPress={() => callSupplier(selectedSupplier)}
							>
								<IconSymbol name='phone' size={14} color='#fff' />
								<Text style={styles.actionText}>Call</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.actionButton, { backgroundColor: '#5E35B1' }]}
								onPress={() => sendSMS(selectedSupplier)}
							>
								<IconSymbol name='mail' size={14} color='#fff' />
								<Text style={styles.actionText}>SMS</Text>
							</TouchableOpacity>

						</View>
					)}

				</View>
			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({

	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.45)',
		justifyContent: 'flex-end'
	},

	container: {
		maxHeight: '75%',
		borderTopLeftRadius: 22,
		borderTopRightRadius: 22,
		padding: Spacing.large
	},

	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},

	title: {
		fontSize: Typography.heading3,
		fontFamily: 'Bold'
	},

	productName: {
		fontSize: 15,
		fontFamily: 'SemiBold',
		marginTop: 10,
		marginBottom: 14
	},

	supplierCard: {
		borderWidth: 1,
		borderRadius: Borders.radiusMedium,
		padding: 14,
		marginBottom: 10,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},

	supplierName: {
		fontSize: 14,
		fontFamily: 'SemiBold'
	},

	phone: {
		fontSize: 11,
		marginTop: 4
	},

	actions: {
		flexDirection: 'row',
		gap: 10,
		marginTop: 14
	},

	actionButton: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 100,
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		gap: 6
	},

	actionText: {
		color: '#fff',
		fontSize: 12,
		fontFamily: 'Bold'
	}
})