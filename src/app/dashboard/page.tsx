"use client"

import { useState, useEffect } from "react"
import { Plus, Truck, Clock, MapPin, Calendar, Fuel, Package2, Coffee, Wrench, CheckCircle2, XCircle, TrendingUp, AlertCircle, Crown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { loadStripe } from '@stripe/stripe-js'
import { useSearchParams } from 'next/navigation'
import { toast } from "sonner"

interface InicioDia {
  data: string
  horaInicio: string
  pais: string
  kmInicial: number
  ultimoDescanso: string
  amplitude: string
  checkupCaminhao: boolean
  checkupReboque: boolean
}

interface Evento {
  id: string
  tipo: "saida" | "pausa" | "carregamento" | "abastecimento" | "descarregamento"
  horario: string
  local: string
  observacao?: string
}

interface FimDia {
  data: string
  horaFim: string
  pais: string
  kmFinal: number
  proximoDescanso: string
  observacoes: string
}

interface JornadaDiaria {
  id: string
  inicioDia: InicioDia
  eventos: Evento[]
  fimDia: FimDia | null
  status: "em_andamento" | "concluida"
  criadoEm: string
}

export default function Dashboard() {
  const searchParams = useSearchParams()
  const [jornadas, setJornadas] = useState<JornadaDiaria[]>([])
  const [dialogNovaJornada, setDialogNovaJornada] = useState(false)
  const [dialogEvento, setDialogEvento] = useState(false)
  const [dialogFimDia, setDialogFimDia] = useState(false)
  const [dialogLimiteGratuito, setDialogLimiteGratuito] = useState(false)
  const [jornadaSelecionada, setJornadaSelecionada] = useState<string | null>(null)
  const [checkupCaminhao, setCheckupCaminhao] = useState(false)
  const [checkupReboque, setCheckupReboque] = useState(false)
  const [erroCheckup, setErroCheckup] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [dataLimiteGratuito, setDataLimiteGratuito] = useState<string | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [processandoPagamento, setProcessandoPagamento] = useState(false)
  const [planoSelecionado, setPlanoSelecionado] = useState<'mensal' | 'anual'>('mensal')

  // Detectar horário e aplicar tema automaticamente
  useEffect(() => {
    const verificarHorario = () => {
      const horaAtual = new Date().getHours()
      // Modo escuro entre 18h (6 PM) e 6h (6 AM)
      const deveSerEscuro = horaAtual >= 18 || horaAtual < 6
      setIsDarkMode(deveSerEscuro)
    }

    // Verificar imediatamente
    verificarHorario()

    // Verificar a cada minuto
    const intervalo = setInterval(verificarHorario, 60000)

    return () => clearInterval(intervalo)
  }, [])

  // Verificar status do pagamento na URL
  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')

    if (success === 'true') {
      toast.success('Pagamento realizado com sucesso! Bem-vindo ao Premium! 🎉')
      localStorage.setItem("premium-status", "true")
      setIsPremium(true)
      // Limpar URL
      window.history.replaceState({}, '', '/dashboard')
    }

    if (canceled === 'true') {
      toast.error('Pagamento cancelado. Você pode tentar novamente quando quiser.')
      // Limpar URL
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [searchParams])

  // Carregar jornadas do localStorage
  useEffect(() => {
    const jornadasSalvas = localStorage.getItem("jornadas-caminhoneiro")
    if (jornadasSalvas) {
      setJornadas(JSON.parse(jornadasSalvas))
    }

    const premiumStatus = localStorage.getItem("premium-status")
    const limiteData = localStorage.getItem("limite-gratuito-data")
    
    if (premiumStatus === "true") {
      setIsPremium(true)
    }
    
    if (limiteData) {
      setDataLimiteGratuito(limiteData)
    }
  }, [])

  // Salvar jornadas no localStorage
  useEffect(() => {
    if (jornadas.length > 0) {
      localStorage.setItem("jornadas-caminhoneiro", JSON.stringify(jornadas))
    }
  }, [jornadas])

  // Verificar limite de jornadas gratuitas
  const verificarLimiteGratuito = (): boolean => {
    if (isPremium) return true

    const jornadasConcluidas = jornadas.filter(j => j.status === "concluida")
    
    if (jornadasConcluidas.length >= 5) {
      if (dataLimiteGratuito) {
        const dataLimite = new Date(dataLimiteGratuito)
        const hoje = new Date()
        const diasPassados = Math.floor((hoje.getTime() - dataLimite.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diasPassados >= 30) {
          localStorage.removeItem("limite-gratuito-data")
          setDataLimiteGratuito(null)
          return true
        }
      } else {
        const hoje = new Date().toISOString()
        localStorage.setItem("limite-gratuito-data", hoje)
        setDataLimiteGratuito(hoje)
      }
      
      return false
    }
    
    return true
  }

  const calcularDiasRestantes = (): number => {
    if (!dataLimiteGratuito) return 30
    
    const dataLimite = new Date(dataLimiteGratuito)
    const hoje = new Date()
    const diasPassados = Math.floor((hoje.getTime() - dataLimite.getTime()) / (1000 * 60 * 60 * 24))
    const diasRestantes = 30 - diasPassados
    
    return diasRestantes > 0 ? diasRestantes : 0
  }

  const iniciarJornada = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!checkupCaminhao || !checkupReboque) {
      setErroCheckup(true)
      return
    }

    if (!verificarLimiteGratuito()) {
      setDialogNovaJornada(false)
      setDialogLimiteGratuito(true)
      return
    }

    setErroCheckup(false)
    const formData = new FormData(e.currentTarget)
    
    const novaJornada: JornadaDiaria = {
      id: Date.now().toString(),
      inicioDia: {
        data: formData.get("dataInicio") as string,
        horaInicio: formData.get("horaInicio") as string,
        pais: formData.get("paisInicio") as string,
        kmInicial: Number(formData.get("kmInicial")),
        ultimoDescanso: formData.get("ultimoDescanso") as string,
        amplitude: formData.get("amplitude") as string,
        checkupCaminhao: checkupCaminhao,
        checkupReboque: checkupReboque
      },
      eventos: [],
      fimDia: null,
      status: "em_andamento",
      criadoEm: new Date().toISOString()
    }
    
    setJornadas([novaJornada, ...jornadas])
    setDialogNovaJornada(false)
    setCheckupCaminhao(false)
    setCheckupReboque(false)
    e.currentTarget.reset()
  }

  const adicionarEvento = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const novoEvento: Evento = {
      id: Date.now().toString(),
      tipo: formData.get("tipoEvento") as Evento["tipo"],
      horario: formData.get("horarioEvento") as string,
      local: formData.get("localEvento") as string,
      observacao: formData.get("observacaoEvento") as string
    }
    
    setJornadas(jornadas.map(j => 
      j.id === jornadaSelecionada 
        ? { ...j, eventos: [...j.eventos, novoEvento] }
        : j
    ))
    
    setDialogEvento(false)
    setJornadaSelecionada(null)
    e.currentTarget.reset()
  }

  const finalizarJornada = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const fimDia: FimDia = {
      data: formData.get("dataFim") as string,
      horaFim: formData.get("horaFim") as string,
      pais: formData.get("paisFim") as string,
      kmFinal: Number(formData.get("kmFinal")),
      proximoDescanso: formData.get("proximoDescanso") as string,
      observacoes: formData.get("observacoesFim") as string
    }
    
    setJornadas(jornadas.map(j => 
      j.id === jornadaSelecionada 
        ? { ...j, fimDia, status: "concluida" }
        : j
    ))
    
    setDialogFimDia(false)
    setJornadaSelecionada(null)
    e.currentTarget.reset()
  }

  const processarPagamento = async () => {
    try {
      setProcessandoPagamento(true)

      // Criar sessão de checkout no backend
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plano: planoSelecionado }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar pagamento')
      }

      // Redirecionar para o Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error)
      toast.error('Erro ao processar pagamento. Tente novamente.')
      setProcessandoPagamento(false)
    }
  }

  const calcularKmPercorridos = (jornada: JornadaDiaria): number => {
    if (!jornada.fimDia) return 0
    return jornada.fimDia.kmFinal - jornada.inicioDia.kmInicial
  }

  const calcularHorasTrabalhadas = (jornada: JornadaDiaria): string => {
    if (!jornada.fimDia) return "Em andamento"
    
    const inicio = new Date(`${jornada.inicioDia.data}T${jornada.inicioDia.horaInicio}`)
    const fim = new Date(`${jornada.fimDia.data}T${jornada.fimDia.horaFim}`)
    
    const diffMs = fim.getTime() - inicio.getTime()
    const diffHrs = Math.floor(diffMs / 3600000)
    const diffMins = Math.floor((diffMs % 3600000) / 60000)
    
    return `${diffHrs}h ${diffMins}m`
  }

  const calcularTotalPausas = (jornada: JornadaDiaria): number => {
    return jornada.eventos.filter(e => e.tipo === "pausa").length
  }

  const calcularTotalCargas = (jornada: JornadaDiaria): number => {
    return jornada.eventos.filter(e => e.tipo === "carregamento").length
  }

  const calcularTotalDescargas = (jornada: JornadaDiaria): number => {
    return jornada.eventos.filter(e => e.tipo === "descarregamento").length
  }

  const calcularEstatisticasGerais = () => {
    const jornadasConcluidas = jornadas.filter(j => j.status === "concluida")
    
    const kmTotal = jornadasConcluidas.reduce((acc, j) => acc + calcularKmPercorridos(j), 0)
    
    let horasTotais = 0
    jornadasConcluidas.forEach(j => {
      if (j.fimDia) {
        const inicio = new Date(`${j.inicioDia.data}T${j.inicioDia.horaInicio}`)
        const fim = new Date(`${j.fimDia.data}T${j.fimDia.horaFim}`)
        const diffMs = fim.getTime() - inicio.getTime()
        horasTotais += diffMs / 3600000
      }
    })
    
    const pausasTotais = jornadasConcluidas.reduce((acc, j) => acc + calcularTotalPausas(j), 0)
    const cargasTotais = jornadasConcluidas.reduce((acc, j) => acc + calcularTotalCargas(j), 0)
    const descargasTotais = jornadasConcluidas.reduce((acc, j) => acc + calcularTotalDescargas(j), 0)
    
    return {
      kmTotal,
      horasTotais: Math.floor(horasTotais),
      pausasTotais,
      cargasTotais,
      descargasTotais
    }
  }

  const estatisticas = calcularEstatisticasGerais()

  const getEventoIcon = (tipo: Evento["tipo"]) => {
    const icons = {
      saida: <Truck className="w-4 h-4 text-blue-500" />,
      pausa: <Coffee className="w-4 h-4 text-yellow-500" />,
      carregamento: <Package2 className="w-4 h-4 text-green-500" />,
      abastecimento: <Fuel className="w-4 h-4 text-orange-500" />,
      descarregamento: <Package2 className="w-4 h-4 text-red-500" />
    }
    return icons[tipo]
  }

  const getEventoLabel = (tipo: Evento["tipo"]) => {
    const labels = {
      saida: "Saída",
      pausa: "Pausa",
      carregamento: "Carregamento",
      abastecimento: "Abastecimento",
      descarregamento: "Descarregamento"
    }
    return labels[tipo]
  }

  const jornadasEmAndamento = jornadas.filter(j => j.status === "em_andamento")
  const jornadasConcluidas = jornadas.filter(j => j.status === "concluida")

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 to-slate-800' 
        : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      {/* Header */}
      <header className={`border-b shadow-sm sticky top-0 z-50 transition-colors duration-500 ${
        isDarkMode 
          ? 'border-slate-700 bg-slate-900' 
          : 'border-slate-200 bg-white'
      }`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 rounded-xl shadow-lg">
                <Truck className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold transition-colors duration-500 ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>Controle Diário de Jornada</h1>
                <p className={`text-sm transition-colors duration-500 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>Sistema de registro para caminhoneiros</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {!isPremium && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  Plano Gratuito: {jornadasConcluidas.length}/5 jornadas
                </Badge>
              )}
              {isPremium && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600">
                  <Crown className="w-4 h-4 mr-1" />
                  Premium
                </Badge>
              )}
              <Dialog open={dialogNovaJornada} onOpenChange={setDialogNovaJornada}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Iniciar Jornada
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">INÍCIO DO DIA</DialogTitle>
                    <DialogDescription>
                      Registre as informações iniciais da jornada
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={iniciarJornada} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dataInicio" className="font-semibold">Data</Label>
                        <Input 
                          id="dataInicio" 
                          name="dataInicio" 
                          type="date" 
                          defaultValue={format(new Date(), "yyyy-MM-dd")}
                          required 
                          className="border-slate-300"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="horaInicio" className="font-semibold">Hora de Início</Label>
                        <Input 
                          id="horaInicio" 
                          name="horaInicio" 
                          type="time" 
                          defaultValue={format(new Date(), "HH:mm")}
                          required 
                          className="border-slate-300"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="paisInicio" className="font-semibold text-red-600">País de Início</Label>
                        <Input 
                          id="paisInicio" 
                          name="paisInicio" 
                          placeholder="Ex: Brasil" 
                          required 
                          className="border-slate-300"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="kmInicial" className="font-semibold">Quilometragem Inicial</Label>
                        <Input 
                          id="kmInicial" 
                          name="kmInicial" 
                          type="number" 
                          placeholder="0" 
                          required 
                          className="border-slate-300"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ultimoDescanso" className="font-semibold">Último Descanso</Label>
                        <Input 
                          id="ultimoDescanso" 
                          name="ultimoDescanso" 
                          type="datetime-local" 
                          required 
                          className="border-slate-300"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="amplitude" className="font-semibold">Amplitude</Label>
                        <Input 
                          id="amplitude" 
                          name="amplitude" 
                          placeholder="Ex: 12h" 
                          required 
                          className="border-slate-300"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3 border-2 border-orange-300 bg-orange-50 rounded-lg p-4">
                      <Label className="font-semibold text-lg text-orange-900">Check-up Obrigatório</Label>
                      <p className="text-sm text-orange-700 mb-3">
                        Você deve verificar o caminhão e o reboque antes de iniciar a jornada
                      </p>
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="checkupCaminhao" 
                            checked={checkupCaminhao}
                            onCheckedChange={(checked) => setCheckupCaminhao(checked as boolean)}
                          />
                          <label htmlFor="checkupCaminhao" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Caminhão verificado
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="checkupReboque" 
                            checked={checkupReboque}
                            onCheckedChange={(checked) => setCheckupReboque(checked as boolean)}
                          />
                          <label htmlFor="checkupReboque" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Reboque verificado
                          </label>
                        </div>
                      </div>
                      
                      {erroCheckup && (
                        <Alert variant="destructive" className="mt-3">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Atenção!</AlertTitle>
                          <AlertDescription>
                            Você deve marcar o check-up do caminhão e do reboque antes de iniciar a jornada.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button type="button" variant="outline" onClick={() => {
                        setDialogNovaJornada(false)
                        setErroCheckup(false)
                        setCheckupCaminhao(false)
                        setCheckupReboque(false)
                      }}>
                        Cancelar
                      </Button>
                      <Button type="submit" className="bg-gradient-to-r from-blue-600 to-blue-700">
                        Iniciar Jornada
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className={`shadow-md transition-colors duration-500 ${
            isDarkMode 
              ? 'bg-slate-800 border-slate-700' 
              : 'bg-white border-slate-200'
          }`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-sm font-medium transition-colors duration-500 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>Jornadas em Andamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-4xl font-bold text-blue-600">{jornadasEmAndamento.length}</span>
                <Clock className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className={`shadow-md transition-colors duration-500 ${
            isDarkMode 
              ? 'bg-slate-800 border-slate-700' 
              : 'bg-white border-slate-200'
          }`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-sm font-medium transition-colors duration-500 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>Jornadas Concluídas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-4xl font-bold text-green-600">{jornadasConcluidas.length}</span>
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className={`shadow-md transition-colors duration-500 ${
            isDarkMode 
              ? 'bg-slate-800 border-slate-700' 
              : 'bg-white border-slate-200'
          }`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-sm font-medium transition-colors duration-500 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>Total de Jornadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className={`text-4xl font-bold transition-colors duration-500 ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>{jornadas.length}</span>
                <Calendar className={`w-10 h-10 transition-colors duration-500 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas Totais */}
        <Card className={`shadow-lg mb-8 border-2 transition-colors duration-500 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-blue-800' 
            : 'bg-gradient-to-br from-blue-50 to-slate-50 border-blue-200'
        }`}>
          <CardHeader className={`border-b transition-colors duration-500 ${
            isDarkMode 
              ? 'border-slate-700 bg-slate-800/50' 
              : 'border-blue-200 bg-white/50'
          }`}>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <CardTitle className={`text-xl font-bold transition-colors duration-500 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>Estatísticas Totais</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className={`rounded-lg p-4 shadow-md border transition-colors duration-500 ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700' 
                  : 'bg-white border-slate-200'
              }`}>
                <p className={`text-xs font-semibold mb-1 transition-colors duration-500 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>Quilometragem Total</p>
                <p className="text-2xl font-bold text-blue-600">{estatisticas.kmTotal.toLocaleString()} km</p>
              </div>
              
              <div className={`rounded-lg p-4 shadow-md border transition-colors duration-500 ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700' 
                  : 'bg-white border-slate-200'
              }`}>
                <p className={`text-xs font-semibold mb-1 transition-colors duration-500 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>Horas Totais</p>
                <p className="text-2xl font-bold text-green-600">{estatisticas.horasTotais}h</p>
              </div>
              
              <div className={`rounded-lg p-4 shadow-md border transition-colors duration-500 ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700' 
                  : 'bg-white border-slate-200'
              }`}>
                <p className={`text-xs font-semibold mb-1 transition-colors duration-500 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>Pausas Totais</p>
                <p className="text-2xl font-bold text-yellow-600">{estatisticas.pausasTotais}</p>
              </div>
              
              <div className={`rounded-lg p-4 shadow-md border transition-colors duration-500 ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700' 
                  : 'bg-white border-slate-200'
              }`}>
                <p className={`text-xs font-semibold mb-1 transition-colors duration-500 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>Carregamentos</p>
                <p className="text-2xl font-bold text-emerald-600">{estatisticas.cargasTotais}</p>
              </div>
              
              <div className={`rounded-lg p-4 shadow-md border transition-colors duration-500 ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700' 
                  : 'bg-white border-slate-200'
              }`}>
                <p className={`text-xs font-semibold mb-1 transition-colors duration-500 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>Descarregamentos</p>
                <p className="text-2xl font-bold text-red-600">{estatisticas.descargasTotais}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jornadas */}
        <div className="space-y-6">
          {jornadas.length === 0 ? (
            <Card className={`shadow-md transition-colors duration-500 ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700' 
                : 'bg-white border-slate-200'
            }`}>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Truck className={`w-20 h-20 mb-4 transition-colors duration-500 ${
                  isDarkMode ? 'text-slate-600' : 'text-slate-300'
                }`} />
                <p className={`text-center text-lg transition-colors duration-500 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Nenhuma jornada registrada.<br />
                  Clique em "Iniciar Jornada" para começar.
                </p>
              </CardContent>
            </Card>
          ) : (
            jornadas.map(jornada => (
              <Card key={jornada.id} className={`shadow-lg hover:shadow-xl transition-all duration-500 ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700' 
                  : 'bg-white border-slate-200'
              }`}>
                <CardHeader className={`border-b transition-colors duration-500 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700' 
                    : 'bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={`text-xl font-bold mb-1 transition-colors duration-500 ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}>
                        JORNADA - {format(new Date(jornada.inicioDia.data), "dd/MM/yyyy", { locale: ptBR })}
                      </CardTitle>
                      <p className={`text-sm transition-colors duration-500 ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {jornada.status === "em_andamento" ? "Em andamento" : "Concluída"}
                      </p>
                    </div>
                    <Badge className={jornada.status === "em_andamento" ? "bg-blue-500" : "bg-green-500"}>
                      {jornada.status === "em_andamento" ? "Ativa" : "Finalizada"}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6 space-y-6">
                  {jornada.status === "concluida" && (
                    <div className={`rounded-lg p-4 border-2 transition-colors duration-500 ${
                      isDarkMode 
                        ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-blue-800' 
                        : 'bg-gradient-to-br from-blue-50 to-slate-50 border-blue-200'
                    }`}>
                      <h4 className={`text-sm font-bold mb-3 transition-colors duration-500 ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}>Resumo da Jornada</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className={`rounded p-3 shadow-sm transition-colors duration-500 ${
                          isDarkMode ? 'bg-slate-800' : 'bg-white'
                        }`}>
                          <p className={`text-xs mb-1 transition-colors duration-500 ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-600'
                          }`}>KM Percorridos</p>
                          <p className="text-lg font-bold text-blue-600">{calcularKmPercorridos(jornada).toLocaleString()} km</p>
                        </div>
                        <div className={`rounded p-3 shadow-sm transition-colors duration-500 ${
                          isDarkMode ? 'bg-slate-800' : 'bg-white'
                        }`}>
                          <p className={`text-xs mb-1 transition-colors duration-500 ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-600'
                          }`}>Horas Trabalhadas</p>
                          <p className="text-lg font-bold text-green-600">{calcularHorasTrabalhadas(jornada)}</p>
                        </div>
                        <div className={`rounded p-3 shadow-sm transition-colors duration-500 ${
                          isDarkMode ? 'bg-slate-800' : 'bg-white'
                        }`}>
                          <p className={`text-xs mb-1 transition-colors duration-500 ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-600'
                          }`}>Pausas</p>
                          <p className="text-lg font-bold text-yellow-600">{calcularTotalPausas(jornada)}</p>
                        </div>
                        <div className={`rounded p-3 shadow-sm transition-colors duration-500 ${
                          isDarkMode ? 'bg-slate-800' : 'bg-white'
                        }`}>
                          <p className={`text-xs mb-1 transition-colors duration-500 ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-600'
                          }`}>Cargas</p>
                          <p className="text-lg font-bold text-emerald-600">{calcularTotalCargas(jornada)}</p>
                        </div>
                        <div className={`rounded p-3 shadow-sm transition-colors duration-500 ${
                          isDarkMode ? 'bg-slate-800' : 'bg-white'
                        }`}>
                          <p className={`text-xs mb-1 transition-colors duration-500 ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-600'
                          }`}>Descargas</p>
                          <p className="text-lg font-bold text-red-600">{calcularTotalDescargas(jornada)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* INÍCIO DO DIA */}
                  <div className={`border-2 rounded-lg p-5 transition-colors duration-500 ${
                    isDarkMode 
                      ? 'border-slate-700 bg-slate-900' 
                      : 'border-slate-200 bg-slate-50'
                  }`}>
                    <h3 className={`text-lg font-bold mb-4 border-b-2 pb-2 transition-colors duration-500 ${
                      isDarkMode 
                        ? 'text-white border-slate-700' 
                        : 'text-slate-900 border-slate-300'
                    }`}>
                      INÍCIO DO DIA
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className={`text-xs font-semibold mb-1 transition-colors duration-500 ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-600'
                        }`}>Data</p>
                        <p className={`text-sm font-medium transition-colors duration-500 ${
                          isDarkMode ? 'text-slate-200' : 'text-slate-900'
                        }`}>
                          {format(new Date(jornada.inicioDia.data), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs font-semibold mb-1 transition-colors duration-500 ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-600'
                        }`}>Hora</p>
                        <p className={`text-sm font-medium transition-colors duration-500 ${
                          isDarkMode ? 'text-slate-200' : 'text-slate-900'
                        }`}>{jornada.inicioDia.horaInicio}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-red-600 mb-1">País de Início</p>
                        <p className={`text-sm font-medium transition-colors duration-500 ${
                          isDarkMode ? 'text-slate-200' : 'text-slate-900'
                        }`}>{jornada.inicioDia.pais}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className={`text-xs font-semibold mb-1 transition-colors duration-500 ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-600'
                        }`}>Quilometragem</p>
                        <p className={`text-sm font-medium transition-colors duration-500 ${
                          isDarkMode ? 'text-slate-200' : 'text-slate-900'
                        }`}>{jornada.inicioDia.kmInicial.toLocaleString()} km</p>
                      </div>
                      <div>
                        <p className={`text-xs font-semibold mb-1 transition-colors duration-500 ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-600'
                        }`}>Último Descanso</p>
                        <p className={`text-sm font-medium transition-colors duration-500 ${
                          isDarkMode ? 'text-slate-200' : 'text-slate-900'
                        }`}>
                          {format(new Date(jornada.inicioDia.ultimoDescanso), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs font-semibold mb-1 transition-colors duration-500 ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-600'
                        }`}>Amplitude</p>
                        <p className={`text-sm font-medium transition-colors duration-500 ${
                          isDarkMode ? 'text-slate-200' : 'text-slate-900'
                        }`}>{jornada.inicioDia.amplitude}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className={`text-xs font-semibold mb-2 transition-colors duration-500 ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-600'
                      }`}>Check-up</p>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          {jornada.inicioDia.checkupCaminhao ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <span className={`text-sm font-medium transition-colors duration-500 ${
                            isDarkMode ? 'text-slate-200' : 'text-slate-900'
                          }`}>Caminhão</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {jornada.inicioDia.checkupReboque ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <span className={`text-sm font-medium transition-colors duration-500 ${
                            isDarkMode ? 'text-slate-200' : 'text-slate-900'
                          }`}>Reboque</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* EVENTOS DIÁRIOS */}
                  <div className={`border-2 rounded-lg p-5 transition-colors duration-500 ${
                    isDarkMode 
                      ? 'border-slate-700 bg-slate-800' 
                      : 'border-slate-200 bg-white'
                  }`}>
                    <div className={`flex items-center justify-between mb-4 border-b-2 pb-2 transition-colors duration-500 ${
                      isDarkMode ? 'border-slate-700' : 'border-slate-300'
                    }`}>
                      <h3 className={`text-lg font-bold transition-colors duration-500 ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}>EVENTOS DIÁRIOS</h3>
                      {jornada.status === "em_andamento" && (
                        <Button 
                          size="sm"
                          onClick={() => {
                            setJornadaSelecionada(jornada.id)
                            setDialogEvento(true)
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Adicionar Evento
                        </Button>
                      )}
                    </div>
                    
                    {jornada.eventos.length === 0 ? (
                      <p className={`text-sm text-center py-4 transition-colors duration-500 ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}>Nenhum evento registrado</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className={`border-b transition-colors duration-500 ${
                              isDarkMode ? 'border-slate-700' : 'border-slate-300'
                            }`}>
                              <th className={`text-left py-2 px-3 font-semibold transition-colors duration-500 ${
                                isDarkMode ? 'text-slate-300' : 'text-slate-700'
                              }`}>Tipo</th>
                              <th className={`text-left py-2 px-3 font-semibold transition-colors duration-500 ${
                                isDarkMode ? 'text-slate-300' : 'text-slate-700'
                              }`}>Horário</th>
                              <th className={`text-left py-2 px-3 font-semibold transition-colors duration-500 ${
                                isDarkMode ? 'text-slate-300' : 'text-slate-700'
                              }`}>Local</th>
                              <th className={`text-left py-2 px-3 font-semibold transition-colors duration-500 ${
                                isDarkMode ? 'text-slate-300' : 'text-slate-700'
                              }`}>Observação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {jornada.eventos.map(evento => (
                              <tr key={evento.id} className={`border-b transition-colors duration-500 ${
                                isDarkMode 
                                  ? 'border-slate-700 hover:bg-slate-700' 
                                  : 'border-slate-200 hover:bg-slate-50'
                              }`}>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    {getEventoIcon(evento.tipo)}
                                    <span className={`font-medium transition-colors duration-500 ${
                                      isDarkMode ? 'text-slate-200' : 'text-slate-900'
                                    }`}>{getEventoLabel(evento.tipo)}</span>
                                  </div>
                                </td>
                                <td className={`py-3 px-3 transition-colors duration-500 ${
                                  isDarkMode ? 'text-slate-200' : 'text-slate-900'
                                }`}>{evento.horario}</td>
                                <td className={`py-3 px-3 transition-colors duration-500 ${
                                  isDarkMode ? 'text-slate-200' : 'text-slate-900'
                                }`}>{evento.local}</td>
                                <td className={`py-3 px-3 transition-colors duration-500 ${
                                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                                }`}>{evento.observacao || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* FIM DO DIA */}
                  {jornada.fimDia ? (
                    <div className={`border-2 rounded-lg p-5 transition-colors duration-500 ${
                      isDarkMode 
                        ? 'border-slate-700 bg-slate-900' 
                        : 'border-slate-200 bg-slate-50'
                    }`}>
                      <h3 className={`text-lg font-bold mb-4 border-b-2 pb-2 transition-colors duration-500 ${
                        isDarkMode 
                          ? 'text-white border-slate-700' 
                          : 'text-slate-900 border-slate-300'
                      }`}>
                        FIM DO DIA
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className={`text-xs font-semibold mb-1 transition-colors duration-500 ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-600'
                          }`}>Data</p>
                          <p className={`text-sm font-medium transition-colors duration-500 ${
                            isDarkMode ? 'text-slate-200' : 'text-slate-900'
                          }`}>
                            {format(new Date(jornada.fimDia.data), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs font-semibold mb-1 transition-colors duration-500 ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-600'
                          }`}>Hora</p>
                          <p className={`text-sm font-medium transition-colors duration-500 ${
                            isDarkMode ? 'text-slate-200' : 'text-slate-900'
                          }`}>{jornada.fimDia.horaFim}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-red-600 mb-1">País de Fim</p>
                          <p className={`text-sm font-medium transition-colors duration-500 ${
                            isDarkMode ? 'text-slate-200' : 'text-slate-900'
                          }`}>{jornada.fimDia.pais}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className={`text-xs font-semibold mb-1 transition-colors duration-500 ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-600'
                          }`}>Quilometragem Final</p>
                          <p className={`text-sm font-medium transition-colors duration-500 ${
                            isDarkMode ? 'text-slate-200' : 'text-slate-900'
                          }`}>{jornada.fimDia.kmFinal.toLocaleString()} km</p>
                        </div>
                        <div>
                          <p className={`text-xs font-semibold mb-1 transition-colors duration-500 ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-600'
                          }`}>KM Percorridos</p>
                          <p className="text-sm font-medium text-green-600 font-bold">
                            {calcularKmPercorridos(jornada).toLocaleString()} km
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs font-semibold mb-1 transition-colors duration-500 ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-600'
                          }`}>Horas Trabalhadas</p>
                          <p className="text-sm font-medium text-blue-600 font-bold">
                            {calcularHorasTrabalhadas(jornada)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className={`text-xs font-semibold mb-1 transition-colors duration-500 ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-600'
                        }`}>Próximo Descanso</p>
                        <p className={`text-sm font-medium transition-colors duration-500 ${
                          isDarkMode ? 'text-slate-200' : 'text-slate-900'
                        }`}>
                          {format(new Date(jornada.fimDia.proximoDescanso), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      
                      {jornada.fimDia.observacoes && (
                        <div className={`border-t pt-3 transition-colors duration-500 ${
                          isDarkMode ? 'border-slate-700' : 'border-slate-300'
                        }`}>
                          <p className="text-xs font-semibold text-red-600 mb-1">Observações</p>
                          <p className={`text-sm transition-colors duration-500 ${
                            isDarkMode ? 'text-slate-200' : 'text-slate-900'
                          }`}>{jornada.fimDia.observacoes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-center pt-2">
                      <Button 
                        onClick={() => {
                          setJornadaSelecionada(jornada.id)
                          setDialogFimDia(true)
                        }}
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Finalizar Jornada
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Dialog Limite Gratuito Atingido */}
      <Dialog open={dialogLimiteGratuito} onOpenChange={setDialogLimiteGratuito}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Limite Atingido</DialogTitle>
            <DialogDescription className="text-center">
              Você atingiu o limite de 5 jornadas do plano gratuito
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <Alert className="border-orange-300 bg-orange-50">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <AlertTitle className="text-orange-900">Plano Gratuito</AlertTitle>
              <AlertDescription className="text-orange-800">
                Você poderá registrar novas jornadas novamente em <strong>{calcularDiasRestantes()} dias</strong> ou pode atualizar para o plano Premium agora.
              </AlertDescription>
            </Alert>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-6">
              <div className="flex items-center justify-center mb-4">
                <Crown className="w-12 h-12 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold text-center mb-2 text-slate-900">Plano Premium</h3>
              <p className="text-center text-slate-700 mb-4">Jornadas ilimitadas + recursos exclusivos</p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Jornadas ilimitadas</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Histórico completo</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Relatórios avançados</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Suporte prioritário</span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <button
                  onClick={() => setPlanoSelecionado('mensal')}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    planoSelecionado === 'mensal'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-300 bg-white hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="font-bold text-slate-900">Plano Mensal</p>
                      <p className="text-sm text-slate-600">Renovação automática</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">R$ 7,99</p>
                      <p className="text-xs text-slate-600">/mês</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setPlanoSelecionado('anual')}
                  className={`w-full p-4 rounded-lg border-2 transition-all relative ${
                    planoSelecionado === 'anual'
                      ? 'border-green-600 bg-green-50'
                      : 'border-slate-300 bg-white hover:border-green-400'
                  }`}
                >
                  <div className="absolute -top-2 right-4 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                    ECONOMIZE 62%
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="font-bold text-slate-900">Plano Anual</p>
                      <p className="text-sm text-slate-600">Melhor custo-benefício</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">R$ 35,99</p>
                      <p className="text-xs text-green-600 font-semibold">R$ 3,00/mês</p>
                    </div>
                  </div>
                </button>
              </div>

              <Button 
                onClick={processarPagamento}
                disabled={processandoPagamento}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg py-6"
              >
                {processandoPagamento ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5 mr-2" />
                    Assinar Premium
                  </>
                )}
              </Button>
            </div>

            <Button 
              variant="outline" 
              onClick={() => setDialogLimiteGratuito(false)}
              className="w-full"
              disabled={processandoPagamento}
            >
              Voltar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Adicionar Evento */}
      <Dialog open={dialogEvento} onOpenChange={setDialogEvento}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Evento</DialogTitle>
            <DialogDescription>
              Registre um novo evento na jornada
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={adicionarEvento} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipoEvento" className="font-semibold">Tipo de Evento</Label>
              <Select name="tipoEvento" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="pausa">Pausa</SelectItem>
                  <SelectItem value="carregamento">Carregamento</SelectItem>
                  <SelectItem value="abastecimento">Abastecimento</SelectItem>
                  <SelectItem value="descarregamento">Descarregamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="horarioEvento" className="font-semibold">Horário</Label>
                <Input 
                  id="horarioEvento" 
                  name="horarioEvento" 
                  type="time" 
                  defaultValue={format(new Date(), "HH:mm")}
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="localEvento" className="font-semibold">Local</Label>
                <Input 
                  id="localEvento" 
                  name="localEvento" 
                  placeholder="Cidade/Estado" 
                  required 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="observacaoEvento" className="font-semibold">Observação (opcional)</Label>
              <Textarea 
                id="observacaoEvento" 
                name="observacaoEvento" 
                placeholder="Detalhes adicionais..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogEvento(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Adicionar Evento
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Finalizar Jornada */}
      <Dialog open={dialogFimDia} onOpenChange={setDialogFimDia}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">FIM DO DIA</DialogTitle>
            <DialogDescription>
              Registre as informações finais da jornada
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={finalizarJornada} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataFim" className="font-semibold">Data</Label>
                <Input 
                  id="dataFim" 
                  name="dataFim" 
                  type="date" 
                  defaultValue={format(new Date(), "yyyy-MM-dd")}
                  required 
                  className="border-slate-300"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="horaFim" className="font-semibold">Hora de Fim</Label>
                <Input 
                  id="horaFim" 
                  name="horaFim" 
                  type="time" 
                  defaultValue={format(new Date(), "HH:mm")}
                  required 
                  className="border-slate-300"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paisFim" className="font-semibold text-red-600">País de Fim</Label>
                <Input 
                  id="paisFim" 
                  name="paisFim" 
                  placeholder="Ex: Brasil" 
                  required 
                  className="border-slate-300"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="kmFinal" className="font-semibold">Quilometragem Final</Label>
                <Input 
                  id="kmFinal" 
                  name="kmFinal" 
                  type="number" 
                  placeholder="0" 
                  required 
                  className="border-slate-300"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="proximoDescanso" className="font-semibold">Próximo Descanso</Label>
              <Input 
                id="proximoDescanso" 
                name="proximoDescanso" 
                type="datetime-local" 
                required 
                className="border-slate-300"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="observacoesFim" className="font-semibold text-red-600">Observações</Label>
              <Textarea 
                id="observacoesFim" 
                name="observacoesFim" 
                placeholder="Observações finais da jornada..."
                rows={4}
                className="border-slate-300"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setDialogFimDia(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-green-600 to-green-700">
                Finalizar Jornada
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
