import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		host: true,
		port: 5173,
		https: {
			key: fs.readFileSync(path.resolve(__dirname, 'certs/localhost.key')),
			cert: fs.readFileSync(path.resolve(__dirname, 'certs/localhost.crt'))
		}
	}
});
