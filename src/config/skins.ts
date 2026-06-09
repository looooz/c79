import type { Skin } from '@/types'

export const DEFAULT_SKINS: Skin[] = [
  {
    id: 'sd-red',
    category: 'screwdriver',
    name: '金属红',
    price: 0,
    owned: true,
    equipped: true,
    config: {
      primary: '#D32F2F',
      secondary: '#FFCDD2',
      gradient: ['#F44336', '#B71C1C'],
    },
  },
  {
    id: 'sd-blue',
    category: 'screwdriver',
    name: '电镀蓝',
    price: 800,
    owned: false,
    equipped: false,
    config: {
      primary: '#1976D2',
      secondary: '#BBDEFB',
      gradient: ['#2196F3', '#0D47A1'],
    },
  },
  {
    id: 'sd-carbon',
    category: 'screwdriver',
    name: '碳纤维',
    price: 1500,
    owned: false,
    equipped: false,
    config: {
      primary: '#37474F',
      secondary: '#78909C',
      gradient: ['#424242', '#121212'],
    },
  },
  {
    id: 'sd-gold',
    category: 'screwdriver',
    name: '黄金版',
    price: 5000,
    owned: false,
    equipped: false,
    config: {
      primary: '#FFA000',
      secondary: '#FFECB3',
      gradient: ['#FFC107', '#E65100'],
    },
  },
  {
    id: 'bg-wood',
    category: 'background',
    name: '木工坊',
    price: 0,
    owned: true,
    equipped: true,
    config: {
      pattern: 'wood',
      colors: ['#5D4037', '#4E342E', '#3E2723'],
    },
  },
  {
    id: 'bg-metal',
    category: 'background',
    name: '机械车间',
    price: 1000,
    owned: false,
    equipped: false,
    config: {
      pattern: 'metal',
      colors: ['#455A64', '#37474F', '#263238'],
    },
  },
  {
    id: 'bg-space',
    category: 'background',
    name: '太空站',
    price: 2000,
    owned: false,
    equipped: false,
    config: {
      pattern: 'space',
      colors: ['#1A237E', '#0D47A1', '#000000'],
    },
  },
  {
    id: 'bg-gradient',
    category: 'background',
    name: '解压渐变',
    price: 1200,
    owned: false,
    equipped: false,
    config: {
      pattern: 'gradient',
      colors: ['#7C4DFF', '#536DFE', '#448AFF', '#40C4FF'],
    },
  },
  {
    id: 'pt-spark',
    category: 'particle',
    name: '火花',
    price: 0,
    owned: true,
    equipped: true,
    config: {
      colors: ['#FF9800', '#FF5722', '#FFC107', '#FFF8E1'],
    },
  },
  {
    id: 'pt-star',
    category: 'particle',
    name: '星光',
    price: 1200,
    owned: false,
    equipped: false,
    config: {
      colors: ['#E3F2FD', '#90CAF9', '#FFFFFF', '#64B5F6'],
    },
  },
  {
    id: 'pt-rainbow',
    category: 'particle',
    name: '彩虹',
    price: 2500,
    owned: false,
    equipped: false,
    config: {
      colors: ['#F44336', '#FF9800', '#FFEB3B', '#4CAF50', '#2196F3', '#9C27B0'],
    },
  },
]

export const getEquippedSkin = (skins: Skin[], category: Skin['category']): Skin | undefined =>
  skins.find((s) => s.category === category && s.equipped) ??
  skins.find((s) => s.category === category && s.owned)
