/**
 * Merge Tag Processing Service
 * 
 * Handles processing of merge tags like {user:email} with test data
 * and provides utilities for merge tag management.
 */

import { MergeTag } from '../types/api';

export interface MergeTagProcessorOptions {
	/** Test data for different object types */
	testData: Record<string, any>;
	
	/** Whether to show placeholder for missing values */
	showPlaceholders?: boolean;
	
	/** Custom placeholder format */
	placeholderFormat?: (tag: string) => string;
}

export class MergeTagProcessor {
	private testData: Record<string, any>;
	private showPlaceholders: boolean;
	private placeholderFormat: (tag: string) => string;

	constructor(options: MergeTagProcessorOptions) {
		this.testData = options.testData;
		this.showPlaceholders = options.showPlaceholders ?? true;
		this.placeholderFormat = options.placeholderFormat ?? ((tag) => `[${tag}]`);
	}

	/**
	 * Process a template string and replace merge tags with values
	 */
	process(template: string): string {
		if (!template || typeof template !== 'string') {
			return template;
		}

		return template.replace(/\{([^}]+)\}/g, (match, tag) => {
			const value = this.getValue(tag);
			
			if (value !== null && value !== undefined) {
				return String(value);
			}
			
			return this.showPlaceholders ? this.placeholderFormat(tag) : match;
		});
	}

	/**
	 * Get value for a merge tag
	 */
	private getValue(tag: string): any {
		const [objectType, fieldName] = tag.split(':');
		
		if (!objectType || !fieldName) {
			return null;
		}

		const objectData = this.testData[objectType];
		if (!objectData || typeof objectData !== 'object') {
			return null;
		}

		// Support nested field access with dot notation
		return this.getNestedValue(objectData, fieldName);
	}

	/**
	 * Get nested value from object using dot notation
	 */
	private getNestedValue(obj: any, path: string): any {
		return path.split('.').reduce((current, key) => {
			return current && current[key] !== undefined ? current[key] : null;
		}, obj);
	}

	/**
	 * Get all available merge tags based on test data
	 */
	getAvailableTags(): MergeTag[] {
		const tags: MergeTag[] = [];

		Object.entries(this.testData).forEach(([objectType, objectData]) => {
			if (objectData && typeof objectData === 'object') {
				this.collectTagsFromObject(objectType, '', objectData, tags);
			}
		});

		return tags.sort((a, b) => a.label.localeCompare(b.label));
	}

	/**
	 * Recursively collect tags from nested objects
	 */
	private collectTagsFromObject(
		objectType: string,
		prefix: string,
		obj: any,
		tags: MergeTag[],
		maxDepth: number = 3,
		currentDepth: number = 0
	): void {
		if (currentDepth >= maxDepth || !obj || typeof obj !== 'object') {
			return;
		}

		Object.entries(obj).forEach(([key, value]) => {
			const fieldPath = prefix ? `${prefix}.${key}` : key;
			const tagString = `{${objectType}:${fieldPath}}`;

			// Add primitive values as tags
			if (this.isPrimitiveValue(value)) {
				tags.push({
					tag: tagString,
					label: this.formatLabel(objectType, fieldPath),
					objectType,
					fieldName: fieldPath,
					example: String(value),
					dataType: this.getDataType(value),
					description: this.generateDescription(objectType, fieldPath, value)
				});
			}
			// Recurse into nested objects
			else if (value && typeof value === 'object' && !Array.isArray(value)) {
				this.collectTagsFromObject(objectType, fieldPath, value, tags, maxDepth, currentDepth + 1);
			}
			// Handle arrays with primitive values
			else if (Array.isArray(value) && value.length > 0 && this.isPrimitiveValue(value[0])) {
				tags.push({
					tag: tagString,
					label: this.formatLabel(objectType, fieldPath),
					objectType,
					fieldName: fieldPath,
					example: value.join(', '),
					dataType: 'array',
					description: this.generateDescription(objectType, fieldPath, value)
				});
			}
		});
	}

	/**
	 * Check if value is a primitive type we can use as a merge tag
	 */
	private isPrimitiveValue(value: any): boolean {
		return value === null || 
			   typeof value === 'string' || 
			   typeof value === 'number' || 
			   typeof value === 'boolean';
	}

	/**
	 * Get data type for a value
	 */
	private getDataType(value: any): 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' {
		if (value === null) return 'string';
		if (Array.isArray(value)) return 'array';
		if (typeof value === 'object') return 'object';
		if (typeof value === 'boolean') return 'boolean';
		if (typeof value === 'number') return 'number';
		if (typeof value === 'string') {
			// Check if it looks like a date
			if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
		}
		return 'string';
	}

	/**
	 * Format a label for display
	 */
	private formatLabel(objectType: string, fieldPath: string): string {
		const objectLabel = objectType.charAt(0).toUpperCase() + objectType.slice(1);
		const fieldLabel = fieldPath
			.split('.')
			.map(part => part.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim())
			.map(part => part.charAt(0).toUpperCase() + part.slice(1))
			.join(' → ');
		
		return `${objectLabel}: ${fieldLabel}`;
	}

	/**
	 * Generate description for a merge tag
	 */
	private generateDescription(objectType: string, fieldPath: string, value: any): string {
		const baseDescriptions: Record<string, Record<string, string>> = {
			user: {
				'user_email': 'The user\'s email address',
				'display_name': 'The user\'s display name',
				'first_name': 'The user\'s first name',
				'last_name': 'The user\'s last name',
				'user_login': 'The user\'s login name'
			},
			post: {
				'post_title': 'The post title',
				'post_content': 'The post content',
				'post_excerpt': 'The post excerpt',
				'post_date': 'The post publication date'
			},
			product: {
				'name': 'The product name',
				'price': 'The product price',
				'sku': 'The product SKU',
				'description': 'The product description'
			},
			order: {
				'order_total': 'The order total amount',
				'order_date': 'The order date',
				'billing_email': 'The billing email address',
				'shipping_address': 'The shipping address'
			}
		};

		const objectDescriptions = baseDescriptions[objectType];
		if (objectDescriptions && objectDescriptions[fieldPath]) {
			return objectDescriptions[fieldPath];
		}

		// Generate generic description
		const fieldName = fieldPath.split('.').pop() || fieldPath;
		return `${objectType} ${fieldName.replace(/_/g, ' ')}`;
	}

	/**
	 * Validate merge tags in a template
	 */
	validateTemplate(template: string): {
		valid: boolean;
		errors: string[];
		tags: string[];
	} {
		const errors: string[] = [];
		const tags: string[] = [];
		const tagRegex = /\{([^}]+)\}/g;
		let match;

		while ((match = tagRegex.exec(template)) !== null) {
			const tag = match[1];
			tags.push(tag);

			// Check tag format
			if (!tag.includes(':')) {
				errors.push(`Invalid tag format: {${tag}}. Expected format: {object:field}`);
				continue;
			}

			const [objectType, fieldName] = tag.split(':');
			
			if (!objectType || !fieldName) {
				errors.push(`Invalid tag format: {${tag}}. Missing object type or field name`);
				continue;
			}

			// Check if object type exists in test data
			if (!this.testData[objectType]) {
				errors.push(`Unknown object type: ${objectType} in tag {${tag}}`);
				continue;
			}

			// Check if field exists
			const value = this.getValue(tag);
			if (value === null || value === undefined) {
				errors.push(`Field not found: ${fieldName} in ${objectType} for tag {${tag}}`);
			}
		}

		return {
			valid: errors.length === 0,
			errors,
			tags
		};
	}

	/**
	 * Update test data
	 */
	updateTestData(newTestData: Record<string, any>): void {
		this.testData = { ...this.testData, ...newTestData };
	}

	/**
	 * Get current test data
	 */
	getTestData(): Record<string, any> {
		return this.testData;
	}

	/**
	 * Extract unique merge tags from a template
	 */
	extractTags(template: string): string[] {
		const tags: string[] = [];
		const tagRegex = /\{([^}]+)\}/g;
		let match;

		while ((match = tagRegex.exec(template)) !== null) {
			if (!tags.includes(match[1])) {
				tags.push(match[1]);
			}
		}

		return tags;
	}
}

