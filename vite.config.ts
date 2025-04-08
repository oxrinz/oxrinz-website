import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import mdx from '@mdx-js/rollup';

export default defineConfig({
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
