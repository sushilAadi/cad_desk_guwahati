import { SiteHeader } from "@/components/nav/site-header"
import { Storefront } from "@/components/home/storefront"
import { getPublicCourses, groupByCategory } from "@/lib/public-courses"
import { FAQ, ORG_LD, SITE_NAME } from "@/lib/site"

export const revalidate = 300

export default async function Home() {
  const courses = await getPublicCourses()
  const groups = groupByCategory(courses)

  const provider = { "@id": ORG_LD["@id"] }
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      ORG_LD,
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
      {
        "@type": "ItemList",
        name: "CAD/CAM & IT courses",
        itemListElement: courses.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Course",
            name: c.title,
            description: c.caption ?? `${c.title} training at ${SITE_NAME}`,
            provider,
          },
        })),
      },
    ],
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader groups={groups} totalCount={courses.length} />
      <Storefront groups={groups} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </div>
  )
}
