/**
 * Sortable Trigger List Component
 * 
 * Provides drag and drop functionality for reordering triggers.
 * Uses HTML5 drag and drop API with fallback for touch devices.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
	Card,
	CardBody,
	VStack,
	Notice,
	Button,
	Flex,
	Text
} from '@wordpress/components';
import { Icon, menu } from '@wordpress/icons';
import clsx from 'clsx';

import { useAccessibility } from '../../hooks/useAccessibility';

export interface SortableItem {
	id: string;
	[key: string]: any;
}

export interface SortableTriggerListProps {
	/** List of triggers to display */
	triggers: SortableItem[];
	
	/** Callback when order changes */
	onReorder: (reorderedTriggers: SortableItem[]) => void;
	
	/** Render function for each trigger */
	renderTrigger: (trigger: SortableItem, isDragging: boolean, dragHandleProps: any) => React.ReactNode;
	
	/** Loading state */
	loading?: boolean;
	
	/** Whether drag and drop is disabled */
	disabled?: boolean;
	
	/** CSS class name */
	className?: string;
	
	/** Empty state message */
	emptyMessage?: string;
	
	/** Show drag handles */
	showDragHandles?: boolean;
}

interface DragState {
	draggedItem: SortableItem | null;
	draggedIndex: number;
	dropIndex: number;
	isDragging: boolean;
}

