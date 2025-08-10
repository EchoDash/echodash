/**
 * Merge Tag Selector Component
 *
 * Dropdown component for selecting merge tags from available options
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import './MergeTagSelector.css';
import type { MergeTagGroup } from '../types';

interface MergeTagSelectorProps {
	options: MergeTagGroup[];
	onSelect: (mergeTag: string) => void;
	isOpen: boolean;
	onClose: () => void;
	buttonRef: React.RefObject<HTMLButtonElement>;
}

export const MergeTagSelector: React.FC<MergeTagSelectorProps> = ({
	options,
	onSelect,
	isOpen,
	onClose,
	buttonRef,
}) => {
	const dropdownRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const [position, setPosition] = useState({ top: 0, left: 0 });
	const [isInModal, setIsInModal] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [focusedIndex, setFocusedIndex] = useState(-1);

	useEffect(() => {
		if (isOpen && buttonRef.current) {
			const buttonRect = buttonRef.current.getBoundingClientRect();

			// Check if we're inside a modal
			const modalParent = buttonRef.current.closest('.echodash-modal');
			setIsInModal(!!modalParent);

			if (modalParent) {
				// For modal context, use fixed positioning
				let top = buttonRect.bottom + 2;
				let left = buttonRect.left;

				// Get dropdown dimensions after render
				setTimeout(() => {
					if (dropdownRef.current) {
						const dropdownRect =
							dropdownRef.current.getBoundingClientRect();

						// Adjust if dropdown would go off screen to the right
						if (
							left + dropdownRect.width >
							window.innerWidth - 20
						) {
							left = buttonRect.right - dropdownRect.width;
						}

						// Adjust if dropdown would go off screen to the bottom
						if (
							top + dropdownRect.height >
							window.innerHeight - 20
						) {
							top = buttonRect.top - dropdownRect.height - 2;
						}

						setPosition({ top, left });
					}
				}, 0);

				setPosition({ top, left });
			} else {
				// For non-modal context, use absolute positioning
				const top = buttonRect.bottom + window.scrollY + 2;
				const left = buttonRect.left + window.scrollX;

				setPosition({ top, left });
			}
		}
	}, [isOpen, buttonRef]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent): void => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node) &&
				buttonRef.current &&
				!buttonRef.current.contains(event.target as Node)
			) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			return () =>
				document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [isOpen, onClose, buttonRef]);

	// Focus search input when dropdown opens
	useEffect(() => {
		if (isOpen && searchInputRef.current) {
			// Small delay to ensure the dropdown is positioned
			setTimeout(() => {
				searchInputRef.current?.focus();
			}, 100);
		}

		// Reset search when dropdown closes
		if (!isOpen) {
			setSearchTerm('');
			setFocusedIndex(-1);
		}
	}, [isOpen]);

	// Filter options based on search term
	const filteredOptions = useMemo(() => {
		if (!searchTerm.trim()) {
			return options;
		}

		const searchLower = searchTerm.toLowerCase();

		return options
			.map(group => ({
				...group,
				options: group.options.filter(option => {
					// Search in merge tag, placeholder, and preview
					const mergeTag =
						`{${group.type}:${option.meta}}`.toLowerCase();
					const placeholder = String(
						option.placeholder ?? ''
					).toLowerCase();
					const preview = String(option.preview ?? '').toLowerCase();

					return (
						mergeTag.includes(searchLower) ||
						placeholder.includes(searchLower) ||
						preview.includes(searchLower)
					);
				}),
			}))
			.filter(group => group.options.length > 0); // Remove empty groups
	}, [options, searchTerm]);

	// Auto-scroll focused item into view
	useEffect(() => {
		if (focusedIndex >= 0 && dropdownRef.current) {
			const contentArea = dropdownRef.current.querySelector(
				'.echodash-merge-dropdown__content'
			);
			const focusedElement = contentArea?.querySelector(
				'.echodash-merge-dropdown__option--focused'
			);

			if (focusedElement && contentArea) {
				const contentRect = contentArea.getBoundingClientRect();
				const elementRect = focusedElement.getBoundingClientRect();

				if (elementRect.bottom > contentRect.bottom) {
					// Scroll down
					contentArea.scrollTop +=
						elementRect.bottom - contentRect.bottom + 5;
				} else if (elementRect.top < contentRect.top) {
					// Scroll up
					contentArea.scrollTop -=
						contentRect.top - elementRect.top + 5;
				}
			}
		}
	}, [focusedIndex]);

	// Flatten filtered options for keyboard navigation
	const flattenedOptions = useMemo(() => {
		const flattened: Array<{
			groupType: string;
			meta: string;
			groupName: string;
			option: MergeTagOption;
		}> = [];
		filteredOptions.forEach(group => {
			group.options.forEach(option => {
				flattened.push({
					groupType: group.type,
					meta: option.meta,
					groupName: group.name,
					option,
				});
			});
		});
		return flattened;
	}, [filteredOptions]);

	const handleSelect = (groupType: string, meta: string): void => {
		const mergeTag = `{${groupType}:${meta}}`;
		onSelect(mergeTag);
		onClose();
	};

	const handleKeyDown = (e: React.KeyboardEvent): void => {
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				setFocusedIndex(prev =>
					prev < flattenedOptions.length - 1 ? prev + 1 : prev
				);
				break;
			case 'ArrowUp':
				e.preventDefault();
				setFocusedIndex(prev => (prev > 0 ? prev - 1 : -1));
				if (focusedIndex === 0) {
					// Focus back to search input
					searchInputRef.current?.focus();
				}
				break;
			case 'Enter':
				e.preventDefault();
				if (
					focusedIndex >= 0 &&
					focusedIndex < flattenedOptions.length
				) {
					const selected = flattenedOptions[focusedIndex];
					handleSelect(selected.groupType, selected.meta);
				}
				break;
			case 'Escape':
				e.preventDefault();
				onClose();
				break;
		}
	};

	if (!isOpen) return null;

	return (
		<div
			ref={dropdownRef}
			className={`echodash-merge-dropdown ${
				isInModal ? 'echodash-merge-dropdown--in-modal' : ''
			}`}
			style={{
				position: isInModal ? 'fixed' : 'absolute',
				top: position.top,
				left: position.left,
			}}
		>
			{/* Search Input */}
			<div className="echodash-merge-dropdown__search">
				<input
					ref={searchInputRef}
					type="text"
					placeholder="Search merge tags..."
					value={searchTerm}
					onChange={e => setSearchTerm(e.target.value)}
					className="echodash-merge-dropdown__search-input"
					onKeyDown={e => {
						if (
							e.key === 'ArrowDown' &&
							flattenedOptions.length > 0
						) {
							e.preventDefault();
							setFocusedIndex(0);
						} else if (e.key === 'Escape') {
							e.preventDefault();
							onClose();
						} else {
							// Prevent dropdown from closing when typing
							e.stopPropagation();
						}
					}}
				/>
			</div>

			{/* Scrollable Content */}
			<div
				className="echodash-merge-dropdown__content"
				onKeyDown={handleKeyDown}
				role="listbox"
				tabIndex={-1}
			>
				{filteredOptions.map((group, groupIndex) => {
					let optionIndexCounter = 0;
					// Calculate starting index for this group
					for (let i = 0; i < groupIndex; i++) {
						optionIndexCounter += filteredOptions[i].options.length;
					}

					return (
						<div
							key={groupIndex}
							className="echodash-merge-dropdown__group"
						>
							{/* Group Header */}
							<div className="echodash-merge-dropdown__group-header">
								{group.name}
							</div>

							{/* Group Options */}
							{group.options.map((option, optionIndex) => {
								const globalIndex =
									optionIndexCounter + optionIndex;
								const isFocused = focusedIndex === globalIndex;

								return (
									<div
										key={optionIndex}
										onClick={() =>
											handleSelect(
												group.type,
												option.meta
											)
										}
										onKeyDown={e => {
											if (
												e.key === 'Enter' ||
												e.key === ' '
											) {
												e.preventDefault();
												handleSelect(
													group.type,
													option.meta
												);
											}
										}}
										tabIndex={isFocused ? 0 : -1}
										role="button"
										aria-label={`Select merge tag ${group.type}:${option.meta}`}
										className={`echodash-merge-dropdown__option ${
											isFocused
												? 'echodash-merge-dropdown__option--focused'
												: ''
										}`}
									>
										<div className="echodash-merge-dropdown__option-tag">
											{`{${group.type}:${option.meta}}`}
										</div>
										<div className="echodash-merge-dropdown__option-placeholder">
											{option.placeholder}
										</div>
										<div className="echodash-merge-dropdown__option-preview">
											Preview: {String(option.preview)}
										</div>
									</div>
								);
							})}
						</div>
					);
				})}

				{filteredOptions.length === 0 && (
					<div className="echodash-merge-dropdown__empty">
						{searchTerm.trim()
							? 'No matching merge tags found'
							: 'No merge tags available'}
					</div>
				)}
			</div>
		</div>
	);
};
