jQuery(function ($) {
	const EchoDash = {
		init: function () {
			this.optionPageRepeater();
			this.multiKeyRepeater();

			// Initialize visibility for existing triggers
			this.initializeExistingTriggers();

			$(document).on(
				'input change',
				'.echodash input[type=text]',
				this.inputPreview
			);
			$(document).on(
				'click',
				'.echodash a.open-list',
				this.selectorShortcodes
			);
			$(document).on(
				'click',
				'.ecd-circles button[data-repeater-create]',
				this.repeaterButtonsFix
			);
			$(document).on(
				'change',
				'td.trigger select.trigger',
				this.handleTriggerChange
			);
			$(document).on('click', '.ecd-send-test', this.sendEventTest);

			// EDD Recurring Subscription.
			$(document).on(
				'input change',
				'#edd_recurring',
				this.eddRecurringFix
			);
			if ($('#edd_recurring').length > 0) {
				if ($('#edd_recurring').val() === 'no') {
					$('.echodash')
						.find('[data-trigger=edd_subscription_status_changed]')
						.parents('table')
						.hide();
				}
			}

			// Trigger preview on page load.
			$('.echodash input[type=text]').trigger('change');

			$(document).on(
				'click',
				'#ecd-reset-defaults',
				this.resetToDefaults
			);

			// Add form validation
			$('#echodash_option_page').on('submit', function (e) {
				if (!EchoDash.validateForm()) {
					e.preventDefault();
				}
			});
		},

		/**
		 * Send an event test.
		 * @param {object} e
		 */
		sendEventTest: function (e) {
			e.preventDefault();
			// Change back text if it was sent.
			$(this).html(
				'<span class="dashicons dashicons-bell ecd-ring"></span>Send Test'
			);

			const trigger = $(this).parents('span.echodash');
			const data = {};
			data.integration = trigger.attr('data-integration');
			data.trigger = trigger.attr('data-trigger');
			data.event_name = trigger.find('.ecd-preview .event-name').text();
			data.event_keys_values = [];

			if (trigger.find('.ecd-multi-key').length > 0) {
				$.each(trigger.find('.ecd-values tr'), function (index, item) {
					const key = $(item).find('td:first').text().slice(0, -1); // Remove trailing colon
					const value = $('<div/>')
						.html($(item).find('td:last').html())
						.text(); // Decode HTML entities

					// Check if this is a list of fields (has <ul> tag)
					if (value && value.includes('<ul')) {
						// Extract field pairs from the <li> elements
						$(value)
							.find('li')
							.each(function () {
								const [fieldKey, fieldValue] = $(this)
									.text()
									.split(':')
									.map(s => s.trim());
								data.event_keys_values.push({
									key: 'fields_' + fieldKey,
									value: fieldValue,
								});
							});
					} else {
						data.event_keys_values.push({
							key: key,
							value: value,
						});
					}
				});
			} else {
				// Decode HTML entities in single value case too
				data.event_keys_values = $('<div/>')
					.html(trigger.find('.ecd-preview .event-value').html())
					.text();
			}

			$.ajax({
				type: 'POST',
				url: ecdEventData.ajaxurl,
				data: {
					action: 'echodash_send_test',
					data,
					_ajax_nonce: ecdEventData.nonce,
				},
				success: function (response) {
					if (response.success === true) {
						trigger.find('.ecd-send-test').text('Sent!');
					}
				},
				error: function (error) {
					// eslint-disable-next-line no-console
					console.log(error);
				},
			});
		},

		/**
		 * Handle trigger selection change
		 */
		handleTriggerChange: function () {
			const $select = $(this);
			const $row = $select.closest('tr');
			const integration = $select.data('integration');
			const trigger = $select.val();

			// Clean up select4
			EchoDash.cleanupSelect4($select, $row);

			// Update trigger metadata
			EchoDash.updateTriggerMetadata($select, $row, trigger);

			// Toggle event fields visibility
			const $eventFields = $row.find('.echodash .echodash-fields');
			const $placeholder = $row.find('.echodash .ecd-placeholder');

			if (trigger) {
				$eventFields.addClass('visible');
				$placeholder.hide();
				// Apply default event configuration if available
				EchoDash.applyDefaultEventConfig($row, integration, trigger);
			} else {
				$eventFields.removeClass('visible');
				$placeholder.show();
			}
		},

		/**
		 * Clean up select4 instance
		 */
		cleanupSelect4: function ($select, $row) {
			$row.find(
				'select.select4-hidden-accessible option, select.select4-hidden-accessible optgroup'
			).remove();
			$row.find('select.select4-hidden-accessible').select4('destroy');
		},

		/**
		 * Update trigger description and data attributes
		 */
		updateTriggerMetadata: function ($select, $row, trigger) {
			$select
				.next('span.description')
				.html($select.find('option:selected').attr('data-description'));
			$row.find('span.echodash').attr('data-trigger', trigger);
		},

		/**
		 * Apply default event configuration if available
		 */
		applyDefaultEventConfig: function ($row, integration, trigger) {
			const defaultEvent =
				ecdEventData.triggers[integration][trigger].default_event;
			if (!defaultEvent) return;

			// Set event name
			$row.find('input.ecd-name')
				.val(defaultEvent.name)
				.trigger('change');

			// Handle mappings
			this.resetMappings($row);
			this.applyDefaultMappings($row, defaultEvent.mappings);
		},

		/**
		 * Reset existing mappings to prepare for new ones
		 */
		resetMappings: function ($row) {
			$row.find('.ecd-multi-key .nr-item:not(:first)').remove();
			const $firstRow = $row.find('.ecd-multi-key .nr-item:first');
			$firstRow.find('input.ecd-key, input.ecd-value').val('');
			return $firstRow;
		},

		/**
		 * Apply the default mappings to the form
		 */
		applyDefaultMappings: function ($row, mappings) {
			const $firstRow = $row.find('.ecd-multi-key .nr-item:first');
			let isFirst = true;

			Object.entries(mappings).forEach(([key, value]) => {
				if (isFirst) {
					$firstRow.find('input.ecd-key').val(key).trigger('change');
					$firstRow
						.find('input.ecd-value')
						.val(value)
						.trigger('change');
					isFirst = false;
				} else {
					this.addNewMapping($row, key, value);
				}
			});
		},

		/**
		 * Add a new mapping row with values
		 */
		addNewMapping: function ($row, key, value) {
			$row.find('.ecd-multi-key [data-repeater-create]').click();
			const $newRow = $row.find('.ecd-multi-key .nr-item:last');
			$newRow.find('input.ecd-key').val(key).trigger('change');
			$newRow.find('input.ecd-value').val(value).trigger('change');
		},

		/**
		 * Fix repeater button not clickable when it generates.
		 */
		repeaterButtonsFix: function () {
			if ($(this).parents('.nr-item').is(':last-child')) {
				$(this)
					.parents('.ecd-multi-key')
					.find(
						'.nr-item:first-child .ecd-circles button[data-repeater-create]'
					)
					.click();
			}
		},

		/**
		 * Fix table view in EDD recurring plugin.
		 */
		eddRecurringFix: function () {
			if ($(this).val() === 'yes') {
				$('.echodash')
					.find('[data-trigger=edd_subscription_status_changed]')
					.parents('table')
					.show();
			} else {
				$('.echodash')
					.find('[data-trigger=edd_subscription_status_changed]')
					.parents('table')
					.hide();
			}
		},

		/**
		 * Multi key crm repeater.
		 */
		multiKeyRepeater: function () {
			if ($('.echodash.single-trigger .ecd-multi-key').length) {
				$('.echodash.single-trigger .ecd-multi-key').repeater({
					initEmpty: false,
					show: function () {
						$(this).show();

						// Fix select4
						$('.select4-container', $(this)).remove();
						$('.trigger option:first', $(this))
							.attr('selected', false)
							.attr('selected', true);
						$(
							'.ecd-preview .event-name,.ecd-preview .event-value,.ecd-preview .event-key',
							$(this)
						).html('');
					},

					isFirstItemUndeletable: false,
				});
			}
		},

		/**
		 * Tooltip charachters limit.
		 * @param {integer} limit
		 */
		limitCharachters: function (limit) {
			const title_limit_notice =
				ecdEventData.crms_notices.title_limit.replace('{limit}', limit);

			// Limit title.
			$('.echodash .ecd-name').each(function (index, this_field) {
				this_field = $(this);

				if (this_field.val().length > limit) {
					this_field
						.addClass('ecd-tip ecd-tip-bottom')
						.attr('data-tip', title_limit_notice);
					$('.ecd-tip.ecd-tip-bottom').tipTip({
						attribute: 'data-tip',
						delay: 0,
						activation: 'focus',
						defaultPosition: 'top',
					});
					this_field.css('color', '#cc0000');
				}
			});

			$(document).on('input', '.echodash .ecd-name', function () {
				const this_field = $(this);

				if (this_field.val().length > limit) {
					this_field
						.addClass('ecd-tip ecd-tip-bottom')
						.attr('data-tip', title_limit_notice);
					$('.ecd-tip.ecd-tip-bottom').tipTip({
						attribute: 'data-tip',
						delay: 0,
						activation: 'focus',
						defaultPosition: 'top',
					});
					this_field.css('color', '#cc0000');
					this_field.focus();
				} else {
					this_field.css('color', '#000');
					$('#tiptip_holder').remove();
				}
			});
		},

		/**
		 * Init option page repeater.
		 */
		optionPageRepeater: function () {
			if ($('#echodash_option_page .ecd-repeater').length) {
				$('#echodash_option_page .ecd-repeater').repeater({
					repeaters: [
						{
							selector: '.ecd-multi-key',

							show: function () {
								$(this).slideDown();
								$('.select4-container', $(this)).remove();
								$('.trigger option:first', $(this))
									.attr('selected', false)
									.attr('selected', true);
								$(
									'.ecd-preview .event-name,.ecd-preview .event-value,.ecd-preview .event-key',
									$(this)
								).html('');
							},
							hide: function (deleteElement) {
								$(this).slideUp(deleteElement);
							},
						},
					],
					initEmpty: false,
					show: function () {
						$(this).show();

						// Hide event fields by default on new rows
						$(this).find('.echodash').removeClass('visible');

						// Reset trigger select to placeholder
						$(this).find('select.trigger').val('');

						// fixing the issue of the labels
						const params = [this];
						$(this)
							.find('label[for]')
							.each(function (index, element) {
								const currentRepeater = params[0];
								const originalFieldId = $(element).attr('for');
								const newField = $(currentRepeater).find(
									"select[id='" + originalFieldId + "']"
								);
								if ($(newField).length > 0) {
									const newFieldName =
										$(newField).attr('name');
									$(newField).attr('id', newFieldName);
									$(currentRepeater)
										.find(
											"label[for='" +
												originalFieldId +
												"']"
										)
										.attr('for', newFieldName);
								}
							}, params);

						// Fix select4
						$('.select4-container', $(this)).remove();
						$('.trigger option:first', $(this))
							.attr('selected', false)
							.attr('selected', true);
						$(
							'.ecd-preview .event-name,.ecd-preview .event-value,.ecd-preview .event-key',
							$(this)
						).html('');

						// Nested Repeaters
						$('.nr-item', $(this)).not(':first').remove();
					},
					hide: function (deleteElement) {
						if ($(this).hasClass('nr-item')) {
							$(this).slideUp(deleteElement);
							EchoDash.updateMultiKeyTable(this, true);
						} else {
							if (
								confirm(
									'Are you sure you want to delete this trigger?'
								)
							) {
								$(this).slideUp(deleteElement);
							}
						}
					},
					ready: function (setIndexes) {
						$('.ecd-repeater .table_body').on(
							'sortupdate',
							function () {
								setIndexes();
							}
						);
					},
					isFirstItemUndeletable: false,
				});

				$('.ecd-repeater .table_body').sortable({
					handle: '.order',
				});
			}
		},

		/**
		 * Convert select shortcodes to real values.
		 * @param {object} input
		 * @returns string
		 */
		convertShortcode: function (input) {
			// Build up the text values and replacements.
			const inputElement = $(input);
			const trigger = inputElement
				.closest('.echodash')
				.attr('data-trigger');
			const integration = inputElement
				.closest('.echodash')
				.attr('data-integration');

			const previews = [];
			let meta = {};

			// Get all available options and meta data
			ecdEventData.triggers[integration][trigger].options.forEach(
				function (element) {
					// Store meta data if available
					if (element.meta && typeof element.meta === 'object') {
						meta = element.meta;
					}

					element.options.forEach(function (option) {
						previews.push({
							text: '{' + element.type + ':' + option.meta + '}',
							preview: option.preview,
						});
					});
				}
			);

			let text_value = input.val();

			// Convert shortcodes
			if (text_value.includes('{') && text_value.includes('}')) {
				const matches = text_value
					.split('{')
					.filter(function (v) {
						return v.indexOf('}') > -1;
					})
					.map(function (value) {
						return value.split('}')[0];
					});

				matches.forEach(function (match) {
					const new_match = '{' + match + '}';
					let found = false;

					// First check predefined previews
					previews.forEach(function (element) {
						if (element.text == new_match) {
							let previewText = element.preview;
							if (typeof element.preview === 'object') {
								previewText =
									'<ul style="margin:0;padding-left:20px">' +
									Object.entries(element.preview)
										.map(
											([key, value]) =>
												`<li>${key}: ${value}</li>`
										)
										.join('') +
									'</ul>';
							}
							text_value = text_value.replace(
								new_match,
								'<b>' + previewText + '</b>'
							);
							found = true;
						}
					});

					// If not found in previews, check meta data (currently just with user fields)
					if (!found) {
						const metaKey = match.split(':')[1];
						if (meta[metaKey]) {
							text_value = text_value.replace(
								new_match,
								'<b>' + meta[metaKey] + '</b>'
							);
						}
					}
				});
			}

			return text_value;
		},

		/**
		 * Update the preview HTML table for multi key crm.
		 * @param {object} input
		 * @param {boolean} remove
		 */
		updateMultiKeyTable: function (input, remove = false) {
			const main_parent = $(input).closest('.echodash');
			const table = main_parent.find('table');
			const tbody = $('<tbody></tbody>');

			$('.nr-item', main_parent).each(function (index) {
				if (remove == true && $(input).index() === index) {
					return true;
				}

				let key = $(this).find('.ecd-key').val();
				const value = EchoDash.convertShortcode(
					$(this).find('.ecd-value')
				);

				key = key ? key + ':' : '';

				const row = $('<tr>');
				const keyCell = $('<td>').text(key);
				const valueCell = $('<td>').html(value);
				row.append(keyCell).append(valueCell);
				tbody.append(row);
			});

			table.html(tbody);
		},

		/**
		 * Show input preview for event names and values.
		 */
		inputPreview: function () {
			if (!$(this).val()) {
				return;
			}
			const input = $(this);
			let text_value = EchoDash.convertShortcode(input);
			const is_multi_key =
				input.parents('.echodash').find('.ecd-multi-key').length > 0;

			if (text_value != '') {
				input
					.closest('.echodash')
					.find('.ecd-preview')
					.css('display', 'flex');
			}

			if (input.attr('class') == 'ecd-name') {
				if (is_multi_key) {
					input
						.parents('.echodash')
						.find('.event-name')
						.html(text_value);
				} else {
					input
						.parents('.echodash-input-container')
						.siblings('.ecd-preview')
						.find('.event-name')
						.html(text_value);
				}
			} else if (input.attr('class') == 'ecd-key') {
				// We'll make the key lowercase and replace spaces with underscores.
				text_value = text_value.replace(/ /g, '_');
				text_value = text_value.toLowerCase();

				input.val(text_value);

				input
					.closest('.echodash-input-container')
					.parent()
					.find('.ecd-preview .event-key')
					.html(text_value + ':');
			} else if (input.attr('class') == 'ecd-value') {
				input
					.closest('.echodash-input-container')
					.parent()
					.find('.ecd-preview .event-value')
					.html(text_value);
			}

			if (is_multi_key) {
				EchoDash.updateMultiKeyTable(input);
			}
		},

		/**
		 * Init select4 selector with shortcodes.
		 * @param {object} e
		 */
		selectorShortcodes: function (e) {
			e.preventDefault();
			let in_nested_repeater = false;
			if ($(this).parents('.nr-item').length > 0) {
				in_nested_repeater = true;
			}

			const inputContainer = $(this).closest(
				'span.echodash-input-container'
			);
			const select = inputContainer.next('select.select4-event-tracking');

			if (!select.data('select4')) {
				const trigger = $(this)
					.closest('.echodash')
					.attr('data-trigger');
				const integration = $(this)
					.closest('.echodash')
					.attr('data-integration');

				const data = [];

				ecdEventData.triggers[integration][trigger].options.forEach(
					function (element) {
						const group = {
							text: element.name,
							children: [''], // for some reason the first item isn't selectable so we'll just add an empty array key here.
						};

						element.options.forEach(function (option) {
							const text =
								'{' + element.type + ':' + option.meta + '}';

							group.children.push({
								id: text,
								text: text,
							});
						});

						data.push(group);
					}
				);

				select
					.select4({
						allowClear: true,
						theme: 'ecd-events',
						width: '250px',
						data: data,
						minimumInputLength: 0,
						minimumResultsForSearch: 1,
						matcher: function (params, data) {
							// Check if params exists and has a term
							if (!params || !params.term) {
								return data;
							}

							// Return all data if no search term
							if (params.term.trim() === '') {
								return data;
							}

							// Handle optgroup children
							if (data.children) {
								// Clone the data object to avoid modifying original
								const match = $.extend(true, {}, data);

								// Check children for matches
								match.children = [];

								for (let c = 0; c < data.children.length; c++) {
									const child = data.children[c];
									// Add null check for child.text
									if (
										child &&
										child.text &&
										child.text
											.toLowerCase()
											.indexOf(
												params.term.toLowerCase()
											) > -1
									) {
										match.children.push(child);
									}
								}

								// Return the matched children
								if (match.children.length > 0) {
									return match;
								}
							}

							// Return null if no matches
							return null;
						},
					})
					.on('select4:select', function (event) {
						const value = event.params.data.text;
						const text_field =
							inputContainer.find('input[type=text]');
						const text_value = text_field.val();
						const cursorPos = text_field.prop('selectionStart');
						let textBefore, textAfter;

						if (
							cursorPos > 0 ||
							(cursorPos == 0 && text_value.length == 0)
						) {
							// If it's empty or we're inserting at the cursor.
							textBefore = text_value.substring(0, cursorPos);
							textAfter = text_value.substring(
								cursorPos,
								text_value.length
							);
						} else {
							// If we're appending to the end.
							textBefore = text_value;
							textAfter = '';
						}

						text_field.val(
							textBefore.trim() + ' ' + value + textAfter
						);
						text_field.focus().trigger('change');
						select.val([]); // clear the select
					});
			}

			select.select4('open');

			if (in_nested_repeater) {
				$('.select4-dropdown').css({ left: '-56px' });
			} else {
				$('.select4-dropdown').css({ left: '0' });
			}
		},

		/**
		 * Initialize visibility state for existing triggers
		 */
		initializeExistingTriggers: function () {
			$('.ecd-repeater select.trigger').each(function () {
				const $select = $(this);
				if ($select.val()) {
					const $row = $select.closest('tr');
					$row.find('.echodash .echodash-fields').addClass('visible');
					$row.find('.echodash .ecd-placeholder').hide();
				}
			});
		},

		resetToDefaults: function (e) {
			e.preventDefault();

			if (!confirm(ecdEventData.i18n.confirmReset)) {
				return;
			}

			const $button = $(this);
			$button.prop('disabled', true);

			$.ajax({
				url: ecdEventData.ajaxurl,
				type: 'POST',
				data: {
					action: 'echodash_reset_to_defaults',
					integration: 'all', // Reset all integrations
					_ajax_nonce: ecdEventData.nonce,
				},
				success: function (response) {
					if (response.success) {
						window.location.reload();
					} else {
						alert(ecdEventData.i18n.resetError);
						$button.prop('disabled', false);
					}
				},
				error: function () {
					alert(ecdEventData.i18n.resetError);
					$button.prop('disabled', false);
				},
			});
		},

		validateForm: function () {
			let isValid = true;
			let firstError = null;

			// Reset previous errors
			$('.ecd-name').removeClass('ecd-error');
			$('.ecd-error-message').remove();

			// Check each visible event name field
			$('.echodash:visible .ecd-name').each(function () {
				const $input = $(this);
				if (!$input.val().trim()) {
					isValid = false;
					$input.addClass('ecd-error');

					// Add error message
					$input.after(
						'<span class="ecd-error-message">' +
							ecdEventData.i18n.emptyEventName +
							'</span>'
					);

					// Store first error for scrolling
					if (!firstError) {
						firstError = $input;
					}
				}
			});

			if (!isValid && firstError) {
				// Scroll to first error
				$('html, body').animate(
					{
						scrollTop: firstError.offset().top - 100,
					},
					500
				);
			}

			return isValid;
		},
	};

	EchoDash.init();
});