export const SortableTriggerList: React.FC<SortableTriggerListProps> = ({
	triggers,
	onReorder,
	renderTrigger,
	loading = false,
	disabled = false,
	className,
	emptyMessage = 'No triggers configured',
	showDragHandles = true
}) => {
	const { announceToScreenReader } = useAccessibility();
	const listRef = useRef<HTMLDivElement>(null);
	const dragPreviewRef = useRef<HTMLDivElement>(null);
	
	// Drag state
	const [dragState, setDragState] = useState<DragState>({
		draggedItem: null,
		draggedIndex: -1,
		dropIndex: -1,
		isDragging: false
	});
	
	// Track if we're using keyboard navigation
	const [keyboardMode, setKeyboardMode] = useState(false);
	const [focusedIndex, setFocusedIndex] = useState(-1);

	// Handle drag start
	const handleDragStart = useCallback((
		e: React.DragEvent<HTMLDivElement>,
		trigger: SortableItem,
		index: number
	) => {
		if (disabled) {
			e.preventDefault();
			return;
		}

		setDragState({
			draggedItem: trigger,
			draggedIndex: index,
			dropIndex: index,
			isDragging: true
		});

		// Set drag data
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', trigger.id);

		// Create drag preview
		if (dragPreviewRef.current) {
			e.dataTransfer.setDragImage(dragPreviewRef.current, 0, 0);
		}

		announceToScreenReader(`Started dragging trigger ${index + 1}`, 'assertive');
	}, [disabled, announceToScreenReader]);

	// Handle drag over
	const handleDragOver = useCallback((
		e: React.DragEvent<HTMLDivElement>,
		index: number
	) => {
		if (disabled || !dragState.isDragging) {
			return;
		}

		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';

		if (index !== dragState.dropIndex) {
			setDragState(prev => ({ ...prev, dropIndex: index }));
		}
	}, [disabled, dragState.isDragging, dragState.dropIndex]);

	// Handle drop
	const handleDrop = useCallback((
		e: React.DragEvent<HTMLDivElement>,
		dropIndex: number
	) => {
		e.preventDefault();

		if (disabled || !dragState.draggedItem || dragState.draggedIndex === dropIndex) {
			setDragState({
				draggedItem: null,
				draggedIndex: -1,
				dropIndex: -1,
				isDragging: false
			});
			return;
		}

		// Reorder array
		const newTriggers = [...triggers];
		const [removed] = newTriggers.splice(dragState.draggedIndex, 1);
		newTriggers.splice(dropIndex, 0, removed);

		onReorder(newTriggers);

		announceToScreenReader(
			`Moved trigger from position ${dragState.draggedIndex + 1} to position ${dropIndex + 1}`,
			'assertive'
		);

		setDragState({
			draggedItem: null,
			draggedIndex: -1,
			dropIndex: -1,
			isDragging: false
		});
	}, [disabled, dragState, triggers, onReorder, announceToScreenReader]);

	// Handle drag end
	const handleDragEnd = useCallback(() => {
		setDragState({
			draggedItem: null,
			draggedIndex: -1,
			dropIndex: -1,
			isDragging: false
		});
	}, []);

	// Keyboard navigation
	const handleKeyDown = useCallback((
		e: React.KeyboardEvent<HTMLDivElement>,
		index: number
	) => {
		setKeyboardMode(true);
		
		switch (e.key) {
			case 'ArrowUp':
				e.preventDefault();
				if (index > 0) {
					const newTriggers = [...triggers];
					[newTriggers[index], newTriggers[index - 1]] = [newTriggers[index - 1], newTriggers[index]];
					onReorder(newTriggers);
					setFocusedIndex(index - 1);
					announceToScreenReader(`Moved trigger up to position ${index}`, 'assertive');
				}
				break;
				
			case 'ArrowDown':
				e.preventDefault();
				if (index < triggers.length - 1) {
					const newTriggers = [...triggers];
					[newTriggers[index], newTriggers[index + 1]] = [newTriggers[index + 1], newTriggers[index]];
					onReorder(newTriggers);
					setFocusedIndex(index + 1);
					announceToScreenReader(`Moved trigger down to position ${index + 2}`, 'assertive');
				}
				break;
				
			case 'Home':
				e.preventDefault();
				if (index > 0) {
					const newTriggers = [...triggers];
					const [removed] = newTriggers.splice(index, 1);
					newTriggers.unshift(removed);
					onReorder(newTriggers);
					setFocusedIndex(0);
					announceToScreenReader(`Moved trigger to first position`, 'assertive');
				}
				break;
				
			case 'End':
				e.preventDefault();
				if (index < triggers.length - 1) {
					const newTriggers = [...triggers];
					const [removed] = newTriggers.splice(index, 1);
					newTriggers.push(removed);
					onReorder(newTriggers);
					setFocusedIndex(triggers.length - 1);
					announceToScreenReader(`Moved trigger to last position`, 'assertive');
				}
				break;
		}
	}, [triggers, onReorder, announceToScreenReader]);

	// Focus management
	useEffect(() => {
		if (keyboardMode && focusedIndex >= 0 && focusedIndex < triggers.length) {
			const element = listRef.current?.querySelector(`[data-index="${focusedIndex}"]`) as HTMLElement;
			if (element) {
				element.focus();
			}
		}
	}, [focusedIndex, keyboardMode, triggers.length]);

	// Reset keyboard mode on mouse interaction
	const handleMouseDown = useCallback(() => {
		setKeyboardMode(false);
	}, []);

	if (triggers.length === 0) {
		return (
			<Card className={clsx('ecd-sortable-list', 'ecd-sortable-list--empty', className)}>
				<CardBody>
					<div className="empty-state">
						<Text variant="muted">{emptyMessage}</Text>
					</div>
				</CardBody>
			</Card>
		);
	}

	return (
		<Card className={clsx('ecd-sortable-list', className, {
			'is-dragging': dragState.isDragging,
			'is-disabled': disabled || loading
		})}>
			<CardBody>
				{/* Instructions */}
				<div className="ecd-sortable-instructions">
					<Text variant="muted" size="12">
						Drag triggers to reorder them, or use arrow keys when focused
					</Text>
				</div>

				{/* Sortable list */}
				<div
					ref={listRef}
					className="ecd-sortable-container"
					onMouseDown={handleMouseDown}
					role="list"
					aria-label="Sortable trigger list"
				>
					<VStack spacing="2">
						{triggers.map((trigger, index) => {
							const isDragged = dragState.draggedItem?.id === trigger.id;
							const isDropTarget = dragState.isDragging && dragState.dropIndex === index;
							
							const dragHandleProps = showDragHandles ? {
								draggable: !disabled && !loading,
								onDragStart: (e: React.DragEvent<HTMLDivElement>) => handleDragStart(e, trigger, index),
								onDragOver: (e: React.DragEvent<HTMLDivElement>) => handleDragOver(e, index),
								onDrop: (e: React.DragEvent<HTMLDivElement>) => handleDrop(e, index),
								onDragEnd: handleDragEnd,
								onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => handleKeyDown(e, index),
								tabIndex: 0,
								role: 'listitem',
								'aria-describedby': 'sortable-instructions',
								'data-index': index
							} : {};

							return (
								<div
									key={trigger.id}
									className={clsx('ecd-sortable-item', {
										'is-dragged': isDragged,
										'is-drop-target': isDropTarget,
										'is-keyboard-focused': keyboardMode && focusedIndex === index
									})}
									{...dragHandleProps}
								>
									{/* Drop indicator */}
									{isDropTarget && dragState.draggedIndex !== index && (
										<div className="drop-indicator" />
									)}

									{/* Drag handle */}
									{showDragHandles && !disabled && !loading && (
										<div className="drag-handle" aria-label="Drag to reorder">
											<Icon icon={menu} size={16} />
										</div>
									)}

									{/* Trigger content */}
									<div className="trigger-content">
										{renderTrigger(trigger, isDragged, dragHandleProps)}
									</div>
								</div>
							);
						})}
					</VStack>
				</div>

				{/* Hidden instructions for screen readers */}
				<div id="sortable-instructions" className="screen-reader-text">
					Use arrow keys to move triggers up or down. 
					Use Home to move to first position, End to move to last position.
				</div>

				{/* Drag preview (hidden) */}
				<div
					ref={dragPreviewRef}
					className="drag-preview"
					style={{ position: 'absolute', top: -1000, left: -1000 }}
				>
					{dragState.draggedItem && (
						<div className="drag-preview-content">
							Moving trigger...
						</div>
					)}
				</div>
			</CardBody>
		</Card>
	);
};