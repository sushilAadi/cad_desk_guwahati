"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  MotionNavigationMenu,
  NavigationBar,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuViewport,
} from "@/components/ui/motion-navigation-menu"
import { CoursesMegaMenu } from "@/components/nav/courses-mega-menu"
import { RegistrationEnquiryMenuContent } from "@/components/nav/registration-enquiry-menu-content"
import { ContactMenuContent } from "@/components/nav/contact-menu-content"
import { TopBar } from "@/components/nav/top-bar"
import { FrameToggle } from "@/components/nav/frame-toggle"
import { ThemeToggle } from "@/components/nav/theme-toggle"
import { MobileNavDrawer } from "@/components/nav/mobile-nav-drawer"
import type { PublicCourse } from "@/lib/public-courses"

interface CategoryGroup {
  category: string
  courses: PublicCourse[]
}

interface SiteHeaderProps {
  groups: CategoryGroup[]
  totalCount: number
}

export function SiteHeader({ groups, totalCount }: SiteHeaderProps) {
  const router = useRouter()
  const megaMenuItems = [
    {
      id: "courses",
      content: (
        <CoursesMegaMenu
          groups={groups}
          totalCount={totalCount}
          onSelectCategory={(cat) => router.push(cat ? `/courses?track=${encodeURIComponent(cat)}` : "/courses")}
          onOpenCatalog={() => router.push("/courses")}
        />
      ),
    },
    {
      id: "register",
      content: <RegistrationEnquiryMenuContent />,
    },
    {
      id: "contact",
      content: <ContactMenuContent />,
    },
  ]

  return (
    // the top bar and the header pin together as one block
    <div data-site-header style={{ viewTransitionName: "site-header" }} className="sticky top-0 z-50 w-full">
    <TopBar />
    <header className="relative w-full border-b border-line bg-paper">
      <MotionNavigationMenu topGap={0} roundedStyle="none">
        <NavigationBar className="mx-auto w-full max-w-[1640px] px-5 md:px-[60px] lg:px-[100px]">
          {/* Brand */}
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-sans text-lg font-medium text-ink">CAD Desk</span>
            <span className="hidden text-xs text-ink-3 sm:inline">Guwahati</span>
          </Link>

          {/* Navigation Items */}
          <NavigationMenuList className="hidden md:flex">
            <NavigationMenuItem id="courses" title="Courses" badge={`${totalCount}`} onClick={() => router.push("/courses")} />
            <NavigationMenuItem id="register" title="Registration / Enquiry" />
            <NavigationMenuItem id="contact" title="Contact Us" />
          </NavigationMenuList>

          {/* Action Button (desktop) + Hamburger (mobile) */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <FrameToggle />
            <Link
              href="/enquiry"
              className="hidden h-9 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand/90 sm:inline-flex"
            >
              Enquire
            </Link>
            <MobileNavDrawer groups={groups} totalCount={totalCount} />
          </div>
        </NavigationBar>

        {/* Dropdown Menu Viewport taking full width */}
        <NavigationMenuViewport items={megaMenuItems} />
      </MotionNavigationMenu>
    </header>
    </div>
  )
}
