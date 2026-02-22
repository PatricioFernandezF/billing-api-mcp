import { spawn } from 'child_process';
import { resolve } from 'path';

const mcpProcess = spawn('node', ['index.js'], {
    cwd: 'c:\\Users\\Patricio\\Downloads\\Billing-API\\billing-api-mcp',
    stdio: ['pipe', 'pipe', 'inherit']
});

mcpProcess.stdout.on('data', (data) => {
    console.log(`STDOUT: ${data.toString()}`);
});

mcpProcess.on('exit', (code) => {
    console.log(`Process exited with code ${code}`);
});

const req = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
        name: 'billing_create_invoice',
        arguments: { client_id: 49, date: '2026-02-22' }
    }
};

const msg = JSON.stringify(req) + '\n';
console.log('Sending:', msg);
mcpProcess.stdin.write(msg);
