// Mock for @wordpress/i18n package

export const __ = (text, domain) => text;
export const _x = (text, context, domain) => text;
export const _n = (single, plural, number, domain) => number === 1 ? single : plural;
export const _nx = (single, plural, number, context, domain) => number === 1 ? single : plural;
export const sprintf = (format, ...args) => {
	let i = 0;
	return format.replace(/%s/g, () => args[i++] || '');
};