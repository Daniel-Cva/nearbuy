<script>
	import { getAdminToken } from '$lib/helpers/adminAuth.js';

	const allLogs = {
		onboarding: [
			{
				id: 'LOG-ONB-1024',
				actor: 'Ravi Kumar',
				action: 'Business account created - Krishna Electronics',
				entity: 'BIZ-001',
				time: '2026-03-09 10:15',
				status: 'success'
			},
			{
				id: 'LOG-ONB-1023',
				actor: 'Anita S.',
				action: 'User account registered via mobile',
				entity: 'USR-5421',
				time: '2026-03-09 09:42',
				status: 'success'
			},
			{
				id: 'LOG-ONB-1022',
				actor: 'Meera Devi',
				action: 'Business onboarding completed with document verification',
				entity: 'BIZ-002',
				time: '2026-03-08 16:30',
				status: 'success'
			},
			{
				id: 'LOG-ONB-1021',
				actor: 'Kumar J.',
				action: 'Failed OTP verification (3 attempts)',
				entity: 'USR-5420',
				time: '2026-03-08 14:20',
				status: 'failed'
			},
			{
				id: 'LOG-ONB-1020',
				actor: 'Lakshmi S.',
				action: 'Business account pending verification',
				entity: 'BIZ-004',
				time: '2026-03-08 11:15',
				status: 'pending'
			}
		],
		account_deletions: [
			{
				id: 'LOG-DEL-0342',
				actor: 'Super Admin',
				action: 'Deleted fraudulent business account',
				entity: 'BIZ-FRAUD-089',
				time: '2026-03-09 08:30',
				reason: 'Fraud detection',
				status: 'deleted'
			},
			{
				id: 'LOG-DEL-0341',
				actor: 'Raj M. (Self)',
				action: 'User requested account deletion',
				entity: 'USR-4982',
				time: '2026-03-08 19:45',
				reason: 'User request',
				status: 'deleted'
			},
			{
				id: 'LOG-DEL-0340',
				actor: 'Super Admin',
				action: 'Business banned for repeated violations',
				entity: 'BIZ-092',
				time: '2026-03-07 15:20',
				reason: 'Policy violation',
				status: 'deleted'
			},
			{
				id: 'LOG-DEL-0339',
				actor: 'Priya K. (Self)',
				action: 'Staff member removed by business owner',
				entity: 'STF-221',
				time: '2026-03-07 12:10',
				reason: 'Business decision',
				status: 'deleted'
			}
		],
		reports: [
			{
				id: 'LOG-RPT-2341',
				actor: 'User #5121',
				action: 'Reported business for fake products',
				entity: 'RPT-089',
				time: '2026-03-09 11:20',
				severity: 'high',
				status: 'under_review'
			},
			{
				id: 'LOG-RPT-2340',
				actor: 'Business BIZ-003',
				action: 'Reported user for abusive behavior',
				entity: 'RPT-088',
				time: '2026-03-09 09:15',
				severity: 'medium',
				status: 'under_review'
			},
			{
				id: 'LOG-RPT-2339',
				actor: 'Super Admin',
				action: 'Resolved spam report - Warning issued',
				entity: 'RPT-087',
				time: '2026-03-08 17:30',
				severity: 'low',
				status: 'resolved'
			},
			{
				id: 'LOG-RPT-2338',
				actor: 'User #4821',
				action: 'Critical: Reported payment fraud incident',
				entity: 'RPT-086',
				time: '2026-03-08 14:45',
				severity: 'critical',
				status: 'escalated'
			}
		],
		businesses: [
			{
				id: 'LOG-BIZ-8821',
				actor: 'Super Admin',
				action: 'Approved business verification - Krishna Electronics',
				entity: 'BIZ-001',
				time: '2026-03-09 10:30',
				status: 'approved'
			},
			{
				id: 'LOG-BIZ-8820',
				actor: 'BIZ-002',
				action: 'Business profile updated - New address added',
				entity: 'BIZ-002',
				time: '2026-03-09 08:15',
				status: 'updated'
			},
			{
				id: 'LOG-BIZ-8819',
				actor: 'Super Admin',
				action: 'Rejected business - Incomplete documents',
				entity: 'BIZ-PEND-034',
				time: '2026-03-08 16:40',
				status: 'rejected'
			},
			{
				id: 'LOG-BIZ-8818',
				actor: 'BIZ-005',
				action: 'Business subscription upgraded to Pro',
				entity: 'BIZ-005',
				time: '2026-03-08 13:20',
				status: 'upgraded'
			},
			{
				id: 'LOG-BIZ-8817',
				actor: 'BIZ-008',
				action: 'Business temporarily suspended for verification',
				entity: 'BIZ-008',
				time: '2026-03-07 11:00',
				status: 'suspended'
			}
		],
		founders: [
			{
				id: 'LOG-FDR-4521',
				actor: 'FDR-001',
				action: 'Ravi Kumar opened collaboration with FDR-004',
				entity: 'FDR-001',
				time: '2026-03-09 09:30',
				status: 'active'
			},
			{
				id: 'LOG-FDR-4520',
				actor: 'FDR-003',
				action: 'Raj Arjun closed collaboration network',
				entity: 'FDR-003',
				time: '2026-03-08 17:15',
				status: 'closed'
			},
			{
				id: 'LOG-FDR-4519',
				actor: 'FDR-002',
				action: 'Meera Devi updated founder profile bio',
				entity: 'FDR-002',
				time: '2026-03-08 14:45',
				status: 'updated'
			},
			{
				id: 'LOG-FDR-4518',
				actor: 'FDR-006',
				action: 'Anand R. connected with 3 new founders',
				entity: 'FDR-006',
				time: '2026-03-07 16:20',
				status: 'active'
			},
			{
				id: 'LOG-FDR-4517',
				actor: 'Super Admin',
				action: 'Verified founder profile for FDR-007',
				entity: 'FDR-007',
				time: '2026-03-07 10:30',
				status: 'verified'
			}
		],
		purchases: [
			{
				id: 'LOG-PUR-6734',
				actor: 'User #5421',
				action: 'Purchased iPhone 15 Case from Krishna Electronics',
				entity: 'ORD-8821',
				time: '2026-03-09 11:45',
				amount: '₹299',
				status: 'completed'
			},
			{
				id: 'LOG-PUR-6733',
				actor: 'User #5102',
				action: 'Order cancelled - USB-C Charger',
				entity: 'ORD-8820',
				time: '2026-03-09 10:20',
				amount: '₹599',
				status: 'cancelled'
			},
			{
				id: 'LOG-PUR-6732',
				actor: 'User #4988',
				action: 'Payment pending for Basmati Rice 5kg',
				entity: 'ORD-8819',
				time: '2026-03-09 09:15',
				amount: '₹399',
				status: 'pending'
			},
			{
				id: 'LOG-PUR-6731',
				actor: 'User #5234',
				action: 'Refund processed for defective headphones',
				entity: 'ORD-8818',
				time: '2026-03-08 18:30',
				amount: '₹2,149',
				status: 'refunded'
			},
			{
				id: 'LOG-PUR-6730',
				actor: 'User #5011',
				action: 'Bulk order placed - 10x Leather Wallets',
				entity: 'ORD-8817',
				time: '2026-03-08 15:45',
				amount: '₹7,990',
				status: 'completed'
			}
		],
		subscriptions: [
			{
				id: 'LOG-SUB-3421',
				actor: 'BIZ-005',
				action: 'Upgraded from Basic to Pro plan',
				entity: 'SUB-105',
				time: '2026-03-09 10:00',
				plan: 'Pro',
				status: 'active'
			},
			{
				id: 'LOG-SUB-3420',
				actor: 'BIZ-002',
				action: 'Subscription renewed - Standard plan',
				entity: 'SUB-042',
				time: '2026-03-09 08:30',
				plan: 'Standard',
				status: 'renewed'
			},
			{
				id: 'LOG-SUB-3419',
				actor: 'BIZ-012',
				action: 'Subscription expired - Basic plan',
				entity: 'SUB-089',
				time: '2026-03-08 23:59',
				plan: 'Basic',
				status: 'expired'
			},
			{
				id: 'LOG-SUB-3418',
				actor: 'Super Admin',
				action: 'Granted complimentary Pro plan to BIZ-001',
				entity: 'SUB-101',
				time: '2026-03-08 14:15',
				plan: 'Pro',
				status: 'granted'
			},
			{
				id: 'LOG-SUB-3417',
				actor: 'BIZ-007',
				action: 'Downgraded from Pro to Standard',
				entity: 'SUB-078',
				time: '2026-03-07 16:45',
				plan: 'Standard',
				status: 'downgraded'
			}
		]
	};

	let filter = $state('onboarding');
	const filtered = $derived(allLogs[filter] || []);

	const statusColors = {
		success: 'bg-green-500/20 text-green-400',
		failed: 'bg-red-500/20 text-red-400',
		pending: 'bg-yellow-500/20 text-yellow-400',
		deleted: 'bg-red-500/20 text-red-400',
		under_review: 'bg-blue-500/20 text-blue-400',
		resolved: 'bg-green-500/20 text-green-400',
		escalated: 'bg-purple-500/20 text-purple-400',
		approved: 'bg-green-500/20 text-green-400',
		updated: 'bg-blue-500/20 text-blue-400',
		rejected: 'bg-red-500/20 text-red-400',
		upgraded: 'bg-purple-500/20 text-purple-400',
		suspended: 'bg-orange-500/20 text-orange-400',
		active: 'bg-green-500/20 text-green-400',
		closed: 'bg-gray-500/20 text-gray-400',
		verified: 'bg-blue-500/20 text-blue-400',
		completed: 'bg-green-500/20 text-green-400',
		cancelled: 'bg-red-500/20 text-red-400',
		refunded: 'bg-orange-500/20 text-orange-400',
		renewed: 'bg-blue-500/20 text-blue-400',
		expired: 'bg-gray-500/20 text-gray-400',
		granted: 'bg-purple-500/20 text-purple-400',
		downgraded: 'bg-orange-500/20 text-orange-400'
	};

	const severityColors = {
		critical: 'bg-red-500/20 text-red-400',
		high: 'bg-orange-500/20 text-orange-400',
		medium: 'bg-yellow-500/20 text-yellow-400',
		low: 'bg-blue-500/20 text-blue-400'
	};
