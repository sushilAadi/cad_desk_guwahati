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
import { GraduationCap } from "lucide-react"

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
    <header className="sticky top-0 z-50 w-full max-w-6xl mx-auto px-4 pt-4 bg-background/95 backdrop-blur">
      <MotionNavigationMenu topGap={16} roundedStyle="none">
        <NavigationBar>
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 cursor-pointer">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 via-amber-600 to-amber-400 text-zinc-950 shadow-md font-extrabold">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-wider uppercase text-zinc-900">
                  CAD DESK
                </span>
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                  {totalCount}+ Courses
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 -mt-0.5 tracking-tight hidden sm:inline">
                Guwahati, Noonmati
              </span>
            </div>
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
              className="hidden sm:inline-flex items-center rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors"
            >
              Chat on WhatsApp
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
