import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import mdx from '@mdx-js/rollup';

export default defineConfig({
	// node_modules is root-owned on this machine, so keep vite's cache in the project.
	cacheDir: '.vite-cache',
	plugins: [mdx({
		providerImportSource: '@mdx-js/preact'
	}), sveltekit()],
	server: {
		proxy: {
			'/api': {
				target: 'http://localhost:8080',
				changeOrigin: true,
				secure: false
			}
		}
	}
});
