import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { ServiceRepository } from './serviceRepository';
import { ProviderRepository } from './providerRepository';
import { TagRepository } from './tagRepository';
import { ServiceType, ProviderType } from '@OpsiMate/shared';

describe('ServiceRepository Performance Tests', () => {
	let db: Database.Database;
	let serviceRepo: ServiceRepository;
	let providerRepo: ProviderRepository;
	let tagRepo: TagRepository;
	const testProviderIds: number[] = [];
	const testServiceIds: number[] = [];
	const testTagIds: number[] = [];

	beforeAll(async () => {
		// Use in-memory database for testing
		db = new Database(':memory:');
		
		// Initialize tables
		await db.exec(`
			CREATE TABLE providers (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				provider_name TEXT NOT NULL,
				provider_ip TEXT,
				username TEXT,
				private_key_filename TEXT,
				password TEXT,
				ssh_port INTEGER,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				provider_type TEXT
			);
			
			CREATE TABLE services (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				provider_id INTEGER NOT NULL,
				service_name TEXT NOT NULL,
				service_ip TEXT,
				service_status TEXT DEFAULT 'unknown',
				service_type TEXT NOT NULL,
				container_details TEXT,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (provider_id) REFERENCES providers (id)
			);
			
			CREATE TABLE tags (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL UNIQUE,
				color TEXT,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP
			);
			
			CREATE TABLE service_tags (
				service_id INTEGER NOT NULL,
				tag_id INTEGER NOT NULL,
				PRIMARY KEY (service_id, tag_id),
				FOREIGN KEY (service_id) REFERENCES services (id),
				FOREIGN KEY (tag_id) REFERENCES tags (id)
			);
		`);

		serviceRepo = new ServiceRepository(db);
		providerRepo = new ProviderRepository(db);
		tagRepo = new TagRepository(db);

		// Create test data: 1 provider, 50 services, 5 tags
		const provider = await providerRepo.createProvider({
			name: 'Test Provider',
			providerIP: '192.168.1.1',
			username: 'test',
			password: 'testpass',
			SSHPort: 22,
			providerType: ProviderType.VM,
		});
		testProviderIds.push(provider.lastID);

		// Create 5 tags
		for (let i = 0; i < 5; i++) {
			const tag = await tagRepo.createTag({ name: `tag-${i}`, color: '#000000' });
			testTagIds.push(tag.lastID);
		}

		// Create 50 services, each with 2-3 tags
		for (let i = 0; i < 50; i++) {
			const service = await serviceRepo.createService({
				providerId: provider.lastID,
				name: `service-${i}`,
				serviceIP: `10.0.0.${i}`,
				serviceStatus: 'running',
				serviceType: ServiceType.SYSTEMD,
			});
			testServiceIds.push(service.lastID);

			// Assign 2-3 tags to each service
			const numTags = 2 + (i % 2); // 2 or 3 tags
			for (let j = 0; j < numTags; j++) {
				const tagId = testTagIds[j % testTagIds.length];
				await db.prepare('INSERT INTO service_tags (service_id, tag_id) VALUES (?, ?)').run(service.lastID, tagId);
			}
		}
	});

	afterAll(() => {
		db.close();
	});

	it('measures query performance in getServicesWithProvider', async () => {
		const startTime = performance.now();
		
		const services = await serviceRepo.getServicesWithProvider();
		
		const endTime = performance.now();
		const duration = endTime - startTime;

		expect(services).toHaveLength(50);
		expect(services[0].tags).toBeDefined();
		expect(services[0].tags.length).toBeGreaterThan(0);
		
		// Log performance metrics
		console.log(`\n[PERFORMANCE] getServicesWithProvider took ${duration.toFixed(2)}ms`);
		console.log(`[PERFORMANCE] Returned ${services.length} services`);
		console.log(`[PERFORMANCE] Average time per service: ${(duration / services.length).toFixed(2)}ms`);
		
		// With optimized query, should be fast (< 20ms for 50 services)
		expect(duration).toBeLessThan(100); // Should complete in under 100ms
	});
});
