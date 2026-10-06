import { Ionicons } from '@expo/vector-icons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, Platform, StyleProp, TextStyle } from 'react-native';

let SymbolView: any = null

if (Platform.OS === 'ios') {
	try {
		const ExpoSymbols = require('expo-symbols')
		SymbolView = ExpoSymbols.SymbolView
	} catch (e) {
		console.warn('expo-symbols not available, using Ionicons fallback')
	}
}

/**
 * Map SF Symbols → Ionicons
 */
const MAPPING = {
	'house.fill': 'home',
	'house': 'home-outline',
	'paperplane.fill': 'send',
	'chevron.left': 'chevron-back',
	'chevron.right': 'chevron-forward',
	'shield.fill': 'shield',
	'shield': 'shield-outline',
	'lock.fill': 'lock-closed',
	'lock': 'lock-closed-outline',
	'lock.open': 'lock-open-outline',
	'person': 'person-outline',
	'people': 'people-outline',
	'eye': 'eye-outline',
	'eye.slash': 'eye-off',
	'mail': 'mail-outline',
	'phone': 'call-outline',
	'ban': 'ban-outline',
	'ribbon': 'ribbon-outline',
	'medical': 'medical-outline',
	'key': 'key-outline',
	'plane': 'airplane-outline',

	'cart.fill': 'storefront',
	'cart': 'storefront-outline',
	'message.fill': 'chatbubble',
	'magnifyingglass': 'search',
	'bell.fill': 'notifications',
	'location': 'location-outline',
	'cube': 'cube-outline',
	'warning': 'warning-outline',
	'alarm': 'alarm-outline',
	'receipt': 'receipt-outline',

	'alarm.fill': 'alarm',
	'price.tag': 'pricetag-outline',

	'arrow.left': 'arrow-back',
	'arrow.right': 'arrow-forward',
	'arrow.up': 'arrow-up',
	'arrow.down': 'arrow-down',
	'arrow.up.right': 'trending-up',
	'arrow.down.left': 'trending-down',

	'plus': 'add',
	'remove.circle': 'remove-circle-outline',
	'plus.circle': 'add-circle-outline',
	'ellipsis': 'ellipsis-horizontal',
	'xmark': 'close',

	'check': 'checkmark',
	'briefcase': 'briefcase-outline',
	'list': 'list-outline',
	'qr': 'qr-code-outline',
	'repeat': 'repeat-outline',

	'alert-circle': 'alert-circle-outline',
	// 'check.done': 'checkmark-done-circle-outline',
	'division': 'git-branch-outline',
	'business-outline': 'business-outline',
	'pencil': 'pencil-outline',
	'checkmark.circle.fill': 'checkmark-circle-sharp',

	'power': 'power-outline',
	'target': 'locate-outline',
	'trash': 'trash-bin-outline',

	'shopping-cart': 'cart-outline',
	'file-text': 'receipt-outline',
	'users': 'people-outline',
	'credit-card': 'card-outline',
	'rotate-ccw': 'return-up-back-outline',
	'clock': 'time-outline',
	'document-outline': 'document-text-outline',
	'dots': 'apps-sharp',
	'building': 'build-outline',
	'download': 'download-outline',
	'archive': 'archive-outline',
	'layers': 'layers-outline',
	'bag.add': 'bag-add-outline',
	'scale': 'scale-outline',
	'trending-up': 'trending-up',
	'dollar': 'logo-usd',
	'percent': 'calculator',
	'chevron-up': 'chevron-up',
	'chevron-down': 'chevron-down',
	'grid': 'grid-outline',
	'calendar': 'calendar-outline',
	'inbox': 'mail-outline',
	'barcode': 'barcode-outline',
	'disk': 'disc',
	'shuffle': 'shuffle',
	'shield-check': 'shield-checkmark-outline',
	"star": "star-outline",
	'chart': "bar-chart-outline",
	"check.circle": 'checkmark-circle-outline',

	'print': 'print-outline',
	'low': 'trending-down-outline',

	'close': 'close-circle-outline',
	'warn': 'warning',
	'alert': 'alert-circle',
	'whatsapp': 'logo-whatsapp',
	'sms': 'chatbox-ellipses-outline',
	'link': 'link-outline',
	'hour.glass': 'hourglass-outline',
	'check.box': 'checkbox-outline',
	'calculator': 'calculator-outline',
	'play': 'play-outline',
	'flag': 'flag-outline',
	'minus': 'remove-outline',
	'swap': 'swap-horizontal-outline',
	'cog': 'cog-outline',
	'filter': 'funnel-outline',
	'wallet': 'wallet-outline',
	'enter': 'enter-outline'


} satisfies Record<string, ComponentProps<typeof Ionicons>['name']>

export type IconSymbolName = keyof typeof MAPPING

export function IconSymbol({ name, size = 18, color, style, weight = 'regular' }: {
	name: IconSymbolName; size?: number; color: string | OpaqueColorValue; style?: StyleProp<TextStyle>; weight?: SymbolWeight }) {

	// if (Platform.OS === 'ios' && SymbolView) {
	// 	return (
	// 		<SymbolView name={name} weight={weight} tintColor={color} style={[{ width: size, height: size }, style]} />
	// 	)
	// }

	return (
		<Ionicons name={MAPPING[name] ?? 'help-circle'} size={size} color={color} style={style} />
	)
}
