'use client'

import { useState, useMemo, Fragment } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ChurchReport, REGIONS, calculateTotalRevenue, calculateTotalExpense, calculateBalance, formatUSD } from '@/lib/data'
import { Search, Filter, ChevronDown, ChevronUp } from 'lucide-react'

interface ReportTableProps {
  reports: ChurchReport[]
}

export function ReportTable({ reports }: ReportTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch = report.churchName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRegion = selectedRegion === 'all' || report.region === selectedRegion
      return matchesSearch && matchesRegion
    })
  }, [reports, searchTerm, selectedRegion])

  const regions = useMemo(() => {
    const uniqueRegions = [...new Set(reports.map((r) => r.region))]
    return uniqueRegions.sort()
  }, [reports])

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-xl text-gray-900">Relatóriu Igreja</CardTitle>
            <CardDescription>
              Lista relatóriu finanseiru husi igreja hotu-hotu
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buka Igreja..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full sm:w-48"
              />
            </div>
            {/* Region Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Região" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Região Hotu</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700 w-10"></TableHead>
                <TableHead className="font-semibold text-gray-700">Igreja</TableHead>
                <TableHead className="font-semibold text-gray-700">Região</TableHead>
                <TableHead className="font-semibold text-gray-700">Fulan</TableHead>
                <TableHead className="font-semibold text-gray-700">Tinan</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Osan Tama</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Gastu</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    La hetan relatóriu
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((report) => {
                  const revenue = calculateTotalRevenue(report)
                  const expense = calculateTotalExpense(report)
                  const balance = calculateBalance(report)
                  const isExpanded = expandedRows.has(report.id)

                  return (
                    <Fragment key={report.id}>
                      <TableRow className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleRow(report.id)}>
                        <TableCell className="w-10">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">
                          {report.churchName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                            {report.region}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">{report.month}</TableCell>
                        <TableCell className="text-gray-600">{report.year}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatUSD(revenue)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-red-600">
                          {formatUSD(expense)}
                        </TableCell>
                        <TableCell className={`text-right font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatUSD(balance)}
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded Details */}
                      {isExpanded && (
                        <TableRow className="bg-gray-50">
                          <TableCell colSpan={8} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Osan Tama Details */}
                              <div>
                                <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                  Osan Tama Detalle
                                </h4>
                                <div className="space-y-1">
                                  {report.osanTama.map((entry) => (
                                    <div key={entry.id} className="flex justify-between text-sm bg-white p-2 rounded">
                                      <span className="text-gray-700">{entry.deskrisaun}</span>
                                      <span className="font-medium text-green-600">{formatUSD(entry.montante)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Gastu Details */}
                              <div>
                                <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                  Gastu Detalle
                                </h4>
                                <div className="space-y-1">
                                  {report.gastu.map((entry) => (
                                    <div key={entry.id} className="flex justify-between text-sm bg-white p-2 rounded">
                                      <span className="text-gray-700">{entry.gastuBaSaida}</span>
                                      <span className="font-medium text-red-600">{formatUSD(entry.montante)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-500">
          Hatudu {filteredReports.length} husi {reports.length} relatóriu
        </div>
      </CardContent>
    </Card>
  )
}
