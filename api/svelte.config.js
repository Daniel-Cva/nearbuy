import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		csrf: {
			checkOrigin: false, // Disable for now to fix local cross-origin 400 errors
			trustedOrigins: [
				'http://localhost:5173',
				'https://localhost:5173',
				'http://192.168.0.165:5173',
				'https://192.168.0.165:5173'
			]
		}
	},
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) => ({ runes: !filename.includes('node_modules') })
	}
};

export default config;
