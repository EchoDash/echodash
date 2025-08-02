/**
 * EchoDash React Admin Interface Entry Point
 * 
 * This file initializes the React application within the WordPress admin context.
 */

import { createRoot } from 'react-dom/client';
import { App } from './components/App';

// Import WordPress dependencies
import '@wordpress/components/build-style/style.css';

// Import our styles
import './styles/main.css';

// Initialize the React app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
	const container = document.getElementById('echodash-react-app');
	
	if (container) {
		const root = createRoot(container);
		root.render(<App />);
	}
});