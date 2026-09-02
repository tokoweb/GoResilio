import React from 'react';
import type { Metadata } from 'next';
import { LanguageProvider } from '../presentation/context/LanguageContext';
import { AssessmentProvider } from '../presentation/context/AssessmentContext';

import '../presentation/styles/theme.css';
import '../presentation/styles/app.css';
import '../presentation/styles/print_report.css';

export const metadata: Metadata = {
  title: 'GoTangguh — Platform Uji Tuntas Risiko Bencana & Ketahanan Iklim Properti',
  description: 'Platform uji tuntas bahaya multi-ancaman (Banjir, Gempa, Panas Ekstrem, Transportasi) berbasis data terverifikasi (BNPB inaRISK, USGS, Open-Meteo Copernicus DEM, OSM) untuk Pembeli Properti, Developer, dan Perbankan.',
  keywords: ['gotangguh', 'skrining bencana', 'risiko banjir', 'sesar aktif', 'inarisk bnpb', 'usgs', 'copernicus dem', 'due diligence properti']
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Poppins:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body>
        <LanguageProvider>
          <AssessmentProvider>
            {children}
          </AssessmentProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
