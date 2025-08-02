/**
 * useAccessibility Hook
 * 
 * Provides accessibility utilities including screen reader announcements,
 * focus management, and keyboard navigation support.
 */

import { useCallback, useRef, useEffect } from 'react';

interface UseAccessibilityReturn {
	/** Announce message to screen readers */
	announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
	
	/** Focus an element by selector */
	focusElement: (selector: string) => boolean;
	
	/** Focus the first focusable element in a container */
	focusFirstFocusable: (container: HTMLElement | null) => boolean;
	
	/** Focus the next focusable element */
	focusNext: (currentElement?: HTMLElement) => boolean;
	
	/** Focus the previous focusable element */
	focusPrevious: (currentElement?: HTMLElement) => boolean;
	
	/** Create a roving tabindex manager */
	createRovingTabindex: (container: HTMLElement, items: NodeListOf<HTMLElement>) => () => void;
	
	/** Check if element is visible to screen readers */
	isVisibleToScreenReader: (element: HTMLElement) => boolean;
}

export const useAccessibility = (): UseAccessibilityReturn => {
	const announcementRef = useRef<HTMLDivElement | null>(null);

	// Create live region for announcements
	useEffect(() => {
		if (!announcementRef.current) {
			const liveRegion = document.createElement('div');
			liveRegion.setAttribute('aria-live', 'polite');
			liveRegion.setAttribute('aria-atomic', 'true');
			liveRegion.className = 'screen-reader-text';
			liveRegion.style.cssText = `
				position: absolute !important;
				clip: rect(1px, 1px, 1px, 1px);
				word-wrap: normal !important;
				border: 0;
				height: 1px;
				margin: -1px;
				overflow: hidden;
				padding: 0;
				width: 1px;
			`;
			document.body.appendChild(liveRegion);
			announcementRef.current = liveRegion;
		}

		return () => {
			if (announcementRef.current) {
				document.body.removeChild(announcementRef.current);
				announcementRef.current = null;
			}
		};
	}, []);

	const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
		if (!announcementRef.current) return;

		// Update aria-live attribute based on priority
		announcementRef.current.setAttribute('aria-live', priority);
		
		// Clear and set new message
		announcementRef.current.textContent = '';
		setTimeout(() => {
			if (announcementRef.current) {
				announcementRef.current.textContent = message;
			}
		}, 100);

		// Clear after announcement
		setTimeout(() => {
			if (announcementRef.current) {
				announcementRef.current.textContent = '';
			}
		}, 1000);
	}, []);

	const focusElement = useCallback((selector: string): boolean => {
		const element = document.querySelector(selector) as HTMLElement;
		if (element && element.focus) {
			element.focus();
			return true;
		}
		return false;
	}, []);

	const getFocusableElements = useCallback((container: HTMLElement): HTMLElement[] => {
		const focusableSelectors = [
			'button:not([disabled])',
			'[href]',
			'input:not([disabled])',
			'select:not([disabled])',
			'textarea:not([disabled])',
			'[tabindex]:not([tabindex="-1"])',
			'[contenteditable="true"]'
		].join(', ');

		const focusableElements = Array.from(
			container.querySelectorAll(focusableSelectors)
		) as HTMLElement[];

		return focusableElements.filter(element => 
			isVisibleToScreenReader(element) && 
			element.offsetWidth > 0 && 
			element.offsetHeight > 0
		);
	}, []);

	const focusFirstFocusable = useCallback((container: HTMLElement | null): boolean => {
		if (!container) return false;

		const focusableElements = getFocusableElements(container);
		if (focusableElements.length > 0) {
			focusableElements[0].focus();
			return true;
		}
		return false;
	}, [getFocusableElements]);

	const focusNext = useCallback((currentElement?: HTMLElement): boolean => {
		const current = currentElement || document.activeElement as HTMLElement;
		if (!current) return false;

		const container = current.closest('[role="application"], [role="dialog"], body') as HTMLElement;
		const focusableElements = getFocusableElements(container);
		const currentIndex = focusableElements.indexOf(current);

		if (currentIndex >= 0 && currentIndex < focusableElements.length - 1) {
			focusableElements[currentIndex + 1].focus();
			return true;
		}
		return false;
	}, [getFocusableElements]);

	const focusPrevious = useCallback((currentElement?: HTMLElement): boolean => {
		const current = currentElement || document.activeElement as HTMLElement;
		if (!current) return false;

		const container = current.closest('[role="application"], [role="dialog"], body') as HTMLElement;
		const focusableElements = getFocusableElements(container);
		const currentIndex = focusableElements.indexOf(current);

		if (currentIndex > 0) {
			focusableElements[currentIndex - 1].focus();
			return true;
		}
		return false;
	}, [getFocusableElements]);

	const createRovingTabindex = useCallback((
		container: HTMLElement, 
		items: NodeListOf<HTMLElement>
	): (() => void) => {
		let currentIndex = 0;

		// Set initial tabindex
		items.forEach((item, index) => {
			item.setAttribute('tabindex', index === 0 ? '0' : '-1');
		});

		const handleKeyDown = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement;
			const itemIndex = Array.from(items).indexOf(target);
			
			if (itemIndex === -1) return;

			let newIndex = itemIndex;

			switch (event.key) {
				case 'ArrowRight':
				case 'ArrowDown':
					event.preventDefault();
					newIndex = (itemIndex + 1) % items.length;
					break;
				case 'ArrowLeft':
				case 'ArrowUp':
					event.preventDefault();
					newIndex = itemIndex === 0 ? items.length - 1 : itemIndex - 1;
					break;
				case 'Home':
					event.preventDefault();
					newIndex = 0;
					break;
				case 'End':
					event.preventDefault();
					newIndex = items.length - 1;
					break;
				default:
					return;
			}

			// Update tabindex
			items[currentIndex].setAttribute('tabindex', '-1');
			items[newIndex].setAttribute('tabindex', '0');
			items[newIndex].focus();
			currentIndex = newIndex;
		};

		container.addEventListener('keydown', handleKeyDown);

		// Return cleanup function
		return () => {
			container.removeEventListener('keydown', handleKeyDown);
		};
	}, []);

	const isVisibleToScreenReader = useCallback((element: HTMLElement): boolean => {
		// Check if element is hidden from screen readers
		if (element.getAttribute('aria-hidden') === 'true') return false;
		if (element.hasAttribute('hidden')) return false;
		
		// Check computed styles
		const computedStyle = window.getComputedStyle(element);
		if (computedStyle.display === 'none') return false;
		if (computedStyle.visibility === 'hidden') return false;
		if (computedStyle.opacity === '0') return false;
		
		// Check if clipped (common screen reader hiding technique)
		const rect = element.getBoundingClientRect();
		if (rect.width <= 1 && rect.height <= 1) return false;

		return true;
	}, []);

	return {
		announceToScreenReader,
		focusElement,
		focusFirstFocusable,
		focusNext,
		focusPrevious,
		createRovingTabindex,
		isVisibleToScreenReader
	};
};

