import 'dotenv/config';

async function main() {
    const baseUrl = process.env.EMPLANNER_API_URL!;
    const username = process.env.EMPLANNER_USERNAME!;
    const password = process.env.EMPLANNER_PASSWORD!;

    // Get token
    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
    const tokenRes = await fetch(`${baseUrl}/rest/v3/user/me/token?type=WEB_SESSION`, {
        headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
    });
    const tokenData = await tokenRes.json() as any;
    const token = tokenData.details.encodedToken;

    // Fetch single user with all fields
    const userRes = await fetch(`${baseUrl}/rest/v3/user/631c58d75d8e0655c04c7cf2`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    const userData = await userRes.json() as any;
    
    console.log('=== ALL FIELDS FROM EMPLANNER API ===');
    console.log(JSON.stringify(userData, null, 2));
    
    // Also check paginated endpoint fields
    const listRes = await fetch(`${baseUrl}/rest/v3/user?p.pageSize=1&p.sortBy=firstName&p.order=asc&p.pageIndex=0&productionAccess=HAVE_ACCESS`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    const listData = await listRes.json() as any;
    const firstUser = listData.details.list[0];
    console.log('\n=== FIELDS IN PAGINATED LIST ===');
    console.log(Object.keys(firstUser).join(', '));
    console.log('\nFull first user:');
    console.log(JSON.stringify(firstUser, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
