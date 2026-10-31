
'use client';

import { useTheme, useWidgetSDK } from '@nitrostack/widgets';

interface TraceLensData {
  product: string;
  status: string;
  domain: string;
  collectedAt: string;
  summary: string;
  observations: string[];
  evidence: {
    dns: {
      ipv4: string[] | { unavailable: boolean; reason: string };
      ipv6: string[] | { unavailable: boolean; reason: string };
      mailServers: any;
      nameservers: any;
      textRecords: any;
    };
    httpsCertificate: {
      available: boolean;
      subject?: Record<string, string>;
      issuer?: Record<string, string>;
      validFrom?: string;
      validTo?: string;
      authorized?: boolean;
      authorizationError?: string | null;
    };
  };
  limitations: string[];
}

export default function TraceLensDashboard() {
  const theme = useTheme();
  const { getToolOutput } = useWidgetSDK();

  const data = getToolOutput<TraceLensData>();

  const dark = theme === 'dark';

  const colors = {
    background: dark ? '#0b1120' : '#f3f6fb',
    panel: dark ? '#151f32' : '#ffffff',
    text: dark ? '#f1f5f9' : '#172033',
    muted: dark ? '#94a3b8' : '#64748b',
    border: dark ? '#263449' : '#e2e8f0',
    blue: '#3b82f6',
    green: '#22c55e',
    yellow: '#f59e0b',
    red: '#ef4444',
  };

  const cardStyle: React.CSSProperties = {
    background: colors.panel,
    border: `1px solid ${colors.border}`,
    borderRadius: 14,
    padding: 18,
    minWidth: 0,
  };

  const headingStyle: React.CSSProperties = {
    color: colors.text,
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 12,
  };

  const valueStyle: React.CSSProperties = {
    color: colors.text,
    fontSize: 14,
    overflowWrap: 'anywhere',
  };

  const recordList = (value: any): string[] => {
    if (Array.isArray(value)) {
      return value.map((item) =>
        typeof item === 'string'
          ? item
          : JSON.stringify(item)
      );
    }

    if (value?.unavailable) {
      return [`Unavailable: ${value.reason}`];
    }

    return ['No record returned'];
  };

  if (!data) {
    return (
      <main style={{
        background: colors.background,
        color: colors.text,
        padding: 28,
        borderRadius: 16,
        fontFamily: 'system-ui, sans-serif',
      }}>
        <h2>TraceLens</h2>
        <p style={{ color: colors.muted }}>
          Waiting for domain investigation results...
        </p>
      </main>
    );
  }

  const dns = data.evidence?.dns;
  const cert = data.evidence?.httpsCertificate;
  const statusDisplay =
  data.status === 'completed'
    ? {
        label: 'INVESTIGATION COMPLETE',
        background: '#14532d',
        color: '#86efac',
        dot: '●',
      }
    : data.status === 'partial'
    ? {
        label: 'PARTIAL INVESTIGATION',
        background: '#78350f',
        color: '#fcd34d',
        dot: '●',
      }
    : data.status === 'failed'
    ? {
        label: 'DOMAIN NOT RESOLVED',
        background: '#7f1d1d',
        color: '#fca5a5',
        dot: '●',
      }
    : {
        label: 'STATUS UNKNOWN',
        background: colors.border,
        color: colors.text,
        dot: '●',
      };

  const recordSections = [
    { title: 'IPv4 Addresses', value: dns?.ipv4 },
    { title: 'IPv6 Addresses', value: dns?.ipv6 },
    { title: 'Mail Servers', value: dns?.mailServers },
    { title: 'Nameservers', value: dns?.nameservers },
    { title: 'TXT Records', value: dns?.textRecords },
  ];

  return (
    <main style={{
      background: colors.background,
      color: colors.text,
      padding: 24,
      borderRadius: 18,
      fontFamily: 'system-ui, sans-serif',
      width: '100%',
      boxSizing: 'border-box',
    }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
      }}>
        <div>
          <div style={{
            fontSize: 27,
            fontWeight: 850,
            letterSpacing: '-1px',
          }}>
            <span style={{ color: colors.blue }}>Trace</span>Lens
          </div>
          <div style={{ color: colors.muted, fontSize: 11 }}>
            WEBSITE INTELLIGENCE · EVIDENCE FIRST
          </div>
        </div>

        <span style={{
  background: statusDisplay.background,
  color: statusDisplay.color,
  padding: '8px 12px',
  borderRadius: 20,
  fontSize: 11,
  fontWeight: 700,
}}>
  {statusDisplay.dot} {statusDisplay.label}
</span>
      </header>

      <section style={{
        ...cardStyle,
        marginBottom: 18,
        background: dark
          ? 'linear-gradient(120deg, #172d50, #151f32)'
          : 'linear-gradient(120deg, #e0edff, #ffffff)',
      }}>
        <div style={{
          color: colors.muted,
          fontSize: 11,
          fontWeight: 700,
          marginBottom: 8,
        }}>
          INVESTIGATED DOMAIN
        </div>

        <div style={{
          fontSize: 24,
          fontWeight: 800,
          overflowWrap: 'anywhere',
        }}>
          {data.domain}
        </div>

        <p style={{
          color: colors.muted,
          fontSize: 13,
          lineHeight: 1.6,
          marginBottom: 0,
        }}>
          {data.summary}
        </p>
      </section>

      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 12,
        marginBottom: 20,
      }}>
        {[
          {
            label: 'IPv4 Records',
            value: Array.isArray(dns?.ipv4)
              ? dns.ipv4.length : '—',
          },
          {
            label: 'IPv6 Records',
            value: Array.isArray(dns?.ipv6)
              ? dns.ipv6.length : '—',
          },
          {
            label: 'Nameservers',
            value: Array.isArray(dns?.nameservers)
              ? dns.nameservers.length : '—',
          },
          {
            label: 'TLS Certificate',
            value: cert?.available ? 'Found' : 'Unavailable',
          },
        ].map((item) => (
          <div key={item.label} style={cardStyle}>
            <div style={{
              color: colors.muted,
              fontSize: 11,
              marginBottom: 10,
            }}>
              {item.label}
            </div>
            <div style={{
              color: colors.text,
              fontSize: 23,
              fontWeight: 800,
            }}>
              {item.value}
            </div>
          </div>
        ))}
      </section>

      <section style={{ marginBottom: 20 }}>
        <h3 style={headingStyle}>DNS Evidence</h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
        }}>
          {recordSections.map((section) => (
            <div key={section.title} style={cardStyle}>
              <div style={{
                color: colors.blue,
                fontSize: 12,
                fontWeight: 800,
                marginBottom: 12,
              }}>
                {section.title.toUpperCase()}
              </div>

              {recordList(section.value).map((record, index) => (
                <div key={index} style={{
                  ...valueStyle,
                  padding: '7px 0',
                  borderBottom: `1px solid ${colors.border}`,
                  fontSize: 12,
                }}>
                  {record}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...cardStyle, marginBottom: 20 }}>
        <h3 style={headingStyle}>HTTPS Certificate Analysis</h3>

        {cert?.available ? (
          <>
            <div style={{
              color: cert.authorized ? colors.green : colors.yellow,
              fontWeight: 800,
              marginBottom: 14,
              fontSize: 13,
            }}>
              ● {cert.authorized
                ? 'TLS authorization passed'
                : 'TLS authorization failed'}
            </div>

            {[
              ['Subject', cert.subject?.CN],
              ['Issuer', cert.issuer?.CN],
              ['Organization', cert.issuer?.O],
              ['Valid From', cert.validFrom],
              ['Valid Until', cert.validTo],
            ].map(([label, value]) => (
              <div key={label} style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                padding: '10px 0',
                borderBottom: `1px solid ${colors.border}`,
                fontSize: 12,
              }}>
                <span style={{ color: colors.muted }}>{label}</span>
                <strong style={{
                  color: colors.text,
                  textAlign: 'right',
                  overflowWrap: 'anywhere',
                }}>
                  {value || 'Not available'}
                </strong>
              </div>
            ))}
          </>
        ) : (
          <p style={{ color: colors.yellow, fontSize: 13 }}>
            Certificate details could not be retrieved.
          </p>
        )}
      </section>

      <section style={{ ...cardStyle, marginBottom: 20 }}>
        <h3 style={headingStyle}>Investigation Observations</h3>

        {data.observations?.map((item, index) => (
          <div key={index} style={{
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            marginBottom: 12,
            fontSize: 13,
            lineHeight: 1.5,
            color: colors.text,
          }}>
            <span style={{ color: colors.green }}>●</span>
            <span>{item}</span>
          </div>
        ))}
      </section>

      <section style={{
        ...cardStyle,
        borderLeft: `4px solid ${colors.yellow}`,
        marginBottom: 20,
      }}>
        <h3 style={headingStyle}>Evidence Limitations</h3>

        {data.limitations?.map((item, index) => (
          <p key={index} style={{
            color: colors.muted,
            fontSize: 12,
            lineHeight: 1.6,
            margin: '8px 0',
          }}>
            • {item}
          </p>
        ))}
      </section>

      <footer style={{
        borderTop: `1px solid ${colors.border}`,
        paddingTop: 14,
        color: colors.muted,
        fontSize: 10,
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <span>TRACELENS · TECHNICAL EVIDENCE REPORT</span>
        <span>
          Collected: {data.collectedAt
            ? new Date(data.collectedAt).toLocaleString()
            : 'Unknown'}
        </span>
      </footer>
    </main>
  );
}
