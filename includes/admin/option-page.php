<div class="wrap">

	<form id="ecd_option_page" action="" method="post">

		<?php $settings = get_option( 'echodash_options' ); ?>

		<h1><?php esc_html_e( 'EchoDash', 'echodash' ); ?></h1>

		<div id="echodash-info">

			<p><?php esc_html_e( 'EchoDash is a service for tracking real-time events on your WordPress site. It\'s free and easy to use.', 'echodash' ); ?></p>

			<p><?php printf( esc_html__( 'To get started, %1$screate an endpoint in your EchoDash account%2$s, and copy the URL into the field below.', 'echodash' ), '<a href="https://echodash.com/endpoints" target="_blank">', '</a>' ); ?></p>

			<input type="text" id="echodash-endpoint" name="echodash_options[endpoint]" placeholder="https://echodash.com/endpoints/xyz/receive" class="regular-text code" value="<?php echo esc_url( $settings['endpoint'] ); ?>">

			<p> <?php printf( esc_html__( 'Once you\'ve created an endpoint, click %1$sAdd Trigger%2$s next to an integration to start tracking events.', 'echodash' ), '<strong>', '</strong>' ); ?></p>

			<p><?php esc_html_e( 'For each trigger, name your event, and enter one or more key / value pairs containing the data you\'d like sent with the event.', 'echodash' ); ?></p>

		</div>

		<?php wp_nonce_field( 'echodash_options', 'echodash_options_nonce' ); ?>
		<input type="hidden" name="action" value="update">

		<?php

		$integrations = (array) echodash()->integrations;

		usort(
			$integrations,
			function ( $a, $b ) {
				return strcasecmp( $a->name, $b->name );
			}
		);

		foreach ( $integrations as $integration ) :

			$i             = 1;
			$did_empty_row = false;

			?>

			<div id="<?php echo esc_attr( $integration->slug ); ?>-integration" class="ecd-integration">
			<h3><?php echo esc_html( $integration->name ); ?></h3>

			<table class="table ecd-repeater">
				<tbody class="table_body" data-repeater-list="echodash_options[<?php echo esc_attr( $integration->slug ); ?>]" >

					<?php

					$triggers   = $integration->get_triggers();
					$has_global = false;

					foreach ( $triggers as $trigger_id => $trigger ) :

						if ( true === $trigger['has_global'] ) {
							$has_global = true; // if we need to display the Add New button.
						}

						$events = $integration->get_events( $trigger_id );

						// Separate out the single events.

						$single_events = array();

						foreach ( $events as $i => $event ) {
							if ( isset( $event['post_id'] ) || isset( $event['edit_url'] ) ) {
								$single_events[] = $event;
								unset( $events[ $i ] );
							}
						}

						if ( ! empty( $single_events ) ) :

							// Show all the single events together.

							?>

								<tr class="item">
									<td class="order"><span><?php echo esc_html( $i ); ?></span></td>
									<td class="trigger">
										<div class="ecd-field">
											<div class="ecd-label">
												<label for="trigger_conf"><?php esc_attr_e( 'Trigger', 'echodash' ); ?></label>
											</div>
											<div class="ecd-input">
												<select id="trigger_conf" disabled="true">
													<option selected><?php echo esc_html( $trigger['name'] ); ?></option>
												</select>
												<span class="description trigger-description"><?php echo esc_html( $trigger['description'] ); ?></span>
											</div>
										</div>
									</td>

									<td colspan="2">
										<div class="ecd-field">
											<div class="ecd-label">
												<label for="conf_on"><?php echo esc_html_e( 'Configured On', 'echodash' ); ?></label>
											</div>
											<ul class="posts">
												<?php

												foreach ( $single_events as $event ) :

													$edit_url   = isset( $event['edit_url'] ) ? $event['edit_url'] : get_edit_post_link( $event['post_id'] ) . '#echodash';
													$post_title = isset( $event['post_title'] ) ? $event['post_title'] : get_the_title( $event['post_id'] );

													?>
													<li><a href="<?php echo esc_url( $edit_url ); ?>"><?php echo esc_html( $post_title ); ?></a></li>
												<?php endforeach; ?>
											</ul>
										</div>
									</td>
								</tr>


							<?php

							++$i;

						endif; // end check for single events.

						if ( empty( $events ) && ! $did_empty_row ) {

							// Add a default for the repeater in the global section.

							$events = array(
								array(
									'trigger' => false,
									'name'    => false,
									'value'   => array(
										array(
											'key'   => false,
											'value' => false,
										),
									),
								),
							);

							$did_empty_row = true;

						}

						if ( ! empty( $events ) ) :

							foreach ( $events as $j => $event ) :
								?>

								<tr class="item" data-repeater-item <?php echo empty( $event['trigger'] ) ? 'style="display: none;"' : ''; ?>>
									<td class="order"><span><?php echo esc_html( $i ); ?></span></td>
									<td class="trigger">
										<div class="ecd-field">
											<div class="ecd-label">
												<label for="trigger_<?php echo $j; ?>"><?php esc_html_e( 'Trigger', 'echodash' ); ?></label>
											</div>
											<div class="ecd-input">
												<select data-integration="<?php echo esc_attr( $integration->slug ); ?>" class="trigger" name="trigger" id="trigger_<?php echo esc_attr( $j ); ?>">
													<?php foreach ( $triggers as $id => $trigger_option ) : ?>
														<?php if ( $trigger_option['has_global'] ) : ?>
															<option data-description="<?php echo esc_html( $trigger_option['description'] ); ?>" <?php selected( $event['trigger'], $id, true ); ?> value="<?php echo $id; ?>"><?php echo esc_html( $trigger_option['name'] ); ?></option>
														<?php endif; ?>
													<?php endforeach; ?>
												</select>
												<span class="description trigger-description"><?php echo esc_html( $trigger['description'] ); ?></span>
											</div>
										</div>
									</td>
									<td class="echodash">
										<?php

										ecd_render_event_tracking_fields(
											array(
												'meta_name' => 'echodash_options',
												'setting'  => $event,
												'field_id' => $id . '_' . $j,
												'integration' => $integration->slug,
												'trigger'  => $trigger_id,
											)
										);
										?>
									</td>

									<td class="close">
										<button onclick="return false;" data-repeater-delete><span class="dashicons dashicons-no"></span></button>
									</td>
								</tr>

								<?php

								++$i;

							endforeach; // global events.

						endif; // empty check for global events.

					endforeach;
					?>

					</tbody>

					<?php if ( $has_global ) : ?>

						<tfoot>
							<tr style="text-align:right;">
								<td colspan="5" style="padding-top:10px;">
								<input data-repeater-create type="button" class="button-primary" value="<?php esc_attr_e( 'Add Trigger', 'echodash' ); ?>"/>
								</td>
							</tr>
						</tfoot>

					<?php endif; // end check for has_global. ?>

				</table>

			</div>

		<?php endforeach; // integrations ?>

		<p class="submit"><input name="Submit" type="submit" class="button-primary" value="<?php esc_attr_e( 'Save Changes', 'echodash' ); ?>" /></p>
	</form>
</div>
