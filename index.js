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
      {
        name: "billing_create_line_item",
        description: "Add a line item to an invoice",
        inputSchema: {
          type: "object",
          properties: {
            invoice_id: { type: "number" },
            product_id: { type: "number" },
            description: { type: "string" },
            quantity: { type: "number" },
            unit_price: { type: "number" },
            tax_rate: { type: "number" }
          },
          required: ["invoice_id", "description", "quantity", "unit_price"],
        },
      },
      {
        name: "billing_get_top_products",
        description: "Get the most sold products",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "billing_download_invoice_pdf",
        description: "Download the PDF of an invoice to a specific path",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number" },
            output_path: { type: "string" }
          },
          required: ["id", "output_path"],
        },
      }
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
    let respText = "";
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      respText = JSON.stringify(data, null, 2);
    } else {
      respText = await response.text();
    }

    // DEBUG LOG
    const fs = await import("fs");
    fs.appendFileSync("C:/Users/Patricio/Downloads/Billing-API/debug_mcp.log", `[${method}] ${url}\nBODY: ${JSON.stringify(body)}\nSTATUS: ${response.status}\nRESP: ${respText}\n\n`);

    if (!response.ok) {
      return `Error: ${response.status} - ${respText}`;
    }

    return respText;
  } catch (err) {
    return `Error connecting to API: ${err.message}`;
  }
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (args && 'waitForPreviousTools' in args) {
    delete args.waitForPreviousTools;
  }

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
        result = "DEBUG_ARGS: " + JSON.stringify(args);
        // result = await makeRequest("/invoices", "POST", args);
        break;
      case "billing_create_line_item":
        result = await makeRequest("/line-items", "POST", args);
        break;
      case "billing_get_top_products":
        result = await makeRequest("/reports/products");
        break;
      case "billing_download_invoice_pdf":
        const fs = await import("fs");
        const pdfUrl = `${BASE_URL}/invoices/${args.id}/pdf`;
        const resp = await fetch(pdfUrl);
        if (!resp.ok) {
          throw new Error(`Failed to download PDF: ${resp.status} ${resp.statusText}`);
        }
        const buffer = await resp.arrayBuffer();
        fs.writeFileSync(args.output_path, Buffer.from(buffer));
        result = `PDF successfully saved to ${args.output_path}`;
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
