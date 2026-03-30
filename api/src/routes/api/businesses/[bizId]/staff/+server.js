import { json } from '@sveltejs/kit';
import { hashPassword } from '$lib/server/auth';
import { ulid } from 'ulid';

/**
 * Path: /api/businesses/[bizId]/staff
 */

// ── GET: View all staffs within a business ──────────────────────────────
export async function GET({ params, platform, locals }) {
    try {
        const { bizId } = params;
        const payload = locals.user;

        // Security check: must be a member of this business
        if (!payload || payload.bizId !== bizId) {
            return json({ message: 'Unauthorized: you are not part of this business' }, { status: 403 });
        }

        const db = platform.env.DB;

        // Fetch all staff members for the business
        const staffs = await db.prepare('SELECT id, biz_id, name, email, role, phone, location, avatar_url, created_at, status FROM biz_staffs WHERE biz_id = ?').bind(bizId).all();
        
        // Let's also fetch the founder profile
        const founder = await db.prepare('SELECT id, biz_id, name, email, phone, avatar_url, created_at FROM founder WHERE biz_id = ?').bind(bizId).first();

        // Include the role manually to founder response data
        if (founder) {
            founder.role = 'founder';
            founder.status = 'active'; // Always active technically
        }

        return json({ message: 'Profiles fetched successfully', founder, staffs: staffs.results });

    } catch (e) {
        return json({ message: 'Internal server error', error: e.message }, { status: 500 });
    }
}

// ── POST: Create a new staff profile ────────────────────────────────────
export async function POST({ params, request, platform, locals }) {
    try {
        const { bizId } = params;
        const payload = locals.user;
        
        // 1. Authenticate Request
        // Only the founder or manager of a business is allowed to create staff accounts
        if (!payload || payload.bizId !== bizId || !['founder', 'manager'].includes(payload.role)) {
            return json({ message: 'Unauthorized. Only business founders/managers can create staff.' }, { status: 403 });
        }

        const body = await request.json();
        const { name, role, email, mobile, location, password } = body;

        if (!name || !role || !email || !password) {
            return json({ message: 'Name, role, email, and password are required' }, { status: 400 });
        }

        // Just enforce they can't create another 'founder'
        if (role === 'founder') {
            return json({ message: 'Cannot create another founder' }, { status: 400 });
        }

        const db = platform.env.DB;

        // 2. Prevent Duplicate Logins
        const existing = await db.prepare('SELECT id FROM biz_login WHERE email = ?').bind(email).first();
        if (existing) {
            return json({ message: 'A staff member or founder with this email already exists' }, { status: 400 });
        }

        const staffId = ulid();
        const hashedPassword = await hashPassword(password);

        // 3. Atomically Insert Data
        await db.batch([
            // Add Profile to biz_staffs
            db.prepare(`
                INSERT INTO biz_staffs (id, biz_id, role, name, email, phone, location)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).bind(staffId, bizId, role, name, email, mobile || null, location || null),

            // Add Login Credentials to master biz_login table
            db.prepare(`
                INSERT INTO biz_login (id, biz_id, role, email, mobile, password_hash)
                VALUES (?, ?, ?, ?, ?, ?)
            `).bind(staffId, bizId, role, email, mobile || null, hashedPassword)
        ]);

        return json({
            message: 'Staff account created successfully',
            staff: { id: staffId, name, role, email, mobile }
        }, { status: 201 });

    } catch (error) {
        console.error('Staff creation error:', error);
        return json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
