import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		csrf: {
			checkOrigin: process.env.NODE_ENV === 'development' ? false : true,
			trustedOrigins: [
				'http://localhost:5173',
				'https://localhost:5173',
				'http://172.18.6.118:5173',
				'https://172.18.6.118:5173'
			]
		}
	},
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) => ({ runes: !filename.includes('node_modules') })
	}
};

export default config;
