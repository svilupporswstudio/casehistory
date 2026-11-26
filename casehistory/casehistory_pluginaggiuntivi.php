<?php
/**
 * Gestione dipendenze plugin tramite sistemi nativi di WordPress 7.0+
 *
 * Il requisito principale "meta-box" è dichiarato nell'intestazione del plugin
 * tramite "Requires Plugins: meta-box" in casehistory.php.
 * Nessuna attivazione forzata (force_activation rimossa).
 */

defined( 'ABSPATH' ) || exit;

/**
 * Verifica che il plugin Meta Box sia attivo tramite le API core di WordPress
 * e mostra un avviso amministrativo nativo se mancante.
 */
function casehistory_check_required_plugins_notice() {
	if ( ! current_user_can( 'activate_plugins' ) ) {
		return;
	}

	if ( ! function_exists( 'is_plugin_active' ) ) {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
	}

	if ( ! defined( 'RWMB_VER' ) && ! is_plugin_active( 'meta-box/meta-box.php' ) ) {
		$install_url = wp_nonce_url(
			self_admin_url( 'update.php?action=install-plugin&plugin=meta-box' ),
			'install-plugin_meta-box'
		);
		$details_url = self_admin_url( 'plugin-install.php?tab=plugin-information&plugin=meta-box&TB_iframe=true&width=600&height=550' );

		printf(
			'<div class="notice notice-warning is-dismissible"><p>%s <a href="%s" class="thickbox open-plugin-details-modal">%s</a> | <a href="%s">%s</a></p></div>',
			esc_html__( 'Il plugin Case History richiede il plugin Meta Box per gestire i campi personalizzati.', 'casehistory' ),
			esc_url( $details_url ),
			esc_html__( 'Dettagli Meta Box', 'casehistory' ),
			esc_url( $install_url ),
			esc_html__( 'Installa Meta Box', 'casehistory' )
		);
	}
}
add_action( 'admin_notices', 'casehistory_check_required_plugins_notice' );

/**
 * Aggiunge un link informativo ai plugin consigliati nella schermata Plugin di WordPress
 * senza alcuna installazione o attivazione forzata.
 */
function casehistory_plugin_row_meta( $links, $file ) {
	if ( plugin_basename( casehistory_Path . 'casehistory.php' ) === $file ) {
		$links[] = sprintf(
			'<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
			esc_url( 'https://www.matteotestoni.it/servizi/programmatore-esperto-wordpress/plugin-case-history-wordpress/' ),
			esc_html__( 'Documentazione Plugin', 'casehistory' )
		);
	}
	return $links;
}
add_filter( 'plugin_row_meta', 'casehistory_plugin_row_meta', 10, 2 );