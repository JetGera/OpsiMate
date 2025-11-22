/**
 * Performance Benchmark Script
 * Run with: npx tsx apps/server/src/dal/benchmark.ts
 * 
 * This script measures the performance improvement from fixing the N+1 query bottleneck
 */

import Database from 'better-sqlite3';
import { ServiceRepository } from './serviceRepository';
import { ProviderRepository } from './providerRepository';
import { TagRepository } from './tagRepository';
import { ServiceType, ProviderType } from '@OpsiMate/shared';
import { initializeDb } from './db';

async function benchmark() {
	console.log('🚀 Starting Performance Benchmark...\n');

	// Use actual database or in-memory for testing
	const db = initializeDb();
	
	const serviceRepo = new ServiceRepository(db);
	const providerRepo = new ProviderRepository(db);
	const tagRepo = new TagRepository(db);

	// Clean up any existing benchmark data
	console.log('🧹 Cleaning up existing benchmark data...');
	const existingProvider = db.prepare('SELECT id FROM providers WHERE provider_name = ?').get('Benchmark Provider') as { id: number } | undefined;
	if (existingProvider) {
		await providerRepo.deleteProvider(existingProvider.id);
		console.log('   Deleted existing benchmark provider');
	}

	// Delete any orphaned benchmark services (services with names like "service-0", "service-1", etc.)
	db.prepare("DELETE FROM services WHERE service_name LIKE 'service-%'").run();
	
	// Delete benchmark tags if they exist
	for (let i = 0; i < 5; i++) {
		db.prepare('DELETE FROM tags WHERE name = ?').run(`tag-${i}`);
	}
	console.log('   Cleaned up benchmark data\n');

	// Setup test data
	console.log('📊 Setting up test data...');
	const provider = await providerRepo.createProvider({
		name: 'Benchmark Provider',
		providerIP: '192.168.1.1',
		username: 'test',
		password: 'testpass',
		SSHPort: 22,
		providerType: ProviderType.VM,
	});

	// Create 5 tags
	const tagIds: number[] = [];
	for (let i = 0; i < 5; i++) {
		const tag = await tagRepo.createTag({ name: `tag-${i}`, color: '#000000' });
		tagIds.push(tag.lastID);
	}

	// Create 100 services with tags
	const serviceIds: number[] = [];
	for (let i = 0; i < 100; i++) {
		const service = await serviceRepo.createService({
			providerId: provider.lastID,
			name: `service-${i}`,
			serviceIP: `10.0.0.${i}`,
			serviceStatus: 'running',
			serviceType: ServiceType.SYSTEMD,
		});
		serviceIds.push(service.lastID);

		// Assign 2-3 tags to each service
		const numTags = 2 + (i % 2);
		for (let j = 0; j < numTags; j++) {
			const tagId = tagIds[j % tagIds.length];
			db.prepare('INSERT OR IGNORE INTO service_tags (service_id, tag_id) VALUES (?, ?)').run(service.lastID, tagId);
		}
	}

	console.log(`✅ Created ${serviceIds.length} services with tags\n`);

	// Benchmark the optimized query
	console.log('⏱️  Measuring optimized getServicesWithProvider()...');
	const iterations = 10;
	const times: number[] = [];

	for (let i = 0; i < iterations; i++) {
		const startTime = performance.now();
		const services = await serviceRepo.getServicesWithProvider();
		const endTime = performance.now();
		const duration = endTime - startTime;
		times.push(duration);
		
		if (i === 0) {
			console.log(`   First run: ${duration.toFixed(2)}ms (${services.length} services, ${services[0]?.tags?.length || 0} tags each)`);
		}
	}

	const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
	const minTime = Math.min(...times);
	const maxTime = Math.max(...times);

	console.log(`\n📈 Performance Results:`);
	console.log(`   Average: ${avgTime.toFixed(2)}ms`);
	console.log(`   Min: ${minTime.toFixed(2)}ms`);
	console.log(`   Max: ${maxTime.toFixed(2)}ms`);
	console.log(`   Throughput: ${((serviceIds.length * iterations) / (times.reduce((a, b) => a + b, 0) / 1000)).toFixed(0)} services/second`);

	// Cleanup
	db.close();
	console.log('\n✅ Benchmark complete!');
}

benchmark().catch(console.error);