</script>

<svelte:head>
	<title>Activity Logs — NearBuy Admin</title>
	<meta
		name="description"
		content="Detailed activity logs for all users, businesses, and admin actions on NearBuy."
	/>
</svelte:head>

<div class="w-full p-4 md:p-8">
	<div class="mb-6">
		<div class="mb-4">
			<h1 class="text-2xl font-bold">Super Admin Logs</h1>
			<p class="mt-0.5 text-sm text-gray-400">Comprehensive audit trail of all platform activities</p>
		</div>
		<div class="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
			{#each [
				{ key: 'onboarding', label: 'Onboarding', icon: '👋' },
				{ key: 'account_deletions', label: 'Deletions', icon: '🗑️' },
				{ key: 'reports', label: 'Reports', icon: '🚨' },
				{ key: 'businesses', label: 'Businesses', icon: '🏪' },
				{ key: 'founders', label: 'Founders', icon: '🤝' },
				{ key: 'purchases', label: 'Purchases', icon: '🛒' },
				{ key: 'subscriptions', label: 'Subscriptions', icon: '💳' }
			] as f}
				<button
					id={`log-filter-${f.key}`}
					onclick={() => (filter = f.key)}
					class={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition-all flex items-center gap-2 ${filter === f.key ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'border border-gray-700 bg-gray-900 text-gray-400 hover:text-white hover:border-gray-600'}`}
				>
					<span>{f.icon}</span>
					<span>{f.label}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Mobile: Card list -->
	<div class="space-y-3 md:hidden">
		{#each filtered as log}
			<div class="rounded-2xl border border-gray-800 bg-gray-900 p-4">
				<div class="mb-2 flex items-center justify-between">
					<span class="font-mono text-xs text-gray-500">{log.id}</span>
					<span class={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${statusColors[log.status] || 'bg-gray-500/20 text-gray-400'}`}
						>{log.status.replace('_', ' ')}</span
					>
				</div>
				<p class="text-sm font-bold text-white">{log.actor}</p>
				<p class="mt-1 text-sm text-gray-300">{log.action}</p>
				<div class="mt-2 flex items-center justify-between">
					<span class="text-xs text-gray-500">{log.entity}</span>
					<span class="text-xs text-gray-400">{log.time}</span>
				</div>
				{#if log.severity}
					<div class="mt-2">
						<span class={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${severityColors[log.severity]}`}
							>{log.severity}</span
						>
					</div>
				{/if}
				{#if log.reason}
					<p class="mt-2 text-xs text-gray-400">Reason: {log.reason}</p>
				{/if}
				{#if log.amount}
					<p class="mt-2 text-xs font-bold text-green-400">{log.amount}</p>
				{/if}
				{#if log.plan}
					<p class="mt-2 text-xs text-blue-400">Plan: {log.plan}</p>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Desktop: Table -->
	<div class="hidden overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 md:block">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-gray-800 text-gray-400">
						<th class="px-5 py-3 text-left">Log ID</th>
						<th class="px-5 py-3 text-left">Actor</th>
						<th class="px-5 py-3 text-left">Action</th>
						<th class="px-5 py-3 text-left">Entity</th>
						{#if filter === 'reports'}
							<th class="px-5 py-3 text-left">Severity</th>
						{/if}
						{#if filter === 'account_deletions'}
							<th class="px-5 py-3 text-left">Reason</th>
						{/if}
						{#if filter === 'purchases'}
							<th class="px-5 py-3 text-left">Amount</th>
						{/if}
						{#if filter === 'subscriptions'}
							<th class="px-5 py-3 text-left">Plan</th>
						{/if}
						<th class="px-5 py-3 text-left">Status</th>
						<th class="px-5 py-3 text-left">Time</th>
					</tr>
				</thead>
				<tbody>
					{#each filtered as log}
						<tr class="border-b border-gray-800/50 transition-colors hover:bg-gray-800/30">
							<td class="px-5 py-3 font-mono text-xs text-gray-500">{log.id}</td>
							<td class="px-5 py-3 font-medium text-white">{log.actor}</td>
							<td class="px-5 py-3 text-gray-300">{log.action}</td>
							<td class="px-5 py-3 font-mono text-xs text-orange-400">{log.entity}</td>
							{#if filter === 'reports'}
								<td class="px-5 py-3"
									><span class={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${severityColors[log.severity]}`}
										>{log.severity}</span
									></td
								>
							{/if}
							{#if filter === 'account_deletions'}
								<td class="px-5 py-3 text-gray-400">{log.reason}</td>
							{/if}
							{#if filter === 'purchases'}
								<td class="px-5 py-3 font-bold text-green-400">{log.amount}</td>
							{/if}
							{#if filter === 'subscriptions'}
								<td class="px-5 py-3 text-blue-400">{log.plan}</td>
							{/if}
							<td class="px-5 py-3"
								><span class={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${statusColors[log.status]}`}
									>{log.status.replace('_', ' ')}</span
								></td
							>
							<td class="px-5 py-3 text-gray-400">{log.time}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
