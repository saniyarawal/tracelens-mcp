import {
  ToolDecorator as Tool,
  Widget,
  ExecutionContext,
  z
} from '@nitrostack/core';

import * as dns from 'node:dns/promises';
import * as tls from 'node:tls';
import * as net from 'node:net';

/* ---------------------------------
   DNS RECORD HELPER
--------------------------------- */

async function getRecord(
  lookup: () => Promise<any>
): Promise<any> {
  try {
    return await lookup();
  } catch (error: any) {
    return {
      unavailable: true,
      reason: error.code || error.message || 'Lookup failed'
    };
  }
}

/* ---------------------------------
   PUBLIC IP ADDRESS VALIDATION
--------------------------------- */

function isPublicAddress(address: string): boolean {
  const family = net.isIP(address);

  if (family === 4) {
    const parts = address.split('.').map(Number);
    const [a, b, c] = parts;

    // Unspecified, private and loopback
    if (a === 0 || a === 10 || a === 127) return false;

    // Carrier-grade NAT
    if (a === 100 && b >= 64 && b <= 127) return false;

    // Link-local
    if (a === 169 && b === 254) return false;

    // Private networks
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;

    // Special-purpose and documentation ranges
    if (a === 192 && b === 0 && c === 0) return false;
    if (a === 192 && b === 0 && c === 2) return false;
    if (a === 192 && b === 88 && c === 99) return false;
    if (a === 198 && (b === 18 || b === 19)) return false;
    if (a === 198 && b === 51 && c === 100) return false;
    if (a === 203 && b === 0 && c === 113) return false;

    // Multicast and reserved addresses
    if (a >= 224) return false;

    return true;
  }

  if (family === 6) {
    const ip = address.toLowerCase();

    // Only allow global unicast IPv6 addresses (2000::/3).
    const firstGroup = parseInt(ip.split(':')[0] || '0', 16);

    if (firstGroup < 0x2000 || firstGroup > 0x3fff) {
      return false;
    }

    // Reject IPv4-mapped addresses
    if (ip.startsWith('::ffff:')) return false;

    // Reject documentation and special transition ranges
    if (ip.startsWith('2001:db8:')) return false;
    if (ip.startsWith('2002:')) return false;
    if (ip.startsWith('3fff:')) return false;

    return true;
  }

  return false;
}

/* ---------------------------------
   HTTPS CERTIFICATE INSPECTION

   Connects to the already-validated
   IP while retaining the domain as
   the TLS server name.
--------------------------------- */

async function inspectCertificate(
  domain: string,
  address: string
): Promise<any> {
  return new Promise((resolve) => {
    let finished = false;
    let socket: tls.TLSSocket;

    const finish = (result: any) => {
      if (finished) return;

      finished = true;
      socket?.destroy();
      resolve(result);
    };

    socket = tls.connect({
      host: address,
      port: 443,
      servername: domain,
      rejectUnauthorized: false
    });

    socket.setTimeout(7000);

    socket.once('secureConnect', () => {
      const cert = socket.getPeerCertificate();

      if (!cert || !cert.subject) {
        finish({
          available: false,
          reason: 'No certificate details returned'
        });
        return;
      }

      finish({
        available: true,
        subject: cert.subject,
        issuer: cert.issuer,
        validFrom: cert.valid_from,
        validTo: cert.valid_to,
        fingerprint256: cert.fingerprint256,
        authorized: socket.authorized,
        authorizationError:
          socket.authorizationError || null
      });
    });

    socket.once('timeout', () => {
      finish({
        available: false,
        reason: 'Connection timed out'
      });
    });

    socket.once('error', (error: Error) => {
      finish({
        available: false,
        reason: error.message
      });
    });
  });
}

/* ---------------------------------
   TRACELENS TOOL
--------------------------------- */

export class TraceLensTools {

  @Tool({
    name: 'investigate_domain',
    description:
      'Investigate a public website domain using DNS records and HTTPS certificate evidence.',

    inputSchema: z.object({
      domain: z.string()
        .min(3)
        .max(253)
        .describe('Website domain, for example example.com')
    })
  })

  @Widget('tracelens-dashboard')

