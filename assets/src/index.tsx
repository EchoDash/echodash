/**
 * EchoDash React Admin Interface Entry Point
 * 
 * This file initializes the React application within the WordPress admin context.
 */

import { createRoot } from 'react-dom/client';
import { App } from './App';

// Import our styles (WordPress styles are loaded separately via PHP)
import './styles/shared.css';
import './styles/main.css';

// Initialize the React app
function initializeEchoDashApp() {
	try {
		const container = document.getElementById('echodash-react-app');
		
		if (container) {
			const root = createRoot(container);
			root.render(<App />);
			
			// Mark the container as loaded
			container.classList.add('loaded');
			
			// Remove the loading spinner
			const loading = document.getElementById('echodash-loading');
			if (loading) {
				loading.style.display = 'none';
			}
		} else {
			console.error('EchoDash: Container #echodash-react-app not found');
		}
	} catch (error) {
		console.error('EchoDash: Error during initialization:', error);
	}
}

// Try to initialize immediately, or wait for DOM ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initializeEchoDashApp);
} else {
	initializeEchoDashApp();
}