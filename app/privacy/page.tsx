import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | CAD Desk Guwahati",
  description: "How CAD Desk Guwahati (Noonmati Centre) collects and uses your data.",
}

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="text-muted-foreground mt-2 text-sm">Last updated: August 2026</p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed">
        <p>
          CAD Desk Guwahati (Noonmati Centre) (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates
          a WhatsApp-based course enquiry assistant and this website. This policy explains what
          information we collect when you contact us — over WhatsApp, our website, or in person —
          and how we use it.
        </p>

        <section>
          <h2 className="font-medium">Information we collect</h2>
          <p className="mt-2">
            When you message our WhatsApp number, we collect your name, phone number, the course
            or category you&apos;re interested in, and the content of your messages. If you use our
            website enquiry form, we may additionally collect your email address, address,
            qualification, and preferred batch timing. If you register for a course in person, we
            collect the details required for enrollment (name, date of birth, contact address,
            qualification, and related admission records).
          </p>
        </section>

        <section>
          <h2 className="font-medium">How we use your information</h2>
          <p className="mt-2">
            We use this information to respond to your course enquiries, answer questions about
            our programs, follow up with a callback when requested, and, if you enroll, to manage
            your registration. We do not display or quote course fees over WhatsApp — fee and
            scholarship details are shared personally during counseling at our Noonmati centre.
          </p>
        </section>

        <section>
          <h2 className="font-medium">How your WhatsApp messages are processed</h2>
          <p className="mt-2">
            Messages sent to our WhatsApp number are delivered through Meta&apos;s WhatsApp Business
            Platform and processed by Google&apos;s Gemini AI to generate replies and identify course
            interest. Your enquiry details are then stored in our secure database (Supabase) so our
            counseling team can follow up. We do not use your WhatsApp messages for advertising or
            share them with unrelated third parties.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Data retention</h2>
          <p className="mt-2">
            We retain enquiry and registration records for as long as reasonably needed to respond
            to you, run our admissions process, and meet our own record-keeping needs, after which
            it may be archived or deleted.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Your choices</h2>
          <p className="mt-2">
            You can ask us to access, correct, or delete the personal data we hold about you at any
            time. See our{" "}
            <a href="/data-deletion" className="underline">
              data deletion page
            </a>{" "}
            for how to request this.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Contact us</h2>
          <p className="mt-2">
            For any privacy questions, message us on WhatsApp or visit us at our Noonmati centre in
            Guwahati.
          </p>
        </section>
      </div>
    </main>
  )
}
