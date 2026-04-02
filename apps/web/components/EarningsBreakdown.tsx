"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface EarningsBreakdownProps {
  earnings: {
    byLevel: Array<{
      level: number
      percentage: string
      count: number
      earned: string
    }>
    total: string
  }
}

export function EarningsBreakdown({ earnings }: EarningsBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission Earnings</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Level</TableHead>
              <TableHead>Count</TableHead>
              <TableHead>Earnings</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {earnings.byLevel.map((level) => (
              <TableRow key={level.level}>
                <TableCell>
                  <Badge variant={level.level === 1 ? 'default' : 'secondary'}>
                    G{level.level} ({level.percentage}%)
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{level.count}</TableCell>
                <TableCell className="font-medium text-primary">
                  {level.earned} USDT
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t-2">
              <TableCell colSpan={2} className="font-bold">
                Total
              </TableCell>
              <TableCell className="font-bold text-primary text-lg">
                {earnings.total} USDT
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
