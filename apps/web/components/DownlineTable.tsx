"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'

interface DownlineUser {
  id: string
  wallet_address: string
  created: string
  egg_purchases: number
  food_purchases: number
  earned_for_you: string
}

interface DownlineTableProps {
  downline: DownlineUser[]
}

const truncateAddress = (address: string) => {
  if (!address) return 'Unknown'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function DownlineTable({ downline }: DownlineTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Direct Recruits
        </CardTitle>
        <CardDescription>
          Users you directly referred (G1)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {downline.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <Users className="w-16 h-16 mx-auto text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No recruits yet</h3>
              <p className="text-muted-foreground">
                Share your referral link to start building your downline
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Wallet</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Egg Purchases</TableHead>
                <TableHead>Food Purchases</TableHead>
                <TableHead>Your Earnings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {downline.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-sm">
                    <Badge variant="outline">
                      {truncateAddress(user.wallet_address)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDate(user.created)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {user.egg_purchases}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {user.food_purchases}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-primary">
                    {user.earned_for_you} USDT
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
