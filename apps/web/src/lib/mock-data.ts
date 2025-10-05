// Mock-Daten die normalerweise aus der Datenbank kommen würden

export const mockStaff = [
  {
    id: '1',
    name: 'Vanessa Carosella',
    role: 'Inhaberin & Master Stylistin',
    specialty: 'Balayage & Creative Color',
    image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=400&fit=crop',
    rating: 4.9,
    reviews: 127,
    experience: '15 Jahre',
    languages: ['Deutsch', 'Englisch', 'Italienisch'],
    bio: 'Spezialisiert auf moderne Farbtechniken und kreative Schnitte.',
    availability: {
      monday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
      tuesday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
      wednesday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
      thursday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
      friday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
      saturday: ['09:00', '10:00', '11:00', '14:00'],
    }
  },
  {
    id: '2',
    name: 'Marco Steiner',
    role: 'Senior Stylist',
    specialty: 'Precision Cuts & Men\'s Grooming',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    rating: 4.8,
    reviews: 89,
    experience: '10 Jahre',
    languages: ['Deutsch', 'Englisch'],
    bio: 'Experte für präzise Schnitte und moderne Männerfrisuren.'
  },
  {
    id: '3',
    name: 'Sofia Müller',
    role: 'Color Specialist',
    specialty: 'Color Correction & Highlights',
    image: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=400&fit=crop',
    rating: 4.9,
    reviews: 104,
    experience: '8 Jahre',
    languages: ['Deutsch', 'Französisch', 'Englisch'],
    bio: 'Zertifizierte Coloristin mit Leidenschaft für perfekte Farbergebnisse.'
  },
  {
    id: '4',
    name: 'Nina Weber',
    role: 'Stylistin',
    specialty: 'Bridal & Event Styling',
    image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=400&fit=crop',
    rating: 4.7,
    reviews: 67,
    experience: '5 Jahre',
    languages: ['Deutsch', 'Englisch'],
    bio: 'Spezialisiert auf Hochsteckfrisuren und Event-Styling.'
  }
]

export const mockProducts = [
  {
    id: '1',
    name: 'Olaplex No. 3 Hair Perfector',
    price: 32.00,
    category: 'Haarpflege',
    image: 'https://images.unsplash.com/photo-1626603189519-9610d72649e6?w=400&h=400&fit=crop',
    description: 'Repariert und stärkt geschädigtes Haar',
    brand: 'Olaplex',
    inStock: 15,
    rating: 4.8,
    reviews: 234
  },
  {
    id: '2',
    name: 'Moroccanoil Treatment',
    price: 45.00,
    category: 'Haarpflege',
    image: 'https://images.unsplash.com/photo-1519735777090-ec97162dc266?w=400&h=400&fit=crop',
    description: 'Arganöl für Glanz und Geschmeidigkeit',
    brand: 'Moroccanoil',
    inStock: 8,
    rating: 4.9,
    reviews: 189
  },
  {
    id: '3',
    name: 'Dyson Supersonic Föhn',
    price: 399.00,
    category: 'Styling Tools',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop',
    description: 'Professioneller Haartrockner mit innovativer Technologie',
    brand: 'Dyson',
    inStock: 3,
    rating: 4.9,
    reviews: 567
  },
  {
    id: '4',
    name: 'ghd Gold Styler',
    price: 229.00,
    category: 'Styling Tools',
    image: 'https://images.unsplash.com/photo-1522336284037-91f7da073525?w=400&h=400&fit=crop',
    description: 'Premium Glätteisen für perfektes Styling',
    brand: 'ghd',
    inStock: 5,
    rating: 4.7,
    reviews: 423
  },
  {
    id: '5',
    name: 'Kérastase Elixir Ultime',
    price: 58.00,
    category: 'Haarpflege',
    image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=400&fit=crop',
    description: 'Luxuriöses Haaröl für ultimativen Glanz',
    brand: 'Kérastase',
    inStock: 12,
    rating: 4.8,
    reviews: 156
  },
  {
    id: '6',
    name: 'Color Wow Dream Coat',
    price: 28.00,
    category: 'Styling',
    image: 'https://images.unsplash.com/photo-1570194065650-d99fb4b38e39?w=400&h=400&fit=crop',
    description: 'Anti-Feuchtigkeit Spray für glattes Haar',
    brand: 'Color Wow',
    inStock: 20,
    rating: 4.6,
    reviews: 298
  }
]

