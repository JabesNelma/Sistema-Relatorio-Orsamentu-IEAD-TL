'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'

interface RoleCardProps {
  icon: LucideIcon
  title: string
  description: string
  href: string
}

export function RoleCard({ icon: Icon, title, description, href }: RoleCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-blue-300">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
          <Icon className="w-8 h-8 text-blue-600" />
        </div>
        <CardTitle className="text-xl text-gray-900">{title}</CardTitle>
        <CardDescription className="text-gray-600">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Link href={href}>
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Tama
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
