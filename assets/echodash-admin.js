jQuery( function ( $ ) {
	var EchoDash = {
		init: function(){
			this.optionPageRepeater();
			this.multiKeyRepeater();

			$(document).on('input change','.echodash input[type=text]',this.inputPreview);
			$(document).on('click','.echodash a.open-list', this.selectorShortcodes);
			$(document).on('click','.ecd-circles button[data-repeater-create]',this.repeaterButtonsFix);
			$(document).on('change','td.trigger select.trigger', this.select4Fix);
			$(document).on('click','.ecd-send-test',this.sendEventTest);

			// EDD Recurring Subscription.
			$(document).on('input change','#edd_recurring',this.eddRecurringFix);
			if($('#edd_recurring').length > 0){
				if($('#edd_recurring').val() === 'no'){
					$('.echodash').find('[data-trigger=edd_subscription_status_changed]').parents('table').hide();
				}
			}

			// Trigger preview on page load.
			$('.echodash input[type=text]').trigger('change');

		},

		/**
		 * Send an event test.
		 * @param {object} e 
		 */
		sendEventTest:function(e){
			e.preventDefault();
			// Change back text if it was sent.
			$(this).html('<span class="dashicons dashicons-bell ecd-ring"></span>Send Test');

			
			let trigger = $(this).parents('span.echodash');
			let data = {};
			data.integration_name = trigger.attr('data-integration');
			data.event_name = trigger.find('.ecd-preview .event-name').text();

			if(trigger.find('.ecd-multi-key-crm').length > 0){
				data.event_keys_values = [];
				$.each(trigger.find('.ecd-values tr'),function(index,item){
					var key = $(item).find('td:first').text().slice(0,-1);
					var value = $(item).find('td:last').text();
					
					data.event_keys_values[index] = {
						key: key,
						value: value
					};
				});
			
			}else{
				data.event_keys_values = trigger.find('.ecd-preview .event-value').text();
			}

			$.ajax({
				type: "POST",
				url: ecdEventData.ajaxurl,
				data: { action: 'ecd_send_test',data,'_ajax_nonce':ecdEventData.nonce },
				success: function(response){
					if(response.success === true){
						trigger.find('.ecd-send-test').text('Sent!');
					}
				},
				error: function(error){
					console.log(error);
				}
			});
	
		},

		/**
		 * Fix select4 selector when a trigger is added/changed.
		 */
		select4Fix:function(){
			$(this).closest( 'tr' ).find( 'select.select4-hidden-accessible option, select.select4-hidden-accessible optgroup' ).remove();
			$(this).closest( 'tr' ).find( 'select.select4-hidden-accessible' ).select4( 'destroy' ); // clear out the old options
			$(this).next( 'span.description' ).html( $(this).find( 'option:selected' ).attr( 'data-description' ) ); // update the description
			$(this).closest( 'tr' ).find( 'span.echodash' ).attr( 'data-trigger', $(this).find( 'option:selected' ).val() ); // update the data atts on the container.

		},

		/**
		 * Fix repeater button not clickable when it generates.
		 */
		repeaterButtonsFix:function(){
			if($(this).parents('.nr-item').is(':last-child')){
				$(this).parents('.ecd-multi-key-crm').find('.nr-item:first-child .ecd-circles button[data-repeater-create]').click();
			}
		},

		/**
		 * Fix table view in EDD recurring plugin.
		 */
		eddRecurringFix:function(){
			if($(this).val() === 'yes'){
				$('.echodash').find('[data-trigger=edd_subscription_status_changed]').parents('table').show();
			}else{
				$('.echodash').find('[data-trigger=edd_subscription_status_changed]').parents('table').hide();
			}
		},

		/**
		 * Multi key crm repeater.
		 */
		multiKeyRepeater:function(){
			if( $( '.echodash.single-trigger .ecd-multi-key-crm' ).length ){
				$( '.echodash.single-trigger .ecd-multi-key-crm' ).repeater({
					initEmpty: false,
					show: function () {
	
						$( this ).show();
	
						// Fix select4
						$( '.select4-container',$( this ) ).remove();
						$( '.trigger option:first',$( this ) ).attr( 'selected',false ).attr( 'selected',true );
						$( '.ecd-preview .event-name,.ecd-preview .event-value,.ecd-preview .event-key',$( this ) ).html( '' );
	
					},
	
					isFirstItemUndeletable: false
				});
			}
		},

		/**
		 * Tooltip charachters limit.
		 * @param {integer} limit 
		 */
		limitCharachters:function(limit){
			var title_limit_notice = ecdEventData.crms_notices.title_limit.replace('{limit}',limit);
	
			// Limit title.
			$('.echodash .ecd-name').each(function(index,this_field){
				this_field = $(this);

				if(this_field.val().length > limit){
					this_field.addClass('ecd-tip ecd-tip-bottom').attr('data-tip', title_limit_notice);
					$( '.ecd-tip.ecd-tip-bottom' ).tipTip({
						'attribute': 'data-tip',
						'delay': 0,
						'activation':'focus',
						'defaultPosition': 'top',
					});
					this_field.css('color','#cc0000');
				}
	
			});
		
			$(document).on('input','.echodash .ecd-name', function() {
				var this_field = $(this);

				if(this_field.val().length > limit){
					this_field.addClass('ecd-tip ecd-tip-bottom').attr('data-tip', title_limit_notice);
					$( '.ecd-tip.ecd-tip-bottom' ).tipTip({
						'attribute': 'data-tip',
						'delay': 0,
						'activation':'focus',
						'defaultPosition': 'top',
					});
					this_field.css('color','#cc0000');
					this_field.focus();
				}else{
					this_field.css('color','#000');
					$('#tiptip_holder').remove();
				}
			});
		},

		/**
		 * Init option page repeater.
		 */
		optionPageRepeater: function(){
			if( $( '#ecd_option_page .ecd-repeater' ).length ){

				$( '#ecd_option_page .ecd-repeater' ).repeater(
					{
						repeaters: [{
							selector: '.ecd-multi-key-crm',
		
							show: function () {
								$( this ).slideDown();
								$( '.select4-container',$( this ) ).remove();
								$( '.trigger option:first',$( this ) ).attr( 'selected',false ).attr( 'selected',true );
								$( '.ecd-preview .event-name,.ecd-preview .event-value,.ecd-preview .event-key',$( this ) ).html( '' );
							},
							hide: function (deleteElement) {
								$( this ).slideUp( deleteElement );
							},
						}],
						initEmpty: false,
						show: function () {
		
							$( this ).show();
							var main_parent = $( this ).parents( '.ecd-repeater' );
							$( '.order span',main_parent ).each(
								function (i) {
									var numbering = i + 1;
									$( this ).text( numbering );
								}
							);
		
							// fixing the issue of the labels
							var params = [this];
							$( this ).find( "label[for]" ).each(
								function(index, element) {
									var currentRepeater = params[0];
									var originalFieldId = $( element ).attr( "for" );
									var newField        = $( currentRepeater ).find( "select[id='" + originalFieldId + "']" );
									if ($( newField ).length > 0) {
										var newFieldName = $( newField ).attr( 'name' );
										$( newField ).attr( 'id', newFieldName );
										$( currentRepeater ).find( "label[for='" + originalFieldId + "']" ).attr( 'for', newFieldName );
									}
								},
								params
							);
		
							// Fix select4
							$( '.select4-container',$( this ) ).remove();
							$( '.trigger option:first',$( this ) ).attr( 'selected',false ).attr( 'selected',true );
							$( '.ecd-preview .event-name,.ecd-preview .event-value,.ecd-preview .event-key',$( this ) ).html( '' );
		
							// Nested Repeaters
							$('.nr-item',$( this )).not(':first').remove();
		
						},
						hide: function (deleteElement) {
		
							if($( this ).hasClass('nr-item')){
								$( this ).slideUp( deleteElement );
								EchoDash.updateMultiKeyTable(this,true);
							}else{
								if (confirm( 'Are you sure you want to delete this trigger?' )) {
									$( this ).slideUp( deleteElement );
								}
							}
		
						},
						ready: function (setIndexes) {
							$( ".ecd-repeater .table_body" ).on(
								"sortupdate",
								function( event, ui ) {
									setIndexes();
								}
							);
						},
						isFirstItemUndeletable: false
					}
				);
		
				$( ".ecd-repeater .table_body" ).sortable(
					{
						handle: '.order',
						update: function (event, ui) {
							$( '.order span',$( this ).parents( '.ecd-repeater' ) ).each(
								function (i) {
									var numbering = i + 1;
									$( this ).text( numbering );
								}
							);
						}
					}
				);
			}
		},

		/**
		 * Convert select shortcodes to real values.
		 * @param {object} input 
		 * @returns string
		 */
		convertShortcode:function(input){
			// Build up the text values and replacements.
			var input = $(input);
			var trigger     = input.closest( '.echodash' ).attr( 'data-trigger' );
			var integration = input.closest( '.echodash' ).attr( 'data-integration' );
	
			var previews = [];
	
			ecdEventData.triggers[ integration ][ trigger ].options.forEach( function( element ) {
	
				element.options.forEach( function( option ) {
	
					previews.push( {
						text: '{' + element.type + ':' + option.meta + '}',
						preview: option.preview,
					} );
	
				} );
			} );
	
			
			var text_value = input.val();
	
			// Convert shortcodes
			if( text_value.includes('{') && text_value.includes('}') ) {
	
				var matches = text_value.split('{')
				.filter(function(v){ return v.indexOf('}') > -1})
				.map( function(value) { 
					return value.split('}')[0]
				});
				matches.forEach(function(match){
	
					let new_match = '{' + match + '}';
	
					previews.forEach( function( element ) {
	
						if ( element.text == new_match ) {
							text_value = text_value.replace( new_match, '<b>' + element.preview + '</b>');
						}
	
					} );
	
				});
	
			}
	
			return text_value;
		},

		/**
		 * Update the preview HTML table for multi key crm.
		 * @param {object} input 
		 * @param {boolean} remove 
		 */
		updateMultiKeyTable:function(input,remove=false){
			var main_parent = $(input).closest('.echodash');
			var table = main_parent.find('table');
			var tbody = $("<tbody></tbody>");
			
			$(".nr-item",main_parent).each(function(index) {
				if(remove == true && $(input).index() === index){
					return true;
				}
	
				var key = $(this).find(".ecd-key").val();
				var value = EchoDash.convertShortcode($(this).find(".ecd-value"));
	
				key = (key ? key +":" : '');

				var row = $("<tr>");
				var keyCell = $("<td>").text(key);
				var valueCell = $("<td>").html(value);
				row.append(keyCell).append(valueCell);
				tbody.append(row);
			});
	
			table.html(tbody);
		},

		/**
		 * Show input preview for event names and values.
		 */
		inputPreview:function(){
			if ( ! $(this).val() ) {
				return;
			}
			var input = $(this);
			var text_value = EchoDash.convertShortcode(input);
			var is_multi_key = input.parents('.echodash').find('.ecd-multi-key-crm').length > 0;
	
			if( text_value != '' ){
				input.closest('.echodash').find('.ecd-preview').css('display', 'flex');
			}
	
			if( input.attr('class') == 'ecd-name' ){
				if(is_multi_key){
					input.parents('.echodash').find('.event-name').html( text_value );
				}else{
					input.parents('.echodash-input-container').siblings('.ecd-preview').find('.event-name').html( text_value );
				}
			} else if( input.attr('class') == 'ecd-key' ){
	
				// We'll make the key lowercase and replace spaces with underscores.
				text_value = text_value.replace(/ /g, '_');
				text_value = text_value.toLowerCase();
	
				input.val( text_value );
	
				input.closest('.echodash-input-container').parent().find('.ecd-preview .event-key').html( text_value + ':' );
				
			} else if( input.attr('class') == 'ecd-value' ){
				input.closest('.echodash-input-container').parent().find('.ecd-preview .event-value').html( text_value );
			}
	
			if(is_multi_key){
				EchoDash.updateMultiKeyTable(input);
			}

		},

		/**
		 * Init select4 selector with shortcodes.
		 * @param {object} e 
		 */
		selectorShortcodes:function(e){
			e.preventDefault();
			var in_nested_repeater = false;
			if($(this).parents('.nr-item').length > 0){
				in_nested_repeater = true;
			}
		
	
			var inputContainer = $(this).closest( 'span.echodash-input-container' );
			var select = inputContainer.next( 'select.select4-event-tracking' );
	
			if ( ! select.data( 'select4' ) ) {
	
				var trigger     = $(this).closest( '.echodash' ).attr( 'data-trigger' );
				var integration = $(this).closest( '.echodash' ).attr( 'data-integration' );
	
				var data = []
	
				ecdEventData.triggers[ integration ][ trigger ].options.forEach( function( element ) {
	
					var group = {
						text: element.name,
						children: [ '' ] // for some reason the first item isn't selectable so we'll just add an empty array key here.
					}
	
					element.options.forEach( function( option ) {
	
						var text = '{' + element.type + ':' + option.meta + '}';
	
						group.children.push(
							{
								id: text,
								text: text,
							}
						);
	
					} );
	
					data.push( group );
	
				} );
	
				select.select4({
					allowClear: true,
					theme: 'ecd-events',
					width: '250px',
					data: data,
			
				}).on('select4:select', function(event) {
	
					let value = event.params.data.text;
					let text_field = inputContainer.find('input[type=text]');
					let text_value = text_field.val();
					let cursorPos = text_field.prop('selectionStart');
	
					if ( cursorPos > 0 || ( cursorPos == 0 && text_value.length == 0 ) ) {
	
						// If it's empty or we're inserting at the cursor.
						var textBefore = text_value.substring(0,  cursorPos);
						var textAfter  = text_value.substring(cursorPos, text_value.length);
	
					} else {
	
						// If we're appending to the end.
						var textBefore = text_value;
						var textAfter  = '';
	
					}
	
					
					text_field.val(textBefore.trim() + ' ' + value + textAfter);
					text_field.focus().trigger('change');
					select.val([]); // clear the select
				});
	
			}
	
			select.select4('open');
	
			if(in_nested_repeater){
				$('.select4-dropdown').css({"left":'-56px'});
			}else{
				$('.select4-dropdown').css({"left":'0'});
			}
		
		}
	};


	EchoDash.init();

} );
