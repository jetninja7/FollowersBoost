import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local first, then .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { prisma } from './src/lib/db/prisma.js';

async function updatePrices() {
  console.log('📊 Updating service prices...\n');

  // Price per unit:
  // Likes: $0.05 per like (100 = $5)
  // Comments: $0.10 per comment (100 = $10)
  // Followers: $0.15 per follower (100 = $15)

  const priceRules = {
    followers: 0.15, // $15 per 100
    likes: 0.05,     // $5 per 100
    comments: 0.10,  // $10 per 100
    views: 0.03,     // $3 per 100
    subscribers: 0.20, // $20 per 100
    shares: 0.08,    // $8 per 100
    retweets: 0.08,  // $8 per 100
    saves: 0.06,     // $6 per 100
  };

  try {
    // Get all services
    const services = await prisma.service.findMany({
      include: {
        category: {
          include: {
            platform: true,
          },
        },
      },
    });

    console.log(`Found ${services.length} services to update\n`);

    for (const service of services) {
      const serviceName = service.name.toLowerCase();
      let newPrice = 0.01; // default price

      // Determine price based on service type
      if (serviceName.includes('follower')) {
        newPrice = priceRules.followers;
      } else if (serviceName.includes('like')) {
        newPrice = priceRules.likes;
      } else if (serviceName.includes('comment')) {
        newPrice = priceRules.comments;
      } else if (serviceName.includes('view')) {
        newPrice = priceRules.views;
      } else if (serviceName.includes('subscriber')) {
        newPrice = priceRules.subscribers;
      } else if (serviceName.includes('share')) {
        newPrice = priceRules.shares;
      } else if (serviceName.includes('retweet')) {
        newPrice = priceRules.retweets;
      } else if (serviceName.includes('save')) {
        newPrice = priceRules.saves;
      }

      const oldPrice = Number(service.price);

      await prisma.service.update({
        where: { id: service.id },
        data: { price: newPrice },
      });

      console.log(`✅ ${service.category.platform.name} - ${service.name}`);
      console.log(`   Old: $${oldPrice.toFixed(4)} → New: $${newPrice.toFixed(4)} per unit`);
      console.log(`   Example: 100 units = $${(newPrice * 100).toFixed(2)}\n`);
    }

    console.log('✅ All prices updated successfully!');
    console.log('\n📊 Price Summary:');
    console.log('- Followers: $0.15/each (100 = $15)');
    console.log('- Comments: $0.10/each (100 = $10)');
    console.log('- Likes: $0.05/each (100 = $5)');
    console.log('- Views: $0.03/each (100 = $3)');
    console.log('- Subscribers: $0.20/each (100 = $20)');
    console.log('- Shares: $0.08/each (100 = $8)');

  } catch (error) {
    console.error('❌ Error updating prices:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updatePrices();