/**
 * Default test data for common WordPress objects
 */
export const defaultTestData = {
	user: {
		ID: 1,
		user_login: 'admin',
		user_email: 'admin@example.com',
		display_name: 'John Doe',
		first_name: 'John',
		last_name: 'Doe',
		user_registered: '2024-01-01 00:00:00',
		roles: ['administrator']
	},
	post: {
		ID: 123,
		post_title: 'Sample Blog Post',
		post_content: 'This is a sample blog post content...',
		post_excerpt: 'This is a sample excerpt',
		post_date: '2024-02-01 10:30:00',
		post_author: 1,
		post_status: 'publish',
		post_type: 'post'
	},
	product: {
		ID: 456,
		name: 'Sample Product',
		price: 29.99,
		regular_price: 39.99,
		sale_price: 29.99,
		sku: 'SAMPLE-001',
		description: 'This is a sample product',
		stock_quantity: 10,
		weight: '1.5',
		dimensions: {
			length: '10',
			width: '5',
			height: '3'
		}
	},
	order: {
		ID: 789,
		order_number: '#WC-789',
		order_total: 59.98,
		order_subtotal: 49.98,
		order_tax: 10.00,
		order_date: '2024-02-15 14:22:00',
		status: 'completed',
		billing: {
			first_name: 'Jane',
			last_name: 'Smith',
			email: 'jane@example.com',
			phone: '555-1234',
			address_1: '123 Main St',
			city: 'Anytown',
			state: 'CA',
			postcode: '12345'
		},
		shipping: {
			first_name: 'Jane',
			last_name: 'Smith',
			address_1: '123 Main St',
			city: 'Anytown',
			state: 'CA',
			postcode: '12345'
		}
	},
	course: {
		ID: 321,
		course_title: 'Advanced WordPress Development',
		course_price: 199.00,
		course_description: 'Learn advanced WordPress concepts',
		lesson_count: 25,
		quiz_count: 5,
		certificate_threshold: 80
	},
	form: {
		form_id: 5,
		form_title: 'Contact Form',
		entry_id: 142,
		entry_date: '2024-02-20 09:15:00',
		fields: {
			name: 'John Doe',
			email: 'john@example.com',
			message: 'Hello, I would like more information about your services.',
			phone: '555-9876'
		}
	}
};