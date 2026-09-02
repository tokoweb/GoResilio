'use client';

import React, { useState } from 'react';
import type { MultiHazardAssessmentResult } from '../../../domain/types/hazard.types';
import type { SpatialFeatureRecord } from '../../../domain/types/feature.types';

interface DataProvenanceAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: MultiHazardAssessmentResult | null;
}

export const DataProvenanceAuditModal: React.FC<DataProvenanceAuditModalProps> = ({
  isOpen,
  onClose,
  assessment
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen || !assessment) return null;

  const features: SpatialFeatureRecord[] = assessment.features || (assessment.featureStore ? Object.values(assessment.featureStore) : []);

  const filteredFeatures = features.filter((f) => {
    const matchesCategory = filterCategory === 'all' || f.category === filterCategory;
    const matchesSearch =
      searchQuery === '' ||
      f.featureName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.sourceDataset && f.sourceDataset.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '1100px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  background: '#ea580c',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Developer Mode
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                Data Provenance & Pipeline Audit Trace
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
              Reference: {assessment.referenceNumber} | Engine: {assessment.modelMetadata?.modelName || 'GoTangguh Engine'} (v{assessment.modelMetadata?.modelVersion || '2.3.0'})
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#ffffff',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
          >
            ✕
          </button>
        </div>

        {/* Filters & Search */}
        <div
          style={{
            padding: '14px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            backgroundColor: '#f8fafc',
            flexWrap: 'wrap'
          }}
        >
          <input
            type="text"
            placeholder="Search feature, source, or dataset..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 14px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.85rem',
              width: '280px',
              outline: 'none'
            }}
          />
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              'all',
              'soil',
              'air_quality',
              'exposure',
              'wildfire',
              'flood',
              'seismic',
              'climate',
              'hydrology',
              'infrastructure',
              'multi_hazard'
            ].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: filterCategory === cat ? '1px solid #0f172a' : '1px solid #e2e8f0',
                  background: filterCategory === cat ? '#0f172a' : '#ffffff',
                  color: filterCategory === cat ? '#ffffff' : '#475569',
                  cursor: 'pointer'
                }}
              >
                {cat.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#64748b' }}>
            Showing {filteredFeatures.length} / {features.length} Features
          </span>
        </div>

        {/* Feature Store Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px 24px' }}>
          {filteredFeatures.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              No feature provenance records found matching criteria.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginTop: '12px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', color: '#334155', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', borderBottom: '2px solid #cbd5e1' }}>Feature Key</th>
                  <th style={{ padding: '10px 12px', borderBottom: '2px solid #cbd5e1' }}>Raw / Measured Value</th>
                  <th style={{ padding: '10px 12px', borderBottom: '2px solid #cbd5e1' }}>Source & Dataset</th>
                  <th style={{ padding: '10px 12px', borderBottom: '2px solid #cbd5e1' }}>Resolution / Scope</th>
                  <th style={{ padding: '10px 12px', borderBottom: '2px solid #cbd5e1' }}>Type</th>
                  <th style={{ padding: '10px 12px', borderBottom: '2px solid #cbd5e1' }}>Calculation Method / Endpoint</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeatures.map((f, idx) => (
                  <tr
                    key={f.featureName}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                    }}
                  >
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 600, color: '#0f172a' }}>
                      {f.featureName}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {f.missing ? (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                          null ({f.missingReason || 'unobserved'})
                        </span>
                      ) : (
                        <div>
                          <strong style={{ color: '#0f172a' }}>
                            {f.numericValue !== null ? `${f.numericValue} ${f.unit || ''}` : (f.stringValue || 'null')}
                          </strong>
                          {f.stringValue && f.numericValue !== null && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>"{f.stringValue}"</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{f.source}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{f.sourceDataset || 'Standard API'}</div>
                      {f.model && <div style={{ fontSize: '0.72rem', color: '#7c3aed' }}>Model: {f.model}</div>}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#475569', fontSize: '0.75rem' }}>
                      <div>{f.spatialResolution || 'point'}</div>
                      {f.depthInterval && <div style={{ color: '#854d0e', fontWeight: 600 }}>Depth: {f.depthInterval}</div>}
                      {f.bufferRadiusMeters && <div style={{ color: '#1e40af', fontWeight: 600 }}>Radius: {f.bufferRadiusMeters}m</div>}
                      {f.sourceValidTime && <div style={{ color: '#0369a1', fontSize: '0.7rem' }}>Valid: {f.sourceValidTime}</div>}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: f.isDerived ? '#e0f2fe' : '#ecfdf5',
                          color: f.isDerived ? '#0369a1' : '#047857'
                        }}
                      >
                        {f.isDerived ? 'DERIVED' : 'RAW SOURCE'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#475569', fontSize: '0.75rem' }}>
                      <div>Method: {f.calculationMethod || 'direct_observation'}</div>
                      {f.endpoint && (
                        <div
                          style={{
                            fontFamily: 'monospace',
                            color: '#94a3b8',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '300px',
                            whiteSpace: 'nowrap'
                          }}
                          title={f.endpoint}
                        >
                          {f.endpoint}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Model Provenance Box */}
        <div
          style={{
            padding: '14px 24px',
            backgroundColor: '#0f172a',
            color: '#94a3b8',
            fontSize: '0.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <strong>GoTangguh Model Provenance:</strong> Scores calculated via {assessment.modelMetadata?.overallFormula || '70% max + 30% mean'}. Missing data policy: {assessment.modelMetadata?.missingDataPolicy || 'Strictly null'}.
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              backgroundColor: '#ea580c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
