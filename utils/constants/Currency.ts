/**
 * Currency formatting utilities for the app
 */

export const CURRENCY_SYMBOL = '₵'; // Ghanaian Cedi

/**
	 * Format a number as currency
	 * @param amount The amount to format
	 * @param options Formatting options
	 * @returns Formatted currency string
*/

export const formatCurrency = (amount: number, options?: { showSymbol?: boolean, decimals?: number, symbol?: string, }) => {
	const showSymbol = options?.showSymbol !== false;
	const decimals = options?.decimals !== undefined ? options.decimals : 2;
	
	const formattedAmount = amount.toLocaleString('en-GH', {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});
	
	return showSymbol ? `${options?.symbol || CURRENCY_SYMBOL}${formattedAmount}` : formattedAmount;
};
