export async function GET({ params, platform }) {
    try {
        const objectKey = params.path;
        if (!objectKey) {
            return new Response('File path missing', { status: 400 });
        }

        const bucket = platform.env.nearbuy_storage;
        const object = await bucket.get(objectKey);

        if (!object) {
            return new Response('Image not found', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        // Cache images aggressively for performance
        headers.set('cache-control', 'public, max-age=31536000');

        return new Response(object.body, {
            headers,
        });
    } catch (e) {
        return new Response(e.message, { status: 500 });
    }
}