  async investigateDomain(
    input: any,
    ctx: ExecutionContext
  ) {

    /* -------------------------------
       DOMAIN VALIDATION
    -------------------------------- */

    const rawDomain = input.domain.trim().toLowerCase();

    let domain: string;

    try {
      const parsed = new URL(
        rawDomain.includes('://')
          ? rawDomain
          : `https://${rawDomain}`
      );

      domain = parsed.hostname;

      if (
        !domain ||
        domain === 'localhost' ||
        domain.endsWith('.localhost') ||
        domain.endsWith('.local') ||
        domain.endsWith('.internal') ||
        !domain.includes('.') ||
        domain.length > 253
      ) {
        throw new Error('Enter a public website domain.');
      }

      const validDomain =
        /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

      if (!validDomain.test(domain)) {
        throw new Error('Invalid domain format.');
      }

    } catch (error: any) {
      throw new Error(error.message || 'Invalid domain.');
    }

    ctx.logger.info(
      'Starting TraceLens investigation',
      { domain }
    );

    /* -------------------------------
       DNS INVESTIGATION
    -------------------------------- */

    const [ipv4, ipv6, mx, nameservers, txt] =
      await Promise.all([
        getRecord(() => dns.resolve4(domain)),
        getRecord(() => dns.resolve6(domain)),
        getRecord(() => dns.resolveMx(domain)),
        getRecord(() => dns.resolveNs(domain)),
        getRecord(() => dns.resolveTxt(domain))
      ]);

    /* -------------------------------
       PRIVATE IP PROTECTION
    -------------------------------- */

    const resolvedAddresses = [
      ...(Array.isArray(ipv4) ? ipv4 : []),
      ...(Array.isArray(ipv6) ? ipv6 : [])
    ];

    const unsafeAddress = resolvedAddresses.find(
      address => !isPublicAddress(address)
    );

    if (unsafeAddress) {
      throw new Error(
        'Investigation blocked: this domain resolves to a private, local, or non-public IP address.'
      );
    }

    /* -------------------------------
       HTTPS CERTIFICATE CHECK
    -------------------------------- */

    const validatedAddress = resolvedAddresses[0];

    const certificate = validatedAddress
      ? await inspectCertificate(domain, validatedAddress)
      : {
          available: false,
          reason: 'No public IP address available'
        };

    /* -------------------------------
       EVIDENCE COLLECTION
    -------------------------------- */

    const evidence = {
      domain,
      collectedAt: new Date().toISOString(),

      dns: {
        ipv4,
        ipv6,
        mailServers: mx,
        nameservers,
        textRecords: txt
      },

      httpsCertificate: certificate
    };

    /* -------------------------------
       OBSERVATIONS
    -------------------------------- */

    const observations: string[] = [];

    if (Array.isArray(ipv4) && ipv4.length > 0) {
      observations.push(
        `Found ${ipv4.length} IPv4 address record(s).`
      );
    }

    if (Array.isArray(ipv6) && ipv6.length > 0) {
      observations.push(
        `Found ${ipv6.length} IPv6 address record(s).`
      );
    }

    if (certificate.available) {
      observations.push(
        'An HTTPS certificate was presented on port 443.'
      );

      observations.push(
        certificate.authorized
          ? 'The TLS connection passed Node.js certificate authorization.'
          : 'The TLS connection did not pass certificate authorization.'
      );
    } else {
      observations.push(
        'HTTPS certificate details could not be retrieved.'
      );
    }

    /* -------------------------------
       INVESTIGATION STATUS
    -------------------------------- */

    const addressLookupFailed =
      ipv4?.unavailable === true &&
      ipv6?.unavailable === true &&
      ipv4?.reason === 'ENOTFOUND' &&
      ipv6?.reason === 'ENOTFOUND';

    const dnsChecksIncomplete = [
      ipv4,
      ipv6,
      mx,
      nameservers,
      txt
    ].some(
      record =>
        record?.unavailable === true &&
        record?.reason !== 'ENODATA'
    );

    let status:
      | 'completed'
      | 'partial'
      | 'failed';

    if (addressLookupFailed) {

      status = 'failed';

      observations.push(
        'The domain could not be resolved to an IPv4 or IPv6 address.'
      );

    } else if (
      dnsChecksIncomplete ||
      !certificate.available
    ) {

      status = 'partial';

      observations.push(
        'Some technical evidence could not be collected.'
      );

    } else {

      status = 'completed';

      observations.push(
        'The requested DNS and HTTPS evidence was collected successfully.'
      );
    }

    /* -------------------------------
       FINAL RESULT
    -------------------------------- */

    return {
      product: 'TraceLens',
      status,
      domain,

      collectedAt: evidence.collectedAt,

      summary:
        status === 'failed'
          ? 'The domain could not be resolved. No conclusion about malicious activity can be made.'
          : status === 'partial'
            ? 'The investigation collected partial technical evidence. Some checks were unavailable.'
            : 'Technical observations collected. These signals alone cannot establish whether a website is safe or malicious.',

      observations,

      evidence,

      limitations: [
        'DNS records and HTTPS certificates do not prove that a website is safe or malicious.',
        'A valid HTTPS certificate does not guarantee trustworthy website content.',
        'DNS records can change over time.',
        'Some websites may not publish every DNS record type.',
        'This investigation does not scan website content or detect malware.',
        'Only the selected validated IP address is used for the HTTPS certificate check.'
      ]
    };
  }
}