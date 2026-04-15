import PocketBase from 'pocketbase';

const adminEmail = process.env.PB_ADMIN_EMAIL;
const adminPassword = process.env.PB_ADMIN_PASSWORD;
const pbUrl = process.env.PB_URL || 'https://pb.eggoworld.io';

if (!adminEmail || !adminPassword) {
  console.error('Set PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD env vars');
  console.log('Usage: PB_ADMIN_EMAIL=x PB_ADMIN_PASSWORD=y bun run scripts/create-test-listings.ts');
  process.exit(1);
}

const pb = new PocketBase(pbUrl);

async function main() {
  try {
    await pb.admins.authWithPassword(adminEmail, adminPassword);
    
    const users = await pb.collection('users').getList(1, 1, { sort: '-created' });
    if (users.items.length === 0) {
      console.error('No users found - create a test user first');
      process.exit(1);
    }
    
    const sellerId = users.items[0].id;
    const listings = [
      { nft_id: '1', nft_type: 'Egg', name: 'Egg NFT #1', rarity: 'Common', price: 100, seller: sellerId, status: 'active' },
      { nft_id: '2', nft_type: 'Egg', name: 'Egg NFT #2', rarity: 'Rare', price: 150, seller: sellerId, status: 'active' },
      { nft_id: '3', nft_type: 'Egg', name: 'Egg NFT #3', rarity: 'Epic', price: 200, seller: sellerId, status: 'active' },
    ];

    for (const listing of listings) {
      try {
        const record = await pb.collection('marketplace_listings').create(listing);
        console.log(`Created: ${record.name}`);
      } catch (err: any) {
        console.error(`Failed: ${listing.name} - ${err.message}`);
      }
    }

    console.log('\nDone! Check http://localhost:3000/marketplace');
  } catch (err: any) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
