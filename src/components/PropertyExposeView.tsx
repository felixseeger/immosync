import React from 'react';
import type { Property, Contact } from '../types';

const EXPOSE_STYLES: React.CSSProperties = {
  width: '210mm',
  minHeight: '297mm',
  padding: '18mm',
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontSize: '10pt',
  color: '#111',
  backgroundColor: '#fff',
  boxSizing: 'border-box',
};

const EXPOSE_STYLES_PRINT = `
  @media print {
    body { margin: 0; padding: 0; background: #fff; }
    .expose-root { box-shadow: none !important; }
  }
`;

interface PropertyExposeViewProps {
  property: Property;
  contacts: Contact[];
  /** Optional: locale for date formatting */
  locale?: string;
}

function formatDate(iso: string | undefined, locale = 'de-DE'): string {
  if (!iso) return '—';
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function PropertyExposeView({ property, contacts, locale = 'de-DE' }: PropertyExposeViewProps) {
  const mainImage = property.mainImage || property.images?.[0] || `https://picsum.photos/seed/${property.id}/1200/800`;
  const allImages = [
    mainImage,
    ...(property.images ?? []).filter((url) => url !== mainImage),
  ];

  return (
    <div className="expose-root" style={EXPOSE_STYLES}>
      <style>{EXPOSE_STYLES_PRINT}</style>

      {/* Header */}
      <header style={{ marginBottom: '16px', borderBottom: '2px solid #D9FF00', paddingBottom: '12px' }}>
        <h1 style={{ margin: 0, fontSize: '22pt', fontWeight: 'bold', color: '#111' }}>
          {property.title}
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: '11pt', color: '#555' }}>
          {property.address}
        </p>
        <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '9pt',
              fontWeight: 600,
              backgroundColor: property.status === 'Active' ? '#D9FF00' : '#e5e5e5',
              color: property.status === 'Active' ? '#111' : '#555',
            }}
          >
            {property.status}
          </span>
          <span style={{ fontSize: '18pt', fontWeight: 'bold', color: '#111' }}>
            €{property.price.toLocaleString('de-DE')}
          </span>
        </div>
      </header>

      {/* Hero image */}
      {allImages.length > 0 && (
        <section style={{ marginBottom: '20px' }}>
          <img
            src={allImages[0]}
            alt={property.title}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '180mm',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </section>
      )}

      {/* Property details grid */}
      <section style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '14pt', fontWeight: 'bold' }}>Property details</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px 24px',
            fontSize: '10pt',
          }}
        >
          <div><strong>Rooms:</strong> {property.rooms ?? '—'}</div>
          <div><strong>Bedrooms:</strong> {property.bedrooms ?? '—'}</div>
          <div><strong>Bathrooms:</strong> {property.bathrooms ?? '—'}</div>
          <div><strong>Living space:</strong> {property.livingSpace ? `${property.livingSpace} m²` : '—'}</div>
          <div><strong>Lot size:</strong> {property.lotSize ? `${property.lotSize} m²` : '—'}</div>
          <div><strong>Year built:</strong> {property.yearBuilt ?? '—'}</div>
          <div><strong>Type:</strong> {property.type ?? '—'}</div>
          <div><strong>Marketing:</strong> {property.marketingType ?? '—'}</div>
          <div><strong>Energy:</strong> {property.energyCertificate ?? '—'}</div>
          <div><strong>Heating:</strong> {property.heatingType ?? '—'}</div>
          <div><strong>Balconies:</strong> {property.balconies ?? '—'}</div>
          <div><strong>Garage:</strong> {property.garage ?? '—'}</div>
        </div>

        {property.status === 'Rented' && (property.moveInDate || property.moveOutDate) && (
          <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
            <strong>Rental dates:</strong> Move-in {formatDate(property.moveInDate, locale)} — Move-out {formatDate(property.moveOutDate, locale)}
          </div>
        )}
        {property.status === 'Sold' && (property.purchaseDate || property.saleDate) && (
          <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
            <strong>Sale dates:</strong> Purchase {formatDate(property.purchaseDate, locale)} — Sale {formatDate(property.saleDate, locale)}
          </div>
        )}
      </section>

      {/* Descriptions */}
      {(property.description || property.objectDescription || property.locationDescription) && (
        <section style={{ marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '14pt', fontWeight: 'bold' }}>Description</h2>
          {property.description && (
            <p style={{ margin: '0 0 12px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {property.description}
            </p>
          )}
          {property.objectDescription && (
            <p style={{ margin: '0 0 12px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {property.objectDescription}
            </p>
          )}
          {property.locationDescription && (
            <p style={{ margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap', color: '#555' }}>
              {property.locationDescription}
            </p>
          )}
        </section>
      )}

      {/* Features */}
      {property.features && property.features.length > 0 && (
        <section style={{ marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '14pt', fontWeight: 'bold' }}>Features</h2>
          <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.6 }}>
            {property.features.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Image gallery */}
      {allImages.length > 1 && (
        <section style={{ marginBottom: '20px', breakInside: 'avoid' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '14pt', fontWeight: 'bold' }}>Gallery</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
            }}
          >
            {allImages.slice(1, 9).map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`${property.title} – ${i + 2}`}
                style={{
                  width: '100%',
                  height: '120px',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Contacts */}
      <section style={{ marginBottom: '12px', breakInside: 'avoid' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '14pt', fontWeight: 'bold' }}>Contacts</h2>
        {contacts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {contacts.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: '12px',
                  border: '1px solid #e5e5e5',
                  borderRadius: '6px',
                  fontSize: '10pt',
                }}
              >
                <strong>{c.name}</strong>
                {c.company && <span style={{ color: '#555' }}> — {c.company}</span>}
                <div style={{ marginTop: '4px', color: '#333' }}>
                  {c.email && <span>Email: {c.email}</span>}
                  {c.email && c.phone && ' · '}
                  {c.phone && <span>Phone: {c.phone}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, color: '#777', fontSize: '9pt' }}>No contacts linked.</p>
        )}
      </section>

      {/* Footer */}
      <footer style={{ marginTop: '24px', paddingTop: '12px', borderTop: '1px solid #e5e5e5', fontSize: '8pt', color: '#888' }}>
        ImmoSync — Property Exposé · {new Date().toLocaleDateString(locale)}
      </footer>
    </div>
  );
}
