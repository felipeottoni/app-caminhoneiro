"use client"

import { useState } from "react"
import { Truck, CheckCircle2, Clock, Shield, BarChart3, FileText, Mail, Chrome, Apple, Facebook, Check, ArrowRight, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email-login") as string
    const password = formData.get("password-login") as string

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast.success("Login realizado com sucesso!")
      router.push("/dashboard")
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name-register") as string
    const email = formData.get("email-register") as string
    const password = formData.get("password-register") as string

    try {
      // Criar conta no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })

      if (authError) throw authError

      // Criar registro na tabela users
      if (authData.user) {
        const { error: userError } = await supabase
          .from("users")
          .insert({
            id: authData.user.id,
            email,
            name,
            is_premium: false,
          })

        if (userError) throw userError
      }

      toast.success("Conta criada com sucesso! Faça login para continuar.")
      setShowRegister(false)
      setShowLogin(true)
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta")
    } finally {
      setLoading(false)
    }
  }

  const handleSocialAuth = async (provider: "google" | "facebook" | "apple") => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      toast.error(error.message || `Erro ao autenticar com ${provider}`)
    }
  }

  const handleMagicLink = async () => {
    const email = prompt("Digite seu email:")
    if (!email) return

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) throw error

      toast.success("Link mágico enviado! Verifique seu email.")
      setShowLogin(false)
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar link mágico")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header/Navbar */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 rounded-xl shadow-lg">
                <Truck className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">RodoControl</h1>
                <p className="text-xs text-slate-600 hidden sm:block">Controle profissional de jornadas</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#recursos" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">Recursos</a>
              <a href="#planos" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">Planos</a>
              <a href="#sobre" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">Sobre</a>
              <Button variant="outline" onClick={() => setShowLogin(true)}>Entrar</Button>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" onClick={() => setShowRegister(true)}>
                Começar Grátis
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 flex flex-col gap-3 border-t pt-4">
              <a href="#recursos" className="text-slate-700 hover:text-blue-600 font-medium transition-colors py-2">Recursos</a>
              <a href="#planos" className="text-slate-700 hover:text-blue-600 font-medium transition-colors py-2">Planos</a>
              <a href="#sobre" className="text-slate-700 hover:text-blue-600 font-medium transition-colors py-2">Sobre</a>
              <Button variant="outline" onClick={() => setShowLogin(true)} className="w-full">Entrar</Button>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 w-full" onClick={() => setShowRegister(true)}>
                Começar Grátis
              </Button>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
            ✨ Sistema Profissional para Caminhoneiros
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Controle Total da Sua <span className="text-blue-600">Jornada de Trabalho</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Registre horários de carga e descarga, pausas obrigatórias, quilometragem e muito mais. 
            Tudo em um só lugar, de forma simples e profissional.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg px-8 py-6 shadow-xl"
              onClick={() => setShowRegister(true)}
            >
              Começar Gratuitamente
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 border-2"
              onClick={() => setShowLogin(true)}
            >
              Ver Demonstração
            </Button>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            ✓ Sem cartão de crédito necessário • ✓ Cancele quando quiser
          </p>
        </div>
      </section>

      {/* Recursos Section */}
      <section id="recursos" className="container mx-auto px-4 py-16 bg-white/50 rounded-3xl my-8">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Tudo que Você Precisa em Um Só Lugar
          </h3>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Recursos desenvolvidos especialmente para facilitar o dia a dia dos caminhoneiros
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="border-2 hover:shadow-xl transition-all hover:border-blue-200">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Controle de Horários</CardTitle>
              <CardDescription>
                Registre início e fim do dia, horários de carga/descarga e pausas obrigatórias
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:shadow-xl transition-all hover:border-blue-200">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Check-up Diário</CardTitle>
              <CardDescription>
                Sistema de verificação de caminhão e reboque antes de iniciar a jornada
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:shadow-xl transition-all hover:border-blue-200">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Estatísticas</CardTitle>
              <CardDescription>
                Acompanhe KM percorridos, horas trabalhadas e histórico completo de jornadas
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:shadow-xl transition-all hover:border-blue-200">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle>Eventos Diários</CardTitle>
              <CardDescription>
                Registre saídas, pausas, carregamentos, abastecimentos e descarregamentos
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:shadow-xl transition-all hover:border-blue-200">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle>Dados Seguros</CardTitle>
              <CardDescription>
                Seus dados salvos com segurança e disponíveis em qualquer dispositivo
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:shadow-xl transition-all hover:border-blue-200">
            <CardHeader>
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-3">
                <Truck className="w-6 h-6 text-cyan-600" />
              </div>
              <CardTitle>Quilometragem</CardTitle>
              <CardDescription>
                Controle preciso de quilometragem inicial e final com cálculo automático
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Planos Section */}
      <section id="planos" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Escolha o Plano Ideal para Você
          </h3>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Comece grátis e faça upgrade quando precisar de mais recursos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Plano Gratuito */}
          <Card className="border-2 hover:shadow-xl transition-all">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl mb-2">Gratuito</CardTitle>
              <div className="mb-4">
                <span className="text-4xl font-bold text-slate-900">R$ 0</span>
                <span className="text-slate-600">/mês</span>
              </div>
              <CardDescription>Perfeito para começar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">Até 5 jornadas por mês</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">Registro de eventos básicos</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">Controle de horários</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">Check-up de veículo</span>
              </div>
              <div className="flex items-start gap-3 opacity-50">
                <X className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-500">Histórico limitado a 30 dias</span>
              </div>
              <div className="flex items-start gap-3 opacity-50">
                <X className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-500">Sem relatórios avançados</span>
              </div>
              <Button 
                className="w-full mt-6" 
                variant="outline"
                onClick={() => setShowRegister(true)}
              >
                Começar Grátis
              </Button>
            </CardContent>
          </Card>

          {/* Plano Premium */}
          <Card className="border-2 border-blue-500 hover:shadow-2xl transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
              MAIS POPULAR
            </div>
            <CardHeader className="text-center pb-8 pt-8">
              <CardTitle className="text-2xl mb-2 text-blue-600">Premium</CardTitle>
              <div className="mb-2">
                <span className="text-4xl font-bold text-slate-900">R$ 7,99</span>
                <span className="text-slate-600">/mês</span>
              </div>
              <div className="text-sm text-slate-600 mb-4">
                ou <span className="font-bold text-green-600">R$ 35,99/ano</span> (economize 62%)
              </div>
              <CardDescription>Recursos ilimitados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700 font-medium">Jornadas ilimitadas</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700 font-medium">Todos os tipos de eventos</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700 font-medium">Histórico completo ilimitado</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700 font-medium">Relatórios avançados e exportação</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700 font-medium">Estatísticas detalhadas</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700 font-medium">Suporte prioritário</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700 font-medium">Backup automático na nuvem</span>
              </div>
              <Button 
                className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" 
                onClick={() => setShowRegister(true)}
              >
                Assinar Premium
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Sobre Section */}
      <section id="sobre" className="container mx-auto px-4 py-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl my-8 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-6">
            Desenvolvido por Caminhoneiros, para Caminhoneiros
          </h3>
          <p className="text-lg text-blue-100 mb-8">
            O RodoControl foi criado para simplificar o registro diário de jornadas, 
            garantindo conformidade com as leis de trânsito e facilitando o controle 
            de horas trabalhadas, pausas e quilometragem. Tudo de forma simples, 
            rápida e profissional.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-blue-100">Caminhoneiros ativos</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">50k+</div>
              <div className="text-blue-100">Jornadas registradas</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">4.9★</div>
              <div className="text-blue-100">Avaliação média</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Pronto para Começar?
        </h3>
        <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
          Junte-se a milhares de caminhoneiros que já estão controlando suas jornadas de forma profissional
        </p>
        <Button 
          size="lg" 
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg px-8 py-6 shadow-xl"
          onClick={() => setShowRegister(true)}
        >
          Criar Conta Gratuita
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-lg">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900">RodoControl</span>
            </div>
            <div className="text-sm text-slate-600 text-center">
              © 2024 RodoControl. Todos os direitos reservados.
            </div>
            <div className="flex gap-4 text-sm text-slate-600">
              <a href="#" className="hover:text-blue-600 transition-colors">Termos</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Privacidade</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Contato</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Dialog Login */}
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Entrar na sua conta</DialogTitle>
            <DialogDescription>
              Acesse sua conta para continuar gerenciando suas jornadas
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleLogin} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email-login">Email</Label>
              <Input 
                id="email-login" 
                name="email-login"
                type="email" 
                placeholder="seu@email.com" 
                required 
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password-login">Senha</Label>
              <Input 
                id="password-login" 
                name="password-login"
                type="password" 
                placeholder="••••••••" 
                required 
                disabled={loading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Ou continue com</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleSocialAuth("google")}
                className="w-full"
                disabled={loading}
              >
                <Chrome className="w-4 h-4 mr-2" />
                Google
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleSocialAuth("facebook")}
                className="w-full"
                disabled={loading}
              >
                <Facebook className="w-4 h-4 mr-2" />
                Facebook
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleSocialAuth("apple")}
                className="w-full"
                disabled={loading}
              >
                <Apple className="w-4 h-4 mr-2" />
                Apple
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleMagicLink}
                className="w-full"
                disabled={loading}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            </div>

            <div className="text-center text-sm text-slate-600 mt-4">
              Não tem uma conta?{" "}
              <button
                type="button"
                onClick={() => {
                  setShowLogin(false)
                  setShowRegister(true)
                }}
                className="text-blue-600 hover:underline font-medium"
                disabled={loading}
              >
                Criar conta
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Registro */}
      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Criar sua conta</DialogTitle>
            <DialogDescription>
              Comece gratuitamente e faça upgrade quando precisar
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleRegister} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name-register">Nome completo</Label>
              <Input 
                id="name-register" 
                name="name-register"
                type="text" 
                placeholder="João Silva" 
                required 
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-register">Email</Label>
              <Input 
                id="email-register" 
                name="email-register"
                type="email" 
                placeholder="seu@email.com" 
                required 
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password-register">Senha</Label>
              <Input 
                id="password-register" 
                name="password-register"
                type="password" 
                placeholder="••••••••" 
                required 
                minLength={6}
                disabled={loading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700"
              disabled={loading}
            >
              {loading ? "Criando conta..." : "Criar Conta Gratuita"}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Ou registre-se com</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleSocialAuth("google")}
                className="w-full"
                disabled={loading}
              >
                <Chrome className="w-4 h-4 mr-2" />
                Google
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleSocialAuth("facebook")}
                className="w-full"
                disabled={loading}
              >
                <Facebook className="w-4 h-4 mr-2" />
                Facebook
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleSocialAuth("apple")}
                className="w-full"
                disabled={loading}
              >
                <Apple className="w-4 h-4 mr-2" />
                Apple
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleMagicLink}
                className="w-full"
                disabled={loading}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            </div>

            <div className="text-center text-sm text-slate-600 mt-4">
              Já tem uma conta?{" "}
              <button
                type="button"
                onClick={() => {
                  setShowRegister(false)
                  setShowLogin(true)
                }}
                className="text-blue-600 hover:underline font-medium"
                disabled={loading}
              >
                Fazer login
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
