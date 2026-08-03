import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Data Deletion | CAD Desk Guwahati",
  description: "How to request deletion of your data from CAD Desk Guwahati.",
}

export default function DataDeletionPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Data Deletion Instructions</h1>
      <p className="text-muted-foreground mt-2 text-sm">Last updated: August 2026</p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed">
        <p>
          If you&apos;ve messaged our WhatsApp assistant or submitted an enquiry through our website,
          you can ask us to delete your personal data (your name, phone number, and any enquiry or
          message history we&apos;ve stored) at any time.
        </p>

        <section>
          <h2 className="font-medium">How to request deletion</h2>
          <p className="mt-2">
            Send us a WhatsApp message saying &quot;Delete my data&quot; from the same number you used to
            contact us, and our team will remove your enquiry and conversation records from our
            database. You can also visit our Noonmati centre in person and make the same request to
            our staff.
          </p>
        </section>

        <section>
          <h2 className="font-medium">What gets deleted</h2>
          <p className="mt-2">
            We&apos;ll delete your name, phone number, course enquiry details, and WhatsApp
            conversation history from our systems. If you&apos;ve already enrolled in a course, we may
            need to retain your enrollment records for as long as required for administrative or
            legal record-keeping, even after a deletion request — we&apos;ll let you know if that
            applies to you.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Processing time</h2>
          <p className="mt-2">
            We aim to process deletion requests within a few business days and will confirm once
            it&apos;s done.
          </p>
        </section>
      </div>
    </main>
  )
}