export const mockServices = [
  {
    id: '1',
    category: 'Schnitt & Styling',
    items: [
      {
        id: 's1',
        name: 'Damenhaarschnitt',
        price: 95,
        duration: 60,
        description: 'Waschen, Schneiden, Föhnen inklusive Beratung',
        popular: true
      },
      {
        id: 's2',
        name: 'Herrenhaarschnitt',
        price: 75,
        duration: 45,
        description: 'Klassischer oder moderner Herrenschnitt mit Styling'
      },
      {
        id: 's3',
        name: 'Kinderhaarschnitt (bis 12 Jahre)',
        price: 45,
        duration: 30,
        description: 'Kindgerechter Service in entspannter Atmosphäre'
      },
      {
        id: 's4',
        name: 'Bart-Styling',
        price: 35,
        duration: 20,
        description: 'Professionelles Bart trimmen und stylen'
      }
    ]
  },
  {
    id: '2',
    category: 'Farbe & Highlights',
    items: [
      {
        id: 's5',
        name: 'Balayage',
        price: 280,
        duration: 180,
        description: 'Freihand-Technik für natürliche Highlights',
        popular: true
      },
      {
        id: 's6',
        name: 'Highlights/Strähnchen',
        price: 180,
        duration: 120,
        description: 'Klassische Foliensträhnen für mehr Dimension'
      },
      {
        id: 's7',
        name: 'Komplett-Färbung',
        price: 120,
        duration: 90,
        description: 'Einheitliche Farbe vom Ansatz bis zu den Spitzen'
      },
      {
        id: 's8',
        name: 'Glossing/Tönung',
        price: 95,
        duration: 45,
        description: 'Farbauffrischung und Glanz-Treatment'
      }
    ]
  },
  {
    id: '3',
    category: 'Treatments',
    items: [
      {
        id: 's9',
        name: 'Olaplex Treatment',
        price: 85,
        duration: 30,
        description: 'Reparatur-Treatment für geschädigtes Haar',
        popular: true
      },
      {
        id: 's10',
        name: 'Keratin Glättung',
        price: 350,
        duration: 180,
        description: 'Langanhaltende Glättung für 3-4 Monate'
      },
      {
        id: 's11',
        name: 'Kopfhaut-Spa',
        price: 65,
        duration: 30,
        description: 'Entspannende Kopfmassage mit pflegenden Ölen'
      }
    ]
  }
]

export const mockAppointments = [
  {
    id: '1',
    date: '2024-01-20',
    time: '14:00',
    service: 'Damenhaarschnitt',
    staff: 'Vanessa Carosella',
    status: 'confirmed',
    price: 95
  },
  {
    id: '2',
    date: '2024-01-15',
    time: '10:00',
    service: 'Balayage',
    staff: 'Sofia Müller',
    status: 'completed',
    price: 280
  }
]

export const mockReviews = [
  {
    id: '1',
    author: 'Sarah M.',
    rating: 5,
    date: '2024-01-10',
    service: 'Balayage',
    staff: 'Vanessa Carosella',
    comment: 'Absolut perfekt! Vanessa hat genau verstanden, was ich wollte. Die Farbe ist traumhaft geworden.',
    verified: true
  },
  {
    id: '2',
    author: 'Michael K.',
    rating: 5,
    date: '2024-01-08',
    service: 'Herrenhaarschnitt',
    staff: 'Marco Steiner',
    comment: 'Bester Herrenfriseur in Zürich! Marco nimmt sich Zeit und das Ergebnis ist immer top.',
    verified: true
  },
  {
    id: '3',
    author: 'Lisa B.',
    rating: 5,
    date: '2024-01-05',
    service: 'Olaplex Treatment',
    staff: 'Sofia Müller',
    comment: 'Meine Haare fühlen sich wieder wie neu an! Super Beratung und tolles Ergebnis.',
    verified: true
  }
]

export const mockGallery = [
  {
    id: '1',
    type: 'before-after',
    title: 'Blonde Balayage Transformation',
    before: 'https://images.unsplash.com/photo-1522336284037-91f7da073525?w=400&h=400&fit=crop',
    after: 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=400&h=400&fit=crop',
    staff: 'Vanessa Carosella'
  },
  {
    id: '2',
    type: 'style',
    title: 'Modern Bob Cut',
    image: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=400&fit=crop',
    staff: 'Marco Steiner'
  },
  {
    id: '3',
    type: 'style',
    title: 'Vivid Color Creation',
    image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=400&h=400&fit=crop',
    staff: 'Sofia Müller'
  },
  {
    id: '4',
    type: 'style',
    title: 'Elegant Updo',
    image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=400&fit=crop',
    staff: 'Nina Weber'
  }
]

// Simulierte API-Funktionen
export async function checkAvailability(date: string, staffId: string) {
  // Simuliert API-Call zur Datenbank
  await new Promise(resolve => setTimeout(resolve, 500))

  const bookedSlots = ['10:00', '14:00', '15:30'] // Bereits gebuchte Zeiten
  const allSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30']

  return allSlots.map(time => ({
    time,
    available: !bookedSlots.includes(time)
  }))
}

export async function createBooking(bookingData: any) {
  // Simuliert API-Call zur Datenbank
  await new Promise(resolve => setTimeout(resolve, 1000))

  return {
    success: true,
    bookingId: Math.random().toString(36).substr(2, 9),
    confirmationNumber: 'SNW-' + Date.now().toString().substr(-6)
  }
}

export async function processPayment(amount: number, method: string) {
  // Simuliert Stripe/SumUp Payment Processing
  await new Promise(resolve => setTimeout(resolve, 1500))

  return {
    success: true,
    transactionId: 'pi_' + Math.random().toString(36).substr(2, 16),
    amount,
    method,
    status: 'completed'
  }
}