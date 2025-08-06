/**
 * Merge Tag Selector Component
 * 
 * Dropdown component for selecting merge tags from available options
 */

import React, { useState, useRef, useEffect } from 'react';

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

	useEffect(() => {
		if (isOpen && buttonRef.current && dropdownRef.current) {
			const buttonRect = buttonRef.current.getBoundingClientRect();
			const dropdownRect = dropdownRef.current.getBoundingClientRect();
			
			// Position dropdown below the button
			let top = buttonRect.bottom + window.scrollY + 5;
			let left = buttonRect.left + window.scrollX;
			
			// Adjust if dropdown would go off screen
			if (left + dropdownRect.width > window.innerWidth) {
				left = buttonRect.right + window.scrollX - dropdownRect.width;
			}
			
			if (top + dropdownRect.height > window.innerHeight + window.scrollY) {
				top = buttonRect.top + window.scrollY - dropdownRect.height - 5;
			}
			
			setPosition({ top, left });
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
			style={{
				position: 'fixed',
				top: position.top,
				left: position.left,
				backgroundColor: 'white',
				border: '1px solid #ddd',
				borderRadius: '4px',
				boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
				zIndex: 10000,
				minWidth: '300px',
				maxHeight: '300px',
				overflowY: 'auto'
			}}
		>
			{options.map((group, groupIndex) => (
				<div key={groupIndex} style={{ borderBottom: groupIndex < options.length - 1 ? '1px solid #eee' : 'none' }}>
					{/* Group Header */}
					<div style={{
						padding: '8px 12px',
						backgroundColor: '#f7f7f7',
						fontWeight: 'bold',
						fontSize: '13px',
						color: '#555',
						borderBottom: '1px solid #eee'
					}}>
						{group.name}
					</div>
					
					{/* Group Options */}
					{group.options.map((option, optionIndex) => (
						<div
							key={optionIndex}
							onClick={() => handleSelect(group.type, option.meta)}
							style={{
								padding: '8px 12px',
								cursor: 'pointer',
								borderBottom: optionIndex < group.options.length - 1 ? '1px solid #f0f0f0' : 'none',
								fontSize: '13px',
								transition: 'background-color 0.1s'
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = '#f5f5f5';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = 'transparent';
							}}
						>
							<div style={{ fontWeight: '500', marginBottom: '2px' }}>
								{`{${group.type}:${option.meta}}`}
							</div>
							<div style={{ color: '#666', fontSize: '12px' }}>
								{option.placeholder}
							</div>
							<div style={{ color: '#999', fontSize: '11px', marginTop: '2px' }}>
								Preview: {String(option.preview)}
							</div>
						</div>
					))}
				</div>
			))}
			
			{options.length === 0 && (
				<div style={{ 
					padding: '12px', 
					color: '#666', 
					fontSize: '13px',
					textAlign: 'center'
				}}>
					No merge tags available
				</div>
			)}
		</div>
	);
};