'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ChurchReport, OsanTamaEntry, GastuEntry, REGIONS, MONTHS, generateId, calculateTotalRevenue, calculateTotalExpense, calculateBalance, formatUSD } from '@/lib/data'
import { SummaryCard } from './SummaryCard'
import { TrendingUp, TrendingDown, Wallet, Plus, CheckCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface ReportFormProps {
  onSubmit?: (report: ChurchReport) => void
}

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

export function ReportForm({ onSubmit }: ReportFormProps) {
  const [formData, setFormData] = useState<Partial<ChurchReport>>({
    churchName: '',
    region: '',
    month: '',
    year: currentYear,
    osanTama: [],
    gastu: [],
  })

  const [submitted, setSubmitted] = useState(false)

  const totalRevenue = useMemo(() => calculateTotalRevenue(formData), [formData])
  const totalExpense = useMemo(() => calculateTotalExpense(formData), [formData])
  const balance = useMemo(() => calculateBalance(formData), [formData])

  // Osan Tama handlers
  const addOsanTamaEntry = () => {
    const newEntry: OsanTamaEntry = {
      id: generateId(),
      deskrisaun: '',
      montante: 0,
    }
    setFormData((prev) => ({
      ...prev,
      osanTama: [...(prev.osanTama || []), newEntry],
    }))
  }

  const updateOsanTamaEntry = (id: string, field: keyof OsanTamaEntry, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      osanTama: prev.osanTama?.map((entry) =>
        entry.id === id ? { ...entry, [field]: field === 'montante' ? parseFloat(value as string) || 0 : value } : entry
      ),
    }))
  }

  const removeOsanTamaEntry = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      osanTama: prev.osanTama?.filter((entry) => entry.id !== id),
    }))
  }

  // Gastu handlers
  const addGastuEntry = () => {
    const newEntry: GastuEntry = {
      id: generateId(),
      gastuBaSaida: '',
      montante: 0,
    }
    setFormData((prev) => ({
      ...prev,
      gastu: [...(prev.gastu || []), newEntry],
    }))
  }

  const updateGastuEntry = (id: string, field: keyof GastuEntry, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      gastu: prev.gastu?.map((entry) =>
        entry.id === id ? { ...entry, [field]: field === 'montante' ? parseFloat(value as string) || 0 : value } : entry
      ),
    }))
  }

  const removeGastuEntry = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      gastu: prev.gastu?.filter((entry) => entry.id !== id),
    }))
  }

  const handleSubmit = () => {
    if (!formData.churchName || !formData.region || !formData.month || !formData.year) {
      toast.error('Preenche dados hotu-hotu', {
        description: 'Favor prenche naran igreja, região, fulan no tinan',
      })
      return
    }

    const newReport: ChurchReport = {
      id: generateId(),
      churchName: formData.churchName!,
      region: formData.region!,
      month: formData.month!,
      year: formData.year!,
      osanTama: formData.osanTama || [],
      gastu: formData.gastu || [],
    }

    onSubmit?.(newReport)
    setSubmitted(true)
    toast.success('Relatóriu konklui!', {
      description: `Dadus ba ${formData.churchName} tau ona`,
    })

    // Reset form after short delay
    setTimeout(() => {
      setFormData({
        churchName: '',
        region: '',
        month: '',
        year: currentYear,
        osanTama: [],
        gastu: [],
      })
      setSubmitted(false)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* Main Form Card */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">Form Relatóriu Finanseiru</CardTitle>
          <CardDescription>
            Hatama relatóriu finanseiru ba igreja ida
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Church Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Informasaun Igreja
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="churchName">Naran Igreja</Label>
                <Input
                  id="churchName"
                  placeholder="Hatan: Igreja Baucau Centro"
                  value={formData.churchName || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, churchName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Região</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, region: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Hili Região" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="month">Fulan</Label>
                <Select
                  value={formData.month}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, month: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Hili Fulan" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month) => (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Tinan</Label>
                <Select
                  value={formData.year?.toString()}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, year: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Hili Tinan" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Revenue Section - Dynamic */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wide flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Osan Tama (Receita)
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOsanTamaEntry}
                className="text-green-600 border-green-300 hover:bg-green-50"
              >
                <Plus className="w-4 h-4 mr-1" />
                Aumenta Osan Tama
              </Button>
            </div>

            {/* Dynamic entries */}
            <div className="space-y-3">
              {formData.osanTama && formData.osanTama.length > 0 ? (
                formData.osanTama.map((entry, index) => (
                  <div key={entry.id} className="flex gap-3 items-start bg-green-50 p-3 rounded-lg border border-green-100">
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs text-green-700">Deskrisaun</Label>
                      <Input
                        placeholder="Hatan: Persembahan Minggu, Perpuluhan..."
                        value={entry.deskrisaun}
                        onChange={(e) => updateOsanTamaEntry(entry.id, 'deskrisaun', e.target.value)}
                      />
                    </div>
                    <div className="w-40 space-y-2">
                      <Label className="text-xs text-green-700">Montante (USD)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={entry.montante || ''}
                          onChange={(e) => updateOsanTamaEntry(entry.id, 'montante', e.target.value)}
                          className="pl-7"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOsanTamaEntry(entry.id)}
                      className="mt-6 text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500 text-sm">Klik "Aumenta Osan Tama" atu hatama dados</p>
                </div>
              )}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-right">
              <span className="text-sm text-green-700">Total Osan Tama: </span>
              <span className="font-bold text-green-700">{formatUSD(totalRevenue)}</span>
            </div>
          </div>

          <Separator />

          {/* Expense Section - Dynamic */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wide flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Gastu (Despesa)
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addGastuEntry}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Plus className="w-4 h-4 mr-1" />
                Aumenta Gastu
              </Button>
            </div>

            {/* Dynamic entries */}
            <div className="space-y-3">
              {formData.gastu && formData.gastu.length > 0 ? (
                formData.gastu.map((entry, index) => (
                  <div key={entry.id} className="flex gap-3 items-start bg-red-50 p-3 rounded-lg border border-red-100">
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs text-red-700">Gastu ba Saida</Label>
                      <Input
                        placeholder="Hatan: Lista Kirista, Operasional, Materia..."
                        value={entry.gastuBaSaida}
                        onChange={(e) => updateGastuEntry(entry.id, 'gastuBaSaida', e.target.value)}
                      />
                    </div>
                    <div className="w-40 space-y-2">
                      <Label className="text-xs text-red-700">Montante (USD)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={entry.montante || ''}
                          onChange={(e) => updateGastuEntry(entry.id, 'montante', e.target.value)}
                          className="pl-7"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeGastuEntry(entry.id)}
                      className="mt-6 text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500 text-sm">Klik "Aumenta Gastu" atu hatama dados</p>
                </div>
              )}
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-right">
              <span className="text-sm text-red-700">Total Gastu: </span>
              <span className="font-bold text-red-700">{formatUSD(totalExpense)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              disabled={submitted}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              {submitted ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Relatóriu Konklui
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Hatama Relatóriu
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          title="Total Osan Tama"
          amount={totalRevenue}
          icon={TrendingUp}
          variant="success"
        />
        <SummaryCard
          title="Total Gastu"
          amount={totalExpense}
          icon={TrendingDown}
          variant="danger"
        />
        <SummaryCard
          title="Saldo"
          amount={balance}
          icon={Wallet}
          variant={balance >= 0 ? 'success' : 'danger'}
        />
      </div>
    </div>
  )
}
