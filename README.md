# TraceLens 🔍

**Investigate website domains with DNS and HTTPS/TLS checks — directly in ChatGPT.**

TraceLens is an MCP-powered domain investigation tool built with **NitroStack**. It helps users inspect important technical details about a website domain without having to run multiple commands or visit different tools.

Enter a domain such as `github.com`, and TraceLens gathers DNS information and checks its HTTPS/TLS certificate, presenting the findings in an easy-to-understand format.

## 🚀 Why TraceLens?

When investigating a website, it can be difficult to find and understand its DNS configuration and HTTPS certificate information in one place.

TraceLens brings these checks together through the Model Context Protocol (MCP), allowing users to investigate domains from within ChatGPT.

It makes technical domain information easier to access and understand.

## ✨ Features

- **DNS Lookup:** Retrieves available DNS records, including A, AAAA, MX, NS, and TXT records.
- **HTTPS/TLS Certificate Check:** Inspects a domain's TLS certificate.
- **Certificate Validation Details:** Reports certificate validity, authorization status, issuer, and expiry information when available.
- **Easy-to-Understand Results:** Presents technical findings in a structured format.
- **Error Handling:** Handles invalid domains and incomplete lookup results.
- **MCP Integration:** Makes domain investigation available directly through ChatGPT.

## 🛠️ How It Works

TraceLens uses an MCP tool called `investigate_domain`.

1. The user provides a domain name.
2. TraceLens performs DNS record lookups.
3. It checks the domain's HTTPS/TLS certificate.
4. The tool gathers the available results.
5. The findings are returned to ChatGPT for presentation.

## 💡 Example

Try asking ChatGPT:

> Use TraceLens to investigate github.com.

TraceLens can return information such as:

- DNS records and their available values
- IPv4 and IPv6 address information
- Mail exchange and name server records
- TXT records
- TLS certificate issuer and expiry date
- Certificate validity and authorization status

You can also try `example.com` or an invalid domain to see how TraceLens handles different results.

## 🧰 Technology Stack

- **NitroStack** — Building the MCP application and dashboard
- **Model Context Protocol (MCP)** — Connecting TraceLens with ChatGPT
- **NitroCloud** — Hosting and deployment
- **ChatGPT** — Interacting with the domain investigation tool
- **GitHub** — Source code and project version control

## 🌐 Try TraceLens

**Live deployment:**  
https://tracelens-6ae5f867-saniya-rawal-fronthyre.app.nitrocloud.ai/

**GitHub repository:**  
https://github.com/saniyarawal/tracelens-mcp

TraceLens is connected to ChatGPT as a custom MCP app. Once the app is available in your ChatGPT environment, you can ask it to investigate a domain using the `investigate_domain` tool.

## 🔐 Important Notes

TraceLens provides technical observations about DNS records and HTTPS/TLS certificates. These results are useful for domain investigation, but they do not guarantee that a website is safe, trustworthy, or malicious.

DNS records may be unavailable, incomplete, or configured differently depending on the domain. Certificate validity alone does not establish the trustworthiness of a website.

## 🎯 Project Goal

The goal of TraceLens is to make basic domain investigation simpler and more accessible by bringing DNS and HTTPS/TLS checks into an AI-powered workflow.

Instead of switching between multiple tools, users can request a domain investigation directly through ChatGPT.

---

**Built with NitroStack for the NitroStack Hackathon 2026.** 🚀
