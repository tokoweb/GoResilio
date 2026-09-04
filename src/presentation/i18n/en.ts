export const enDictionary = {
  nav: {
    riskScan: 'Risk Assessment',
    pricing: 'Pricing',
    reportStructure: 'Report Standards',
    bookDemo: 'Consultation',
    sampleReportBtn: 'Sample Report',
    scheduleDemoBtn: 'Book Consultation',
    loginBtn: 'Sign In'
  },
  hero: {
    title: 'Property Climate & Disaster Risk Assessment Platform',
    subtitle:
      'Search a location or drag the map pin below for precision physical risk screening across flooding, seismic fault lines, extreme heat stress, and site transportation connectivity.',
    searchPlaceholder: 'Type a city, district, or address (e.g., South Jakarta, Denpasar, Quezon City)...',
    propertyTypeLabel: 'Property Type',
    targetUserLabel: 'Target Persona',
    scanBtn: 'Search & Scan',
    quickPresetsLabel: 'Quick Presets:',
    scoreOverrideLabel: 'Manual Score Simulation (Demo Mode):',
    scoreHigh: 'High (85)',
    scoreMed: 'Medium (55)',
    scoreLow: 'Low (20)',
    types: {
      residential: 'Residential (House / Land)',
      commercial: 'Commercial (Shophouse / Mall / Estate)'
    },
    personas: {
      buyer: 'Home Buyer',
      owner: 'Home Owner',
      developer: 'Property Developer',
      lender: 'Lender / Bank',
      agent: 'Real Estate Agent'
    }
  },
  dashboard: {
    mapTitle: 'Site Location & Hazard Zoning',
    perspectiveBadge: 'Perspective',
    mapHint:
      'Fully Synchronized Interactive Map: Searching an address, clicking on the map, or dragging the pin marker dynamically updates multi-hazard analytics across the entire platform!',
    indicatorsTitle: 'Site Hazard & Accessibility Breakdown',
    indicatorsSubtitle: '4 Core Assessment Pillars',
    overallScoreTitle: 'Integrated Risk Index',
    overallScoreSubtitle: 'Overall Risk',
    propertyTypeLabel: 'Property Type',
    downloadPdfBtn: 'Download Summary Report (PDF)',
    roleInsightTitle: 'Recommendations',
    cards: {
      floodTitle: 'Flood & Inundation',
      quakeTitle: 'Earthquake & Active Faults',
      heatTitle: 'Heat Conditions',
      transportTitle: 'Transportation & Access',
      causeLabel: 'Key Factors:',
      impactLabel: 'Potential Impacts to Consider:',
      recomLabel: 'Recommended Actions:',
      accessRecomLabel: 'Access & Evacuation:'
    }
  },
  pricing: {
    title: 'Service Options & Assessment Solutions',
    subtitle: 'Tiered service models designed for individuals to estate developers & institutional lenders.',
    free: {
      title: 'Free Site Check',
      desc: 'Initial location-based multi-hazard screening via interactive dashboard for early risk discovery.',
      price: '',
      period: '',
      btn: 'Check on Dashboard',
      features: [
        'Multi-Hazard Scan (Flood, Seismic, Heat Stress)',
        'CARTO Spatial Map Visualization',
        'Composite Risk Score Summary (0–100)',
        'Concise plain-language insight'
      ]
    },
    instant: {
      title: 'Instant (1 Property)',
      badge: 'Most Popular',
      desc: 'Automated ±10 page PDF report covering baseline 3 hazards (Flood, Heat, Seismic) and general recommendations.',
      price: '',
      period: '',
      btn: 'Generate Instant Report',
      features: [
        'Coverage for 1 site location',
        'Baseline 3-hazard profile (Flood, Heat, Quake)',
        'General recommendations & risk mitigation',
        'Official ±10 page PDF document',
        'Site accessibility & emergency egress summary'
      ]
    },
    lite: {
      title: 'Bundling 1 (Compare 3 Properties)',
      badge: 'Best Value',
      desc: 'Side-by-side comparison report for buyers evaluating 3–5 candidate houses before making an offer.',
      price: '',
      period: '',
      btn: 'Compare Properties',
      features: [
        'Coverage for 1–3 site locations',
        'Side-by-side comparative risk matrix',
        '3 Complete PDF reports included (@±10 pages)',
        'Safety ranking recommendation for shortlist',
        'Essential due diligence before offering'
      ]
    },
    gold: {
      title: 'Expert Consultation & Field Verification',
      desc: 'In-depth evaluation by BGP disaster resilience engineers or on-site field verification by civil engineers & architects.',
      price: '',
      period: '',
      btn: 'Book a demo',
      features: [
        'Online consultation session with Resilience Expert',
        'On-site field verification by Structural Engineers & Architects',
        'Estate-scale feasibility study for Developers',
        'Disaster-Resilient House prototype catalog',
        'Execution referral to accredited contractors'
      ]
    }
  },
  demo: {
    title: 'Expert Consultation & Field Verification',
    subtitle:
      'Gain risk assessment and property condition reviews from expert teams, accompanied by field verification by Architects and Structural Engineers to support safer and well-informed property decisions.',
    pillar1Title: 'Disaster Risk & Geospatial Analysis',
    pillar1Desc: 'Property risk evaluation powered by geospatial intelligence and engineering diagnostics to identify hazards, vulnerabilities, and mitigation needs alongside specialists.',
    pillar2Title: 'Technical Field Verification',
    pillar2Desc: 'Actual site condition verification through ground inspection, elevation surveys, soil bearing tests (SPT/sondir), and existing structural integrity checks.',
    pillar3Title: 'Design Guidelines & Contractor Referrals',
    pillar3Desc: 'Disaster-Resilient Housing design recommendations and certified contractor referrals for construction or retrofitting.',
    credibilityTitle: 'Credibility Backed By:',
    credibilityText: 'Research & Disaster Resilience Specialists from Baresi Global Prime (BGP) Consultant',
    highlights: [
      'Disaster Risk & Geospatial Analysis',
      'Technical Field Verification by Architects & Structural Engineers',
      'Resilient Design Guidelines & Contractor Referrals'
    ],
    formTitle: 'Consultation & Field Verification Request Form',
    nameLabel: 'Full Name',
    namePlaceholder: 'Enter your full name',
    emailLabel: 'Official Email Address',
    emailPlaceholder: 'name@email.com',
    phoneLabel: 'Active WhatsApp Number',
    phonePlaceholder: '+62 812-xxxx-xxxx',
    companyLabel: 'Organization / Company (Optional)',
    companyPlaceholder: 'Enter organization or company name',
    roleLabel: 'Your Profile / Role',
    packageLabel: 'Service Package Interest',
    packagePlaceholder: 'Select service package...',
    locationLabel: 'Target Property Location / Land Site',
    locationPlaceholder: 'Enter property location or address',
    dateLabel: 'Preferred Consultation / Survey Date',
    notesLabel: 'Special Requirements / Notes (Optional)',
    notesPlaceholder: 'Enter your specific requirements or inquiries here...',
    submitBtn: 'Submit Consultation Request',
    successMsg: 'Consultation Request Successfully Submitted!',
    successSub: 'Our specialists will contact you via WhatsApp or Email within 24 hours to confirm your schedule.'
  },
  reportSteps: {
    title: "See What's Inside the Report",
    subtitle: 'Download sample comprehensive report to explore multi-hazard analysis structure, depth microzonation, and technical mitigations.',
    downloadBtn: 'Download Sample Report',
    step1: {
      badge: 'PART 1',
      title: 'Cover & Executive Summary',
      desc: 'Site identity, coordinates, overall risk score (0-100), and 1-2 paragraph executive conclusions.'
    },
    step2: {
      badge: 'PART 2',
      title: 'Hazard Deep-Dive Analysis',
      desc: 'Causes, impacts, depth/microzonation maps, and historical trends for Quake, Flood, and Heat stress.'
    },
    step3: {
      badge: 'PART 3',
      title: 'Diagnostics & Prescriptions',
      desc: 'Building element vulnerability diagnostics, engineering mitigation specs, and estimated adaptation costs.'
    },
    step4: {
      badge: 'PART 4',
      title: 'Accessibility & Financial Impact',
      desc: 'Evacuation infrastructure, public transport connectivity, insurance premiums, and property valuation effect.'
    }
  },
  modal: {
    title: 'GoResilio Sample Report PDF',
    subtitle: 'Official structured environmental and climate hazard due diligence report by GoResilio.',
    brandSubtitle: 'LOCATION INTELLIGENCE & CLIMATE RISK REPORT',
    addressLabel: 'Site Address:',
    propTypeLabel: 'Property Type:',
    perspectiveLabel: 'Client Perspective:',
    opinionHeader: 'Professional Opinion & Key Results',
    opinionHigh: 'Significant environmental & climate risks have been identified. Action is recommended before transaction completion.',
    opinionMed: 'Moderate environmental & climate risks identified. Preventive mitigation recommended.',
    opinionLow: 'Low environmental & climate risks. Standard maintenance sufficient.',
    tableHeader: {
      hazard: 'Hazard Category',
      status: 'Status / Rating',
      cause: 'Primary Cause / Site Condition',
      mitigation: 'Recommended Mitigations & Access'
    },
    nextStepsTitle: "Consultant's Guidance & Next Steps",
    downloadBtn: 'Download / Print PDF Report',
    closeBtn: 'Close'
  },
  footer: {
    copyright: '© 2026 GoResilio. Climate & Disaster Risk Property Assessment Platform.'
  },
  auth: {
    portalTitle: 'GoResilio Client & Enterprise Portal',
    portalSubtitle: 'Access multi-site risk portfolios, verified PDF report archives, and API data feeds.',
    buyerTab: 'Individual / Buyer',
    developerTab: 'Property Developer',
    bankTab: 'Banking & Insurance',
    emailLabel: 'Email / Enterprise Client ID',
    emailPlaceholder: 'name@company.com / Client ID',
    passLabel: 'Password / Report Access Key',
    passPlaceholder: '••••••••••••',
    submitBtn: 'Sign In to Risk Dashboard',
    demoInstantBtn: 'Quick Demo Access',
    loginSuccess: 'Successfully Signed In! Welcome to your GoResilio Portfolio Dashboard.',
    securityNote: 'Your privacy and data are safely secured.'
  }
};
