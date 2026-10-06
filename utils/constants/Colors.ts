const primaryLight = '#2563eb';
const primaryDark = '#147dc8';
const secondaryLight = '#292b2c';
const secondaryDark = '#292b2c';

const light = {
	text: '#1E293B',
	background: '#FFFFFF',
	tint: primaryLight,
	icon: '#64748B',
	tabIconDefault: '#94A3B8',
	tabIconSelected: primaryLight,
	primary: primaryLight,
	secondary: secondaryLight,
	success: '#10B981',
	error: '#DC143C',
	warning: '#F59E0B',
	info: '#0850BC',
	border: '#E2E8F0',
	card: '#FAF9F6',
	cardShadow: '#00000010',
	inputBackground: '#F1F5F9',
	subtleBackground: '#F8FAFC',
	subtleText: '#64748B',
	buttonBorder: '#ddd',
	serviceIconBackground: '#EFF6FF',
	white: '#FFFFFF',
	tomato: 'tomato',
};

const dark = {
	text: '#F8FAFC',
	background: '#0F172A',
	tint: primaryDark,
	icon: '#94A3B8',
	tabIconDefault: '#64748B',
	tabIconSelected: primaryDark,
	primary: primaryDark,
	secondary: secondaryDark,
	success: '#34D399',
	error: '#DC143C',
	warning: '#FBBF24',
	info: '#38BDF8',
	border: '#334155',
	card: '#1E293B',
	cardShadow: '#00000050',
	inputBackground: '#1E293B',
	subtleBackground: '#1E293B',
	subtleText: '#94A3B8',
	buttonBorder: '#ddd',
	serviceIconBackground: '#1E3A8A20',
	white: '#FFFFFF',
	tomato: 'tomato',
};

export const Colors: Record<string, typeof light> = {
	light,
	dark,
};
