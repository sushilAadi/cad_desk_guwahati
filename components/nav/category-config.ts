// Static display metadata for each course category shown in the mega menu.
// Course/category *data* (titles, counts, captions) comes from Supabase —
// this file only holds the fixed visual chrome (slogan, image, icon, color)
// for the 5 known category names, mirroring the reference design 1:1.

export interface CategoryDisplayMeta {
  slogan: string
  description: string
  image: string
  iconName: "Building2" | "Code" | "Cpu" | "Palette" | "Zap" | "BookOpen"
}

export const CATEGORY_DISPLAY: Record<string, CategoryDisplayMeta> = {
  "Civil / Architecture": {
    slogan: "Design. Build. Inspire.",
    description: "AutoCAD, Revit, STAAD Pro, Civil 3D, Tekla, SketchUp & BIM",
    image: "/images/categories/civil.jpg",
    iconName: "Building2",
  },
  "CS/IT": {
    slogan: "Code. Innovate. Transform.",
    description: "Data Science, Python, Java, C++, Cyber Security & Web Design",
    image: "/images/categories/cs-it.jpg",
    iconName: "Code",
  },
  Mechanical: {
    slogan: "Design. Develop. Deliver.",
    description: "NX CAD, SOLIDWORKS, Creo, CATIA, Fusion 360, ANSYS WB & CNC",
    image: "/images/categories/mechanical.jpg",
    iconName: "Cpu",
  },
  "Creative Arts": {
    slogan: "Create. Imagine. Express.",
    description: "Photoshop, Illustrator, CorelDRAW, Blender & Photography",
    image: "/images/categories/creative-arts.jpg",
    iconName: "Palette",
  },
  Electrical: {
    slogan: "Power. Connect. Innovate.",
    description: "AutoCAD Electrical, Revit MEP, ETAP, EPLAN & PLC Automation",
    image: "/images/categories/electrical.jpg",
    iconName: "Zap",
  },
}

export const DEFAULT_CATEGORY_DISPLAY: CategoryDisplayMeta = {
  slogan: "Learn. Build. Grow.",
  description: "Practical, project-based training",
  image: "/images/categories/civil.jpg",
  iconName: "BookOpen",
}

export function getCategoryDisplay(name: string): CategoryDisplayMeta {
  return CATEGORY_DISPLAY[name] ?? DEFAULT_CATEGORY_DISPLAY
}
