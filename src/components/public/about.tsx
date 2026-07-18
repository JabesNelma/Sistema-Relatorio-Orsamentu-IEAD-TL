'use client'

import { motion } from 'framer-motion'
import { BookOpen, Church, HandHeart, ShieldCheck, Users } from 'lucide-react'

const values = [
  {
    icon: ShieldCheck,
    label: 'Transparansi',
    desc: 'Setiap penerimaan dan pengeluaran tercatat dengan jelas, dapat ditelusuri oleh setiap tingkat administrasi gereja.',
  },
  {
    icon: HandHeart,
    label: 'Akuntabilitas',
    desc: 'Admin wilayah memantau laporan dari gereja lokal secara real-time melalui dashboard visual yang komprehensif.',
  },
  {
    icon: Users,
    label: 'Kolaborasi',
    desc: 'Tiga tingkat peran — super admin, admin wilayah, dan admin lokal — bekerja sama dalam satu sistem yang harmonis.',
  },
  {
    icon: BookOpen,
    label: 'Stewardship',
    desc: 'Mengelola berkat dengan bijaksana sebagai bentuk ibadah dan tanggung jawab kepada jemaat dan Tuhan.',
  },
]

const roles = [
  {
    name: 'Super Admin',
    title: 'Administrator Pusat',
    desc: 'Mengelola admin wilayah di seluruh jaringan gereja. Menjadi penjaga struktur organisasi tingkat tertinggi.',
    color: 'from-primary/15 to-primary/5',
    accent: 'text-primary',
    features: ['Membuat admin wilayah', 'Mengelola wilayah gereja', 'Mengawasi seluruh struktur'],
  },
  {
    name: 'Admin Wilayah',
    title: 'Administrator Regional',
    desc: 'Membuat admin lokal dan memantau laporan keuangan dari setiap gereja lokal di wilayahnya melalui grafik visual.',
    color: 'from-gold/20 to-gold/5',
    accent: 'text-gold',
    features: ['Membuat admin lokal', 'Melihat laporan visual', 'Memantau arus kas wilayah'],
  },
  {
    name: 'Admin Lokal',
    title: 'Administrator Gereja Lokal',
    desc: 'Mencatat setiap uang masuk, uang keluar, dan pendapatan gereja lokal dengan rapi dan tepat waktu.',
    color: 'from-emerald-deep/15 to-emerald-deep/5',
    accent: 'text-primary',
    features: ['Input uang masuk', 'Input uang keluar', 'Catat pendapatan'],
  },
]

export function About() {
  return (
    <section id="tentang" className="relative py-20 sm:py-28 bg-cream texture-paper overflow-hidden">
      {/* Decorative top divider */}
      <div className="absolute top-0 inset-x-0 h-px divider-gold opacity-60" />

      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        {/* Heading */}
        <div className="max-w-2xl">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.3em] text-gold font-medium"
          >
            Tentang Sistem Kami
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl text-foreground leading-tight"
          >
            Mengelola berkat dengan
            <span className="text-gradient-gold"> amanah dan elegan</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-5 text-foreground/70 leading-relaxed"
          >
            Sistem Laporan Keuangan Gereja hadir untuk mempermudah pencatatan, pemantauan, dan
            pelaporan keuangan gereja lintas tingkat. Dengan hierarki peran yang jelas dan
            visualisasi data yang hidup, setiap berkat dapat dikelola dengan penuh tanggung jawab.
          </motion.p>
        </div>

        {/* Image + story */}
        <div className="mt-14 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-elegant-lg aspect-[4/3]">
              <img
                src="/images/about-community.jpg"
                alt="Jemaat gereja berkumpul bersama"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep/40 via-transparent to-transparent" />
            </div>
            {/* Floating quote card */}
            <div className="absolute -bottom-6 -right-4 sm:right-6 max-w-[260px] bg-card rounded-xl shadow-elegant-lg border border-gold/20 p-5">
              <p className="font-serif text-base text-foreground leading-snug italic">
                &ldquo;Setiap pemberian yang baik dan setiap anugerah yang sempurna datang dari atas.&rdquo;
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-wider text-gold font-medium">Yakobus 1:17</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-5"
          >
            <h3 className="font-serif text-2xl text-foreground">Mengapa sistem ini ada</h3>
            <p className="text-foreground/70 leading-relaxed">
              Gereja yang berkembang membutuhkan tata kelola keuangan yang sehat. Sistem ini
              memastikan setiap ibadah, persembahan, dan kegiatan gerejawi tercatat secara
              terstruktur — dari gereja lokal hingga tingkat wilayah.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: 'Pencatatan Akurat', icon: BookOpen },
                { label: 'Laporan Visual', icon: HandHeart },
                { label: 'Akses Bertingkat', icon: Church },
                { label: 'Kolaboratif', icon: Users },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/70">
                  <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Values grid */}
        <div className="mt-20">
          <motion.h3
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="font-serif text-2xl sm:text-3xl text-foreground text-center mb-2"
          >
            Nilai-nilai yang kami junjung
          </motion.h3>
          <p className="text-center text-foreground/60 mb-10 max-w-xl mx-auto">
            Empat pilar yang menjadi dasar pengelolaan keuangan gereja dalam sistem ini.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((v, i) => (
              <motion.div
                key={v.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="group p-6 rounded-xl bg-card border border-border/70 hover:border-gold/40 hover:shadow-elegant-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/15 to-gold/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <v.icon className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-serif text-lg text-foreground mb-1.5">{v.label}</h4>
                <p className="text-sm text-foreground/65 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Roles section */}
      <div id="layanan" className="container mx-auto max-w-6xl px-4 sm:px-6 mt-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-[0.3em] text-gold font-medium">Hierarki Peran</span>
          <h3 className="mt-3 font-serif text-3xl sm:text-4xl text-foreground">
            Tiga tingkat administrasi yang saling melengkapi
          </h3>
          <p className="mt-4 text-foreground/60">
            Setiap peran memiliki tanggung jawab yang berbeda namun terhubung dalam satu alur
            yang harmonis.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {roles.map((role, i) => (
            <motion.div
              key={role.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: i * 0.12 }}
              className={`relative p-7 rounded-2xl bg-gradient-to-br ${role.color} border border-border/70 overflow-hidden`}
            >
              <div className="absolute top-4 right-4 font-serif text-6xl text-foreground/5 leading-none">
                {i + 1}
              </div>
              <span className={`text-[11px] uppercase tracking-[0.2em] font-medium ${role.accent}`}>
                {role.title}
              </span>
              <h4 className="mt-2 font-serif text-2xl text-foreground">{role.name}</h4>
              <p className="mt-3 text-sm text-foreground/70 leading-relaxed min-h-[80px]">
                {role.desc}
              </p>
              <div className="mt-5 space-y-2">
                {role.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                    <span className={`w-1.5 h-1.5 rounded-full ${role.accent === 'text-gold' ? 'bg-gold' : 'bg-primary'}`} />
                    {f}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