/**
 * useFocusManagement Hook
 * 
 * Specialized hook for managing focus in complex components.
 */
export const useFocusManagement = () => {
	const previousFocusRef = useRef<HTMLElement | null>(null);

	const saveFocus = useCallback(() => {
		previousFocusRef.current = document.activeElement as HTMLElement;
	}, []);

	const restoreFocus = useCallback(() => {
		if (previousFocusRef.current && previousFocusRef.current.focus) {
			previousFocusRef.current.focus();
		}
	}, []);

	const trapFocus = useCallback((container: HTMLElement) => {
		const focusableElements = container.querySelectorAll(
			'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
		) as NodeListOf<HTMLElement>;

		const firstFocusable = focusableElements[0];
		const lastFocusable = focusableElements[focusableElements.length - 1];

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Tab') return;

			if (event.shiftKey) {
				// Shift + Tab
				if (document.activeElement === firstFocusable) {
					event.preventDefault();
					lastFocusable.focus();
				}
			} else {
				// Tab
				if (document.activeElement === lastFocusable) {
					event.preventDefault();
					firstFocusable.focus();
				}
			}
		};

		container.addEventListener('keydown', handleKeyDown);

		// Focus first element
		if (firstFocusable) {
			firstFocusable.focus();
		}

		// Return cleanup function
		return () => {
			container.removeEventListener('keydown', handleKeyDown);
		};
	}, []);

	return {
		saveFocus,
		restoreFocus,
		trapFocus
	};
};

/**
 * useKeyboardNavigation Hook
 * 
 * Provides keyboard navigation utilities for component interactions.
 */
export const useKeyboardNavigation = () => {
	
	const handleArrowNavigation = useCallback((
		event: React.KeyboardEvent,
		items: HTMLElement[],
		currentIndex: number,
		onIndexChange: (newIndex: number) => void
	) => {
		let newIndex = currentIndex;

		switch (event.key) {
			case 'ArrowUp':
				event.preventDefault();
				newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
				break;
			case 'ArrowDown':
				event.preventDefault();
				newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
				break;
			case 'Home':
				event.preventDefault();
				newIndex = 0;
				break;
			case 'End':
				event.preventDefault();
				newIndex = items.length - 1;
				break;
			default:
				return;
		}

		onIndexChange(newIndex);
		items[newIndex]?.focus();
	}, []);

	const handleMenuNavigation = useCallback((
		event: React.KeyboardEvent,
		onSelect?: () => void,
		onCancel?: () => void
	) => {
		switch (event.key) {
			case 'Enter':
			case ' ':
				event.preventDefault();
				onSelect?.();
				break;
			case 'Escape':
				event.preventDefault();
				onCancel?.();
				break;
		}
	}, []);

	return {
		handleArrowNavigation,
		handleMenuNavigation
	};
};