const si = require('systeminformation');

async function test() {
    console.log('--- SYSTEM CHECK ---');
    try {
        const temp = await si.cpuTemperature();
        console.log('CPU Temp:', JSON.stringify(temp));
        
        const mem = await si.mem();
        console.log('Memory:', JSON.stringify({
            total: mem.total,
            free: mem.free,
            used: mem.used
        }));
        
        const load = await si.currentLoad();
        console.log('Load:', load.currentLoad);

        const graphics = await si.graphics();
        console.log('Graphics:', JSON.stringify(graphics.controllers));

    } catch (e) {
        console.error('DIAGNOSTIC ERROR:', e);
    }
}

test();
