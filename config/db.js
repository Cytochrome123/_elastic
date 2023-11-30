const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient()

async function db() {
    try {
        // connect to the database
        await prisma.$connect();

        process.env.NODE_ENV !== "production" ? console.log('connected to db successfully') : null;

    } catch (e) {
        console.error(e)
        await prisma.$disconnect()
        console.log('disconnected');
        process.exit(1)
    }
}

module.exports = db;
// export default db;