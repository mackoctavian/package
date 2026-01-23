import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

type RetreatBookingEmailProps = {
  kind: 'created' | 'rescheduled'
  guestName: string
  retreatTitle: string
  dateRange?: string | null
  timeRange?: string | null
  location?: string | null
  ticketCode: string
  ticketUrl: string
}

export const RetreatBookingEmail = ({
  kind,
  guestName,
  retreatTitle,
  dateRange,
  timeRange,
  location,
  ticketCode,
  ticketUrl,
}: RetreatBookingEmailProps) => {
  const title =
    kind === 'rescheduled' ? 'Your retreat booking has been updated' : 'Your retreat booking is confirmed'
  const preheader =
    kind === 'rescheduled'
      ? `Updated booking for ${retreatTitle}. Ticket: ${ticketCode}`
      : `Confirmed booking for ${retreatTitle}. Ticket: ${ticketCode}`

  return (
    <Html>
      <Head />
      <Preview>{preheader}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section>
            <Text style={styles.brand}>DMRC</Text>
            <Heading style={styles.heading}>{title}</Heading>
            <Text style={styles.lead}>
              Hello <strong>{guestName || 'Guest'}</strong>, your booking details are below.
            </Text>
          </Section>

          <Section style={styles.card}>
            <Heading style={styles.cardTitle}>{retreatTitle || 'Retreat'}</Heading>
            <Section style={styles.cardRow}>
              <Section style={styles.cardColumn}>
                <Text style={styles.cardLabel}>Schedule</Text>
                <Text style={styles.cardValue}>
                  {(dateRange || 'TBA') + (timeRange ? ` • ${timeRange}` : '')}
                </Text>
              </Section>
              <Section style={styles.cardColumn}>
                <Text style={styles.cardLabel}>Location</Text>
                <Text style={styles.cardValue}>{location || 'TBA'}</Text>
              </Section>
            </Section>
            <Hr style={styles.divider} />
            <Section>
              <Text style={styles.cardLabel}>Your Ticket Code</Text>
              <Text style={styles.ticketCode}>{ticketCode}</Text>
              <Button href={ticketUrl} style={styles.button}>
                View / Download Ticket
              </Button>
              <Text style={styles.note}>
                Present your ticket code at check-in. If you need to manage your booking, use the link above.
              </Text>
            </Section>
          </Section>

          <Text style={styles.footer}>
            If you did not make this booking, please ignore this email.
            <br />
            Divine Mercy Retreat Center
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const styles = {
  body: {
    backgroundColor: '#0b1220',
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
    margin: '0',
    padding: '0',
  },
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '32px 18px 40px',
  },
  brand: {
    color: '#93c5fd',
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: '0.22em',
    textTransform: 'uppercase' as const,
    marginBottom: '8px',
  },
  heading: {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: 800,
    margin: '0 0 8px',
  },
  lead: {
    color: '#cbd5e1',
    fontSize: '14px',
    lineHeight: '1.6',
    marginTop: '0',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '18px',
    padding: '18px',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: 800,
    margin: '0 0 8px',
  },
  cardRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  cardColumn: {
    minWidth: '220px',
    flex: '1',
  },
  cardLabel: {
    color: '#94a3b8',
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    marginBottom: '4px',
  },
  cardValue: {
    color: '#e2e8f0',
    fontSize: '14px',
    marginTop: '0',
  },
  divider: {
    borderColor: 'rgba(255,255,255,0.12)',
    margin: '16px 0',
  },
  ticketCode: {
    color: '#ffffff',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '18px',
    fontWeight: 800,
    letterSpacing: '0.08em',
    margin: '0 0 12px',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: '12px',
    color: '#ffffff',
    display: 'inline-block',
    fontWeight: 800,
    padding: '12px 16px',
    textDecoration: 'none',
  },
  note: {
    color: '#cbd5e1',
    fontSize: '12px',
    lineHeight: '1.6',
    marginTop: '12px',
  },
  footer: {
    color: '#94a3b8',
    fontSize: '12px',
    lineHeight: '1.6',
    marginTop: '18px',
  },
}
