/**
 * Merge Tag Selector Component
 * 
 * Dropdown component for selecting merge tags from available options
 */

import React, { useState, useRef, useEffect } from 'react';
import './MergeTagSelector.css';

interface MergeTagOption {
	meta: string;
	preview: string | number;
	placeholder: string;
}

interface MergeTagGroup {
	name: string;
	type: string;
	options: MergeTagOption[];
}

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
	buttonRef
}) => {
	const dropdownRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState({ top: 0, left: 0 });
	const [isInModal, setIsInModal] = useState(false);

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
						const dropdownRect = dropdownRef.current.getBoundingClientRect();
						
						// Adjust if dropdown would go off screen to the right
						if (left + dropdownRect.width > window.innerWidth - 20) {
							left = buttonRect.right - dropdownRect.width;
						}
						
						// Adjust if dropdown would go off screen to the bottom
						if (top + dropdownRect.height > window.innerHeight - 20) {
							top = buttonRect.top - dropdownRect.height - 2;
						}
						
						setPosition({ top, left });
					}
				}, 0);
				
				setPosition({ top, left });
			} else {
				// For non-modal context, use absolute positioning
				let top = buttonRect.bottom + window.scrollY + 2;
				let left = buttonRect.left + window.scrollX;
				
				setPosition({ top, left });
			}
		}
	}, [isOpen, buttonRef]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
				buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [isOpen, onClose, buttonRef]);

	const handleSelect = (groupType: string, meta: string) => {
		const mergeTag = `{${groupType}:${meta}}`;
		onSelect(mergeTag);
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div
			ref={dropdownRef}
			className={`echodash-merge-dropdown ${isInModal ? 'echodash-merge-dropdown--in-modal' : ''}`}
			style={{
				position: isInModal ? 'fixed' : 'absolute',
				top: position.top,
				left: position.left
			}}
		>
			{options.map((group, groupIndex) => (
				<div 
					key={groupIndex} 
					className="echodash-merge-dropdown__group"
				>
					{/* Group Header */}
					<div className="echodash-merge-dropdown__group-header">
						{group.name}
					</div>
					
					{/* Group Options */}
					{group.options.map((option, optionIndex) => (
						<div
							key={optionIndex}
							onClick={() => handleSelect(group.type, option.meta)}
							className="echodash-merge-dropdown__option"
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
					))}
				</div>
			))}
			
			{options.length === 0 && (
				<div className="echodash-merge-dropdown__empty">
					No merge tags available
				</div>
			)}
		</div>
	);
};