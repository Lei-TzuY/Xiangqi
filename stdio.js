import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createXiangqiServer } from "./src/mcp-server.js";

const server = createXiangqiServer();
const transport = new StdioServerTransport();
await server.connect(transport);
