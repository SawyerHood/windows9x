import { createScriptClient } from "./lib/scriptClient";

const client = createScriptClient();

// Read the ID from command line arguments
const id = process.argv[2];

if (!id) {
  console.error("Please provide a user ID as a command line argument.");
  process.exit(1);
}

const { data } = await client.auth.admin.getUserById(id);

console.log(data?.user?.email);
