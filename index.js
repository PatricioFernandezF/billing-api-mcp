#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const BASE_URL = "https://m4g4k88cgww0c4o0oc48884s.37.60.236.102.sslip.io/api";

const server = new Server(
  {
    name: "billing-api-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "billing_get_stats",
        description: "Get the dashboard statistics for the billing system",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "billing_list_clients",
        description: "List all clients",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "billing_get_client",
        description: "Get a specific client by ID",
        inputSchema: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
      },
      {
        name: "billing_create_client",
        description: "Create a new client",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string" },
            tax_id: { type: "string" },
          },
          required: ["name"],
        },
      },
      {
        name: "billing_list_products",
        description: "List all products",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "billing_list_invoices",
        description: "List all invoices",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "billing_get_invoice",
        description: "Get a specific invoice by ID",
        inputSchema: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
      },
      {
        name: "billing_create_invoice",
        description: "Create a new invoice",
        inputSchema: {
          type: "object",
          properties: {
            client_id: { type: "number" },
            date: { type: "string", description: "YYYY-MM-DD" },
            due_date: { type: "string", description: "YYYY-MM-DD" },
            notes: { type: "string" },
          },
          required: ["client_id", "date"],
        },
      },
    ],
  };
});

async function makeRequest(endpoint, method = "GET", body = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get("content-type");
    if (!response.ok) {
      let errText = "Unknown error";
      if (contentType && contentType.includes("application/json")) {
        errText = JSON.stringify(await response.json());
      } else {
        errText = await response.text();
      }
      return `Error: ${response.status} - ${errText}`;
    }

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return JSON.stringify(data, null, 2);
    }
    return await response.text();
  } catch (err) {
    return `Error connecting to API: ${err.message}`;
  }
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  let result = "";
  try {
    switch (name) {
      case "billing_get_stats":
        result = await makeRequest("/stats");
        break;
      case "billing_list_clients":
        result = await makeRequest("/clients");
        break;
      case "billing_get_client":
        result = await makeRequest(`/clients/${args.id}`);
        break;
      case "billing_create_client":
        result = await makeRequest("/clients", "POST", args);
        break;
      case "billing_list_products":
        result = await makeRequest("/products");
        break;
      case "billing_list_invoices":
        result = await makeRequest("/invoices");
        break;
      case "billing_get_invoice":
        result = await makeRequest(`/invoices/${args.id}`);
        break;
      case "billing_create_invoice":
        result = await makeRequest("/invoices", "POST", args);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  } catch (err) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: err.message,
        },
      ],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Billing API MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
