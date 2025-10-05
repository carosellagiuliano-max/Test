import Link from 'next/link'
import { Button } from '@coiffeur/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@coiffeur/ui/card'
import { ArrowRight, Calendar, Clock, MapPin, Phone, Mail, Star, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6 text-gray-900">
              Willkommen bei Ihrem Premium Coiffeur
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Erleben Sie erstklassige Haarpflege und Styling in entspannter Atmosphäre
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/booking">
                <Button size="lg" className="px-8">
                  <Calendar className="mr-2 h-5 w-5" />
                  Jetzt Termin buchen
                </Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="outline" className="px-8">
                  Unsere Services
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Warum bei uns?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-blue-500 mb-4" />
                <CardTitle>Erfahrene Stylisten</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Unser Team besteht aus hochqualifizierten Fachkräften mit jahrelanger Erfahrung
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Star className="h-10 w-10 text-blue-500 mb-4" />
                <CardTitle>Premium Produkte</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Wir verwenden nur hochwertige Produkte führender Marken für beste Ergebnisse
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="h-10 w-10 text-blue-500 mb-4" />
                <CardTitle>Flexible Termine</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Online-Buchung rund um die Uhr mit flexiblen Terminen nach Ihrem Zeitplan
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Beliebte Services</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'Haarschnitt & Styling',
                price: 'ab CHF 65',
                duration: '45 min',
                description: 'Professioneller Haarschnitt mit Beratung und Styling'
              },
              {
                name: 'Farbe & Highlights',
                price: 'ab CHF 120',
                duration: '120 min',
                description: 'Individuelle Farbberatung und -behandlung'
              },
              {
                name: 'Balayage',
                price: 'ab CHF 180',
                duration: '180 min',
                description: 'Natürliche Farbverläufe für einen sonnigen Look'
              },
              {
                name: 'Dauerwelle',
                price: 'ab CHF 150',
                duration: '150 min',
                description: 'Moderne Locken und Wellen nach Ihren Wünschen'
              },
              {
                name: 'Keratin Behandlung',
                price: 'ab CHF 250',
                duration: '180 min',
                description: 'Glättung und intensive Pflege für seidiges Haar'
              },
              {
                name: 'Hochzeitsstyling',
                price: 'ab CHF 200',
                duration: '120 min',
                description: 'Perfektes Styling für Ihren besonderen Tag'
              }
            ].map((service, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{service.name}</CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="font-semibold text-lg text-gray-900">{service.price}</span>
                      <span className="text-sm text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {service.duration}
                      </span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{service.description}</p>
                  <Link href="/booking">
                    <Button className="w-full mt-4" variant="outline">
                      Termin buchen
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/services">
              <Button size="lg" variant="outline">
                Alle Services anzeigen
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact & Location */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Kontakt & Standort</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Öffnungszeiten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Montag - Freitag</span>
                  <span className="font-medium">09:00 - 19:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Samstag</span>
                  <span className="font-medium">09:00 - 17:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Sonntag</span>
                  <span className="font-medium">Geschlossen</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kontakt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>Bahnhofstrasse 123, 8001 Zürich</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>+41 44 123 45 67</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>info@coiffeur-platform.ch</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Bereit für Ihre Verwandlung?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Buchen Sie jetzt Ihren Termin online und erleben Sie Premium-Haarpflege
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/booking">
              <Button size="lg" variant="secondary" className="px-8">
                <Calendar className="mr-2 h-5 w-5" />
                Online Termin buchen
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="lg" variant="outline" className="px-8 bg-transparent text-white border-white hover:bg-white hover:text-blue-600">
                Konto erstellen
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}