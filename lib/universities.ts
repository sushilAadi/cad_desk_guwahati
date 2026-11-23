// Universities where CAD Desk has trained students and received appreciation letters (home page).
// Logo files go in public/images/universities/<id>.png; a tile without a file shows a lettered badge.
export type University = {
  id: string
  name: string
  short: string
  place: string
  /** logo is white on transparent, so it sits on a navy circle */
  dark?: boolean
  /** Appreciation letter image, e.g. "/images/appreciation/iitg.jpg". Set it and the logo shows the letter on hover and opens /appreciation/<id> on click. */
  letter?: string
}

export const UNIVERSITIES: University[] = [
  { id: "iitg", name: "Indian Institute of Technology Guwahati", short: "IIT Guwahati", place: "Guwahati" },
  { id: "nits", name: "National Institute of Technology Silchar", short: "NIT Silchar", place: "Silchar" },
  { id: "iiitg", name: "Indian Institute of Information Technology Guwahati", short: "IIIT Guwahati", place: "Guwahati" },
  { id: "tezu", name: "Tezpur University", short: "Tezpur University", place: "Tezpur" },
  { id: "astu", name: "Assam Science and Technology University", short: "ASTU", place: "Guwahati" },
  { id: "guist", dark: true, name: "Gauhati University, Institute of Science and Technology", short: "GUIST", place: "Guwahati" },
  { id: "duiet", name: "Dibrugarh University, Institute of Engineering and Technology", short: "DUIET", place: "Dibrugarh" },
  { id: "aus", name: "Assam University, Triguna Sen School of Technology", short: "Assam University", place: "Silchar" },
  { id: "adbu", name: "Assam Don Bosco University", short: "ADBU", place: "Guwahati" },
  { id: "adtu", name: "Assam down town University", short: "AdtU", place: "Guwahati" },
]
