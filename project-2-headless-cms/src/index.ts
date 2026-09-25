import { createServer } from './server.js';
import { env } from './config/env.js';

async function main() {
  try {
    const server = await createServer();
    await server.listen({
      port: env.PORT,
      host: env.HOST,
    });

    console.log(`🚀 Headless CMS server running at http://${env.HOST}:${env.PORT}`);
    console.log(`🧭 GraphiQL Explorer available at http://${env.HOST}:${env.PORT}/graphql`);
    console.log(`📁 Media upload endpoint: http://${env.HOST}:${env.PORT}/api/upload`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

main();
