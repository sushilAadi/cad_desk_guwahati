"use client"

import Link from "next/link"
import {
  MotionNavigationMenu,
  NavigationBar,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuViewport,
} from "@/components/ui/motion-navigation-menu"
import { CoursesMegaMenu } from "@/components/nav/courses-mega-menu"
import { RegistrationMenuContent } from "@/components/nav/registration-menu-content"
import { EnquiryMenuContent } from "@/components/nav/enquiry-menu-content"
import { ContactMenuContent } from "@/components/nav/contact-menu-content"
import { MobileNavDrawer } from "@/components/nav/mobile-nav-drawer"
import type { PublicCourse } from "@/lib/public-courses"

const WHATSAPP_NUMBER = "919127281610"
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi! I'd like to know more about courses at CAD Desk Guwahati."
)}`

interface CategoryGroup {
  category: string
  courses: PublicCourse[]
}

interface SiteHeaderProps {
  groups: CategoryGroup[]
  totalCount: number
}

function scrollToCourses() {
  document.getElementById("courses")?.scrollIntoView({ behavior: "smooth" })
}

export function SiteHeader({ groups, totalCount }: SiteHeaderProps) {
  const megaMenuItems = [
    {
      id: "courses",
      content: (
        <CoursesMegaMenu
          groups={groups}
          totalCount={totalCount}
          onSelectCategory={() => scrollToCourses()}
          onOpenCatalog={() => scrollToCourses()}
        />
      ),
    },
    {
      id: "registration",
      content: <RegistrationMenuContent />,
    },
    {
      id: "enquiry",
      content: <EnquiryMenuContent />,
    },
    {
      id: "contact",
      content: <ContactMenuContent />,
    },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-paper">
      <MotionNavigationMenu topGap={0} roundedStyle="none">
        <NavigationBar className="mx-auto w-full max-w-[1640px] px-5 md:px-[60px] lg:px-[100px]">
          {/* Brand */}
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-lg font-medium text-ink">CAD Desk</span>
            <span className="hidden font-mono text-xs text-ink-3 sm:inline">Guwahati</span>
          </Link>

          {/* Navigation Items */}
          <NavigationMenuList className="hidden md:flex">
            <NavigationMenuItem id="courses" title="Courses" badge={`${totalCount}`} />
            <NavigationMenuItem id="registration" title="Registration" />
            <NavigationMenuItem id="enquiry" title="Enquiry Desk" />
            <NavigationMenuItem id="contact" title="Contact Us" />
          </NavigationMenuList>

          {/* Action Button (desktop) + Hamburger (mobile) */}
          <div className="flex items-center gap-2">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-9 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand/90 sm:inline-flex"
            >
              Enquire
            </a>
            <MobileNavDrawer groups={groups} totalCount={totalCount} />
          </div>
        </NavigationBar>

        {/* Dropdown Menu Viewport taking full width */}
        <NavigationMenuViewport items={megaMenuItems} />
      </MotionNavigationMenu>
    </header>
  )
}
