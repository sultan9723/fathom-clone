/**
 * Every font DESIGN.md calls for, loaded through next/font.
 *
 * Geist and Geist Mono are global — the whole UI is set in them. The four
 * Noto faces are NOT applied globally: they are exposed as CSS variables and
 * reach an element only through lib/i18n-text.ts, so a Nastaliq or CJK face
 * is used exclusively for text actually written in that script.
 *
 * The CJK and Arabic subsets are large, so those four are marked
 * `preload: false`: they download when a translation needs them instead of
 * blocking first paint on every page.
 */
import {
  Geist,
  Geist_Mono,
  Noto_Naskh_Arabic,
  Noto_Nastaliq_Urdu,
  Noto_Sans_JP,
  Noto_Sans_SC,
} from 'next/font/google'

export const geistSans = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-sans',
})

export const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-mono',
})

export const notoNastaliqUrdu = Noto_Nastaliq_Urdu({
  subsets: ['arabic'],
  display: 'swap',
  preload: false,
  variable: '--font-noto-nastaliq-urdu',
})

export const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ['arabic'],
  display: 'swap',
  preload: false,
  variable: '--font-noto-naskh-arabic',
})

export const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-noto-sans-sc',
})

export const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-noto-sans-jp',
})

/** Every font variable, for the <html> className. */
export const fontVariables = [
  geistSans.variable,
  geistMono.variable,
  notoNastaliqUrdu.variable,
  notoNaskhArabic.variable,
  notoSansSC.variable,
  notoSansJP.variable,
].join(' ')
