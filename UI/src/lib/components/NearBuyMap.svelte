<script>
	import { onMount } from 'svelte';

	let {
		center = [80.2707, 13.0827],
		zoom = 12,
		theme = 'light',
		markers = [],
		interactive = true,
		showControls = true,
		showGeolocate = false,
		height = '300px',
		className = '',
		radiusKm = 0,
		radiusCenter = null,
		onMapReady = null,
		onMarkerClick = null,
		requestLocation = false,
		onLocationFound = null,
		routeStart = null,
		routeEnd = null
	} = $props();

	let container = $state(null);
	let map = $state(null);
	let mapLoaded = $state(false);
	let currentMarkers = [];
	let maplibreRef = null;

	// Fullscreen & filter state
	let isFullscreen = $state(false);
	let showFilters = $state(false);
	let mapTheme = $state('liberty'); // liberty | bright | dark | positron
	let showBuildings = $state(true);
	let showRoads = $state(true);
	let showWater = $state(true);
	let showLabels = $state(true);
	let showLanduse = $state(true);

	const themes = [
		{ id: 'liberty', label: 'Liberty', icon: '🗺️' },
		{ id: 'bright', label: 'Bright', icon: '☀️' },
		{ id: 'dark', label: 'Dark', icon: '🌙' },
		{ id: 'positron', label: 'Positron', icon: '⚪' }
	];

	// Layer categories and their matching layer id patterns
	const layerFilters = {
		buildings: { patterns: ['building'], label: 'Buildings', icon: '🏢' },
		roads: { patterns: ['road', 'highway', 'bridge', 'tunnel', 'path', 'street', 'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'link', 'service', 'track'], label: 'Roads', icon: '🛣️' },
		water: { patterns: ['water', 'river', 'lake', 'ocean', 'sea', 'stream', 'canal'], label: 'Water', icon: '🌊' },
		labels: { patterns: ['label', 'name', 'place', 'poi'], label: 'Labels', icon: '🏷️' },
		landuse: { patterns: ['landuse', 'landcover', 'park', 'grass', 'forest', 'wood', 'vegetation', 'scrub', 'sand', 'farmland'], label: 'Land Use', icon: '🌳' }
	};

	function getLayerVisibilityState(key) {
		switch(key) {
			case 'buildings': return showBuildings;
			case 'roads': return showRoads;
			case 'water': return showWater;
			case 'labels': return showLabels;
			case 'landuse': return showLanduse;
			default: return true;
		}
	}

	function toggleLayer(key) {
		switch(key) {
			case 'buildings': showBuildings = !showBuildings; break;
			case 'roads': showRoads = !showRoads; break;
			case 'water': showWater = !showWater; break;
			case 'labels': showLabels = !showLabels; break;
			case 'landuse': showLanduse = !showLanduse; break;
		}
		applyLayerVisibility(key);
	}

	function applyLayerVisibility(key) {
		if (!map) return;
		const visible = getLayerVisibilityState(key);
		const { patterns } = layerFilters[key];
		const layers = map.getStyle()?.layers || [];
		for (const layer of layers) {
			const lid = layer.id.toLowerCase();
			if (patterns.some(p => lid.includes(p))) {
				map.setLayoutProperty(layer.id, 'visibility', visible ? 'visible' : 'none');
			}
		}
	}

	function applyAllLayerVisibility() {
		for (const key of Object.keys(layerFilters)) {
			applyLayerVisibility(key);
		}
	}

	function changeTheme(newTheme) {
		mapTheme = newTheme;
		if (!map) return;
		const styleUrl = `https://tiles.openfreemap.org/styles/${newTheme}`;
		map.setStyle(styleUrl);
		map.once('styledata', () => {
			if (maplibreRef) syncMarkers(maplibreRef);
			// After style change all sources/layers are wiped — redraw radius with current values
			if (radiusKm > 0) drawRadius(radiusKm, radiusCenter || center);
			// Re-apply layer visibility after style change
			setTimeout(applyAllLayerVisibility, 300);
		});
	}

	function toggleFullscreen() {
		isFullscreen = !isFullscreen;
		// Let the DOM update, then resize the map
		setTimeout(() => {
			if (map) map.resize();
		}, 50);
	}

	function handleKeydown(e) {
		if (e.key === 'Escape' && isFullscreen) {
			isFullscreen = false;
			setTimeout(() => map?.resize(), 50);
		}
	}

	onMount(async () => {
		const maplibregl = (await import('maplibre-gl')).default;
		maplibreRef = maplibregl;
		await import('maplibre-gl/dist/maplibre-gl.css');

		// Detect dark mode for initial theme
		const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
		if (isDark) mapTheme = 'dark';

		const styleUrl = `https://tiles.openfreemap.org/styles/${mapTheme}`;

		map = new maplibregl.Map({
			container,
			style: styleUrl,
			center,
			zoom,
			interactive,
			maxBounds: [[60, 5], [100, 40]]
		});

		if (showControls && interactive) {
			map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
		}

		if (showGeolocate && interactive) {
			map.addControl(
				new maplibregl.GeolocateControl({
					positionOptions: { enableHighAccuracy: true },
					trackUserLocation: false,
					showUserHeading: false
				}),
				'top-right'
			);
		}

		map.on('load', () => {
			mapLoaded = true;
			syncMarkers(maplibregl);
			if (onMapReady) onMapReady(map);

			// Auto-request user location when requestLocation is enabled
			if (requestLocation && navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(
					(pos) => {
						const { latitude, longitude } = pos.coords;
						if (onLocationFound) onLocationFound({ lat: latitude, lng: longitude });
					},
					(err) => console.warn('Geolocation denied:', err.message),
					{ enableHighAccuracy: true, timeout: 10000 }
				);
			}
		});

		// Show/hide markers based on zoom level
		map.on('zoom', updateMarkerVisibility);

		return () => {
			currentMarkers.forEach((m) => m.remove());
			if (map) map.remove();
		};
	});

	// Minimum zoom level to show markers (street/neighbourhood level)
	const MARKER_MIN_ZOOM = 11;

	function syncMarkers(maplibregl) {
		if (!map || !maplibregl) return;

		// Clear old markers
		currentMarkers.forEach((m) => m.remove());
		currentMarkers = [];

		markers.forEach((m) => {
			// Create custom element for marker
			const el = document.createElement('div');

			if (m.type === 'user') {
				// Pulsing blue dot for user location
				el.className = 'nearbuy-pulse-dot';
			} else {
				// Orange pin for providers/businesses
				el.className = 'nearbuy-marker';
				el.innerHTML = `<div class="nearbuy-marker-inner">${m.label || m.name?.[0] || '📍'}</div>`;
			}

			const marker = new maplibregl.Marker({ element: el }).setLngLat([m.lng, m.lat]).addTo(map);

			if (m.popup) {
				const popup = new maplibregl.Popup({ offset: 20, maxWidth: '220px', closeButton: false }).setHTML(m.popup);
				marker.setPopup(popup);

				// Navigate on popup click (for business markers)
				if (onMarkerClick && m.id && m.type !== 'user') {
					popup.on('open', () => {
						const popupEl = popup.getElement();
						if (popupEl) {
							popupEl.style.cursor = 'pointer';
							popupEl.addEventListener('click', () => onMarkerClick(m));
						}
					});
				}
			}

			if (onMarkerClick && m.id && !m.popup) {
				el.addEventListener('click', () => onMarkerClick(m));
			}

			currentMarkers.push(marker);
		});

		// Apply initial visibility based on current zoom
		updateMarkerVisibility();
	}

	function updateMarkerVisibility() {
		if (!map) return;
		const currentZoom = map.getZoom();
		const visible = currentZoom >= MARKER_MIN_ZOOM;
		for (const m of currentMarkers) {
			m.getElement().style.display = visible ? '' : 'none';
		}
	}

	// Draw the radius circle with EXPLICIT arguments so the $effect below
	// can control exactly what values are used and when it re-runs.
	function drawRadius(km = radiusKm, rc = (radiusCenter || center)) {
		if (!map || !mapLoaded || !rc) return;

		const sourceId = 'radius-circle';

		// Remove circle when km is 0 or less
		if (km <= 0) {
			if (map.getLayer('radius-fill')) map.removeLayer('radius-fill');
			if (map.getLayer('radius-border')) map.removeLayer('radius-border');
			if (map.getSource(sourceId)) map.removeSource(sourceId);
			return;
		}

		const points = 64;
		const coords = [];
		const earthRadius = 6371;

		const rcClean = [Number(rc[0] || 80.2707), Number(rc[1] || 13.0827)];
		const kmClean = Number(km || 5);

		for (let i = 0; i < points; i++) {
			const angle = (i / points) * 2 * Math.PI;
			const lat = rcClean[1] + (kmClean / earthRadius) * (180 / Math.PI) * Math.sin(angle);
			const lng = rcClean[0] + ((kmClean / earthRadius) * (180 / Math.PI) * Math.cos(angle)) / Math.cos((rcClean[1] * Math.PI) / 180);
			coords.push([lng, lat]);
		}
		// Mapbox GL JS STRICTLY requires the first and last point of a polygon to be exactly identical
		if (coords.length > 0) coords.push([...coords[0]]);

		const geojson = {
			type: 'Feature',
			geometry: { type: 'Polygon', coordinates: [coords] }
		};

		if (map.getSource(sourceId)) {
			map.getSource(sourceId).setData(geojson);
		} else {
			map.addSource(sourceId, { type: 'geojson', data: geojson });
			map.addLayer({
				id: 'radius-fill',
				type: 'fill',
				source: sourceId,
				paint: { 'fill-color': '#f97316', 'fill-opacity': 0.08 }
			});
			map.addLayer({
				id: 'radius-border',
				type: 'line',
				source: sourceId,
				paint: { 'line-color': '#f97316', 'line-width': 2, 'line-dasharray': [3, 2], 'line-opacity': 0.5 }
			});
		}
	}

	// React to marker changes
	$effect(() => {
		if (map && markers) {
			import('maplibre-gl').then((mod) => syncMarkers(mod.default));
		}
	});

	// ─── RADIUS EFFECT ───────────────────────────────────────────────────────────
	// Explicitly capture ALL three props that affect the circle as local const
	// variables at the TOP of the effect body. This GUARANTEES Svelte 5 registers
	// each one as a reactive dependency, so the effect re-runs whenever:
	//   • The distance slider changes radiusKm
	//   • GPS resolves and radiusCenter updates to the real device location
	//   • The fallback center changes
	$effect(() => {
		if (!map || !mapLoaded) return;
		const km = radiusKm;              // track: slider changes
		const rc = radiusCenter;          // track: GPS / userLocation changes
		const c  = center;               // track: center fallback changes
		
		// Micro-delay helps Maplibre finish style compilation internally before we add custom sources
		setTimeout(() => {
			if (map.isStyleLoaded()) {
				drawRadius(km, rc || c);
			}
		}, 50);
	});

	// ─── CENTER FLY EFFECT ───────────────────────────────────────────────────────
	// Fly the map view when center changes (GPS update or prop change).
	// Also redraws the radius so the circle follows the new camera position.
	$effect(() => {
		if (!map || !center) return;
		try {
			// Unbox to a pure primitive array to avoid Svelte proxy issues in MapLibre!
			const pureCenter = [Number(center[0]), Number(center[1])];
			map.flyTo({ center: pureCenter, duration: 800 });
		} catch (e) {
			console.error('flyTo error', e);
		}
	});

	// ─── ROUTING EFFECT ──────────────────────────────────────────────────────────
	$effect(() => {
		if (!map || !mapLoaded) return;
		const start = routeStart;
		const end = routeEnd;
		
		let activeRouteIndex = 0;
		let routesData = [];

		function drawActiveRoutes() {
			if (!map.isStyleLoaded() || !routesData.length) return;

			// Clean up old instances cleanly
			const currentLayers = map.getStyle().layers.filter(l => l.id.startsWith('nearbuy-route-'));
			currentLayers.forEach(l => map.removeLayer(l.id));
			const currentSources = Object.keys(map.getStyle().sources).filter(s => s.startsWith('nearbuy-route-'));
			currentSources.forEach(s => map.removeSource(s));

			// Render inactive (so they are under the active one)
			routesData.forEach((route, index) => {
				if (index !== activeRouteIndex) addRouteLayer(route.geometry, index, false);
			});
			// Render active (so it's drawn last and on top)
			if (routesData[activeRouteIndex]) {
				addRouteLayer(routesData[activeRouteIndex].geometry, activeRouteIndex, true);
			}
		}

		function addRouteLayer(geometry, index, isActive) {
			const sourceId = `nearbuy-route-source-${index}`;
			const layerBaseId = `nearbuy-route-base-${index}`;
			const layerLineId = `nearbuy-route-line-${index}`;
			const layerClickId = `nearbuy-route-click-${index}`;

			map.addSource(sourceId, { type: 'geojson', data: { type: 'Feature', geometry } });
			
			// Background outline stroke
			map.addLayer({
				id: layerBaseId,
				type: 'line',
				source: sourceId,
				layout: { 'line-join': 'round', 'line-cap': 'round' },
				paint: { 'line-color': isActive ? '#000000' : '#475569', 'line-width': isActive ? 8 : 6, 'line-opacity': isActive ? 0.15 : 0.3 }
			});

			// Inner bright line
			map.addLayer({
				id: layerLineId,
				type: 'line',
				source: sourceId,
				layout: { 'line-join': 'round', 'line-cap': 'round' },
				paint: { 'line-color': isActive ? '#f97316' : '#94a3b8', 'line-width': isActive ? 4 : 3 }
			});

			// Invisible thicker clickable layer
			map.addLayer({
				id: layerClickId,
				type: 'line',
				source: sourceId,
				layout: { 'line-join': 'round', 'line-cap': 'round' },
				paint: { 'line-color': 'transparent', 'line-width': 25 }
			});
		}

		function routeClickHandler(e) {
			if (!routesData.length) return;
			const layersToQuery = routesData.map((_, i) => `nearbuy-route-click-${i}`);
			// Only query if these layers actually exist in map to prevent Maplibregl console errors
			const existingLayers = layersToQuery.filter(id => map.getLayer(id));
			if (!existingLayers.length) return;

			const features = map.queryRenderedFeatures(e.point, { layers: existingLayers });
			if (features.length) {
				const layerId = features[0].layer.id;
				const index = parseInt(layerId.replace('nearbuy-route-click-', ''), 10);
				if (index !== activeRouteIndex) {
					activeRouteIndex = index;
					drawActiveRoutes();
				}
			}
		}

		function routeHoverHandler(e) {
			if (!routesData.length) return;
			const layersToQuery = routesData.map((_, i) => `nearbuy-route-click-${i}`);
			const existingLayers = layersToQuery.filter(id => map.getLayer(id));
			if (!existingLayers.length) return;

			const features = map.queryRenderedFeatures(e.point, { layers: existingLayers });
			map.getCanvas().style.cursor = features.length ? 'pointer' : '';
		}

		async function fetchRoutes() {
			if (!map.isStyleLoaded()) return;

			// If start or end is missing, remove the routes from map
			if (!start || !end) {
				const layersToRemove = map.getStyle().layers.filter(l => l.id.startsWith('nearbuy-route-'));
				layersToRemove.forEach(l => map.removeLayer(l.id));
				const sourcesToRemove = Object.keys(map.getStyle().sources).filter(s => s.startsWith('nearbuy-route-'));
				sourcesToRemove.forEach(s => map.removeSource(s));
				routesData = [];
				return;
			}

			try {
				const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson&alternatives=3`);
				const data = await res.json();
				if (data.code !== 'Ok' || !data.routes || !data.routes.length) return;

				// OSRM snaps to the nearest road, which causes visual gaps at the ends near the exact markers.
				// We append the exact `start` and `end` point coords directly into the returned GeoJSON array to bridge that gap smoothly.
				routesData = data.routes.map(route => {
					if (route.geometry && route.geometry.coordinates) {
						route.geometry.coordinates = [
							[parseFloat(start[0]), parseFloat(start[1])],
							...route.geometry.coordinates,
							[parseFloat(end[0]), parseFloat(end[1])]
						];
					}
					return route;
				});
				
				activeRouteIndex = 0;
				drawActiveRoutes();

				// Fit bounds to show entire route neatly
				if (maplibreRef && routesData[0]) {
					const coordinates = routesData[0].geometry.coordinates;
					const bounds = coordinates.reduce((b, coord) => b.extend(coord), new maplibreRef.LngLatBounds(coordinates[0], coordinates[0]));
					map.fitBounds(bounds, { padding: 40 });
				}

			} catch (e) {
				console.error('Route fetch failed', e);
			}
		}

		// Bind global pointer events
		map.on('click', routeClickHandler);
		map.on('mousemove', routeHoverHandler);

		setTimeout(fetchRoutes, 50);

		return () => {
			if (map) {
				map.off('click', routeClickHandler);
				map.off('mousemove', routeHoverHandler);
			}
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="nearbuy-map-wrapper {className}"
	class:nearbuy-map-fullscreen={isFullscreen}
>
	<!-- Fullscreen Button -->
	{#if interactive}
		<button
			type="button"
			onclick={toggleFullscreen}
			class="nearbuy-map-btn nearbuy-fullscreen-btn"
			title={isFullscreen ? 'Exit fullscreen' : 'Open fullscreen'}
		>
			{#if isFullscreen}
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
			{/if}
		</button>
	{/if}

	<!-- Filter Toggle Button -->
	{#if interactive}
		<button
			type="button"
			onclick={() => showFilters = !showFilters}
			class="nearbuy-map-btn nearbuy-filter-btn"
			class:active={showFilters}
			title="Map filters"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
		</button>
	{/if}

	<!-- Filter Panel -->
	{#if showFilters}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="nearbuy-filter-panel" onclick={(e) => e.stopPropagation()}>
			<div class="nearbuy-filter-section">
				<p class="nearbuy-filter-title">Theme</p>
				<div class="nearbuy-theme-grid">
					{#each themes as t}
						<button
							type="button"
							onclick={() => changeTheme(t.id)}
							class="nearbuy-theme-chip"
							class:active={mapTheme === t.id}
						>
							<span>{t.icon}</span>
							<span>{t.label}</span>
						</button>
					{/each}
				</div>
			</div>

			<div class="nearbuy-filter-section">
				<p class="nearbuy-filter-title">Layers</p>
				<div class="nearbuy-layer-list">
					{#each Object.entries(layerFilters) as [key, { label, icon }]}
						<button
							type="button"
							onclick={() => toggleLayer(key)}
							class="nearbuy-layer-chip"
							class:active={getLayerVisibilityState(key)}
						>
							<span>{icon}</span>
							<span>{label}</span>
							<span class="nearbuy-layer-toggle">{getLayerVisibilityState(key) ? '✓' : '✕'}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Map Container -->
	<div
		bind:this={container}
		class="nearbuy-map-container"
		style="width:100%;height:{isFullscreen ? '100%' : height};"
	></div>
</div>

<style>
	.nearbuy-map-wrapper {
		position: relative;
		border-radius: 16px;
		overflow: hidden;
		height: 100%;
	}

	.nearbuy-map-fullscreen {
		position: fixed !important;
		inset: 0;
		z-index: 9999;
		border-radius: 0;
		background: white;
	}

	.nearbuy-map-container {
		position: relative;
		width: 100%;
	}

	/* Shared button base */
	.nearbuy-map-btn {
		position: absolute;
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 8px;
		border: none;
		background: white;
		color: #374151;
		box-shadow: 0 1px 4px rgba(0,0,0,0.15);
		cursor: pointer;
		transition: all 0.15s;
	}
	.nearbuy-map-btn:hover { background: #f3f4f6; }

	.nearbuy-fullscreen-btn {
		bottom: 12px;
		left: 12px;
	}

	.nearbuy-filter-btn {
		bottom: 12px;
		left: 52px;
	}
	.nearbuy-filter-btn.active {
		background: #f97316;
		color: white;
	}

	/* Filter Panel */
	.nearbuy-filter-panel {
		position: absolute;
		bottom: 52px;
		left: 12px;
		z-index: 20;
		background: white;
		border-radius: 14px;
		box-shadow: 0 4px 24px rgba(0,0,0,0.15);
		padding: 12px;
		min-width: 220px;
		max-height: 320px;
		overflow-y: auto;
	}

	.nearbuy-filter-section {
		margin-bottom: 10px;
	}
	.nearbuy-filter-section:last-child {
		margin-bottom: 0;
	}

	.nearbuy-filter-title {
		font-size: 10px;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #9ca3af;
		margin-bottom: 6px;
	}

	/* Theme grid */
	.nearbuy-theme-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 5px;
	}

	.nearbuy-theme-chip {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 6px 10px;
		border-radius: 10px;
		border: 2px solid #e5e7eb;
		background: white;
		font-size: 12px;
		font-weight: 600;
		color: #4b5563;
		cursor: pointer;
		transition: all 0.15s;
	}
	.nearbuy-theme-chip:hover { border-color: #f97316; color: #f97316; }
	.nearbuy-theme-chip.active {
		border-color: #f97316;
		background: #fff7ed;
		color: #ea580c;
	}

	/* Layer list */
	.nearbuy-layer-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.nearbuy-layer-chip {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 10px;
		border-radius: 10px;
		border: 1.5px solid #e5e7eb;
		background: white;
		font-size: 12px;
		font-weight: 600;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.15s;
	}
	.nearbuy-layer-chip:hover { border-color: #d1d5db; }
	.nearbuy-layer-chip.active {
		border-color: #86efac;
		background: #f0fdf4;
		color: #15803d;
	}

	.nearbuy-layer-toggle {
		margin-left: auto;
		font-size: 11px;
		font-weight: 800;
	}
	.nearbuy-layer-chip.active .nearbuy-layer-toggle { color: #16a34a; }
	.nearbuy-layer-chip:not(.active) .nearbuy-layer-toggle { color: #d1d5db; }

	/* Dark mode overrides */
	:global(.dark) .nearbuy-map-fullscreen { background: #0a0a0a; }
	:global(.dark) .nearbuy-map-btn { background: #1f2937; color: #d1d5db; }
	:global(.dark) .nearbuy-map-btn:hover { background: #374151; }
	:global(.dark) .nearbuy-filter-btn.active { background: #f97316; color: white; }
	:global(.dark) .nearbuy-filter-panel { background: #111827; }
	:global(.dark) .nearbuy-filter-title { color: #6b7280; }
	:global(.dark) .nearbuy-theme-chip { border-color: #374151; background: #1f2937; color: #9ca3af; }
	:global(.dark) .nearbuy-theme-chip:hover { border-color: #f97316; color: #f97316; }
	:global(.dark) .nearbuy-theme-chip.active { border-color: #f97316; background: #431407; color: #fb923c; }
	:global(.dark) .nearbuy-layer-chip { border-color: #374151; background: #1f2937; color: #9ca3af; }
	:global(.dark) .nearbuy-layer-chip.active { border-color: #166534; background: #052e16; color: #4ade80; }
	:global(.dark) .nearbuy-layer-chip:not(.active) .nearbuy-layer-toggle { color: #4b5563; }

	:global(.nearbuy-pulse-dot) {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #3b82f6;
		box-shadow: 0 0 0 3px white, 0 0 10px rgba(59, 130, 246, 0.5);
		cursor: pointer;
		position: relative;
	}
	:global(.nearbuy-pulse-dot::after) {
		content: '';
		position: absolute;
		inset: -6px;
		border-radius: 50%;
		border: 2px solid #3b82f6;
		animation: nearbuy-pulse 1.5s ease-out infinite;
	}

	:global(.nearbuy-marker) {
		cursor: pointer;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
	}
	:global(.nearbuy-marker-inner) {
		width: 36px;
		height: 36px;
		border-radius: 50% 50% 50% 0;
		background: #f97316;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: 700;
		font-size: 13px;
		transform: rotate(-45deg);
		border: 3px solid white;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}
	:global(.nearbuy-marker-inner > *) {
		transform: rotate(45deg);
	}

	@keyframes nearbuy-pulse {
		0% {
			transform: scale(0.8);
			opacity: 0.8;
		}
		100% {
			transform: scale(2);
			opacity: 0;
		}
	}

	:global(.maplibregl-popup-content) {
		border-radius: 12px !important;
		padding: 10px 14px !important;
		font-family: inherit !important;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12) !important;
	}
	:global(.maplibregl-popup-tip) {
		border-top-color: white !important;
	}
</style>
