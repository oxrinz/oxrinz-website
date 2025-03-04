import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		proxy: {
		  // This will forward any requests that start with /api to your Go server
		  '/api': {
			target: 'http://localhost:8080', // Your Go server address
			changeOrigin: true,
			secure: false
		  }
		}
	  }
});
