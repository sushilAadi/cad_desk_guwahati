import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const WHATSAPP_NUMBER = "919127281610"
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi! I'd like to know more about courses at CAD Desk Guwahati."
)}`

const CATEGORIES: { name: string; count: number; blurb: string }[] = [
  {
    name: "Civil / Architecture",
    count: 20,
    blurb: "AutoCAD, Revit, STAAD Pro, Primavera, BIM Modelling, and more.",
  },
  {
    name: "Mechanical",
    count: 15,
    blurb: "Solidworks, CATIA, Creo, ANSYS, CNC Programming, NX CAD/CAM.",
  },
  {
    name: "CS / IT",
    count: 18,
    blurb: "Python, Java, Web Design, Data Science, Cyber Security, Power BI.",
  },
  {
    name: "Electrical",
    count: 6,
    blurb: "AutoCAD Electrical, EPLAN, ETAP, PLC, Revit MEP.",
  },
  {
    name: "Creative Arts",
    count: 7,
    blurb: "Photoshop, Illustrator, CorelDRAW, Blender, Photography.",
  },
]

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">
            CAD Desk Guwahati
          </span>
          <Button asChild size="sm">
            <Link href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
              Chat on WhatsApp
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto w-full max-w-5xl px-6 py-16 text-center">
        <Badge variant="secondary" className="mb-4">
          Noonmati, Guwahati
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          CAD/CAM &amp; IT Training Institute
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          CAD Desk Guwahati offers 66+ industry-oriented courses across Civil
          &amp; Architecture, Mechanical, Electrical, CS/IT, and Creative
          Arts &mdash; with certification and hands-on training at our
          Noonmati centre.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
              Enquire on WhatsApp
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="tel:+919127281610">Call Us</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-16">
        <h2 className="mb-6 text-xl font-semibold">Course Categories</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <Card key={cat.name}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  {cat.name}
                  <Badge variant="outline">{cat.count} courses</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {cat.blurb}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="mt-auto border-t bg-background">
        <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">
            CAD Desk Guwahati &mdash; NEEED ASSOCIATES
          </p>
          <p className="mt-1">
            Near Axom Jatiya Vidyalaya, Noonmati, Kamrup Metro, Guwahati,
            Assam 781020
          </p>
          <p className="mt-1">
            WhatsApp / Phone:{" "}
            <Link href="tel:+919127281610" className="underline">
              +91 91272 81610
            </Link>
          </p>
          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="underline">
              Terms of Service
            </Link>
            <Link href="/data-deletion" className="underline">
              Data Deletion
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
