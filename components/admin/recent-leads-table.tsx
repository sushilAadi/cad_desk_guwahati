import { PhoneCall } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Lead, LeadStatus } from "@/lib/types"

const statusVariant: Record<
  LeadStatus,
  "default" | "secondary" | "outline" | "success" | "warning" | "destructive"
> = {
  New: "secondary",
  Contacted: "outline",
  "Counseling Scheduled": "warning",
  Enrolled: "success",
  Lost: "destructive",
}

export function RecentLeadsTable({ leads }: { leads: Lead[] }) {
  if (leads.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No enquiries captured yet.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead>Course</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Captured</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">{lead.name}</span>
                <span className="text-muted-foreground text-xs">{lead.phone}</span>
              </div>
            </TableCell>
            <TableCell className="text-sm">{lead.courseTitle ?? "—"}</TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {lead.category ?? "—"}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1.5">
                <Badge variant={statusVariant[lead.status]}>{lead.status}</Badge>
                {lead.callbackRequested ? (
                  <PhoneCall className="text-muted-foreground size-3.5" />
                ) : null}
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground text-right text-xs">
              {new Date(lead.createdAt).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
