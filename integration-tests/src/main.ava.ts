import { Worker, NearAccount } from 'near-workspaces';
import anyTest, { TestFn } from 'ava';

const test = anyTest as TestFn<{
    worker: Worker;
    accounts: Record<string, NearAccount>;
}>;

test.beforeEach(async (t) => {
    // Init the worker and start a Sandbox server
    const worker = await Worker.init();

    // Deploy contract
    const root = worker.rootAccount;
    const contract = await root.createSubAccount('test-account');

    // Test users
    const ali = await root.createSubAccount('ali');
    const bob = await root.createSubAccount('bob');

    // Get wasm file path from package.json test script in folder above
    await contract.deploy(process.argv[2]);

    // Save state for test runs, it is unique for each test
    t.context.worker = worker;
    t.context.accounts = { root, contract, ali, bob };
});

test.afterEach(async (t) => {
    // Stop Sandbox server
    await t.context.worker.tearDown().catch((error) => {
        console.log('Failed to stop the Sandbox:', error);
    });
});

test('gets the supporters count of each faction', async (t) => {
    const { contract, ali, bob } = t.context.accounts;
    let supportersSquare: number = await contract.view('get_supporters_square', {});
    t.is(supportersSquare, 0);
    let supportersCircle: number = await contract.view('get_supporters_circle', {});
    t.is(supportersCircle, 0);
    let supportersTriangle: number = await contract.view('get_supporters_triangle', {});
    t.is(supportersTriangle, 0);
});

test("add support from different users", async (t) => {
    const { contract, ali, bob } = t.context.accounts;
    await ali.call(contract, "add_support", { support: 10, faction: 1 });
    let supportersSquare = await contract.view("get_supporters_square", {});
    t.is(supportersSquare, 10);

    await bob.call(contract, "add_support", { support: 9999, faction: 2 });
    let supportersCircle = await contract.view('get_supporters_circle', {});
    t.is(supportersCircle, 0);

    await bob.call(contract, "add_support", { support: 50, faction: 3 });
    let supportersTriangle = await contract.view('get_supporters_triangle', {});
    t.is(supportersTriangle, 50);

    let aliData = await contract.view("get_user_support_data", { account: "ali.test.near" });
    let parsedAliData = JSON.parse(JSON.stringify(aliData));
    console.log(parsedAliData);
    t.is(parsedAliData.support_square, 10);
    t.is(parsedAliData.support_circle, 0);
    t.is(parsedAliData.support_triangle, 0);
    
    let bobData = await contract.view("get_user_support_data", { account: "bob.test.near" });
    let parsedBobData = JSON.parse(JSON.stringify(bobData));
    console.log(parsedBobData);
    t.is(parsedBobData.support_square, 0);
    t.is(parsedBobData.support_circle, 0);
    t.is(parsedBobData.support_triangle, 50);

    await bob.call(contract, "add_support", { support: 15, faction: 2 });
    bobData = await contract.view("get_user_support_data", { account: "bob.test.near" });
    parsedBobData = JSON.parse(JSON.stringify(bobData));
    console.log(parsedBobData);
    t.is(parsedBobData.support_circle, 15);
});

test('gets the list of messages at the starting point, then adds a messages', async (t) => {
    const { root, contract, ali, bob } = t.context.accounts;
    let messagesStart: Array<string> = await contract.view('get_messages_start', {});
    t.is(messagesStart.length, 0);

    await ali.call(contract, 'add_message_start', { message: "This is ali" });
    messagesStart = await contract.view('get_messages_start', {});
    t.is(messagesStart.length, 1);
    t.is(messagesStart[0], "This is ali");
});

/*test('add many messages', async (t) => {
    const { root, contract, ali, bob } = t.context.accounts;
    let messagesStart: Array<string> = await contract.view('get_messages_start', {});
    t.is(messagesStart.length, 0);
    for(let i = 0; i < 21; i++){
        await ali.call(contract, 'add_message_start', { message: "Message #" + i + " from ali"});
    }
    await bob.call(contract, 'add_message_start', { message: "Message #1 from bob"});
    messagesStart = await contract.view('get_messages_start', {});
    t.is(messagesStart.length, 20);
    t.is(messagesStart[0], "Message #20 from ali");
    t.is(messagesStart[1], "Message #1 from bob");
});*/