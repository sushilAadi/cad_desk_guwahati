import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | CAD Desk Guwahati",
  description: "Terms for using the CAD Desk Guwahati WhatsApp assistant and website.",
}

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="text-muted-foreground mt-2 text-sm">Last updated: August 2026</p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed">
        <p>
          These terms apply to your use of CAD Desk Guwahati&apos;s (Noonmati Centre) WhatsApp
          assistant and website. By messaging our WhatsApp number or using our website, you agree
          to these terms.
        </p>

        <section>
          <h2 className="font-medium">What our WhatsApp assistant does</h2>
          <p className="mt-2">
            Our WhatsApp assistant is an automated, AI-powered tool that answers questions about
            our courses, categories, and admissions process, and helps route your enquiry to our
            counseling team. It is provided for informational purposes and does not replace advice
            from our staff.
          </p>
        </section>

        <section>
          <h2 className="font-medium">No course fees quoted automatically</h2>
          <p className="mt-2">
            Our assistant does not display or quote course fees, discounts, or scholarship amounts.
            All fee and scholarship information is provided personally during 1-on-1 counseling at
            our Noonmati centre.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Payments</h2>
          <p className="mt-2">
            At present, our WhatsApp assistant does not process payments or generate payment links.
            If this changes in the future, any payment link will only be generated with your
            explicit request and will be clearly identified before you pay.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Accuracy</h2>
          <p className="mt-2">
            We aim to keep course information accurate, but course availability, curriculum, and
            schedules may change. Please confirm details with our counseling team before making
            decisions based solely on the WhatsApp assistant&apos;s responses.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Changes</h2>
          <p className="mt-2">
            We may update these terms from time to time; continued use of our WhatsApp assistant or
            website after changes means you accept the updated terms.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Contact us</h2>
          <p className="mt-2">
            Questions about these terms can be sent to us via WhatsApp or in person at our Noonmati
            centre in Guwahati.
          </p>
        </section>
      </div>
    </main>
  )
}
